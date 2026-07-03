import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 45;

const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const monovaKnowledge = `
MONOVA es un estudio digital que combina software, diseño, branding e inteligencia artificial.
Servicios principales:
- Desarrollo de software: aplicaciones web, móviles, SaaS, sistemas a medida y paneles administrativos.
- Diseño UX/UI: interfaces modernas, wireframes, prototipos y experiencias enfocadas en conversión.
- Inteligencia artificial: asistentes, automatización de procesos, análisis de datos y flujos operativos.
- Branding digital: identidad visual, tono de marca, piezas digitales y sistemas de marca.
- Cloud, DevOps e integraciones: despliegues, APIs, pagos, CRM, formularios, automatizaciones y herramientas internas.
Casos comunes:
- Plataforma de ventas: CRM, cotizaciones, seguimiento de clientes, automatizaciones y reportes.
- Inventario: entradas, salidas, alertas de stock, catálogo, ventas conectadas y panel administrativo.
- Ecommerce o catálogo: productos, pagos, envíos, inventario y experiencia de compra.
- Automatización interna: formularios, integraciones, reportes, recordatorios y flujos entre herramientas.
- IA para negocio: chatbot, asistente comercial, clasificación de leads, análisis de datos y respuestas automáticas.
- Marca y presencia digital: identidad visual, landing, contenido, UX/UI y piezas comerciales.
Proceso Monova:
1. Diagnóstico: entender negocio, usuarios, datos y oportunidades.
2. Prototipo: convertir estrategia en interfaces claras y validables.
3. Producto: desarrollar software, IA e integraciones con base escalable.
4. Optimizar: medir, mejorar y preparar el sistema para crecer.
`;

type ChatMessage = {
  role: "user" | "assistant" | "bot";
  content?: string;
  text?: string;
};

function cleanText(value: unknown) {
  return String(value || "")
    .replaceAll("\u00AD", "")
    .replaceAll("\uFFFD", "")
    .trim();
}

function extractResponseText(data: any) {
  if (typeof data.output_text === "string") return data.output_text;
  return (data.output || [])
    .flatMap((item: any) => item.content || [])
    .map((part: any) => part.text || part.output_text || "")
    .join("\n")
    .trim();
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 35_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "La IA todavía no está configurada en el servidor." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? (body.messages as ChatMessage[]) : [];
    const cleanMessages = messages
      .filter((message) => ["user", "assistant", "bot"].includes(message.role))
      .slice(-10)
      .map((message) => ({
        role: message.role === "user" ? "user" : "assistant",
        content: cleanText(message.content || message.text).slice(0, 900)
      }))
      .filter((message) => message.content);

    if (!cleanMessages.length) {
      return NextResponse.json({ error: "Escribe una pregunta para Monova." }, { status: 400 });
    }

    const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "developer",
            content: `Eres el asistente comercial y diagnosticador de MONOVA. Responde en español, breve, premium y accionable. Usa tildes y eñes correctas. No inventes clientes, cifras, precios ni garantías.

Información de Monova:
${monovaKnowledge}

Reglas:
- Si el usuario no sabe qué necesita, haz máximo 2 preguntas concretas y sugiere una ruta inicial.
- Si ya dice qué vende o qué problema tiene, responde con una mini propuesta: qué le falta, módulos recomendados, primer paso y cómo Monova lo construiría.
- Si pide precio, explica que depende del alcance y pregunta 2 datos para cotizar.
- Mantén respuestas de 3 a 6 líneas, con tono cercano, claro y de alto valor.
- No uses markdown pesado.`
          },
          ...cleanMessages
        ],
        max_output_tokens: 520,
        store: false
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "No pudimos generar la respuesta ahora." },
        { status: response.status }
      );
    }

    return NextResponse.json({ answer: cleanText(extractResponseText(data)) });
  } catch {
    return NextResponse.json(
      { error: "No pudimos generar la respuesta ahora. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
