import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.MONOVA_ALLOW_UNAUTHENTICATED_AI_ACTIONS !== "true") {
    return NextResponse.json({ error: "La descarga requiere autenticación activa en producción." }, { status: 403 });
  }
  if (!process.env.MAGNIFIC_API_KEY) {
    return NextResponse.json({ error: "Magnific no está configurado." }, { status: 503 });
  }
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Recurso inválido." }, { status: 400 });
  const { searchParams } = new URL(_request.url);
  const requestedFormat = searchParams.get("format") || "original";
  const allowedFormats = ["original", "jpg", "png", "svg", "eps", "psd", "ai"];
  if (!allowedFormats.includes(requestedFormat)) return NextResponse.json({ error: "Formato inválido." }, { status: 400 });

  try {
    const endpoint = requestedFormat === "original"
      ? `https://api.magnific.com/v1/resources/${id}/download?image_size=original`
      : `https://api.magnific.com/v1/resources/${id}/download/${requestedFormat}`;
    const response = await fetch(endpoint, {
      headers: {
        "x-magnific-api-key": process.env.MAGNIFIC_API_KEY,
        "Accept-Language": "es-ES",
      },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({})) as {
      data?: { url?: string; signed_url?: string; filename?: string };
      message?: string;
    };
    if (!response.ok) {
      return NextResponse.json({ error: payload.message || "No se pudo preparar la descarga." }, { status: response.status });
    }
    const url = payload.data?.signed_url || payload.data?.url;
    if (!url) return NextResponse.json({ error: "Magnific no devolvió un archivo descargable." }, { status: 502 });
    return NextResponse.json({ url, filename: payload.data?.filename || `magnific-${id}` });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con Magnific." }, { status: 502 });
  }
}
