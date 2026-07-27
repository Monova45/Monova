-- Application authentication used by the Next.js server.
-- Passwords and raw session tokens are never stored.
create extension if not exists "pgcrypto";
create extension if not exists "citext";

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  full_name text not null,
  password_hash text not null,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists app_sessions_user_idx on public.app_sessions(user_id);
create index if not exists app_sessions_expiry_idx on public.app_sessions(expires_at);

alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;

-- These tables are server-only. No anon/authenticated PostgREST grants are added.
revoke all on public.app_users from anon, authenticated;
revoke all on public.app_sessions from anon, authenticated;

