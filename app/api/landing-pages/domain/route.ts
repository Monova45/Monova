import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/database";

export const runtime = "nodejs";

const demoWorkspaceId = "11111111-1111-4111-8111-111111111111";
const schema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(120),
  domain: z.string().regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i).max(253),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    await getDatabase().query(`
      create table if not exists public.landing_domains (
        id uuid primary key default gen_random_uuid(),
        workspace_id uuid not null references public.workspaces(id) on delete cascade,
        landing_slug text not null,
        domain text not null unique,
        status text not null default 'pending',
        verification jsonb not null default '{}',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);
    await getDatabase().query(
      `insert into public.landing_domains (workspace_id, landing_slug, domain, status, verification)
       values ($1, $2, $3, 'pending', $4::jsonb)
       on conflict (domain) do update
       set landing_slug = excluded.landing_slug, status = 'pending', verification = excluded.verification, updated_at = now()`,
      [demoWorkspaceId, input.slug, input.domain, JSON.stringify({ type: "CNAME", target: "cname.monova.app" })],
    );
    return NextResponse.json({ ok: true, status: "pending" });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Dominio inválido." }, { status: 400 });
    return NextResponse.json({ error: "No se pudo guardar el dominio." }, { status: 503 });
  }
}
