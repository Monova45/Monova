import { createServer } from "node:http";
import { readFile, stat, open } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  sendJson, readBody, mimeTypes, createRoadmap, createChatReply
} from "./api/_shared.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;

async function loadEnv() {
  const envPath = path.join(root, ".env");
  if (!existsSync(envPath)) return;
  const content = await readFile(envPath, "utf8").catch(() => "");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const index = trimmed.indexOf("=");
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

await loadEnv();

const port = Number(process.env.PORT || 8000);

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(root, requested));

  if (!filePath.startsWith(root) || path.basename(filePath).startsWith(".env")) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || "application/octet-stream";

  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    const fallback = await readFile(path.join(root, "404.html")).catch(() => "Not found");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fallback);
    return;
  }

  const rangeHeader = req.headers["range"];

  if (rangeHeader && (ext === ".mp4" || ext === ".webm" || ext === ".mp3")) {
    const total = fileStat.size;
    const [startStr, endStr] = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : Math.min(start + 1048576, total - 1);

    if (start >= total || end >= total) {
      res.writeHead(416, { "Content-Range": `bytes */${total}` });
      res.end();
      return;
    }

    const chunkSize = end - start + 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": contentType
    });

    const fd = await open(filePath, "r");
    const buf = Buffer.allocUnsafe(chunkSize);
    await fd.read(buf, 0, chunkSize, start);
    await fd.close();
    res.end(buf);
    return;
  }

  const content = await readFile(filePath).catch(() => null);
  if (!content) {
    const fallback = await readFile(path.join(root, "404.html")).catch(() => "Not found");
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fallback);
    return;
  }

  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": fileStat.size,
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  });
  res.end(content);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/roadmap") {
      const body = await readBody(req);
      const { idea } = JSON.parse(body || "{}");
      const cleanIdea = String(idea || "").trim().slice(0, 600);

      if (cleanIdea.length < 4) {
        sendJson(res, 400, { error: "Cuéntanos un poco más sobre la idea." });
        return;
      }

      const cards = await createRoadmap(cleanIdea);
      sendJson(res, 200, { cards });
      return;
    }

    if (req.method === "POST" && req.url === "/api/chat") {
      const body = await readBody(req);
      const { messages } = JSON.parse(body || "{}");

      if (!Array.isArray(messages) || messages.length === 0) {
        sendJson(res, 400, { error: "Escribe una pregunta para Monova." });
        return;
      }

      const answer = await createChatReply(messages);
      sendJson(res, 200, { answer });
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end("Method not allowed");
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    sendJson(res, error.status || 500, {
      error: error.status === 503 ? "AI is not configured yet." : "No pudimos generar la ruta ahora."
    });
  }
});

server.listen(port, () => {
  console.log(`Monova running at http://localhost:${port}`);
});
