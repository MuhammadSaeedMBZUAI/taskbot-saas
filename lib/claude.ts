import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ParsedIntent {
  action:
    | "create_task"
    | "list_tasks"
    | "complete_task"
    | "delete_task"
    | "help"
    | "unknown";
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  due_date?: string;
  task_query?: string;
}

export async function parseWhatsAppIntent(
  message: string,
  history: Array<{ role: "user" | "assistant"; content: string }>
): Promise<ParsedIntent> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: `You are a task management assistant integrated with WhatsApp.
Parse the user's message and return a JSON object with the following structure:
{
  "action": "create_task" | "list_tasks" | "complete_task" | "delete_task" | "help" | "unknown",
  "title": "task title if creating",
  "description": "task description if provided",
  "priority": "low" | "medium" | "high",
  "due_date": "ISO date string if mentioned",
  "task_query": "search term if listing/completing/deleting a specific task"
}

Examples:
- "add buy groceries tomorrow" → create_task, title: "Buy groceries", due_date: tomorrow's ISO
- "show my tasks" → list_tasks
- "mark groceries done" → complete_task, task_query: "groceries"
- "delete the meeting task" → delete_task, task_query: "meeting"
- "help" or "what can you do" → help

Only return valid JSON, nothing else.`,
    messages: [
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ],
  });

  try {
    const raw =
      response.content[0].type === "text" ? response.content[0].text : "{}";
    // Strip markdown code fences if Claude wrapped the JSON
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    console.log("[claude] raw:", raw);
    console.log("[claude] parsed intent:", text);
    return JSON.parse(text) as ParsedIntent;
  } catch (e) {
    console.error("[claude] JSON parse failed:", e);
    return { action: "unknown" };
  }
}

export async function generateWhatsAppReply(
  intent: ParsedIntent,
  result: { success: boolean; data?: unknown; error?: string }
): Promise<string> {
  const context = JSON.stringify({ intent, result });

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system:
      "You are a friendly WhatsApp task manager bot. Generate a short, helpful reply (max 3 lines) based on the action taken. Use emojis sparingly. Be concise.",
    messages: [{ role: "user", content: context }],
  });

  return response.content[0].type === "text"
    ? response.content[0].text
    : "Done! ✓";
}
