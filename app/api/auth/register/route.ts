import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, isUniqueEmailError, registerUser, setSessionCookie } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  fullName: z.string().trim().min(2).max(100),
  workspaceName: z.string().trim().min(2).max(120),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Completa todos los campos correctamente." }, { status: 400 });
  try {
    const user = await registerUser(parsed.data);
    const session = await createSession(user.id);
    await setSessionCookie(session.token, session.expiresAt);
    return NextResponse.json({ user: { email: user.email, fullName: user.fullName, workspaceName: user.workspaceName } }, { status: 201 });
  } catch (error) {
    if (isUniqueEmailError(error)) return NextResponse.json({ error: "Ya existe una cuenta con este correo." }, { status: 409 });
    console.error("Registration failed", error);
    return NextResponse.json({ error: "No fue posible crear la cuenta." }, { status: 500 });
  }
}

