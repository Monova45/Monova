import { NextResponse } from "next/server";
import { z } from "zod";
import { sendWatiSessionMessage } from "@/lib/wati/provider";

const schema = z.object({
  target: z.string().min(3).max(120),
  text: z.string().trim().min(1).max(4096),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const result = await sendWatiSessionMessage(input.target, input.text);
    if (result.result === false) {
      return NextResponse.json({
        error: result.info || "WATI rechazó el mensaje. Verifica que la conversación esté dentro de la ventana de 24 horas.",
      }, { status: 400 });
    }
    return NextResponse.json({ success: true, info: result.info || null });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Mensaje inválido." }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo enviar." }, { status: 502 });
  }
}
