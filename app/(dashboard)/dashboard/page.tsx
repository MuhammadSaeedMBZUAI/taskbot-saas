import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ListTodo, Clock, CheckCircle2, TrendingUp, MessageSquare, ArrowRight } from "lucide-react";
import Link from "next/link";

async function getStats(userId: string) {
  const supabase = createServiceClient();
  const [total, pending, completed] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact" }).eq("user_id", userId),
    supabase.from("tasks").select("id", { count: "exact" }).eq("user_id", userId).eq("status", "pending"),
    supabase.from("tasks").select("id", { count: "exact" }).eq("user_id", userId).eq("status", "completed"),
  ]);
  const t = total.count ?? 0;
  const c = completed.count ?? 0;
  return {
    total: t,
    pending: pending.count ?? 0,
    completed: c,
    rate: t > 0 ? Math.round((c / t) * 100) : 0,
  };
}

async function getRecentTasks(userId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

const PRIORITY_CONFIG = {
  high:   { dot: "bg-red-400",   label: "High",   text: "text-red-400" },
  medium: { dot: "bg-amber-400", label: "Medium", text: "text-amber-400" },
  low:    { dot: "bg-blue-400",  label: "Low",    text: "text-blue-400" },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId) return null;

  const [stats, recentTasks] = await Promise.all([getStats(userId), getRecentTasks(userId)]);

  const statCards = [
    { label: "Total tasks",       value: stats.total,     icon: ListTodo,     color: "text-violet-400 bg-violet-400/10" },
    { label: "Pending",           value: stats.pending,   icon: Clock,        color: "text-amber-400 bg-amber-400/10" },
    { label: "Completed",         value: stats.completed, icon: CheckCircle2, color: "text-emerald-400 bg-emerald-400/10" },
    { label: "Completion rate",   value: `${stats.rate}%`, icon: TrendingUp,  color: "text-blue-400 bg-blue-400/10" },
  ];

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {getGreeting()}, {user?.firstName ?? "there"} 👋
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Here&apos;s your task summary for today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] transition-colors">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${color}`}>
              <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
            </div>
            <div className="text-2xl font-bold tracking-tight mb-0.5">{value}</div>
            <div className="text-xs text-zinc-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Progress this period</span>
            <span className="text-sm text-zinc-400">{stats.completed}/{stats.total} completed</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-zinc-600">0%</span>
            <span className="text-xs text-emerald-400 font-medium">{stats.rate}%</span>
            <span className="text-xs text-zinc-600">100%</span>
          </div>
        </div>
      )}

      {/* Open tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-zinc-300">Open tasks</h2>
          <Link href="/tasks" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-white/[0.07] text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500 mb-1">No open tasks</p>
            <p className="text-xs text-zinc-600">Send a WhatsApp message to add one</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
            {recentTasks.map((task) => {
              const p = PRIORITY_CONFIG[task.priority];
              return (
                <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.dot}`} />
                  <span className="flex-1 text-sm text-zinc-200 truncate">{task.title}</span>
                  <span className={`text-xs font-medium ${p.text} hidden sm:block`}>{p.label}</span>
                  {task.due_date && (
                    <span className="text-xs text-zinc-600 flex-shrink-0">
                      {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WhatsApp card */}
      <div className="flex items-start gap-4 p-5 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04]">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-emerald-300 mb-0.5">WhatsApp connected</p>
          <p className="text-xs text-zinc-500">
            Text{" "}
            <span className="font-mono text-zinc-300">
              {process.env.TWILIO_WHATSAPP_FROM?.replace("whatsapp:", "") ?? "your Twilio number"}
            </span>{" "}
            on WhatsApp to manage tasks from anywhere.
          </p>
        </div>
      </div>
    </div>
  );
}
