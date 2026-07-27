create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  slug text not null unique,
  content jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.landing_domains (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  landing_slug text not null,
  domain text not null unique,
  status text not null default 'pending' check (status in ('pending','verified','failed')),
  verification jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists landing_pages_workspace_idx on public.landing_pages(workspace_id, updated_at desc);
create index if not exists landing_domains_workspace_idx on public.landing_domains(workspace_id, updated_at desc);

alter table public.landing_pages enable row level security;
alter table public.landing_domains enable row level security;

create policy "members can read landing pages"
on public.landing_pages for select
using (public.is_workspace_member(workspace_id));

create policy "members can read landing domains"
on public.landing_domains for select
using (public.is_workspace_member(workspace_id));
