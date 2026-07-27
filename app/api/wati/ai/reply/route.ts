import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePeluviSalesReply, isPeluviAiConfigured } from "@/lib/peluvi/agent";
import { sendWatiSessionMessage } from "@/lib/wati/provider";

export const runtime = "nodejs";
export const maxDuration = 45;

const schema = z.object({
  target: z.string().min(3).max(120),
  preview: z.boolean().optional().default(false),
  messages: z.array(z.object({
    text: z.string().max(4096),
    outgoing: z.boolean(),
  })).min(1).max(12),
});

export async function POST(request: Request) {
  try {
    if (!isPeluviAiConfigured()) {
      return NextResponse.json({ error: "La IA no está configurada en el servidor." }, { status: 503 });
    }
    const input = schema.parse(await request.json());
    const answer = await generatePeluviSalesReply(input.messages);
    if (input.preview) return NextResponse.json({ answer, sent: false });

    const sent = await sendWatiSessionMessage(input.target, answer);
    if (sent.result === false) {
      return NextResponse.json({ error: sent.info || "WATI rechazó la respuesta." }, { status: 400 });
    }
    return NextResponse.json({ answer, sent: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Conversación inválida." }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo responder con IA." }, { status: 502 });
  }
}
