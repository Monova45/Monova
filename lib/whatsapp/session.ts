import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const WHATSAPP_SESSION_COOKIE = "monova_whatsapp_connection";

export type WhatsAppSession = {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  connectedAt: string;
};

function encryptionKey() {
  const source = process.env.ENCRYPTION_KEY?.trim() || process.env.META_APP_SECRET?.trim();
  if (!source) throw new Error("Configura ENCRYPTION_KEY para guardar la conexión de forma segura.");
  return createHash("sha256").update(source).digest();
}

export function encryptWhatsAppSession(value: WhatsAppSession) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptWhatsAppSession(value: string | undefined): WhatsAppSession | null {
  if (!value) return null;
  try {
    const packed = Buffer.from(value, "base64url");
    const iv = packed.subarray(0, 12);
    const tag = packed.subarray(12, 28);
    const encrypted = packed.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")) as WhatsAppSession;
  } catch {
    return null;
  }
}
