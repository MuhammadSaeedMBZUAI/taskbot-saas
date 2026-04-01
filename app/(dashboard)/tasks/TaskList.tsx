"use client";

import { useState } from "react";
import { Plus, Trash2, Circle, CheckCircle2, Loader2 } from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

const STATUS_TABS = [
  { key: "all",         label: "All" },
  { key: "pending",     label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed",   label: "Completed" },
] as const;

const PRIORITY_CONFIG = {
  high:   { dot: "bg-red-400",   badge: "text-red-400 bg-red-400/10 border-red-400/20" },
  medium: { dot: "bg-amber-400", badge: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  low:    { dot: "bg-blue-400",  badge: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
};

export default function TaskList({ initialTasks, userId }: { initialTasks: Task[]; userId: string }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<"all" | Task["status"]>("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("medium");
  const [adding, setAdding] = useState(false);

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), priority: newPriority, userId }),
      });
      const { task } = await res.json();
      setTasks((prev) => [task, ...prev]);
      setNewTitle("");
    } finally {
      setAdding(false);
    }
  }

  async function updateStatus(id: string, status: Task["status"]) {
    setLoading(id);
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    } finally {
      setLoading(null);
    }
  }

  async function deleteTask(id: string) {
    setLoading(id);
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Add task form */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
        <form onSubmit={addTask} className="flex gap-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] focus:border-emerald-500/50 focus:bg-white/[0.06] outline-none text-sm placeholder-zinc-600 transition-all"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as Task["priority"])}
            className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] outline-none text-sm text-zinc-400 transition-all hover:border-white/[0.12] cursor-pointer"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold rounded-xl text-sm transition-colors flex-shrink-0"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </form>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] w-fit">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === key
                ? "bg-white/[0.08] text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              filter === key ? "bg-white/[0.12] text-zinc-200" : "bg-white/[0.04] text-zinc-600"
            }`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-white/[0.07] text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-zinc-700" />
          </div>
          <p className="text-sm text-zinc-500 mb-1">No tasks here</p>
          <p className="text-xs text-zinc-700">Add one above or send a WhatsApp message</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
          {filtered.map((task) => {
            const isCompleted = task.status === "completed";
            const isLoading = loading === task.id;
            const p = PRIORITY_CONFIG[task.priority];

            return (
              <div
                key={task.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group"
              >
                {/* Checkbox */}
                <button
                  onClick={() => updateStatus(task.id, isCompleted ? "pending" : "completed")}
                  disabled={isLoading}
                  className="flex-shrink-0 text-zinc-600 hover:text-emerald-400 transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>

                {/* Priority dot */}
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isCompleted ? "bg-zinc-700" : p.dot}`} />

                {/* Title */}
                <span className={`flex-1 text-sm truncate transition-colors ${
                  isCompleted ? "line-through text-zinc-600" : "text-zinc-200"
                }`}>
                  {task.title}
                </span>

                {/* Priority badge */}
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border hidden sm:block flex-shrink-0 ${
                  isCompleted ? "text-zinc-700 bg-transparent border-zinc-800" : p.badge
                }`}>
                  {task.priority}
                </span>

                {/* Due date */}
                {task.due_date && (
                  <span className="text-xs text-zinc-600 flex-shrink-0 hidden md:block">
                    {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}

                {/* Delete */}
                <button
                  onClick={() => deleteTask(task.id)}
                  disabled={isLoading}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-zinc-700 hover:text-red-400 transition-all disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tasks.length > 0 && (
        <p className="text-xs text-zinc-700 text-center">
          {counts.completed} of {counts.all} tasks completed
        </p>
      )}
    </div>
  );
}
