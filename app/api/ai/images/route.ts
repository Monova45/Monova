import { NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const maxDuration = 90;

const demoWorkspaceId = "11111111-1111-4111-8111-111111111111";
const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const promptModel = process.env.OPENAI_PROMPT_MODEL || "gpt-4.1-mini";

const requestSchema = z.object({
  prompt: z.string().trim().min(10).max(4_000),
  network: z.enum(["instagram", "facebook", "linkedin", "tiktok", "pinterest", "x"]).default("instagram"),
  format: z.enum(["instagram-post", "instagram-square", "instagram-story", "facebook-post", "linkedin-post", "tiktok-post", "pinterest-pin", "x-post"]).default("instagram-post"),
  style: z.enum(["photographic", "editorial", "product", "illustration"]).default("photographic"),
  size: z.enum(["1024x1024", "1024x1536", "1536x1024"]).default("1024x1024"),
  quality: z.enum(["low", "medium", "high"]).default("medium"),
  objective: z.string().trim().max(500).optional().default(""),
  audience: z.string().trim().max(500).optional().default(""),
  product: z.string().trim().max(800).optional().default(""),
  graphicLine: z.string().trim().max(1_000).optional().default(""),
  reference: z.string().trim().max(1_000).optional().default(""),
  colors: z.string().trim().max(300).optional().default(""),
  headline: z.string().trim().max(160).optional().default(""),
  supportingText: z.string().trim().max(240).optional().default(""),
  cta: z.string().trim().max(80).optional().default(""),
  composition: z.string().trim().max(500).optional().default(""),
  avoid: z.string().trim().max(500).optional().default(""),
  referenceImages: z.array(z.object({
    type: z.enum(["style", "character", "product"]),
    data: z.string().startsWith("data:image/").max(6_000_000),
  })).max(3).optional().default([]),
});

async function costActionAllowed() {
  if (
    process.env.NODE_ENV !== "production" ||
    process.env.MONOVA_ALLOW_UNAUTHENTICATED_AI_ACTIONS === "true"
  ) {
    return true;
  }
  return Boolean(await getCurrentUser());
}

type ResponsesPayload = {
  output_text?: unknown;
  output?: Array<{ content?: Array<{ text?: unknown; output_text?: unknown }> }>;
};

function responseText(value: ResponsesPayload): string {
  if (typeof value.output_text === "string") return value.output_text.trim();
  return (value.output ?? []).flatMap((item) => item.content ?? []).map((part) =>
    typeof part.text === "string" ? part.text : typeof part.output_text === "string" ? part.output_text : ""
  ).join("\n").trim();
}

async function professionalizePrompt(brief: string): Promise<string> {
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: promptModel,
        store: false,
        max_output_tokens: 900,
        input: [
          {
            role: "developer",
            content: `Actúa como director creativo senior y especialista en prompting para publicidad.
Convierte el brief del usuario en un único prompt de producción visual profesional.

Reglas obligatorias:
- Conserva exactamente el producto, oferta, porcentaje, precio, cantidad y condiciones solicitadas. No inventes datos.
- Respeta el idioma del usuario. Si solicita texto dentro de la imagen, no lo traduzcas: corrige únicamente ortografía y acentos, y escríbelo entre comillas como copy exacto.
- Define jerarquía visual, composición, iluminación, materiales, profundidad, encuadre, zona segura y acabado publicitario.
- Usa la referencia solo para dirección estética; no copies logotipos, personajes protegidos ni marcas.
- Evita texto redundante, letras deformes, productos incorrectos, elementos no pedidos y marcas de agua.
- Prioriza claridad comercial y una sola idea principal.
- Devuelve exclusivamente el prompt final, sin explicaciones, títulos ni Markdown.`,
          },
          { role: "user", content: brief },
        ],
      }),
    });
    if (!response.ok) return brief;
    const payload = await response.json() as ResponsesPayload;
    return responseText(payload) || brief;
  } catch {
    return brief;
  }
}

export async function POST(request: Request) {
  if (!(await costActionAllowed())) {
    return NextResponse.json(
      { error: "La generación requiere autenticación activa en producción." },
      { status: 403 },
    );
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI no está configurado." }, { status: 503 });
  }

  try {
    const input = requestSchema.parse(await request.json());
    const styleInstruction = {
      photographic: "fotografía publicitaria profesional, iluminación realista y detalle de producto",
      editorial: "dirección de arte editorial premium, composición limpia y tipografía ausente",
      product: "fotografía de producto para ecommerce, encuadre comercial y fondo controlado",
      illustration: "ilustración publicitaria moderna, pulida y coherente",
    }[input.style];
    const promptRequestsText = /(que\s+diga|debe\s+decir|incluye?\s+(?:el\s+)?texto|con\s+(?:el\s+)?texto|titular|escribe|frase|slogan|headline|title|copy)/i.test(input.prompt);
    const generationPrompt = [
      `Concepto principal: ${input.prompt}`,
      `Canal de publicación: ${input.network}. Adapta la jerarquía visual, el encuadre y la legibilidad a esta red social.`,
      `Formato final: ${input.format}. Mantén los elementos importantes dentro de una zona segura central para el recorte social.`,
      input.product && `Producto o servicio: ${input.product}`,
      input.objective && `Objetivo de comunicación: ${input.objective}`,
      input.audience && `Audiencia: ${input.audience}`,
      `Estilo visual: ${styleInstruction}`,
      input.graphicLine && `Línea gráfica: ${input.graphicLine}`,
      input.reference && `Referencia creativa (solo como dirección, sin copiar marcas ni obras): ${input.reference}`,
      input.colors && `Paleta de color: ${input.colors}`,
      input.composition && `Composición y encuadre: ${input.composition}`,
      input.headline && `Incluye exactamente este titular: "${input.headline}"`,
      input.supportingText && `Incluye exactamente este texto secundario: "${input.supportingText}"`,
      input.cta && `Incluye exactamente este llamado a la acción: "${input.cta}"`,
      input.avoid && `Evita expresamente: ${input.avoid}`,
      "Crea una pieza lista para marketing. No inventes logotipos, datos, certificaciones ni marcas de agua.",
      !input.headline && !input.supportingText && !input.cta && !promptRequestsText && "No incluyas texto dentro de la imagen.",
    ].filter(Boolean).join("\n");
    const enhancedPrompt = await professionalizePrompt(generationPrompt);

    let response: Response;
    if (input.referenceImages.length) {
      const form = new FormData();
      form.set("model", model);
      form.set("prompt", `${enhancedPrompt}\nUsa las imágenes adjuntas según su nombre: style como dirección estética, character para conservar la persona/personaje y product para respetar el producto.`);
      form.set("n", "1");
      form.set("size", input.size);
      form.set("quality", input.quality);
      form.set("output_format", "png");
      for (const referenceImage of input.referenceImages) {
        const [metadata, encoded] = referenceImage.data.split(",", 2);
        const mimeType = metadata.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64$/)?.[1];
        if (!mimeType || !encoded) throw new Error("Una imagen de referencia no es válida.");
        const bytes = Buffer.from(encoded, "base64");
        form.append("image[]", new Blob([bytes], { type: mimeType }), `${referenceImage.type}.${mimeType.split("/")[1] || "png"}`);
      }
      response = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: form,
      });
    } else {
      response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt: enhancedPrompt,
          n: 1,
          size: input.size,
          quality: input.quality,
          output_format: "png",
        }),
      });
    }
    const payload = await response.json().catch(() => ({})) as {
      data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>;
      error?: { message?: string };
    };
    if (!response.ok) {
      return NextResponse.json(
        { error: payload.error?.message || "OpenAI no pudo generar la imagen." },
        { status: response.status },
      );
    }

    const generated = payload.data?.[0];
    const image = generated?.b64_json
      ? `data:image/png;base64,${generated.b64_json}`
      : generated?.url;
    if (!image) throw new Error("El proveedor no devolvió una imagen.");

    try {
      await getDatabase().query(
        `insert into public.ai_generations
          (workspace_id, kind, provider, model, prompt, configuration, result, status)
         values ($1, 'image', 'openai', $2, $3, $4::jsonb, $5::jsonb, 'completed')`,
        [
          demoWorkspaceId,
          model,
          input.prompt,
          JSON.stringify({
            network: input.network, format: input.format, style: input.style, size: input.size, quality: input.quality,
            objective: input.objective, audience: input.audience,
            hasGraphicLine: Boolean(input.graphicLine), hasReference: Boolean(input.reference),
            referenceImageTypes: input.referenceImages.map((item) => item.type),
            promptEnhancedBy: promptModel,
            hasText: Boolean(input.headline || input.supportingText || input.cta || promptRequestsText),
          }),
          JSON.stringify({ revisedPrompt: generated?.revised_prompt || null, delivery: generated?.url ? "provider_url" : "inline" }),
        ],
      );
    } catch {
      // The generated asset remains usable even if optional audit persistence is unavailable.
    }

    return NextResponse.json({
      image,
      revisedPrompt: generated?.revised_prompt || null,
      model,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Revisa la descripción y los ajustes.", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo generar la imagen." },
      { status: 500 },
    );
  }
}
