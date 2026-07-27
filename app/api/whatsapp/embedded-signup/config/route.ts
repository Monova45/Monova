import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const appId = process.env.META_APP_ID?.trim() || "";
  const configId = process.env.META_LOGIN_CONFIG_ID?.trim() || "";
  return NextResponse.json({
    ready: Boolean(appId && configId && process.env.META_APP_SECRET && process.env.ENCRYPTION_KEY),
    appId: appId || null,
    configId: configId || null,
    missing: [
      !appId && "META_APP_ID",
      !configId && "META_LOGIN_CONFIG_ID",
      !process.env.META_APP_SECRET && "META_APP_SECRET",
      !process.env.ENCRYPTION_KEY && "ENCRYPTION_KEY",
    ].filter(Boolean),
  });
}
