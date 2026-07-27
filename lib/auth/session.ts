import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/database";

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = "monova_session";
const SESSION_DAYS = 14;

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  workspaceId: string;
  workspaceName: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, storedHex] = encoded.split(":");
  if (algorithm !== "scrypt" || !salt || !storedHex) return false;
  const stored = Buffer.from(storedHex, "hex");
  const derived = await scrypt(password, salt, stored.length) as Buffer;
  return stored.length === derived.length && timingSafeEqual(stored, derived);
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function registerUser(input: { email: string; password: string; fullName: string; workspaceName: string }) {
  const database = getDatabase();
  const client = await database.connect();
  try {
    await client.query("begin");
    const workspace = await client.query<{ id: string }>(
      "insert into public.workspaces (name, slug, metadata) values ($1, $2, $3::jsonb) returning id",
      [input.workspaceName.trim(), `${slugify(input.workspaceName)}-${randomBytes(3).toString("hex")}`, JSON.stringify({ created_from: "registration" })],
    );
    const passwordHash = await hashPassword(input.password);
    const user = await client.query<{ id: string; email: string; full_name: string }>(
      "insert into public.app_users (email, full_name, password_hash, workspace_id) values ($1, $2, $3, $4) returning id, email::text, full_name",
      [normalizeEmail(input.email), input.fullName.trim(), passwordHash, workspace.rows[0].id],
    );
    await client.query("commit");
    return {
      id: user.rows[0].id,
      email: user.rows[0].email,
      fullName: user.rows[0].full_name,
      workspaceId: workspace.rows[0].id,
      workspaceName: input.workspaceName.trim(),
    } satisfies AuthUser;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const result = await getDatabase().query<{
    id: string; email: string; full_name: string; password_hash: string;
    workspace_id: string; workspace_name: string; status: string;
  }>(
    `select u.id, u.email::text, u.full_name, u.password_hash, u.workspace_id,
            w.name as workspace_name, u.status
       from public.app_users u
       join public.workspaces w on w.id = u.workspace_id
      where u.email = $1`,
    [normalizeEmail(email)],
  );
  const user = result.rows[0];
  if (!user || user.status !== "active" || !(await verifyPassword(password, user.password_hash))) return null;
  return { id: user.id, email: user.email, fullName: user.full_name, workspaceId: user.workspace_id, workspaceName: user.workspace_name };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await getDatabase().query(
    "insert into public.app_sessions (user_id, token_hash, expires_at) values ($1, $2, $3)",
    [userId, tokenHash(token), expiresAt],
  );
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await getDatabase().query<{
    id: string; email: string; full_name: string; workspace_id: string; workspace_name: string;
  }>(
    `select u.id, u.email::text, u.full_name, u.workspace_id, w.name as workspace_name
       from public.app_sessions s
       join public.app_users u on u.id = s.user_id and u.status = 'active'
       join public.workspaces w on w.id = u.workspace_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [tokenHash(token)],
  );
  const user = result.rows[0];
  return user ? { id: user.id, email: user.email, fullName: user.full_name, workspaceId: user.workspace_id, workspaceName: user.workspace_name } : null;
}

export async function revokeCurrentSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await getDatabase().query("delete from public.app_sessions where token_hash = $1", [tokenHash(token)]);
  store.delete(SESSION_COOKIE);
}

export function isUniqueEmailError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "workspace";
}
