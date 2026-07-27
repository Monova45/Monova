import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePeluviLeadClassifications, isPeluviAiConfigured } from "@/lib/peluvi/agent";

export const runtime = "nodejs";
export const maxDuration = 45;

const schema = z.object({
  conversations: z.array(z.object({
    id: z.string().min(1).max(160),
    name: z.string().max(160),
    messages: z.array(z.object({
      text: z.string().max(4096),
      outgoing: z.boolean(),
    })).max(12),
  })).min(1).max(30),
});

export async function POST(request: Request) {
  try {
    if (!isPeluviAiConfigured()) {
      return NextResponse.json({ error: "La IA no está configurada." }, { status: 503 });
    }
    const input = schema.parse(await request.json());
    return NextResponse.json({
      classifications: await generatePeluviLeadClassifications(input.conversations),
    });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Conversaciones inválidas." }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo clasificar." }, { status: 502 });
  }
}
