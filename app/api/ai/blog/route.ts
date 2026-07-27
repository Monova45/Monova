import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;
const inputSchema = z.object({ keyword: z.string().trim().min(2).max(100), topic: z.string().trim().min(2).max(180) });
type Payload = { output_text?: unknown; output?: Array<{ content?: Array<{ text?: unknown; output_text?: unknown }> }>; error?: { message?: string } };
function extractText(payload: Payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  return (payload.output ?? []).flatMap((item) => item.content ?? []).map((part) => typeof part.text === "string" ? part.text : typeof part.output_text === "string" ? part.output_text : "").join("").trim();
}
export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Conecta OpenAI para generar el borrador. El editor manual ya funciona." }, { status: 503 });
  try {
    const input = inputSchema.parse(await request.json());
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini", store: false, max_output_tokens: 2200,
        input: [
          { role: "developer", content: "Eres un redactor SEO en español. Escribe para una empresa real sin inventar cifras, premios o certificaciones. Devuelve exclusivamente JSON válido con title, metaDescription, excerpt y content. Título de 30-60 caracteres, metaDescription de 120-160, excerpt de 80-180 y content de al menos 500 palabras." },
          { role: "user", content: `Tema: ${input.topic}\nPalabra clave principal: ${input.keyword}` },
        ],
      }),
    });
    const payload = await response.json() as Payload;
    if (!response.ok) return NextResponse.json({ error: payload.error?.message || "OpenAI no pudo generar el artículo." }, { status: response.status });
    const parsed = JSON.parse(extractText(payload).replace(/^```json\s*|\s*```$/g, ""));
    const content = z.object({ title: z.string().min(20).max(80), metaDescription: z.string().min(100).max(180), excerpt: z.string().min(50).max(240), content: z.string().min(900).max(15000) }).parse(parsed);
    return NextResponse.json({ content });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Revisa la palabra clave y vuelve a intentar." }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo generar el artículo." }, { status: 502 });
  }
}
