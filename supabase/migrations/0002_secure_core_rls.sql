-- Harden core RLS without recursive workspace_members policy checks.

alter table public.profiles enable row level security;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles for select
using (id = auth.uid());

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "members can read memberships" on public.workspace_members;
create policy "members can read memberships"
on public.workspace_members for select
using (
  user_id = auth.uid()
  or public.is_workspace_member(workspace_id)
);

drop policy if exists "members can read workspace" on public.workspaces;
create policy "members can read workspace"
on public.workspaces for select
using (public.is_workspace_member(id));

drop policy if exists "members can read brands" on public.brands;
create policy "members can read brands"
on public.brands for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "members can read generations" on public.ai_generations;
create policy "members can read generations"
on public.ai_generations for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "members can read jobs" on public.jobs;
create policy "members can read jobs"
on public.jobs for select
using (public.is_workspace_member(workspace_id));
