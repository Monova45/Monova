import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  const missing = [
    !process.env.META_APP_ID && "META_APP_ID",
    !process.env.META_APP_SECRET && "META_APP_SECRET",
    !process.env.META_REDIRECT_URI && "META_REDIRECT_URI",
  ].filter(Boolean);

  return NextResponse.json({
    ready: missing.length === 0,
    connected: false,
    missing,
  });
}
