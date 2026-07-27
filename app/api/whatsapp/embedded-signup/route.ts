import { NextResponse } from "next/server";
import { z } from "zod";
import { encryptWhatsAppSession, WHATSAPP_SESSION_COOKIE } from "@/lib/whatsapp/session";
import { getWhatsAppPhoneProfile } from "@/lib/whatsapp/provider";

const payloadSchema = z.object({
  code: z.string().min(10),
  phoneNumberId: z.string().regex(/^\d+$/),
  businessAccountId: z.string().regex(/^\d+$/),
});

export async function POST(request: Request) {
  try {
    const payload = payloadSchema.parse(await request.json());
    const appId = process.env.META_APP_ID?.trim();
    const appSecret = process.env.META_APP_SECRET?.trim();
    if (!appId || !appSecret) {
      return NextResponse.json({ error: "La aplicación de Meta no está configurada." }, { status: 503 });
    }

    const tokenUrl = new URL("https://graph.facebook.com/v23.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("code", payload.code);
    const tokenResponse = await fetch(tokenUrl, { cache: "no-store" });
    const tokenData = await tokenResponse.json() as { access_token?: string; error?: { message?: string } };
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error?.message || "Meta no entregó un token válido.");
    }

    const credentials = {
      token: tokenData.access_token,
      phoneNumberId: payload.phoneNumberId,
      businessAccountId: payload.businessAccountId,
    };
    const profile = await getWhatsAppPhoneProfile(credentials);
    const response = NextResponse.json({ success: true, profile });
    response.cookies.set(WHATSAPP_SESSION_COOKIE, encryptWhatsAppSession({
      accessToken: credentials.token,
      phoneNumberId: credentials.phoneNumberId,
      businessAccountId: credentials.businessAccountId,
      connectedAt: new Date().toISOString(),
    }), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 60,
    });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Meta no devolvió los identificadores esperados." }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo completar la conexión." }, { status: 502 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(WHATSAPP_SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
