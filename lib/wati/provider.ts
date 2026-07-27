type WatiContact = {
  id: string;
  displayName?: string;
  fullName?: string;
  firstName?: string;
  phone?: string;
  wAid?: string;
  waId?: string;
  bsuid?: string;
  photo?: string;
  contactStatus?: string;
  isRead?: boolean;
  lastMessageText?: string;
  lastMessage?: string;
};

type WatiMessage = {
  id?: string;
  text?: string;
  type?: string;
  owner?: boolean;
  timestamp?: string | number;
  created?: string;
  statusString?: string;
};

function config() {
  const endpoint = process.env.WATI_API_ENDPOINT?.trim().replace(/\/$/, "") || "";
  const token = process.env.WATI_ACCESS_TOKEN?.trim() || "";
  return { endpoint, token, configured: Boolean(endpoint && token) };
}

async function watiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { endpoint, token, configured } = config();
  if (!configured) throw new Error("WATI no está configurado.");
  const response = await fetch(`${endpoint}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as T & { info?: string; message?: string };
  if (!response.ok) throw new Error(payload.message || payload.info || `WATI respondió ${response.status}.`);
  return payload;
}

export function isWatiConfigured() {
  return config().configured;
}

function contactTarget(contact: WatiContact) {
  return contact.phone || contact.waId || contact.wAid || contact.bsuid || contact.id;
}

function messageList(payload: unknown): WatiMessage[] {
  if (!payload || typeof payload !== "object") return [];
  const queue: unknown[] = [payload];
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (Array.isArray(current)) {
      if (current.some((item) => item && typeof item === "object" && ("text" in item || "owner" in item || "timestamp" in item))) {
        return current as WatiMessage[];
      }
      queue.push(...current);
      continue;
    }
    const value = current as Record<string, unknown>;
    for (const key of ["messages", "message_list", "items", "result", "data"]) {
      if (key in value) queue.push(value[key]);
    }
  }
  return [];
}

function messageTime(message: WatiMessage) {
  const value = message.timestamp || message.created;
  if (typeof value === "number") return value < 10_000_000_000 ? value * 1000 : value;
  if (typeof value === "string" && /^\d+$/.test(value)) {
    const numeric = Number(value);
    return numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  }
  return value ? new Date(value).getTime() : 0;
}

export async function getWatiInbox() {
  const contactsPayload = await watiRequest<{
    contact_list?: WatiContact[];
    contacts?: WatiContact[];
    link?: { total?: number };
  }>("/api/v1/getContacts?pageSize=10&pageNumber=1");
  const contacts = contactsPayload.contact_list || contactsPayload.contacts || [];
  const conversations = [];
  for (const contact of contacts.slice(0, 5)) {
    const target = contactTarget(contact);
    try {
      const payload = await watiRequest<unknown>(`/api/v1/getMessages/${encodeURIComponent(target)}?pageSize=20&pageNumber=1`);
      const messages = messageList(payload);
      const orderedMessages = [...messages].sort((a, b) => messageTime(a) - messageTime(b));
      const last = orderedMessages[orderedMessages.length - 1];
      conversations.push({
        id: contact.id,
        target,
        name: contact.displayName || contact.fullName || contact.firstName || "Contacto",
        photo: contact.photo || null,
        lastMessage: last?.text || (last ? `[${last.type || "mensaje"}]` : null) || contact.lastMessageText || contact.lastMessage || "Contacto de WhatsApp",
        lastMessageAt: last?.timestamp || last?.created || null,
        unread: contact.isRead === false,
        messages: orderedMessages.slice(-20).map((message) => ({
          id: message.id || crypto.randomUUID(),
          text: message.text || `[${message.type || "mensaje"}]`,
          outgoing: Boolean(message.owner),
          timestamp: message.timestamp || message.created || null,
          status: message.statusString || null,
        })),
      });
    } catch {
      conversations.push({
        id: contact.id,
        target,
        name: contact.displayName || contact.fullName || contact.firstName || "Contacto",
        photo: contact.photo || null,
        lastMessage: contact.lastMessageText || contact.lastMessage || "Contacto de WhatsApp",
        lastMessageAt: null,
        unread: contact.isRead === false,
        messages: [],
      });
    }
  }
  return {
    configured: true,
    contactCount: contactsPayload.link?.total ?? contacts.length,
    conversations,
  };
}

export async function sendWatiSessionMessage(target: string, text: string) {
  const params = new URLSearchParams({ messageText: text });
  return watiRequest<{ result?: boolean; info?: string }>(
    `/api/v1/sendSessionMessage/${encodeURIComponent(target)}?${params.toString()}`,
    { method: "POST", body: JSON.stringify({}) },
  );
}
