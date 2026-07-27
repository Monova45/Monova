import { NextResponse } from "next/server";
import { getWatiInbox, isWatiConfigured } from "@/lib/wati/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isWatiConfigured()) return NextResponse.json({ configured: false, conversations: [] });
  try {
    return NextResponse.json(await getWatiInbox());
  } catch (error) {
    return NextResponse.json({
      configured: false,
      conversations: [],
      error: error instanceof Error ? error.message : "No se pudo consultar WATI.",
    }, { status: 502 });
  }
}
