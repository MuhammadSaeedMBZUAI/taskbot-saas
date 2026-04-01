import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createOrRetrieveCustomer, createCheckoutSession } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) {
    return NextResponse.json({ error: "No email" }, { status: 400 });
  }

  const customer = await createOrRetrieveCustomer({
    userId,
    email,
    name: user.fullName,
  });

  // Store customer ID
  const supabase = createServiceClient();
  await supabase
    .from("users")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  const session = await createCheckoutSession({
    customerId: customer.id,
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    userId,
    returnUrl: process.env.NEXT_PUBLIC_APP_URL!,
  });

  return NextResponse.json({ url: session.url });
}
