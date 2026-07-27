import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getWhatsAppConnection, getWhatsAppPhoneProfile } from "@/lib/whatsapp/provider";
import { decryptWhatsAppSession, WHATSAPP_SESSION_COOKIE } from "@/lib/whatsapp/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const session = decryptWhatsAppSession(cookieStore.get(WHATSAPP_SESSION_COOKIE)?.value);
  const envConnection = getWhatsAppConnection();
  const connection = session ? {
    configured: true,
    phoneNumberId: session.phoneNumberId,
    businessAccountId: session.businessAccountId,
    webhookConfigured: envConnection.webhookConfigured,
    source: "facebook" as const,
  } : { ...envConnection, source: "environment" as const };
  if (!connection.configured) return NextResponse.json(connection);
  try {
    const profile = await getWhatsAppPhoneProfile(session ? {
      token: session.accessToken,
      phoneNumberId: session.phoneNumberId,
      businessAccountId: session.businessAccountId,
    } : undefined);
    return NextResponse.json({ ...connection, profile });
  } catch (error) {
    return NextResponse.json(
      { ...connection, configured: false, error: error instanceof Error ? error.message : "No se pudo validar la conexión." },
      { status: 502 },
    );
  }
}
