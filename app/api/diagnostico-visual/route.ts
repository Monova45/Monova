import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

type DiagnosticLead = {
  nombre: string;
  whatsapp: string;
  tipoNegocio: string;
  url: string;
  descripcion: string;
  objetivo: string;
};

type DiagnosticVisual = {
  diagnostico: {
    diseno: number;
    marketing: number;
    automatizacion: number;
    experienciaDigital: number;
    resumen: string;
    problemasDetectados: string[];
    recomendaciones: string[];
    serviciosSugeridos: string[];
  };
  propuesta: {
    concepto: string;
    estiloVisual: string;
    estructuraRecomendada: string[];
    copyHero: string;
    colores: string[];
    funcionalidades: string[];
  };
  imagePrompt: string;
};

const fallbackDiagnostic: DiagnosticVisual = {
  diagnostico: {
    diseno: 68,
    marketing: 62,
    automatizacion: 28,
    experienciaDigital: 64,
    resumen:
      "Tu presencia digital puede comunicar mejor la propuesta de valor, capturar más contactos y automatizar la primera respuesta comercial.",
    problemasDetectados: [
      "La propuesta principal necesita ser más directa para que el visitante entienda qué vendes y por qué elegirte.",
      "Faltan llamados a la acción visibles para convertir visitas en conversaciones de venta.",
      "Hay oportunidades para automatizar WhatsApp, formularios y seguimiento de prospectos."
    ],
    recomendaciones: [
      "Rediseñar el inicio con una promesa clara, beneficios concretos y un CTA dominante.",
      "Crear una ruta de conversión con WhatsApp, formulario y seguimiento automático.",
      "Mejorar la jerarquía visual para que servicios, prueba social y proceso sean fáciles de escanear."
    ],
    serviciosSugeridos: ["UX/UI", "Landing Page", "Automatización WhatsApp", "Chatbot IA"]
  },
  propuesta: {
    concepto: "Una web más clara, moderna y enfocada en convertir visitantes en clientes.",
    estiloVisual: "Premium, tecnológica, oscura, con acentos naranja Monova y componentes tipo glass.",
    estructuraRecomendada: [
      "Hero con promesa comercial clara y botón a WhatsApp.",
      "Sección de servicios o productos principales con beneficios.",
      "Prueba social, casos o diferenciales de confianza.",
      "Formulario corto y chatbot para capturar leads.",
      "Panel interno para ordenar contactos y oportunidades."
    ],
    copyHero: "Convierte más visitas en clientes con una presencia digital clara, moderna y automatizada.",
    colores: ["#050505", "#ff790f", "#f5f5f0", "#111827"],
    funcionalidades: ["CTA inteligente", "Chatbot IA", "Formulario de leads", "Panel comercial"]
  },
  imagePrompt:
    "High fidelity realistic homepage redesign preview for a digital business, shown as a full browser screenshot mockup. Include a polished navigation bar, premium hero section, clear CTA, product/service cards, trust section, lead capture block, dark elegant Monova style, orange glow accents, realistic UI spacing, refined typography, no floating text overlays, no fake brand logos."
};

function cleanText(value: unknown) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replaceAll("\u00AD", "")
    .replaceAll("\uFFFD", "")
    .trim();
}

function clampScore(value: unknown, min: number, max: number) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function cleanArray(value: unknown, fallback: string[], max = 8) {
  const source = Array.isArray(value) ? value : fallback;
  return source.map(cleanText).filter(Boolean).slice(0, max);
}

function sanitizeLead(payload: Record<string, unknown>): DiagnosticLead {
  return {
    nombre: cleanText(payload.nombre).slice(0, 90),
    whatsapp: cleanText(payload.whatsapp).slice(0, 40),
    tipoNegocio: cleanText(payload.tipoNegocio || payload.empresa).slice(0, 120),
    url: cleanText(payload.url).slice(0, 220),
    descripcion: cleanText(payload.descripcion || payload.mensaje).slice(0, 1100),
    objetivo: cleanText(payload.objetivo).slice(0, 120)
  };
}

function normalizeUrl(value: string) {
  if (!value) return "";
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 45_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function extractTag(html: string, pattern: RegExp) {
  return cleanText(html.match(pattern)?.[1] || "");
}

async function fetchWebsiteSnapshot(inputUrl: string) {
  const url = normalizeUrl(inputUrl);
  if (!url) return "El cliente no indicó una URL válida para auditar.";

  try {
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; MonovaDiagnostic/1.0; +https://monova.digital)"
        }
      },
      16_000
    );

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("text/html")) {
      return `URL revisada: ${url}. La web respondió con estado ${response.status} o no entregó HTML auditable.`;
    }

    const html = (await response.text()).slice(0, 180_000);
    const title = extractTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = extractTag(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i
    );
    const h1 = extractTag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]*>/g, "");
    const visibleText = cleanText(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
    ).slice(0, 1800);

    return [
      `URL auditada: ${url}`,
      title ? `Title: ${title}` : "Title: no detectado",
      description ? `Meta description: ${description}` : "Meta description: no detectada",
      h1 ? `H1 principal: ${h1}` : "H1 principal: no detectado",
      `Texto visible inicial: ${visibleText || "No se pudo extraer texto visible."}`
    ].join("\n");
  } catch {
    return `URL indicada: ${url}. No se pudo acceder automáticamente a la web; diagnostica con los datos entregados por el cliente y recomienda revisar rendimiento, mensaje, UX y conversión.`;
  }
}

type OpenAIContentPart = { text?: unknown; output_text?: unknown };
type OpenAIOutputItem = { content?: OpenAIContentPart[] };
type OpenAIResponsePayload = { output_text?: unknown; output?: OpenAIOutputItem[] };

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function extractResponseText(value: unknown) {
  const data = asRecord(value) as OpenAIResponsePayload;
  if (typeof data.output_text === "string") return data.output_text;
  return (Array.isArray(data.output) ? data.output : [])
    .flatMap((item) => Array.isArray(item.content) ? item.content : [])
    .map((part) => typeof part.text === "string" ? part.text : typeof part.output_text === "string" ? part.output_text : "")
    .join("\n")
    .trim();
}

function normalizeDiagnosticVisual(value: unknown): DiagnosticVisual {
  const data = asRecord(value);
  const diagnostic = asRecord(data.diagnostico);
  const propuesta = asRecord(data.propuesta);

  return {
    diagnostico: {
      diseno: clampScore(diagnostic.diseno, 45, 95),
      marketing: clampScore(diagnostic.marketing, 35, 94),
      automatizacion: clampScore(diagnostic.automatizacion, 5, 85),
      experienciaDigital: clampScore(diagnostic.experienciaDigital, 35, 95),
      resumen: cleanText(diagnostic.resumen) || fallbackDiagnostic.diagnostico.resumen,
      problemasDetectados: cleanArray(
        diagnostic.problemasDetectados,
        fallbackDiagnostic.diagnostico.problemasDetectados,
        5
      ),
      recomendaciones: cleanArray(
        diagnostic.recomendaciones,
        fallbackDiagnostic.diagnostico.recomendaciones,
        5
      ),
      serviciosSugeridos: cleanArray(
        diagnostic.serviciosSugeridos,
        fallbackDiagnostic.diagnostico.serviciosSugeridos,
        6
      )
    },
    propuesta: {
      concepto: cleanText(propuesta.concepto) || fallbackDiagnostic.propuesta.concepto,
      estiloVisual: cleanText(propuesta.estiloVisual) || fallbackDiagnostic.propuesta.estiloVisual,
      estructuraRecomendada: cleanArray(
        propuesta.estructuraRecomendada,
        fallbackDiagnostic.propuesta.estructuraRecomendada,
        6
      ),
      copyHero: cleanText(propuesta.copyHero) || fallbackDiagnostic.propuesta.copyHero,
      colores: cleanArray(propuesta.colores, fallbackDiagnostic.propuesta.colores, 6),
      funcionalidades: cleanArray(
        propuesta.funcionalidades,
        fallbackDiagnostic.propuesta.funcionalidades,
        6
      )
    },
    imagePrompt: cleanText(data.imagePrompt) || fallbackDiagnostic.imagePrompt
  };
}

async function createDiagnosticVisual(lead: DiagnosticLead, websiteSnapshot: string) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("Missing OPENAI_API_KEY");
    (error as Error & { status?: number }).status = 503;
    throw error;
  }

  const prompt = `
Actúa como consultor senior de Monova, estudio premium de software, inteligencia artificial, automatización y diseño.
El usuario quiere que revises su web, detectes qué está mal y propongas cómo podría verse/mejorar.

Datos del lead:
- Nombre: ${lead.nombre}
- WhatsApp: ${lead.whatsapp}
- Tipo de negocio: ${lead.tipoNegocio}
- URL: ${lead.url || "No indicada"}
- Descripción del negocio: ${lead.descripcion}
- Objetivo principal: ${lead.objetivo}

Auditoría automática de la web:
${websiteSnapshot}

Reglas:
- No inventes métricas, clientes, precios ni garantías.
- Si la auditoría automática no pudo acceder a la web, dilo solo como contexto interno y enfoca la respuesta en recomendaciones accionables.
- Detecta problemas concretos de mensaje, diseño, conversión, UX, confianza, SEO básico y automatización.
- Propón una versión mejorada tipo mockup de home real: navegación, hero, secciones, CTA, visuales, automatización y funcionalidades.
- Responde en español profesional, claro y comercial.
`;

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
          content:
            "Responde solo con JSON válido según el schema. El imagePrompt debe describir una previsualización realista de la home mejorada, como captura de navegador de una landing final: barra de navegación, hero profesional, CTA, secciones debajo del fold, tarjetas, imagen/productos/servicios específicos del negocio, jerarquía visual cuidada, sin texto largo superpuesto, sin letras ilegibles y sin logos de marcas reales."
        },
        { role: "user", content: prompt }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "diagnostico_visual_monova",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              diagnostico: {
                type: "object",
                additionalProperties: false,
                properties: {
                  diseno: { type: "number" },
                  marketing: { type: "number" },
                  automatizacion: { type: "number" },
                  experienciaDigital: { type: "number" },
                  resumen: { type: "string" },
                  problemasDetectados: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
                  recomendaciones: { type: "array", minItems: 3, maxItems: 5, items: { type: "string" } },
                  serviciosSugeridos: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } }
                },
                required: ["diseno", "marketing", "automatizacion", "experienciaDigital", "resumen", "problemasDetectados", "recomendaciones", "serviciosSugeridos"]
              },
              propuesta: {
                type: "object",
                additionalProperties: false,
                properties: {
                  concepto: { type: "string" },
                  estiloVisual: { type: "string" },
                  estructuraRecomendada: { type: "array", minItems: 4, maxItems: 6, items: { type: "string" } },
                  copyHero: { type: "string" },
                  colores: { type: "array", minItems: 4, maxItems: 6, items: { type: "string" } },
                  funcionalidades: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } }
                },
                required: ["concepto", "estiloVisual", "estructuraRecomendada", "copyHero", "colores", "funcionalidades"]
              },
              imagePrompt: { type: "string" }
            },
            required: ["diagnostico", "propuesta", "imagePrompt"]
          }
        }
      },
      max_output_tokens: 1700,
      store: false
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || "OpenAI diagnostic request failed");
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return normalizeDiagnosticVisual(JSON.parse(extractResponseText(data)));
}

function buildHomepagePreviewPrompt(lead: DiagnosticLead, result: DiagnosticVisual) {
  return `
Create a high fidelity realistic homepage redesign preview for this business, as if it were a polished browser screenshot of the improved home page.

Business type: ${lead.tipoNegocio}
User context: ${lead.descripcion}
Main goal: ${lead.objetivo}
Hero copy direction: ${result.propuesta.copyHero}
Visual concept: ${result.propuesta.concepto}
Visual style: ${result.propuesta.estiloVisual}
Recommended structure: ${result.propuesta.estructuraRecomendada.join(" | ")}
Recommended features: ${result.propuesta.funcionalidades.join(" | ")}
Color direction: ${result.propuesta.colores.join(", ")}

Design requirements:
- Show a realistic website home page inside a desktop browser frame or full-page web mockup.
- Include a top navigation bar, premium hero, clear CTA button, visual product/service area, benefits cards, trust/testimonial area, and lead/contact section preview.
- Make it look like an actual finished landing page for the specific business, not a generic poster.
- Use dark elegant Monova-inspired styling with orange glow accents only where useful; keep it premium and readable.
- Use realistic layout, spacing, shadows, cards, responsive grid, refined typography, and high-end UI details.
- Avoid huge text overlays outside the website. Avoid random isolated product cards. Avoid fake logos, fake brand names, illegible microtext, watermarks, or distorted UI.
- The image should communicate: "Previsualiza cómo se vería tu home mejorada".
`.trim();
}

async function generateDiagnosticMockup(imagePrompt: string) {
  if (!process.env.OPENAI_API_KEY) return "";

  try {
    const response = await fetchWithTimeout("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: imageModel,
        prompt: imagePrompt,
        size: "1536x1024"
      })
    }, 120_000);

    const data = await response.json().catch(() => ({}));
    const image = data.data?.[0] || {};
    if (response.ok && image.b64_json) return `data:image/png;base64,${image.b64_json}`;
    if (response.ok && image.url) return image.url;
  } catch {
    return "";
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const lead = sanitizeLead(payload);

    if (!lead.nombre || !lead.whatsapp || !lead.tipoNegocio || !lead.url || !lead.descripcion) {
      return NextResponse.json(
        { error: "Completa nombre, WhatsApp, tipo de negocio, link de la web y descripción." },
        { status: 400 }
      );
    }

    const websiteSnapshot = await fetchWebsiteSnapshot(lead.url);
    const result = await createDiagnosticVisual(lead, websiteSnapshot);
    const mockupImageUrl = await generateDiagnosticMockup(buildHomepagePreviewPrompt(lead, result));

    return NextResponse.json({
      ...result,
      mockupImageUrl,
      auditedUrl: normalizeUrl(lead.url)
    });
  } catch (error) {
    const status = (error as Error & { status?: number }).status || 500;
    return NextResponse.json(
      {
        error:
          status === 503
            ? "La IA todavía no está configurada en el servidor."
            : "No pudimos generar el diagnóstico ahora. Intenta de nuevo en unos minutos."
      },
      { status }
    );
  }
}
