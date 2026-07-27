import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser, createSession, getActiveUserByEmail, setSessionCookie } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const passwordlessTestAccess =
    body?.testAccess === true &&
    process.env.MONOVA_ALLOW_PASSWORDLESS_TEST_LOGIN === "true";

  let user;
  if (passwordlessTestAccess) {
    user = await getActiveUserByEmail("pruebas@monova.local");
  } else {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Revisa el correo y la contraseña." }, { status: 400 });
    }
    user = await authenticateUser(parsed.data.email, parsed.data.password);
  }
  if (!user) return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  const session = await createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);
  return NextResponse.json({ user: { email: user.email, fullName: user.fullName, workspaceName: user.workspaceName } });
}
