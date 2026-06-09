import { createChatReply, sendJson } from "./_shared.js";

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

    const { messages } = JSON.parse(body || "{}");

    if (!Array.isArray(messages) || messages.length === 0) {
      sendJson(res, 400, { error: "Escribe una pregunta para Monova." });
      return;
    }

    const answer = await createChatReply(messages);
    sendJson(res, 200, { answer });
  } catch (error) {
    sendJson(res, error.status || 500, {
      error: error.status === 503 ? "AI is not configured yet." : "No pudimos generar la respuesta ahora."
    });
  }
}
