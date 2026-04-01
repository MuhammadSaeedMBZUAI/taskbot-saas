import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 to-zinc-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-tight">TaskBot</span>
        <div className="flex gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-4 py-2 text-sm bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition">
                Get started
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg transition"
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Powered by Claude AI
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
          Your tasks.
          <br />
          <span className="text-green-400">In WhatsApp.</span>
        </h1>

        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
          Just send a message. TaskBot understands natural language, manages
          your tasks, and keeps you on track — no app to download.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignUpButton mode="modal">
            <button className="px-8 py-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl text-lg transition">
              Start for free
            </button>
          </SignUpButton>
          <a
            href="#how-it-works"
            className="px-8 py-4 border border-zinc-700 hover:border-zinc-500 rounded-xl text-lg transition"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* WhatsApp Demo */}
      <section
        id="how-it-works"
        className="max-w-6xl mx-auto px-8 py-20 border-t border-zinc-800"
      >
        <h2 className="text-3xl font-bold text-center mb-4">
          How it works
        </h2>
        <p className="text-zinc-400 text-center mb-16">
          Send a WhatsApp message. That&apos;s it.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Connect WhatsApp",
              desc: "Add our number to your contacts and send a message to get started.",
            },
            {
              step: "02",
              title: "Chat naturally",
              desc: '"Add buy milk tomorrow" or "What\'s on my list?" — Claude understands.',
            },
            {
              step: "03",
              title: "Manage from anywhere",
              desc: "Use the web dashboard for bulk edits, tags, and analytics.",
            },
          ].map(({ step, title, desc }) => (
            <div
              key={step}
              className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50"
            >
              <span className="text-4xl font-black text-green-500/30">
                {step}
              </span>
              <h3 className="text-xl font-semibold mt-3 mb-2">{title}</h3>
              <p className="text-zinc-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-8 py-20 border-t border-zinc-800">
        <h2 className="text-3xl font-bold text-center mb-16">Pricing</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            {
              name: "Free",
              price: "$0",
              period: "forever",
              features: ["50 tasks / month", "WhatsApp access", "Web dashboard"],
              cta: "Get started",
              highlight: false,
            },
            {
              name: "Pro",
              price: "$9",
              period: "/ month",
              features: [
                "Unlimited tasks",
                "Priority support",
                "Task analytics",
                "Custom tags & filters",
                "Claude Console MCP access",
              ],
              cta: "Upgrade to Pro",
              highlight: true,
            },
          ].map(({ name, price, period, features, cta, highlight }) => (
            <div
              key={name}
              className={`p-8 rounded-2xl border ${
                highlight
                  ? "border-green-500 bg-green-500/5"
                  : "border-zinc-800 bg-zinc-900/50"
              }`}
            >
              <h3 className="text-xl font-semibold mb-1">{name}</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-black">{price}</span>
                <span className="text-zinc-400 mb-1">{period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-zinc-300">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <SignUpButton mode="modal">
                <button
                  className={`w-full py-3 rounded-xl font-semibold transition ${
                    highlight
                      ? "bg-green-500 hover:bg-green-400 text-black"
                      : "border border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  {cta}
                </button>
              </SignUpButton>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-zinc-600 text-sm border-t border-zinc-800">
        © {new Date().getFullYear()} TaskBot. Built with Claude Code.
      </footer>
    </main>
  );
}
