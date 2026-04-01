"use client";

import { useState } from "react";
import type { Database } from "@/lib/supabase/database.types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

const STATUS_LABELS: Record<Task["status"], string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  low: "text-blue-400 bg-blue-400/10",
  medium: "text-yellow-400 bg-yellow-400/10",
  high: "text-red-400 bg-red-400/10",
};

export default function TaskList({
  initialTasks,
  userId,
}: {
  initialTasks: Task[];
  userId: string;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<"all" | Task["status"]>("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const filtered =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), userId }),
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
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
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
    <div>
      {/* Add task */}
      <form onSubmit={addTask} className="flex gap-3 mb-6">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 focus:border-zinc-500 outline-none text-sm"
        />
        <button
          type="submit"
          disabled={adding}
          className="px-4 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition"
        >
          {adding ? "Adding..." : "Add"}
        </button>
      </form>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "pending", "in_progress", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === f
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {f === "all" ? "All" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-12 border border-dashed border-zinc-800 rounded-xl">
          No tasks here.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition group"
            >
              <input
                type="checkbox"
                checked={task.status === "completed"}
                onChange={(e) =>
                  updateStatus(task.id, e.target.checked ? "completed" : "pending")
                }
                disabled={loading === task.id}
                className="w-4 h-4 accent-green-500 cursor-pointer"
              />

              <span
                className={`flex-1 text-sm ${
                  task.status === "completed"
                    ? "line-through text-zinc-500"
                    : ""
                }`}
              >
                {task.title}
              </span>

              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}
              >
                {task.priority}
              </span>

              {task.due_date && (
                <span className="text-xs text-zinc-500">
                  {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}

              <button
                onClick={() => deleteTask(task.id)}
                disabled={loading === task.id}
                className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 text-xs transition"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
