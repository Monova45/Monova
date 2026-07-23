-- Monova Marketing OS — esquema inicial. Ejecutar únicamente en un proyecto Supabase configurado.
create extension if not exists "pgcrypto";

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','admin','marketing_manager','designer','community_manager','analyst','sales','client','viewer')),
  permissions jsonb not null default '[]',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  industry text,
  description text,
  audience jsonb not null default '{}',
  voice jsonb not null default '{}',
  visual_identity jsonb not null default '{}',
  metadata jsonb not null default '{}',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete set null,
  created_by uuid references public.profiles(id),
  kind text not null check (kind in ('text','image','video','analysis')),
  provider text not null,
  model text not null,
  prompt text,
  configuration jsonb not null default '{}',
  result jsonb not null default '{}',
  status text not null default 'pending',
  estimated_cost_usd numeric(12,6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references public.profiles(id),
  type text not null,
  provider text,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed','cancelled')),
  progress smallint not null default 0 check (progress between 0 and 100),
  attempts smallint not null default 0,
  input jsonb not null default '{}',
  output jsonb not null default '{}',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brands_workspace_idx on public.brands(workspace_id);
create index if not exists generations_workspace_created_idx on public.ai_generations(workspace_id, created_at desc);
create index if not exists jobs_workspace_status_idx on public.jobs(workspace_id, status, created_at desc);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.brands enable row level security;
alter table public.ai_generations enable row level security;
alter table public.jobs enable row level security;

create policy "members can read workspace" on public.workspaces for select
using (exists (select 1 from public.workspace_members m where m.workspace_id = id and m.user_id = auth.uid()));
create policy "members can read brands" on public.brands for select
using (exists (select 1 from public.workspace_members m where m.workspace_id = brands.workspace_id and m.user_id = auth.uid()));
create policy "members can read generations" on public.ai_generations for select
using (exists (select 1 from public.workspace_members m where m.workspace_id = ai_generations.workspace_id and m.user_id = auth.uid()));
create policy "members can read jobs" on public.jobs for select
using (exists (select 1 from public.workspace_members m where m.workspace_id = jobs.workspace_id and m.user_id = auth.uid()));
