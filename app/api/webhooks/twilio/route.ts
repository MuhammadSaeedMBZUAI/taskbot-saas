import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWhatsAppMessage, validateTwilioWebhook } from "@/lib/twilio";
import { parseWhatsAppIntent, generateWhatsAppReply } from "@/lib/claude";
import { headers } from "next/headers";

// Parse Twilio's urlencoded form body
async function parseTwilioBody(req: Request): Promise<Record<string, string>> {
  const text = await req.text();
  return Object.fromEntries(new URLSearchParams(text));
}

export async function POST(req: Request) {
  const headersList = await headers();
  const signature = headersList.get("x-twilio-signature") ?? "";
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`;

  const body = await parseTwilioBody(req);

  // Validate Twilio signature in production
  if (process.env.NODE_ENV === "production") {
    const valid = validateTwilioWebhook(signature, url, body);
    if (!valid) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const from: string = body.From ?? ""; // e.g. "whatsapp:+15551234567"
  const messageBody: string = body.Body ?? "";
  const phoneNumber = from.replace("whatsapp:", "");

  if (!phoneNumber || !messageBody) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const supabase = createServiceClient();

  // Upsert WhatsApp session
  const { data: session, error: sessionError } = await supabase
    .from("whatsapp_sessions")
    .upsert(
      { phone_number: phoneNumber, last_message_at: new Date().toISOString() },
      { onConflict: "phone_number" }
    )
    .select()
    .single();

  if (sessionError || !session) {
    await sendWhatsAppMessage(from, "Something went wrong. Please try again.");
    return new NextResponse("OK");
  }

  // Find linked user
  const { data: user } = await supabase
    .from("users")
    .select("id, subscription_tier")
    .eq("phone_number", phoneNumber)
    .single();

  if (!user) {
    await sendWhatsAppMessage(
      from,
      `Welcome to TaskBot! 👋\n\nTo link your WhatsApp to your account, go to ${process.env.NEXT_PUBLIC_APP_URL}/settings and add your number.\n\nYour number: ${phoneNumber}`
    );
    return new NextResponse("OK");
  }

  // Check free tier limits
  if (user.subscription_tier === "free") {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("tasks")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString());

    if ((count ?? 0) >= 50) {
      await sendWhatsAppMessage(
        from,
        `You've reached the 50 task/month limit on the free plan. Upgrade to Pro at ${process.env.NEXT_PUBLIC_APP_URL}/settings`
      );
      return new NextResponse("OK");
    }
  }

  // Retrieve recent conversation context
  const context = session.context as { history?: Array<{ role: string; content: string }> };
  const history = context.history ?? [];

  // Parse intent with Claude
  const intent = await parseWhatsAppIntent(messageBody, history as Array<{ role: "user" | "assistant"; content: string }>);

  let result: { success: boolean; data?: unknown; error?: string };

  switch (intent.action) {
    case "create_task": {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title: intent.title ?? messageBody,
          description: intent.description,
          priority: intent.priority ?? "medium",
          due_date: intent.due_date,
        })
        .select()
        .single();
      result = error ? { success: false, error: error.message } : { success: true, data };
      break;
    }

    case "list_tasks": {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(10);
      result = error ? { success: false, error: error.message } : { success: true, data };
      break;
    }

    case "complete_task": {
      // Find best matching task
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "completed")
        .ilike("title", `%${intent.task_query ?? ""}%`)
        .limit(1);

      if (!tasks || tasks.length === 0) {
        result = { success: false, error: "Task not found" };
      } else {
        const { error } = await supabase
          .from("tasks")
          .update({ status: "completed" })
          .eq("id", tasks[0].id);
        result = error ? { success: false, error: error.message } : { success: true, data: tasks[0] };
      }
      break;
    }

    case "delete_task": {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .ilike("title", `%${intent.task_query ?? ""}%`)
        .limit(1);

      if (!tasks || tasks.length === 0) {
        result = { success: false, error: "Task not found" };
      } else {
        const { error } = await supabase
          .from("tasks")
          .delete()
          .eq("id", tasks[0].id);
        result = error ? { success: false, error: error.message } : { success: true, data: tasks[0] };
      }
      break;
    }

    case "help":
      result = {
        success: true,
        data: {
          commands: [
            "Add a task: \"add buy milk tomorrow\"",
            "List tasks: \"show my tasks\"",
            "Complete a task: \"mark buy milk done\"",
            "Delete a task: \"delete buy milk\"",
          ],
        },
      };
      break;

    default:
      result = { success: false, error: "I didn't understand that. Try 'help' for commands." };
  }

  // Generate friendly reply
  const reply = await generateWhatsAppReply(intent, result);

  // Update session context (keep last 10 messages)
  const newHistory = [
    ...history,
    { role: "user", content: messageBody },
    { role: "assistant", content: reply },
  ].slice(-10);

  await supabase
    .from("whatsapp_sessions")
    .update({ context: { history: newHistory } })
    .eq("phone_number", phoneNumber);

  await sendWhatsAppMessage(from, reply);

  return new NextResponse("OK");
}
