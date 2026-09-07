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
  customRatio: z.number().positive().optional(),
  referenceImages: z.array(z.object({
    type: z.enum(["style", "character", "product"]),
    data: z.string().startsWith("data:image/").max(6_000_000),
  })).max(3).optional().default([]),
});

function safeZoneInstruction(baseSize: string, targetRatio: number): string {
  const [width, height] = baseSize.split("x").map(Number);
  const sourceRatio = width / height;
  if (Math.abs(sourceRatio - targetRatio) < 0.05) return "";
  if (sourceRatio > targetRatio) {
    const keptFraction = Math.round((targetRatio / sourceRatio) * 100);
    return `El resultado final se recorta por los lados, conservando solo el ${keptFraction}% central del ancho. Ubica TODO el texto, el titular, el CTA y el producto dentro de una franja vertical central de ese ancho; no coloques elementos importantes cerca de los bordes izquierdo o derecho. El producto debe verse COMPLETO y reconocible dentro de esa franja (con todos sus extremos, tapa y base si aplica), nunca como un acercamiento recortado que solo muestre una textura o fragmento ampliado; si el producto es más alto que ancho, redúcelo de tamaño o inclínalo/acuéstalo para que quepa entero.`;
  }
  const keptFraction = Math.round((sourceRatio / targetRatio) * 100);
  const safeFraction = Math.max(25, Math.round(keptFraction * 0.65));
  return `ATENCIÓN, RESTRICCIÓN CRÍTICA DE ENCUADRE: el lienzo que generas mide ${width}x${height}px, pero el resultado final se recorta arriba y abajo dejando visible ÚNICAMENTE una franja horizontal centrada de ${keptFraction}% de la altura (aproximadamente ${Math.round(height * keptFraction / 100)}px de los ${height}px). Todo lo que dibujes fuera de esa franja central desaparecerá sin previo aviso, incluida cualquier letra que quede pegada al límite.
Por seguridad, NO uses el 100% de esa franja: comprime todo el contenido (texto y producto) dentro de una zona todavía más chica, de solo el ${safeFraction}% de la altura total, exactamente centrada verticalmente. El espacio entre esa zona segura y el borde de la franja que se recorta debe quedar completamente vacío (solo fondo), como colchón de seguridad ante variaciones de composición.
Reglas obligatorias de composición dentro de esa zona segura del ${safeFraction}%:
- El producto debe dibujarse en miniatura, a una escala mucho más pequeña que la que usarías normalmente, de forma que quepa COMPLETO (todos sus extremos: tapa, cuerpo y base) dentro de esa zona, con margen de aire libre alrededor por los cuatro costados. Nunca lo dibujes ocupando toda la altura del lienzo.
- El producto NO debe tocar ni sobrepasar ningún borde del lienzo (ni izquierdo, ni derecho, ni el de la zona segura arriba/abajo): dibújalo completamente rodeado de fondo/espacio vacío, como si flotara en el centro con aire alrededor, nunca "sangrado" o cortado por el marco.
- Si el producto es más alto que ancho, acuéstalo horizontalmente o inclínalo en diagonal suave para que su silueta entera, incluida la tapa y la base, quepa con margen dentro de la zona segura.
- El titular, el texto secundario y el CTA deben escribirse en líneas horizontales cortas, todas dentro de esa misma zona segura, verticalmente centradas, con aire libre por encima de la primera línea y por debajo de la última.
- Deja el tercio superior y el tercio inferior del lienzo completo prácticamente vacíos (solo fondo o degradado), sin texto ni partes del producto, porque se van a recortar.`;
}

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
- Usa las referencias solo como dirección estética; no copies logotipos ni personajes protegidos.
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
    const hasDesignBase = input.referenceImages.some((item) => item.type === "style");
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
      input.customRatio && safeZoneInstruction(input.size, input.customRatio),
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
    const enhancedPrompt = hasDesignBase
      ? `EDICIÓN CONSERVADORA DE UN DISEÑO BASE.

INSTRUCCIÓN EXACTA DEL USUARIO:
${input.prompt}

REGLAS OBLIGATORIAS:
1. Usa la imagen llamada "style" como lienzo base. No rediseñes ni reinterpretes la pieza.
2. Conserva exactamente el encuadre, proporción, fondo, logotipo, fotografías, iconos, colores, tipografías, bloques, bordes, alineación, espaciado y jerarquía.
3. Considera inmutables todos los píxeles y textos que el usuario no haya pedido modificar.
4. Modifica únicamente los elementos mencionados explícitamente en la instrucción del usuario.
5. Todo texto no solicitado debe permanecer idéntico, legible y en la misma posición. No lo reescribas, traduzcas, resumas ni regeneres.
6. Los valores nuevos deben aparecer exactamente como los escribió el usuario, respetando puntos, comas, moneda y mayúsculas.
7. Prohibido añadir texto de relleno, pseudo-letras, palabras inventadas, símbolos, personas, productos, empaques, tubos, objetos 3D, escenas o adornos.
8. No cortes, amplíes ni cambies la relación de aspecto del diseño base. Devuelve la pieza completa con todos sus bordes visibles.
9. Si una parte no necesita cambio, cópiala visualmente sin alterarla.`
      : await professionalizePrompt(generationPrompt);

    let response: Response;
    if (input.referenceImages.length) {
      const form = new FormData();
      form.set("model", model);
      form.set("prompt", `${enhancedPrompt}

IMÁGENES ADJUNTAS:
- "style": diseño base que debe conservarse completo y sin reinterpretación.
- "character": referencia para conservar la persona o personaje, solo si existe.
- "product": referencia para conservar el producto, solo si existe.`);
      form.set("n", "1");
      form.set("size", hasDesignBase ? "auto" : input.size);
      form.set("quality", input.quality);
      form.set("output_format", "png");
      if (hasDesignBase) form.set("input_fidelity", "high");
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
