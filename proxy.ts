import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

// Public demo visitors never receive an authenticated session.
// These endpoints expose connected services, stored content, or paid operations.
export async function proxy() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json(
      { error: "Esta acción requiere una cuenta. Estás explorando la demo pública." },
      { status: 401 },
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/ai/:path*", "/api/jobs/:path*", "/api/resources/:path*",
    "/api/email/:path*", "/api/social/:path*", "/api/kommo/:path*",
    "/api/wati/:path*", "/api/landing-pages/:path*",
    "/api/whatsapp/send", "/api/whatsapp/status",
    "/api/whatsapp/embedded-signup/:path*",
  ],
};
