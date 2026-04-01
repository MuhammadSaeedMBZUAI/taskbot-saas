import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createPortalSession } from "@/lib/stripe";
import { redirect } from "next/navigation";
import UpgradeButton from "./UpgradeButton";

export default async function SettingsPage() {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) return null;

  const supabase = createServiceClient();
  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  const isPro = dbUser?.subscription_tier === "pro";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      {/* Account */}
      <section className="mb-8 p-6 rounded-xl border border-zinc-800 bg-zinc-900">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-3 text-sm text-zinc-300">
          <div className="flex justify-between">
            <span className="text-zinc-500">Email</span>
            <span>{user.emailAddresses[0]?.emailAddress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Name</span>
            <span>{user.fullName ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Plan</span>
            <span
              className={
                isPro ? "text-green-400 font-semibold" : "text-zinc-400"
              }
            >
              {isPro ? "Pro" : "Free"}
            </span>
          </div>
        </div>
      </section>

      {/* Subscription */}
      <section className="mb-8 p-6 rounded-xl border border-zinc-800 bg-zinc-900">
        <h2 className="text-lg font-semibold mb-4">Subscription</h2>
        {isPro ? (
          <div>
            <p className="text-sm text-zinc-400 mb-4">
              You&apos;re on the Pro plan. Manage your billing below.
            </p>
            <form
              action={async () => {
                "use server";
                const supabaseSrv = createServiceClient();
                const { data } = await supabaseSrv
                  .from("users")
                  .select("stripe_customer_id")
                  .eq("id", userId!)
                  .single();
                if (!data?.stripe_customer_id) return;
                const session = await createPortalSession({
                  customerId: data.stripe_customer_id,
                  returnUrl: process.env.NEXT_PUBLIC_APP_URL!,
                });
                redirect(session.url);
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 border border-zinc-700 hover:border-zinc-500 rounded-lg text-sm transition"
              >
                Manage billing
              </button>
            </form>
          </div>
        ) : (
          <div>
            <p className="text-sm text-zinc-400 mb-4">
              Upgrade to Pro for unlimited tasks, analytics, and MCP access.
            </p>
            <UpgradeButton />
          </div>
        )}
      </section>

      {/* WhatsApp */}
      <section className="p-6 rounded-xl border border-green-500/20 bg-green-500/5">
        <h2 className="text-lg font-semibold mb-2">WhatsApp</h2>
        <p className="text-sm text-zinc-400">
          Send a message from WhatsApp to{" "}
          <span className="font-mono text-white">
            {process.env.TWILIO_WHATSAPP_FROM?.replace("whatsapp:", "") ??
              "your Twilio number"}
          </span>
          . Your phone number will be automatically linked to your account.
        </p>
      </section>
    </div>
  );
}
