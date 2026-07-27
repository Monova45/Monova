import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/database";

export const runtime = "nodejs";

const demoWorkspaceId = "11111111-1111-4111-8111-111111111111";
const landingContentSchema = z.object({
  business: z.string().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(120),
  headline: z.string().min(1).max(180),
  subheadline: z.string().min(1).max(400),
  primaryCta: z.string().min(1).max(60),
  secondaryCta: z.string().min(1).max(60),
  benefits: z.array(z.string().max(120)).length(3),
  proof: z.string().max(240),
  contact: z.string().max(240),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  surface: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  text: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  muted: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  layout: z.enum(["split", "overlay", "centered", "feature", "magazine"]),
  templateName: z.string().min(1).max(60),
});
const saveSchema = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/).max(120), content: landingContentSchema });

async function ensureSchema() {
  await getDatabase().query(`
    create table if not exists public.landing_pages (
      id uuid primary key default gen_random_uuid(),
      workspace_id uuid not null references public.workspaces(id) on delete cascade,
      slug text not null unique,
      content jsonb not null default '{}',
      status text not null default 'published',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
}

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim();
  if (!slug) return NextResponse.json({ error: "Slug requerido." }, { status: 400 });
  try {
    await ensureSchema();
    const result = await getDatabase().query(
      `select content, updated_at from public.landing_pages where slug = $1 and status = 'published' limit 1`,
      [slug],
    );
    if (!result.rowCount) return NextResponse.json({ error: "Landing no encontrada." }, { status: 404 });
    return NextResponse.json({ content: result.rows[0].content, updatedAt: result.rows[0].updated_at });
  } catch {
    return NextResponse.json({ error: "La base de datos no está disponible." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const input = saveSchema.parse(await request.json());
    await ensureSchema();
    const existing = await getDatabase().query(`select workspace_id from public.landing_pages where slug = $1`, [input.slug]);
    if (existing.rowCount && existing.rows[0].workspace_id !== demoWorkspaceId) {
      return NextResponse.json({ error: "Ese nombre de página ya está en uso." }, { status: 409 });
    }
    await getDatabase().query(
      `insert into public.landing_pages (workspace_id, slug, content, status)
       values ($1, $2, $3::jsonb, 'published')
       on conflict (slug) do update
       set content = excluded.content, status = 'published', updated_at = now()`,
      [demoWorkspaceId, input.slug, JSON.stringify(input.content)],
    );
    return NextResponse.json({ ok: true, slug: input.slug });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Revisa los datos de la landing." }, { status: 400 });
    return NextResponse.json({ error: "No se pudo sincronizar la landing." }, { status: 503 });
  }
}
