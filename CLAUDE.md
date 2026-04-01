# CLAUDE.md — TaskBot Project Context

This file gives any Claude Code session full context to work on this project without asking setup questions.

---

## Working Style

**One feature at a time.** Focus on the single feature or task described in the prompt. Do not proactively refactor, clean up, or improve adjacent code unless explicitly asked.

**Minimal footprint.** Limit changes to the files directly relevant to the task. Avoid touching shared utilities, config files, or unrelated modules unless the task requires it.

**Ask before expanding scope.** If completing the task seems to require modifying more than 3–4 files, pause and confirm before proceeding.

**No unsolicited restructuring.** Do not reorganize folder structures, rename files, or move components without an explicit instruction to do so.

---

## Project Overview

**TaskBot** is a WhatsApp-first AI task manager SaaS. Users send natural language messages via WhatsApp to create, list, complete, and delete tasks. There is also a web dashboard for managing tasks visually and handling account/billing settings.

Key differentiator: no app to download. Everything works through a WhatsApp chat powered by Claude AI for natural language understanding.

**Plans:**
- Free: 50 tasks/month, WhatsApp + web dashboard
- Pro ($9/mo): unlimited tasks, analytics, MCP access

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.2.4 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 |
| Database | Supabase (PostgreSQL) | @supabase/supabase-js ^2.49.2 |
| Auth | Clerk | @clerk/nextjs ^6.12.0 |
| Payments | Stripe | stripe ^17.7.0 |
| WhatsApp | Twilio | twilio ^5.4.5 |
| AI / NLP | Anthropic Claude | @anthropic-ai/sdk ^0.39.0 |
| MCP Server | Model Context Protocol SDK | @modelcontextprotocol/sdk ^1.10.2 |
| Hosting | Vercel | — |
| Validation | Zod | ^3.24.2 |
| Webhook verify | Svix (Clerk) | ^1.58.0 |
| Env loading | dotenv | ^17.3.1 |

---

## Architecture

### WhatsApp Message Flow

```
User sends WhatsApp message
        │
        ▼
Twilio (receives message, HTTP POST to webhook)
        │
        ▼
/api/webhooks/twilio  (app/api/webhooks/twilio/route.ts)
        │
        ├─► Validate Twilio signature
        │
        ├─► Supabase: upsert whatsapp_sessions, look up user by phone_number
        │       └─ If no user found → send "link your account" message → done
        │
        ├─► Check free tier task limit (50/month)
        │
        ├─► Claude Sonnet (lib/claude.ts → parseWhatsAppIntent)
        │       └─ Returns: { action, title, priority, due_date, task_query }
        │
        ├─► Supabase: execute action (create/list/complete/delete task)
        │
        ├─► Claude Haiku (lib/claude.ts → generateWhatsAppReply)
        │       └─ Returns: short friendly reply string
        │
        ├─► Update session context (last 10 messages) in Supabase
        │
        └─► Twilio: sendWhatsAppMessage → reply back to user
```

### Auth + User Sync Flow

```
User signs up via Clerk (web)
        │
        ▼
Clerk fires user.created webhook
        │
        ▼
/api/webhooks/clerk  → verified via Svix
        │
        ▼
Supabase: INSERT into users (id = Clerk user ID, email, name)
```

### Subscription Flow

```
User clicks "Upgrade to Pro" → /api/stripe/checkout
        │
        ▼
Stripe Checkout session created → redirect to Stripe
        │
        ▼
Payment complete → Stripe fires checkout.session.completed
        │
        ▼
/api/webhooks/stripe → Supabase: update users SET subscription_tier = 'pro'
```

### MCP Flow (Claude Console)

```
Claude Console (or Claude Desktop)
        │
        ▼
MCP client connects via stdio
        │
        ▼
mcp/server.ts (runs as subprocess)
        │
        ▼
Supabase (service role — bypasses RLS)
        │
Tools: list_users, get_user_tasks, create_task, update_task,
       delete_task, get_stats, search_tasks, get_whatsapp_sessions
```

---

## Environment Variables

All variables go in `.env.local` for local dev and in Vercel dashboard for production.

### Supabase
| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → service_role key (**keep secret**) |

### Clerk
| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks → your endpoint → Signing Secret |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | hardcoded: `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | hardcoded: `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | hardcoded: `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | hardcoded: `/dashboard` |

Clerk webhook endpoint URL: `https://your-domain/api/webhooks/clerk`
Events to subscribe: `user.created`, `user.updated`, `user.deleted`

### Stripe
| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → endpoint → Signing Secret |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Stripe Dashboard → Products → TaskBot Pro → monthly price ID |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Stripe Dashboard → Products → TaskBot Pro → yearly price ID |

Stripe webhook endpoint URL: `https://your-domain/api/webhooks/stripe`
Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### Twilio
| Variable | Where to get it |
|----------|----------------|
| `TWILIO_ACCOUNT_SID` | Twilio Console → Account Info (starts with AC) |
| `TWILIO_AUTH_TOKEN` | Twilio Console → Account Info (32-char hex) |
| `TWILIO_WHATSAPP_FROM` | Twilio Console → WhatsApp sandbox number, format: `whatsapp:+14155238886` |

Twilio webhook URL: `https://your-ngrok-or-domain/api/webhooks/twilio` (HTTP POST)

### Anthropic
| Variable | Where to get it |
|----------|----------------|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |

### App
| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3002` locally, `https://your-app.vercel.app` in production |

**Important:** `NEXT_PUBLIC_APP_URL` must be `localhost:3002` locally (not the ngrok URL). ngrok URL only goes into the external service dashboards (Clerk, Stripe, Twilio webhook settings).

---

## File Structure

```
.
├── app/
│   ├── (dashboard)/                 # All protected routes (Clerk middleware guards these)
│   │   ├── layout.tsx               # Sidebar nav + UserButton shell
│   │   ├── dashboard/page.tsx       # Overview: stats cards + open task list
│   │   ├── tasks/
│   │   │   ├── page.tsx             # Server component: fetches tasks, passes to client
│   │   │   └── TaskList.tsx         # Client component: add/complete/delete tasks
│   │   └── settings/
│   │       ├── page.tsx             # Account info + billing + WhatsApp instructions
│   │       └── UpgradeButton.tsx    # Client component: triggers Stripe checkout
│   ├── api/
│   │   ├── tasks/
│   │   │   ├── route.ts             # GET (list), POST (create) — auth via Clerk
│   │   │   └── [id]/route.ts        # PATCH (update), DELETE — ownership verified
│   │   ├── stripe/
│   │   │   └── checkout/route.ts   # Creates Stripe checkout session for Pro upgrade
│   │   └── webhooks/
│   │       ├── clerk/route.ts       # Syncs Clerk users → Supabase users table
│   │       ├── stripe/route.ts      # Handles subscription lifecycle events
│   │       └── twilio/route.ts      # WhatsApp bot entry point (the main feature)
│   ├── sign-in/[[...sign-in]]/      # Clerk hosted sign-in page
│   ├── sign-up/[[...sign-up]]/      # Clerk hosted sign-up page
│   ├── layout.tsx                   # Root layout: ClerkProvider wrapper
│   ├── page.tsx                     # Public landing page (hero, how it works, pricing)
│   └── globals.css                  # Tailwind v4 import
│
├── lib/
│   ├── claude.ts                    # parseWhatsAppIntent (Sonnet) + generateWhatsAppReply (Haiku)
│   ├── stripe.ts                    # createOrRetrieveCustomer, createCheckoutSession, createPortalSession
│   ├── twilio.ts                    # sendWhatsAppMessage, validateTwilioWebhook
│   └── supabase/
│       ├── client.ts                # Browser Supabase client (anon key)
│       ├── server.ts                # Server Supabase client (anon key) + createServiceClient (service role)
│       └── database.types.ts        # TypeScript types for all tables (manually maintained)
│
├── mcp/
│   └── server.ts                    # MCP stdio server — exposes TaskBot data to Claude Console
│
├── supabase/
│   └── migrations/
│       └── 001_initial.sql          # Full schema: tables, indexes, triggers, RLS policies
│
├── middleware.ts                    # Clerk route protection (guards /dashboard, /tasks, /settings)
├── next.config.ts                   # Next.js config
├── postcss.config.mjs               # Tailwind v4 PostCSS plugin
├── vercel.json                      # Vercel deployment config
└── .env.example                     # Template for all required env vars
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | Clerk user ID (e.g. `user_abc123`) |
| `email` | text unique | |
| `name` | text | |
| `phone_number` | text unique | Used to link WhatsApp messages to account |
| `stripe_customer_id` | text unique | Set on first checkout |
| `subscription_status` | text | `free` \| `active` \| `canceled` \| `past_due` |
| `subscription_tier` | text | `free` \| `pro` |
| `created_at` / `updated_at` | timestamptz | auto-managed by trigger |

### `tasks`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | auto-generated |
| `user_id` | text FK → users.id | cascade delete |
| `title` | text | required |
| `description` | text | optional |
| `status` | text | `pending` \| `in_progress` \| `completed` |
| `priority` | text | `low` \| `medium` \| `high` |
| `due_date` | timestamptz | optional |
| `tags` | text[] | optional |
| `created_at` / `updated_at` | timestamptz | auto-managed by trigger |

### `whatsapp_sessions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `phone_number` | text unique | e.g. `+15551234567` |
| `user_id` | text FK → users.id | nullable — null until user links their phone |
| `context` | jsonb | stores last 10 messages as `{ history: [...] }` for conversational context |
| `last_message_at` | timestamptz | |

**RLS:** All tables have Row Level Security enabled. App code that reads/writes on behalf of a user uses the service role key (bypasses RLS). The `app.user_id` session setting approach is used for browser-side access.

---

## Running Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env.local
# Fill in all values — see Environment Variables section above
```

### 3. Run the database migration
Paste `supabase/migrations/001_initial.sql` into Supabase Dashboard → SQL Editor → Run.

### 4. Start the dev server
```bash
npm run dev
# App runs at http://localhost:3002
```

### 5. Expose localhost for webhooks (separate terminal)
```bash
ngrok http 3002
# Copy the https URL e.g. https://abc123.ngrok-free.app
# Set this URL in:
#   - Clerk Dashboard → Webhooks → endpoint URL
#   - Stripe Dashboard → Webhooks → endpoint URL  (OR use stripe listen below)
#   - Twilio Console → WhatsApp → webhook URL
```

### 6. Stripe webhook listener (alternative to ngrok for Stripe only)
```bash
stripe listen --forward-to localhost:3002/api/webhooks/stripe
# Copy the whsec_... key it prints → STRIPE_WEBHOOK_SECRET in .env.local
```

### 7. Link your phone number to your account
After signing up, run in Supabase SQL Editor:
```sql
UPDATE users SET phone_number = '+1234567890' WHERE email = 'your@email.com';
```

### 8. Run the MCP server (optional, separate terminal)
```bash
npm run mcp
```

---

## Deploying to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy to production
vercel --prod
```

Or connect the GitHub repo (`MuhammadSaeedMBZUAI/taskbot-saas`) to Vercel for automatic deploys on every push.

**After deploying:** Add all env vars from `.env.local` to Vercel → Project → Settings → Environment Variables. Update `NEXT_PUBLIC_APP_URL` to the Vercel domain. Update webhook URLs in Clerk, Stripe, and Twilio dashboards to use the Vercel domain instead of ngrok.

---

## MCP Server Setup (Claude Desktop)

The MCP server lets Claude Desktop / Claude Console query and manage TaskBot data directly.

Config file location: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the `mcpServers` block (keep any existing `preferences` key):
```json
{
  "mcpServers": {
    "taskbot": {
      "command": "npx",
      "args": ["tsx", "/Users/muhammad_saeed/Documents/saeed_work/claude_code/crazy_project/mcp/server.ts"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key"
      }
    }
  }
}
```

Fully quit (Cmd+Q) and reopen Claude Desktop after saving.

### Available MCP tools
| Tool | Description |
|------|-------------|
| `list_users` | List all users, optionally filter by `tier` |
| `get_user_tasks` | Get tasks for a user, filter by status |
| `create_task` | Create a task for any user |
| `update_task` | Update status, priority, title, due_date |
| `delete_task` | Delete a task by UUID |
| `get_stats` | Aggregate counts: users, tasks, pro users, pending tasks |
| `search_tasks` | Full-text search across task titles |
| `get_whatsapp_sessions` | List WhatsApp sessions with linked user info |

Resource `taskbot://stats` is also available for a live snapshot.

---

## Known Issues & TODO

### Known Issues
- **Phone number linking is manual** — users must be linked via SQL UPDATE. No UI for users to enter their own phone number on the settings page yet.
- **WhatsApp double message** — in Twilio sandbox, you may see an "OK" text appear. This is a sandbox artifact; it does not happen with a production WhatsApp number.
- **Twilio signature validation is skipped in dev** — the webhook only validates signatures in `NODE_ENV=production`. Fine for local dev but remember to confirm it works on Vercel.
- **`database.types.ts` is manually maintained** — types are hand-written. Run `npm run db:generate-types` (requires Supabase CLI) to auto-regenerate after schema changes.

### TODO
- [ ] Settings page: add phone number input so users can self-link WhatsApp
- [ ] Task due date reminders via WhatsApp (Twilio scheduled messages or cron)
- [ ] Analytics page for Pro users (task completion rate, streaks)
- [ ] Yearly subscription price properly wired (currently uses monthly price ID as fallback)
- [ ] Supabase Realtime on the tasks page (live updates without refresh)
- [ ] Rate limiting on the Twilio webhook (prevent abuse)
- [ ] Error monitoring (Sentry or similar)
- [ ] Push to production Vercel deployment
- [ ] Apply for Twilio production WhatsApp Business number (sandbox has join-phrase friction)
