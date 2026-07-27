import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { sendWhatsAppMessage } from "@/lib/whatsapp/provider";
import { decryptWhatsAppSession, WHATSAPP_SESSION_COOKIE } from "@/lib/whatsapp/session";

const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("text"),
    to: z.string().regex(/^\d{8,15}$/, "Usa el número con código de país y solo dígitos."),
    message: z.string().trim().min(1).max(4096),
  }),
  z.object({
    kind: z.literal("template"),
    to: z.string().regex(/^\d{8,15}$/, "Usa el número con código de país y solo dígitos."),
    template: z.string().regex(/^[a-z0-9_]+$/).max(512),
    language: z.string().regex(/^[a-z]{2,3}(?:_[A-Z]{2})?$/).max(10),
  }),
]);

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const cookieStore = await cookies();
    const session = decryptWhatsAppSession(cookieStore.get(WHATSAPP_SESSION_COOKIE)?.value);
    const result = await sendWhatsAppMessage(input, session ? {
      token: session.accessToken,
      phoneNumberId: session.phoneNumberId,
      businessAccountId: session.businessAccountId,
    } : undefined);
    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id || null,
      recipient: result.contacts?.[0]?.wa_id || input.to,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Datos inválidos." }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo enviar el mensaje." },
      { status: 502 },
    );
  }
}
