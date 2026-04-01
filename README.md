# TaskBot — WhatsApp-first AI Task Manager

A production-ready SaaS built with the crazy-fast stack:
**Claude Code · GitHub · Vercel · Supabase · Clerk · Stripe · Twilio · Anthropic Claude**

Send tasks via WhatsApp. Manage them on the web. Query your data with Claude Console via MCP. No app to download.

---

## Architecture

```
WhatsApp message
      │
      ▼
Twilio webhook  ──►  /api/webhooks/twilio
                          │
                          ├─ Claude (claude-sonnet-4-6): parse intent
                          ├─ Supabase: read / write tasks
                          └─ Twilio: send reply back to WhatsApp

Web dashboard (Next.js 14 + Tailwind)
      │
      ├─ Clerk: auth (Google, GitHub, email, social)
      ├─ Supabase: data
      └─ Stripe: subscriptions

MCP Server (stdio)
      │
      └─ Claude Console: talk to your data directly
```

---

## Stack

| Layer | Service | Purpose |
|-------|---------|---------|
| Hosting | Vercel | Deploy Next.js app |
| Database | Supabase | PostgreSQL + RLS |
| Auth | Clerk | Sign-up/in, social OAuth |
| Payments | Stripe | Subscriptions (Free / Pro) |
| WhatsApp | Twilio | Inbound/outbound messages |
| AI | Anthropic Claude | NLP intent parsing |
| MCP | `@modelcontextprotocol/sdk` | Claude Console integration |
| Framework | Next.js 14 (App Router) | Full-stack React |

---

## Quick Start

```bash
git clone <your-repo>
cd taskbot-saas
npm install
cp .env.example .env.local
# fill in .env.local (see section below)
npm run dev
```

---

## What You Need to Provide

Everything below is required. Copy `.env.example` → `.env.local` and fill in each value. Then add the same variables to your **Vercel project environment variables**.

---

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → API**
3. Provide:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (**keep secret**) |

4. Run the database migration:
   ```bash
   # Option A: Supabase CLI
   npx supabase db push

   # Option B: paste supabase/migrations/001_initial.sql directly
   # into Supabase Dashboard → SQL Editor → Run
   ```

---

### 2. Clerk

1. Create an app at [clerk.com](https://clerk.com)
2. Enable social providers you want (Google, GitHub, etc.) under **User & Authentication → Social Connections**
3. Go to **API Keys**
4. Provide:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Publishable key |
| `CLERK_SECRET_KEY` | Secret key |

5. Set up a **webhook** in Clerk Dashboard → Webhooks → Add endpoint:
   - URL: `https://your-app.vercel.app/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Copy the **Signing Secret** → `CLERK_WEBHOOK_SECRET`

6. Set redirect URLs (already in `.env.example`, update domain for prod):
   ```
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   ```

---

### 3. Stripe

1. Create an account at [stripe.com](https://stripe.com)
2. Go to **Developers → API Keys**
3. Provide:

| Variable | Where to find it |
|----------|-----------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key |
| `STRIPE_SECRET_KEY` | Secret key |

4. Create subscription products:
   - **Dashboard → Products → Add product**
   - Create "TaskBot Pro" with a monthly price ($9) and optionally yearly
   - Copy the **Price IDs** → `STRIPE_PRO_MONTHLY_PRICE_ID` / `STRIPE_PRO_YEARLY_PRICE_ID`

5. Set up a **webhook** in Stripe Dashboard → Developers → Webhooks → Add endpoint:
   - URL: `https://your-app.vercel.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`
   - Copy the **Signing Secret** → `STRIPE_WEBHOOK_SECRET`

6. Enable the **Customer Portal** in Stripe Dashboard → Settings → Billing → Customer portal

---

### 4. Twilio (WhatsApp)

1. Create an account at [twilio.com](https://twilio.com)
2. Go to **Console Dashboard** for:

| Variable | Where to find it |
|----------|-----------------|
| `TWILIO_ACCOUNT_SID` | Account SID |
| `TWILIO_AUTH_TOKEN` | Auth Token |

3. Set up WhatsApp:
   - **Messaging → Try WhatsApp** → use the Twilio Sandbox for development
   - For production: apply for a WhatsApp Business number
   - Set the **Webhook URL** for incoming messages to:
     `https://your-app.vercel.app/api/webhooks/twilio`
   - HTTP method: **POST**
   - Copy the WhatsApp-enabled number → `TWILIO_WHATSAPP_FROM` (format: `whatsapp:+14155238886`)

---

### 5. Anthropic

1. Get an API key at [console.anthropic.com](https://console.anthropic.com)
2. Provide:

| Variable | Where to find it |
|----------|-----------------|
| `ANTHROPIC_API_KEY` | API Keys section |

---

### 6. App URL

```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```
Use `http://localhost:3000` for local dev.

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set all env vars
vercel env add NEXT_PUBLIC_SUPABASE_URL
# ... repeat for each variable
```

Or connect your GitHub repo to Vercel and add env vars in the dashboard under **Project → Settings → Environment Variables**.

---

## MCP Server (Claude Console)

The MCP server lets Claude Console read and write your TaskBot data directly.

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `list_users` | List all users, filter by tier |
| `get_user_tasks` | Get tasks for a specific user |
| `create_task` | Create a task for any user |
| `update_task` | Update status, priority, etc. |
| `delete_task` | Delete a task |
| `get_stats` | Aggregate stats (users, tasks) |
| `search_tasks` | Full-text search across tasks |
| `get_whatsapp_sessions` | See WhatsApp session data |

### Connect to Claude Console

Add to your Claude Console `settings.json` (or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "taskbot": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/your/project/mcp/server.ts"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "your_supabase_url",
        "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key"
      }
    }
  }
}
```

Then in Claude Console you can say:
- *"Show me all pro users"*
- *"Create a task for user X: buy milk, due tomorrow"*
- *"What are the TaskBot stats?"*
- *"Mark task abc123 as completed"*

---

## Linking WhatsApp to an Account

Because Twilio doesn't share the user's email, the user must manually link their phone:

1. User goes to `/settings` in the web app
2. They see their phone number shown in the WhatsApp section *(coming: add a phone number input field there)*
3. Currently the linking is done server-side — add this to `supabase/migrations` or run in SQL editor:
   ```sql
   UPDATE users SET phone_number = '+15551234567' WHERE email = 'user@example.com';
   ```
   > You can also build a `/settings` form to let users enter their own number. The field is already in the schema.

---

## Project Structure

```
.
├── app/
│   ├── (dashboard)/          # Protected routes
│   │   ├── dashboard/        # Overview page
│   │   ├── tasks/            # Task manager
│   │   └── settings/         # Billing + WhatsApp
│   ├── api/
│   │   ├── tasks/            # REST CRUD
│   │   ├── stripe/checkout/  # Create checkout session
│   │   └── webhooks/
│   │       ├── clerk/        # Sync users to Supabase
│   │       ├── stripe/       # Handle subscription events
│   │       └── twilio/       # WhatsApp bot entry point
│   ├── sign-in/
│   ├── sign-up/
│   └── page.tsx              # Landing page
├── lib/
│   ├── supabase/             # DB client (browser + server + service)
│   ├── stripe.ts             # Stripe helpers
│   ├── twilio.ts             # Twilio send/validate
│   └── claude.ts             # NLP intent parsing
├── mcp/
│   └── server.ts             # MCP server for Claude Console
├── supabase/
│   └── migrations/
│       └── 001_initial.sql   # DB schema + RLS
└── middleware.ts             # Clerk route protection
```

---

## Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| Tasks per month | 50 | Unlimited |
| WhatsApp access | ✓ | ✓ |
| Web dashboard | ✓ | ✓ |
| Task analytics | — | ✓ |
| MCP access | — | ✓ |
| Priority support | — | ✓ |

---

## Local Development Tips

- Use [ngrok](https://ngrok.com) to expose your local server for Twilio/Stripe/Clerk webhooks:
  ```bash
  ngrok http 3000
  # use the https URL as your webhook base
  ```
- Twilio sandbox: join by sending `join <sandbox-word>` to the sandbox number
- Stripe: use `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (Stripe CLI)

---

## What Was Used for Design

The UI uses **Tailwind CSS** with a dark zinc/green palette.
For custom design assets / mockups, use your preferred tool (Figma, Sketch, etc.) and drop components into `app/components/`.

---

Built with Claude Code in ~1 hour.
