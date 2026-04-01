import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";

async function getStats(userId: string) {
  const supabase = createServiceClient();

  const [total, pending, completed] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact" }).eq("user_id", userId),
    supabase
      .from("tasks")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .eq("status", "pending"),
    supabase
      .from("tasks")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .eq("status", "completed"),
  ]);

  return {
    total: total.count ?? 0,
    pending: pending.count ?? 0,
    completed: completed.count ?? 0,
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

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) return null;

  const [stats, recentTasks] = await Promise.all([
    getStats(userId),
    getRecentTasks(userId),
  ]);

  const priorityColors = {
    low: "text-blue-400",
    medium: "text-yellow-400",
    high: "text-red-400",
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">
        Welcome back, {user?.firstName ?? "there"}
      </h1>
      <p className="text-zinc-400 mb-8 text-sm">
        Here&apos;s what&apos;s on your plate today.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "Total tasks", value: stats.total },
          { label: "Pending", value: stats.pending },
          { label: "Completed", value: stats.completed },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="p-5 rounded-xl border border-zinc-800 bg-zinc-900"
          >
            <div className="text-3xl font-black mb-1">{value}</div>
            <div className="text-sm text-zinc-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent tasks */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Open tasks</h2>
        {recentTasks.length === 0 ? (
          <div className="text-zinc-500 text-sm py-8 text-center border border-dashed border-zinc-800 rounded-xl">
            No open tasks. Send a WhatsApp message to add one!
          </div>
        ) : (
          <ul className="space-y-3">
            {recentTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition"
              >
                <span
                  className={`text-xs font-semibold uppercase ${priorityColors[task.priority]}`}
                >
                  {task.priority}
                </span>
                <span className="flex-1 text-sm">{task.title}</span>
                {task.due_date && (
                  <span className="text-xs text-zinc-500">
                    {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* WhatsApp number hint */}
      <div className="mt-10 p-5 rounded-xl border border-green-500/20 bg-green-500/5">
        <p className="text-sm text-green-400 font-semibold mb-1">
          Connected to WhatsApp
        </p>
        <p className="text-sm text-zinc-400">
          Text{" "}
          <span className="font-mono text-white">
            {process.env.TWILIO_WHATSAPP_FROM?.replace("whatsapp:", "") ??
              "your Twilio number"}
          </span>{" "}
          on WhatsApp to manage tasks from anywhere.
        </p>
      </div>
    </div>
  );
}
