import { ProviderError } from "@/lib/errors";
import type { JobStatus } from "@/types/domain";

const endpoint = "https://api.magnific.com/v1/ai/image-upscaler";

export interface MagnificUpscaleInput {
  image: string;
  scaleFactor: "2x" | "4x" | "8x" | "16x";
  optimizedFor:
    | "standard" | "soft_portraits" | "hard_portraits" | "art_n_illustration"
    | "videogame_assets" | "nature_n_landscapes" | "films_n_photography"
    | "3d_renders" | "science_fiction_n_horror";
  prompt?: string;
  creativity: number;
  hdr: number;
  resemblance: number;
  fractality: number;
  webhookUrl?: string;
}

export interface MagnificTask {
  externalJobId: string;
  status: JobStatus;
  generated: string[];
}

interface MagnificPayload {
  data?: {
    task_id?: string;
    status?: string;
    generated?: string[];
  };
  message?: string;
}

function getApiKey(): string {
  const key = process.env.MAGNIFIC_API_KEY;
  if (!key) throw new ProviderError("Magnific no está configurado.", "magnific");
  return key;
}

function normalizeStatus(status: string | undefined): JobStatus {
  switch (status?.toUpperCase()) {
    case "COMPLETED": return "completed";
    case "FAILED": return "failed";
    case "CANCELLED": return "cancelled";
    case "IN_PROGRESS": return "processing";
    case "CREATED": return "pending";
    default: return "pending";
  }
}

async function magnificRequest(url: string, init: RequestInit): Promise<MagnificPayload> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "x-magnific-api-key": getApiKey(),
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    const payload = await response.json().catch(() => ({})) as MagnificPayload;
    if (!response.ok) throw new ProviderError(payload.message || `Magnific respondió ${response.status}.`, "magnific");
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createMagnificUpscale(input: MagnificUpscaleInput): Promise<MagnificTask> {
  const image = input.image.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "");
  const payload = await magnificRequest(endpoint, {
    method: "POST",
    body: JSON.stringify({
      image,
      scale_factor: input.scaleFactor,
      optimized_for: input.optimizedFor,
      prompt: input.prompt,
      creativity: input.creativity,
      hdr: input.hdr,
      resemblance: input.resemblance,
      fractality: input.fractality,
      engine: "automatic",
      filter_nsfw: true,
      webhook_url: input.webhookUrl,
    }),
  });

  if (!payload.data?.task_id) throw new ProviderError("Magnific no devolvió un task ID.", "magnific");
  return {
    externalJobId: payload.data.task_id,
    status: normalizeStatus(payload.data.status),
    generated: payload.data.generated ?? [],
  };
}

export async function getMagnificTask(externalJobId: string): Promise<MagnificTask> {
  const payload = await magnificRequest(`${endpoint}/${encodeURIComponent(externalJobId)}`, { method: "GET" });
  return {
    externalJobId: payload.data?.task_id ?? externalJobId,
    status: normalizeStatus(payload.data?.status),
    generated: payload.data?.generated ?? [],
  };
}
