import { NextResponse } from "next/server";
import { z } from "zod";
import { createMagnificUpscale } from "@/lib/ai/magnific-provider";
import { getDatabase } from "@/lib/database";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 45;

const demoWorkspaceId = "11111111-1111-4111-8111-111111111111";
const requestSchema = z.object({
  image: z.string().min(100).max(8_000_000),
  scaleFactor: z.enum(["2x", "4x", "8x", "16x"]).default("2x"),
  optimizedFor: z.enum([
    "standard", "soft_portraits", "hard_portraits", "art_n_illustration",
    "videogame_assets", "nature_n_landscapes", "films_n_photography",
    "3d_renders", "science_fiction_n_horror",
  ]).default("standard"),
  prompt: z.string().max(2_500).optional(),
  creativity: z.number().int().min(-10).max(10).default(0),
  hdr: z.number().int().min(-10).max(10).default(0),
  resemblance: z.number().int().min(-10).max(10).default(0),
  fractality: z.number().int().min(-10).max(10).default(0),
});

function localCostActionAllowed(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.MONOVA_ALLOW_UNAUTHENTICATED_AI_ACTIONS === "true";
}

export async function POST(request: Request) {
  if (!localCostActionAllowed()) {
    return NextResponse.json({ error: "Esta operación requiere autenticación activa." }, { status: 403 });
  }

  try {
    const input = requestSchema.parse(await request.json());
    const task = await createMagnificUpscale(input);
    const result = await getDatabase().query<{ id: string }>(
      `insert into public.jobs
        (workspace_id, type, provider, status, progress, input, output)
       values ($1, 'image_upscale', 'magnific', $2, $3, $4::jsonb, $5::jsonb)
       returning id`,
      [
        demoWorkspaceId,
        task.status,
        task.status === "completed" ? 100 : 5,
        JSON.stringify({ ...input, image: "[redacted]" }),
        JSON.stringify({ externalJobId: task.externalJobId, generated: task.generated }),
      ],
    );

    return NextResponse.json({ jobId: result.rows[0].id, status: task.status });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Parámetros de imagen inválidos.", issues: error.issues }, { status: 400 });
    if (error instanceof AppError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
    return NextResponse.json({ error: "No se pudo crear el trabajo de mejora." }, { status: 500 });
  }
}
