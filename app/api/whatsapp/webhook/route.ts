import { verifyWebhookChallenge, verifyWebhookSignature } from "@/lib/whatsapp/provider";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (verifyWebhookChallenge(mode, token) && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Webhook verification failed", { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 401 });
  }

  // Meta reintenta si no recibe 200 rápidamente. La persistencia de conversaciones
  // se conectará aquí cuando Supabase y la autenticación del workspace estén activos.
  const event = JSON.parse(rawBody) as { object?: string };
  if (event.object !== "whatsapp_business_account") {
    return new Response("Ignored", { status: 200 });
  }
  return new Response("EVENT_RECEIVED", { status: 200 });
}
