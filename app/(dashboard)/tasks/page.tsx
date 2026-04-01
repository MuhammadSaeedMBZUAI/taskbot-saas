import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import TaskList from "./TaskList";

export default async function TasksPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = createServiceClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Tasks</h1>
      </div>
      <TaskList initialTasks={tasks ?? []} userId={userId} />
    </div>
  );
}
