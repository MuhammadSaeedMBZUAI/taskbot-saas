-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Users ───────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id                  text primary key,                -- Clerk user ID
  email               text unique not null,
  name                text,
  phone_number        text unique,
  stripe_customer_id  text unique,
  subscription_status text not null default 'free'
                        check (subscription_status in ('free','active','canceled','past_due')),
  subscription_tier   text not null default 'free'
                        check (subscription_tier in ('free','pro')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ─── Tasks ───────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     text not null references public.users(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'pending'
                check (status in ('pending','in_progress','completed')),
  priority    text not null default 'medium'
                check (priority in ('low','medium','high')),
  due_date    timestamptz,
  tags        text[],
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_status_idx on public.tasks(status);

-- ─── WhatsApp Sessions ───────────────────────────────────────────────────────
create table if not exists public.whatsapp_sessions (
  id              uuid primary key default uuid_generate_v4(),
  phone_number    text not null unique,
  user_id         text references public.users(id) on delete set null,
  context         jsonb not null default '{}',
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists whatsapp_sessions_phone_idx on public.whatsapp_sessions(phone_number);

-- ─── Auto-update updated_at ──────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_users_updated on public.users;
create trigger on_users_updated
  before update on public.users
  for each row execute procedure public.handle_updated_at();

drop trigger if exists on_tasks_updated on public.tasks;
create trigger on_tasks_updated
  before update on public.tasks
  for each row execute procedure public.handle_updated_at();

-- ─── Row Level Security ──────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.whatsapp_sessions enable row level security;

-- Users: only the owner can read/update their own row
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (id = current_setting('app.user_id', true));

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (id = current_setting('app.user_id', true));

-- Tasks: full CRUD for the task owner
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select using (user_id = current_setting('app.user_id', true));

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert with check (user_id = current_setting('app.user_id', true));

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update using (user_id = current_setting('app.user_id', true));

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete using (user_id = current_setting('app.user_id', true));

-- WhatsApp sessions: only owner can read
drop policy if exists "wa_sessions_select_own" on public.whatsapp_sessions;
create policy "wa_sessions_select_own" on public.whatsapp_sessions
  for select using (user_id = current_setting('app.user_id', true));

-- Note: webhooks and server-side code use the service role key which bypasses RLS
