import { NextResponse } from "next/server";
import { getKommoStatus, isKommoConfigured } from "@/lib/kommo/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isKommoConfigured()) return NextResponse.json({ configured: false });
  try {
    return NextResponse.json(await getKommoStatus());
  } catch (error) {
    return NextResponse.json({
      configured: false,
      error: error instanceof Error ? error.message : "No se pudo validar Kommo.",
    }, { status: 502 });
  }
}
