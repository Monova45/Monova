import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_GRAPH_VERSION = "v23.0";

export type WhatsAppConnection = {
  configured: boolean;
  phoneNumberId: string | null;
  businessAccountId: string | null;
  webhookConfigured: boolean;
};

export type WhatsAppPhoneProfile = {
  id: string;
  displayPhoneNumber: string;
  verifiedName: string;
  qualityRating: string | null;
};

export type WhatsAppCredentials = {
  token: string;
  phoneNumberId: string;
  businessAccountId?: string;
};

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function apiVersion() {
  return env("WHATSAPP_GRAPH_API_VERSION") || DEFAULT_GRAPH_VERSION;
}

function graphUrl(path: string) {
  return `https://graph.facebook.com/${apiVersion()}/${path}`;
}

export function getWhatsAppConnection(): WhatsAppConnection {
  const phoneNumberId = env("WHATSAPP_PHONE_NUMBER_ID");
  const businessAccountId = env("WHATSAPP_BUSINESS_ACCOUNT_ID");
  return {
    configured: Boolean(env("WHATSAPP_ACCESS_TOKEN") && phoneNumberId),
    phoneNumberId: phoneNumberId || null,
    businessAccountId: businessAccountId || null,
    webhookConfigured: Boolean(env("META_WEBHOOK_VERIFY_TOKEN") && env("WHATSAPP_APP_SECRET")),
  };
}

function requireCredentials(credentials?: WhatsAppCredentials) {
  const token = credentials?.token || env("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = credentials?.phoneNumberId || env("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneNumberId) {
    throw new Error("Configura WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID.");
  }
  return { token, phoneNumberId };
}

async function graphRequest<T>(path: string, init?: RequestInit, credentials?: WhatsAppCredentials): Promise<T> {
  const { token } = requireCredentials(credentials);
  const response = await fetch(graphUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as {
    error?: { message?: string; error_user_msg?: string };
  } & T;
  if (!response.ok) {
    throw new Error(payload.error?.error_user_msg || payload.error?.message || "Meta rechazó la solicitud.");
  }
  return payload;
}

export async function getWhatsAppPhoneProfile(credentials?: WhatsAppCredentials): Promise<WhatsAppPhoneProfile> {
  const { phoneNumberId } = requireCredentials(credentials);
  const data = await graphRequest<{
    id: string;
    display_phone_number?: string;
    verified_name?: string;
    quality_rating?: string;
  }>(`${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`, undefined, credentials);
  return {
    id: data.id,
    displayPhoneNumber: data.display_phone_number || "",
    verifiedName: data.verified_name || "",
    qualityRating: data.quality_rating || null,
  };
}

type SendTextInput = { to: string; kind: "text"; message: string };
type SendTemplateInput = { to: string; kind: "template"; template: string; language: string };

export async function sendWhatsAppMessage(input: SendTextInput | SendTemplateInput, credentials?: WhatsAppCredentials) {
  const { phoneNumberId } = requireCredentials(credentials);
  const body = input.kind === "text"
    ? {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: input.to,
        type: "text",
        text: { preview_url: false, body: input.message },
      }
    : {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: input.to,
        type: "template",
        template: { name: input.template, language: { code: input.language } },
      };
  return graphRequest<{ messages?: Array<{ id: string }>; contacts?: Array<{ wa_id: string }> }>(
    `${phoneNumberId}/messages`,
    { method: "POST", body: JSON.stringify(body) },
    credentials,
  );
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = env("WHATSAPP_APP_SECRET");
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"));
  const supplied = Buffer.from(signature.slice(7));
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function verifyWebhookChallenge(mode: string | null, token: string | null) {
  return mode === "subscribe" && Boolean(token) && token === env("META_WEBHOOK_VERIFY_TOKEN");
}
