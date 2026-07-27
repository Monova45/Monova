import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 45;

const inputSchema = z.object({
  brief: z.string().trim().min(12).max(600),
  business: z.string().trim().min(2).max(120),
});

type ResponsePayload = {
  output_text?: unknown;
  output?: Array<{ content?: Array<{ text?: unknown; output_text?: unknown }> }>;
  error?: { message?: string };
};

function extractText(payload: ResponsePayload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  return (payload.output ?? []).flatMap((item) => item.content ?? []).map((part) =>
    typeof part.text === "string" ? part.text : typeof part.output_text === "string" ? part.output_text : ""
  ).join("").trim();
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "OpenAI no está configurado." }, { status: 503 });
  try {
    const input = inputSchema.parse(await request.json());
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        store: false,
        max_output_tokens: 700,
        input: [
          {
            role: "developer",
            content: `Eres un copywriter senior de landing pages en español. Genera contenido breve, específico y orientado a conversión. No inventes precios, cifras, certificaciones ni testimonios. Devuelve exclusivamente JSON válido con estas propiedades: headline, subheadline, primaryCta, secondaryCta, benefits (arreglo de exactamente 3 textos), proof y contact.`,
          },
          { role: "user", content: `Negocio: ${input.business}\nBrief: ${input.brief}` },
        ],
      }),
    });
    const payload = await response.json() as ResponsePayload;
    if (!response.ok) return NextResponse.json({ error: payload.error?.message || "OpenAI no pudo generar el contenido." }, { status: response.status });
    const parsed = JSON.parse(extractText(payload).replace(/^```json\s*|\s*```$/g, "")) as Record<string, unknown>;
    const contentSchema = z.object({
      headline: z.string().min(8).max(140),
      subheadline: z.string().min(20).max(260),
      primaryCta: z.string().min(2).max(40),
      secondaryCta: z.string().min(2).max(40),
      benefits: z.array(z.string().min(3).max(80)).length(3),
      proof: z.string().min(8).max(180),
      contact: z.string().min(8).max(180),
    });
    return NextResponse.json({ content: contentSchema.parse(parsed) });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Revisa el brief de la landing." }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo generar la landing." }, { status: 502 });
  }
}
