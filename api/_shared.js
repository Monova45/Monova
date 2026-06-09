const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const monovaKnowledge = `
MONOVA es un estudio digital que combina software, diseño, branding e inteligencia artificial.
Servicios principales:
- Desarrollo de software: aplicaciones web, móviles, SaaS, sistemas a medida y paneles administrativos.
- Diseño UX/UI: interfaces modernas, wireframes, prototipos y experiencias enfocadas en conversión.
- Inteligencia artificial: asistentes, automatización de procesos, análisis de datos y flujos operativos.
- Branding digital: identidad visual, tono de marca, piezas digitales y sistemas de marca.
- Cloud, DevOps e integraciones: despliegues, APIs, pagos, CRM, formularios, automatizaciones y herramientas internas.
Casos comunes que Monova puede proponer:
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
Tono: cercano, claro, profesional y honesto. No inventar clientes, cifras, precios ni garantías.
Objetivo del chat: diagnosticar necesidades del visitante, detectar que le falta a su empresa y orientar hacia servicios de Monova. Si el visitante ya dice claramente lo que quiere, responder directo con una propuesta breve.
`;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 12_000) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function extractResponseText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((part) => part.text || part.output_text || "")
    .join("\n")
    .trim();
}

function cleanSpanishText(value) {
  return String(value || "")
    .replace(/\bgesti\uFFFDn\b/gi, "gestión")
    .replace(/\bsoluci\uFFFDn\b/gi, "solución")
    .replace(/\bcat\uFFFDlogo\b/gi, "catálogo")
    .replace(/\bautomatizaci\uFFFDn\b/gi, "automatización")
    .replace(/\boperaci\uFFFDn\b/gi, "operación")
    .replace(/\bversi\uFFFDn\b/gi, "versión")
    .replace(/\bdiagn\uFFFDstico\b/gi, "diagnóstico")
    .replace(/\bm\uFFFDetricas\b/gi, "métricas")
    .replace(/\bgarant\uFFFDias\b/gi, "garantías")
    .replace(/\bopci\uFFFDnes\b/gi, "opciones")
    .replaceAll("\u00AD", "")
    .replaceAll("\uFFFD", "")
    .replace(/\bgestion\b/gi, "gestión")
    .replace(/\bdiseno\b/gi, "diseño")
    .replace(/\bsolucion\b/gi, "solución")
    .replace(/\bcatalogo\b/gi, "catálogo")
    .replace(/\bautomatizacion\b/gi, "automatización")
    .replace(/\boperacion\b/gi, "operación")
    .replace(/\bversion\b/gi, "versión")
    .replace(/\bdiagnostico\b/gi, "diagnóstico")
    .replace(/\bmetricas\b/gi, "métricas")
    .replace(/\bgarantias\b/gi, "garantías")
    .replace(/\butil\b/gi, "útil")
    .replace(/\bespanol\b/gi, "español")
    .replace(/\bgenericas\b/gi, "genéricas")
    .replace(/\bsolución Monova\b/g, "Solución Monova");
}

async function createRoadmap(idea) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("Missing OPENAI_API_KEY");
    error.status = 503;
    throw error;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
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
            "Eres Monova, un estudio de software, diseño e IA. Convierte la idea del cliente en una respuesta breve de chat con 3 tarjetas. Usa español natural con tildes y eñes correctas. Nunca escribas caracteres de reemplazo como � ni palabras sin acento cuando corresponda. No cortes palabras ni dejes frases incompletas. Debes usar detalles concretos que el cliente mencione. Si pregunta precio, valor, cuánto vale o cuánto cuesta, NO diagnostiques de nuevo: explica que depende del alcance, menciona variables concretas y pide datos para cotizar. Si dice tamales, manillas, platos, inventario u otro producto, nombra ese producto y plantea una solución específica. Responde en español claro, comercial y accionable. No uses frases genéricas como 'aterrizamos qué vendes' si ya sabes qué vende. No inventes métricas, clientes, precios ni garantías."
        },
        {
          role: "user",
          content: `Idea del proyecto: ${idea}`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "monova_roadmap",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              cards: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    number: { type: "string", enum: ["01", "02", "03"] },
                    title: { type: "string", minLength: 3, maxLength: 34 },
                    copy: { type: "string", minLength: 20, maxLength: 180 }
                  },
                  required: ["number", "title", "copy"]
                }
              }
            },
            required: ["cards"]
          }
        }
      },
      max_output_tokens: 700,
      store: false
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error?.message || "OpenAI request failed");
    error.status = response.status;
    throw error;
  }

  const text = extractResponseText(data);
  const parsed = JSON.parse(text);
  const hasInvalidCharacters = parsed.cards.some((card) =>
    [card.title, card.copy].some((value) => String(value || "").includes("\uFFFD"))
  );
  if (hasInvalidCharacters) {
    const error = new Error("AI response had invalid characters");
    error.status = 502;
    throw error;
  }
  return parsed.cards.map((card, index) => ({
    number: cleanSpanishText(card.number || `0${index + 1}`),
    title: cleanSpanishText(card.title),
    copy: cleanSpanishText(card.copy)
  }));
}

async function createChatReply(messages) {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("Missing OPENAI_API_KEY");
    error.status = 503;
    throw error;
  }

  const cleanMessages = messages
    .filter((message) => ["user", "assistant"].includes(message.role))
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: String(message.content || "").slice(0, 700)
    }));

  const response = await fetch("https://api.openai.com/v1/responses", {
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
            `Eres el asistente comercial y diagnosticador de MONOVA. Responde en español, breve y útil. Usa tildes y eñes correctas. Nunca escribas caracteres de reemplazo como �. Usa solo esta información de negocio:\n${monovaKnowledge}\nReglas:
- Si el usuario no sabe qué necesita, haz 2 o 3 preguntas concretas sobre su empresa: qué vende/ofrece, cómo maneja ventas/clientes/inventario/procesos hoy, y qué tarea le quita más tiempo.
- Luego sugiere "a tu empresa le falta..." con 2 o 3 oportunidades: por ejemplo sistema de ventas, inventario, automatización, IA, UX/UI o branding.
- Si el usuario ya sabe lo que quiere (ej. plataforma de ventas, inventario, ecommerce, CRM, chatbot, app), responde directo con una mini propuesta: módulos recomendados, primer paso y cómo Monova lo construye.
- Si el usuario ya cuenta que vende algo y quiere vender digital, mostrar productos a más personas, no tiene página de venta, no tiene vendedores virtuales o quiere chatbot, no sigas preguntando diagnóstico básico: propone web/catálogo, pedidos o reservas, chatbot de preguntas frecuentes, contenido/UX para presentar mejor el producto, y posibles fases como pagos, inventario y panel administrativo.
- No inventes clientes, cifras, precios ni garantías.
- Si preguntan por precio o fecha exacta, explica que depende del alcance e invita a dejar datos en contacto.`
        },
        ...cleanMessages
      ],
      max_output_tokens: 450,
      store: false
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error?.message || "OpenAI request failed");
    error.status = response.status;
    throw error;
  }

  return cleanSpanishText(extractResponseText(data));
}

export {
  sendJson,
  readBody,
  extractResponseText,
  cleanSpanishText,
  mimeTypes,
  monovaKnowledge,
  createRoadmap,
  createChatReply
};
