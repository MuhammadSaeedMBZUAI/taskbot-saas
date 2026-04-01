import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createPortalSession } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { User, CreditCard, MessageSquare, CheckCircle2, Zap } from "lucide-react";
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
    <div className="max-w-2xl space-y-5">

      {/* Account */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.05]">
          <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center">
            <User className="w-4 h-4 text-zinc-400" />
          </div>
          <h2 className="text-sm font-medium">Account</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { label: "Email", value: user.emailAddresses[0]?.emailAddress },
            { label: "Name",  value: user.fullName ?? "—" },
            {
              label: "Plan",
              value: isPro ? "Pro" : "Free",
              valueClass: isPro ? "text-emerald-400 font-semibold" : "text-zinc-400",
            },
          ].map(({ label, value, valueClass }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">{label}</span>
              <span className={`text-sm ${valueClass ?? "text-zinc-200"}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.05]">
          <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-zinc-400" />
          </div>
          <h2 className="text-sm font-medium">Subscription</h2>
          {isPro && (
            <span className="ml-auto text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
              Pro
            </span>
          )}
        </div>
        <div className="px-6 py-5">
          {isPro ? (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-zinc-300 mb-1">You&apos;re on the Pro plan</p>
                <p className="text-xs text-zinc-600">Unlimited tasks, analytics, and MCP access included.</p>
              </div>
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
                  className="px-4 py-2 text-xs border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-lg transition-all text-zinc-400 hover:text-white"
                >
                  Manage billing
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">Upgrade to Pro — $9/mo</span>
                </div>
                <ul className="space-y-2 mb-4">
                  {["Unlimited tasks", "Task analytics", "Custom tags & filters", "Claude Console MCP access"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-zinc-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <UpgradeButton />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp */}
      <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-emerald-500/10">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="text-sm font-medium">WhatsApp</h2>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">Active</span>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Twilio number</p>
            <p className="text-sm font-mono text-zinc-200">
              {process.env.TWILIO_WHATSAPP_FROM?.replace("whatsapp:", "") ?? "Not configured"}
            </p>
          </div>
          <div className="pt-3 border-t border-white/[0.04]">
            <p className="text-xs text-zinc-600 leading-relaxed">
              Send a WhatsApp message to the number above to manage your tasks. Your phone number must be linked to your account — contact support if you need help connecting.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
