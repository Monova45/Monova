import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    ready: Boolean(process.env.RESEND_API_KEY),
    provider: process.env.RESEND_API_KEY ? "resend" : null,
    sendingEnabled: false,
  });
}
