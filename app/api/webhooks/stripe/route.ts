import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.clerk_user_id;
      if (!userId) break;

      const isActive = subscription.status === "active";
      await supabase.from("users").update({
        subscription_status: subscription.status as "active" | "canceled" | "past_due",
        subscription_tier: isActive ? "pro" : "free",
      }).eq("id", userId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.clerk_user_id;
      if (!userId) break;

      await supabase.from("users").update({
        subscription_status: "canceled",
        subscription_tier: "free",
      }).eq("id", userId);
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.CheckoutSession;
      const userId = session.metadata?.clerk_user_id;
      const customerId = session.customer as string;
      if (!userId || !customerId) break;

      await supabase.from("users").update({
        stripe_customer_id: customerId,
      }).eq("id", userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
