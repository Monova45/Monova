import { createRoadmap, sendJson } from "./_shared.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 12_000) {
        sendJson(res, 413, { error: "Request too large" });
        return;
      }
    }

    const { idea } = JSON.parse(body || "{}");
    const cleanIdea = String(idea || "").trim().slice(0, 600);

    if (cleanIdea.length < 4) {
      sendJson(res, 400, { error: "Cuéntanos un poco más sobre la idea." });
      return;
    }

    const cards = await createRoadmap(cleanIdea);
    sendJson(res, 200, { cards });
  } catch (error) {
    sendJson(res, error.status || 500, {
      error: error.status === 503 ? "AI is not configured yet." : "No pudimos generar la ruta ahora."
    });
  }
}
