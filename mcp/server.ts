#!/usr/bin/env node
/**
 * TaskBot MCP Server
 *
 * Exposes TaskBot data to Claude Console (or any MCP client).
 * Run with: npx tsx mcp/server.ts
 *
 * Add to Claude Console settings:
 * {
 *   "mcpServers": {
 *     "taskbot": {
 *       "command": "npx",
 *       "args": ["tsx", "/path/to/your/project/mcp/server.ts"],
 *       "env": {
 *         "NEXT_PUBLIC_SUPABASE_URL": "...",
 *         "SUPABASE_SERVICE_ROLE_KEY": "..."
 *       }
 *     }
 *   }
 * }
 */

import { config } from "dotenv";
config({ path: ".env.local" }); // loads when running locally; Claude Desktop uses its own env block

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "../lib/supabase/database.types.js";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const server = new McpServer({
  name: "taskbot",
  version: "1.0.0",
});

// ─── Tools ───────────────────────────────────────────────────────────────────

server.tool(
  "list_users",
  "List all TaskBot users with their subscription status",
  {
    limit: z.number().int().min(1).max(100).default(20).optional(),
    tier: z.enum(["free", "pro"]).optional(),
  },
  async ({ limit = 20, tier }) => {
    let query = supabase
      .from("users")
      .select("id, email, name, subscription_tier, subscription_status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tier) query = query.eq("subscription_tier", tier);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "get_user_tasks",
  "Get all tasks for a specific user",
  {
    user_id: z.string().describe("The Clerk user ID"),
    status: z.enum(["pending", "in_progress", "completed"]).optional(),
    limit: z.number().int().min(1).max(200).default(50).optional(),
  },
  async ({ user_id, status, limit = 50 }) => {
    let query = supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "create_task",
  "Create a new task for a user",
  {
    user_id: z.string(),
    title: z.string().min(1).max(500),
    description: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).default("medium").optional(),
    due_date: z.string().datetime().optional(),
    tags: z.array(z.string()).optional(),
  },
  async ({ user_id, title, description, priority = "medium", due_date, tags }) => {
    const { data, error } = await supabase
      .from("tasks")
      .insert({ user_id, title, description, priority, due_date, tags })
      .select()
      .single();

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };

    return {
      content: [
        {
          type: "text",
          text: `Created task: ${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }
);

server.tool(
  "update_task",
  "Update a task's status, priority, or other fields",
  {
    task_id: z.string().uuid(),
    status: z.enum(["pending", "in_progress", "completed"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    title: z.string().min(1).max(500).optional(),
    due_date: z.string().datetime().nullable().optional(),
  },
  async ({ task_id, ...updates }) => {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", task_id)
      .select()
      .single();

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };

    return {
      content: [
        {
          type: "text",
          text: `Updated task: ${JSON.stringify(data, null, 2)}`,
        },
      ],
    };
  }
);

server.tool(
  "delete_task",
  "Delete a task by ID",
  {
    task_id: z.string().uuid(),
  },
  async ({ task_id }) => {
    const { error } = await supabase.from("tasks").delete().eq("id", task_id);
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };
    return { content: [{ type: "text", text: `Deleted task ${task_id}` }] };
  }
);

server.tool(
  "get_stats",
  "Get aggregate stats: user counts, task counts, subscription breakdown",
  {},
  async () => {
    const [users, tasks, proUsers, pendingTasks] = await Promise.all([
      supabase.from("users").select("id", { count: "exact" }),
      supabase.from("tasks").select("id", { count: "exact" }),
      supabase
        .from("users")
        .select("id", { count: "exact" })
        .eq("subscription_tier", "pro"),
      supabase
        .from("tasks")
        .select("id", { count: "exact" })
        .eq("status", "pending"),
    ]);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              total_users: users.count,
              total_tasks: tasks.count,
              pro_users: proUsers.count,
              pending_tasks: pendingTasks.count,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.tool(
  "search_tasks",
  "Full-text search across task titles and descriptions",
  {
    query: z.string().min(1),
    user_id: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20).optional(),
  },
  async ({ query, user_id, limit = 20 }) => {
    let q = supabase
      .from("tasks")
      .select("*")
      .ilike("title", `%${query}%`)
      .limit(limit);

    if (user_id) q = q.eq("user_id", user_id);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "get_whatsapp_sessions",
  "List WhatsApp sessions and their linked users",
  {
    limit: z.number().int().min(1).max(100).default(20).optional(),
  },
  async ({ limit = 20 }) => {
    const { data, error } = await supabase
      .from("whatsapp_sessions")
      .select("*, users(email, name)")
      .order("last_message_at", { ascending: false })
      .limit(limit);

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }] };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
);

// ─── Resources ───────────────────────────────────────────────────────────────

server.resource(
  "taskbot://stats",
  "Live aggregate stats for TaskBot",
  async () => {
    const [users, tasks] = await Promise.all([
      supabase.from("users").select("id, subscription_tier"),
      supabase.from("tasks").select("id, status"),
    ]);

    const stats = {
      users: {
        total: users.data?.length ?? 0,
        free: users.data?.filter((u) => u.subscription_tier === "free").length ?? 0,
        pro: users.data?.filter((u) => u.subscription_tier === "pro").length ?? 0,
      },
      tasks: {
        total: tasks.data?.length ?? 0,
        pending: tasks.data?.filter((t) => t.status === "pending").length ?? 0,
        in_progress: tasks.data?.filter((t) => t.status === "in_progress").length ?? 0,
        completed: tasks.data?.filter((t) => t.status === "completed").length ?? 0,
      },
    };

    return {
      contents: [
        {
          uri: "taskbot://stats",
          text: JSON.stringify(stats, null, 2),
          mimeType: "application/json",
        },
      ],
    };
  }
);

// ─── Start ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("TaskBot MCP server running on stdio");
}

main().catch(console.error);
