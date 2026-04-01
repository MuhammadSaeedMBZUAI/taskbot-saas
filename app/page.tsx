import Link from "next/link";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { MessageSquare, Zap, LayoutDashboard, CheckCircle2, ArrowRight, Bot } from "lucide-react";

const chatMessages = [
  { from: "user", text: "add call dentist tomorrow high priority" },
  { from: "bot", text: '✓ Added "Call dentist" — high priority, due tomorrow.' },
  { from: "user", text: "show my tasks" },
  { from: "bot", text: "You have 3 open tasks:\n• Call dentist (tomorrow) 🔴\n• Review Q2 report\n• Buy team lunch" },
  { from: "user", text: "mark call dentist done" },
  { from: "bot", text: '✓ "Call dentist" completed!' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-black" />
            </div>
            <span className="font-semibold tracking-tight">TaskBot</span>
          </div>
          <div className="flex items-center gap-2">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-colors">
                  Get started free
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-colors"
              >
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Powered by Claude AI
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Manage tasks
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                from WhatsApp.
              </span>
            </h1>

            <p className="text-lg text-zinc-400 leading-relaxed mb-10 max-w-lg">
              Just send a message. TaskBot understands natural language, creates tasks, and keeps you on track — no app to download.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <SignUpButton mode="modal">
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors text-sm">
                  Start for free <ArrowRight className="w-4 h-4" />
                </button>
              </SignUpButton>
              <a
                href="#how-it-works"
                className="flex items-center justify-center gap-2 px-6 py-3 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl transition-colors text-sm text-zinc-300"
              >
                See how it works
              </a>
            </div>

            <div className="flex items-center gap-6 mt-10 pt-10 border-t border-white/[0.06]">
              {[
                { value: "50+", label: "Commands understood" },
                { value: "< 1s", label: "Response time" },
                { value: "Free", label: "To get started" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-xl font-bold text-white">{value}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — WhatsApp mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-[320px]">
              {/* Phone frame */}
              <div className="rounded-[2rem] border border-white/10 bg-[#111] p-1 shadow-2xl shadow-black/50">
                {/* WhatsApp header */}
                <div className="rounded-[1.6rem] overflow-hidden">
                  <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-black" />
                    </div>
                    <div>
                      <div className="text-white text-sm font-semibold">TaskBot</div>
                      <div className="text-emerald-200 text-xs">online</div>
                    </div>
                  </div>

                  {/* Chat */}
                  <div className="bg-[#0d1418] bg-[url('https://web.whatsapp.com/img/bg-chat-tile-light_a4be512e7195b6b733d9110b408f075d.png')] px-3 py-4 space-y-2 min-h-[360px]">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[78%] px-3 py-2 rounded-lg text-xs leading-relaxed whitespace-pre-line shadow-sm ${
                            msg.from === "user"
                              ? "bg-[#005c4b] text-white rounded-tr-none"
                              : "bg-[#202c33] text-zinc-100 rounded-tl-none"
                          }`}
                        >
                          {msg.text}
                          <span className={`block text-right text-[10px] mt-1 ${msg.from === "user" ? "text-emerald-300/60" : "text-zinc-500"}`}>
                            {["9:41", "9:41", "9:42", "9:42", "9:43", "9:43"][i]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-white/[0.06] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3">Simple by design</h2>
            <p className="text-zinc-400 max-w-md mx-auto">Three steps to a fully connected task manager that lives in your WhatsApp.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: MessageSquare,
                step: "01",
                title: "Connect WhatsApp",
                desc: "Save our number and send a message. No downloads, no sign-up friction on your phone.",
                color: "text-blue-400 bg-blue-400/10",
              },
              {
                icon: Zap,
                step: "02",
                title: "Chat naturally",
                desc: '"Add call dentist high priority tomorrow" — Claude understands context, priority, and dates.',
                color: "text-emerald-400 bg-emerald-400/10",
              },
              {
                icon: LayoutDashboard,
                step: "03",
                title: "Review on the web",
                desc: "Use the dashboard for a full view — filter, bulk-edit, and track progress.",
                color: "text-violet-400 bg-violet-400/10",
              },
            ].map(({ icon: Icon, step, title, desc, color }) => (
              <div key={step} className="relative p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all">
                <div className="text-[11px] font-mono text-zinc-600 mb-4">{step}</div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Natural language processing",
                desc: "Claude AI understands context, relative dates ("next Monday"), priority levels, and complex instructions.",
                badge: "AI-powered",
                badgeColor: "text-violet-400 bg-violet-400/10 border-violet-400/20",
              },
              {
                title: "Conversation memory",
                desc: "TaskBot remembers the last 10 messages, so you can say 'mark the last one done' and it knows exactly what you mean.",
                badge: "Context-aware",
                badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
              },
              {
                title: "Claude Console MCP integration",
                desc: "Connect your TaskBot data to Claude Console. Query users, tasks, and stats directly from a conversation.",
                badge: "Pro",
                badgeColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
              },
              {
                title: "Real-time sync",
                desc: "Tasks added via WhatsApp appear instantly on the web dashboard. Change made on the web? Your bot knows immediately.",
                badge: "Live sync",
                badgeColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
              },
            ].map(({ title, desc, badge, badgeColor }) => (
              <div key={title} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
                <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border mb-4 ${badgeColor}`}>
                  {badge}
                </span>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3">Simple pricing</h2>
            <p className="text-zinc-400">Start free. Upgrade when you need more.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="p-8 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-1">Free</h3>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-zinc-500 pb-1">/ forever</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {["50 tasks per month", "WhatsApp access", "Web dashboard", "Priority levels & due dates"].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <SignUpButton mode="modal">
                <button className="w-full py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-sm font-medium transition-all">
                  Get started free
                </button>
              </SignUpButton>
            </div>

            {/* Pro */}
            <div className="relative p-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500 text-black">
                  Most popular
                </span>
              </div>
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-1">Pro</h3>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">$9</span>
                  <span className="text-zinc-500 pb-1">/ month</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited tasks",
                  "Everything in Free",
                  "Task analytics",
                  "Custom tags & filters",
                  "Claude Console MCP access",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <SignUpButton mode="modal">
                <button className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors">
                  Start with Pro
                </button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.06] py-24">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Your tasks, in your pocket.
          </h2>
          <p className="text-zinc-400 mb-8">
            Sign up in 30 seconds. No credit card required.
          </p>
          <SignUpButton mode="modal">
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-base transition-colors">
              Get started for free <ArrowRight className="w-4 h-4" />
            </button>
          </SignUpButton>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center">
              <Bot className="w-3 h-3 text-emerald-400" />
            </div>
            TaskBot
          </div>
          <span>© {new Date().getFullYear()} — Built with Claude Code</span>
        </div>
      </footer>
    </div>
  );
}
