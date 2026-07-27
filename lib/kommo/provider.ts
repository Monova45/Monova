type KommoProblem = { title?: string; detail?: string; status?: number };

function config() {
  const domain = process.env.KOMMO_API_DOMAIN?.trim() || "";
  const token = process.env.KOMMO_ACCESS_TOKEN?.trim() || "";
  return { domain, token, configured: Boolean(domain && token) };
}

async function kommoRequest<T>(path: string): Promise<T> {
  const { domain, token, configured } = config();
  if (!configured) throw new Error("Kommo no está configurado.");
  const response = await fetch(`https://${domain}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({})) as KommoProblem;
    const error = new Error(problem.detail || problem.title || `Kommo respondió ${response.status}.`);
    Object.assign(error, { status: response.status });
    throw error;
  }
  return response.json() as Promise<T>;
}

export function isKommoConfigured() {
  return config().configured;
}

export async function getKommoStatus() {
  const account = await kommoRequest<{ id: number; name: string; subdomain: string; country: string }>("/api/v4/account");
  const leads = await kommoRequest<{ _embedded?: { leads?: Array<{ id: number }> } }>("/api/v4/leads?limit=50");
  let chatAccess = false;
  let chatAccessReason = "No se encontró una conversación para validar.";
  const events = await kommoRequest<{ _embedded?: { events?: Array<{ entity_id: number }> } }>("/api/v4/events?filter%5Btype%5D=talk_created&limit=1");
  const talkId = events._embedded?.events?.[0]?.entity_id;
  if (talkId) {
    try {
      await kommoRequest<unknown>(`/api/v4/talks/${talkId}/messages?limit=1`);
      chatAccess = true;
      chatAccessReason = "Historial externo disponible.";
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      chatAccessReason = status === 403
        ? "El token no tiene el alcance External chat history."
        : error instanceof Error ? error.message : "No se pudo validar el historial.";
    }
  }
  return {
    configured: true,
    account: { id: account.id, name: account.name, subdomain: account.subdomain, country: account.country },
    crmAccess: true,
    leadSampleCount: leads._embedded?.leads?.length || 0,
    chatAccess,
    chatAccessReason,
  };
}
