import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export async function createOrRetrieveCustomer({
  userId,
  email,
  name,
}: {
  userId: string;
  email: string;
  name?: string | null;
}) {
  const existing = await stripe.customers.search({
    query: `metadata["clerk_user_id"]:"${userId}"`,
  });

  if (existing.data.length > 0) return existing.data[0];

  return stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { clerk_user_id: userId },
  });
}

export async function createCheckoutSession({
  customerId,
  priceId,
  userId,
  returnUrl,
}: {
  customerId: string;
  priceId: string;
  userId: string;
  returnUrl: string;
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}/dashboard?upgrade=success`,
    cancel_url: `${returnUrl}/settings?upgrade=canceled`,
    metadata: { clerk_user_id: userId },
    subscription_data: {
      metadata: { clerk_user_id: userId },
    },
  });
}

export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${returnUrl}/settings`,
  });
}
