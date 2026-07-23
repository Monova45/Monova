insert into public.workspaces (id, name, slug, status, metadata)
values (
  '11111111-1111-4111-8111-111111111111',
  'Universal de Cauchos',
  'universal-de-cauchos-demo',
  'active',
  '{"is_demo": true}'::jsonb
)
on conflict (id) do update
set name = excluded.name,
    metadata = excluded.metadata,
    updated_at = now();
