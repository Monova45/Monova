import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  const provider =
    process.env.RUNWAY_API_KEY ? "runway" :
    process.env.KLING_API_KEY ? "kling" :
    process.env.GOOGLE_VIDEO_API_KEY ? "google-veo" :
    null;

  return NextResponse.json({
    configured: Boolean(provider),
    provider,
    generationEnabled: false,
    message: provider
      ? "Las credenciales están presentes; falta activar el adaptador de generación."
      : "Configura un proveedor de video para generar.",
  });
}
