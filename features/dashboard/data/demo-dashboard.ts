import type { DashboardSummary } from "@/types/dashboard";

export const demoDashboardSummary: DashboardSummary = {
  workspaceId: "demo-universal-de-cauchos",
  isDemo: true,
  dateRange: { from: "2026-07-01", to: "2026-07-31", label: "1 – 31 julio 2026" },
  metrics: [
    { id: "reach", label: "Alcance", formattedValue: "125.8K", changePercent: 18.6, trend: "positive" },
    { id: "engagement", label: "Interacciones", formattedValue: "8.47K", changePercent: 32.1, trend: "positive" },
    { id: "clicks", label: "Clics en enlace", formattedValue: "2.34K", changePercent: 15.3, trend: "positive" },
    { id: "conversions", label: "Conversiones", formattedValue: "356", changePercent: 25, trend: "positive" },
    { id: "sales", label: "Ventas", formattedValue: "$12,450", changePercent: 28.6, trend: "positive" },
  ],
  channelPerformance: [
    { id: "instagram", name: "Instagram", contributionPercent: 48.6, color: "#ff4d8d" },
    { id: "facebook", name: "Facebook", contributionPercent: 24.7, color: "#1877f2" },
    { id: "whatsapp", name: "WhatsApp", contributionPercent: 13.8, color: "#25d366" },
    { id: "tiktok", name: "TikTok", contributionPercent: 7.6, color: "#18181b" },
    { id: "youtube", name: "YouTube", contributionPercent: 3.2, color: "#ff0000" },
  ],
  assistantInsights: [
    { id: "best-time", title: "Mejor hora para publicar", description: "Tu audiencia está 32% más activa hoy a las 7:30 p. m.", actionLabel: "Crear publicación", actionHref: "/app/creative-studio" },
    { id: "fatigue", title: "Anuncio con fatiga", description: "Una campaña demo perdió 18% de CTR esta semana.", actionLabel: "Generar variación", actionHref: "/app/creative-studio" },
    { id: "messages", title: "Mensajes pendientes", description: "Hay 8 conversaciones demo pendientes por más de 2 horas.", actionLabel: "Responder", actionHref: "/app/whatsapp" },
  ],
  calendarItems: [
    { id: "calendar-1", date: "2026-07-20", title: "Post Instagram", channel: "instagram", status: "scheduled", isDemo: true },
    { id: "calendar-2", date: "2026-07-21", title: "Estado WhatsApp", channel: "whatsapp", status: "published", isDemo: true },
    { id: "calendar-3", date: "2026-07-22", title: "Reel Instagram", channel: "instagram", status: "in_review", isDemo: true },
    { id: "calendar-4", date: "2026-07-23", title: "Post Facebook", channel: "facebook", status: "scheduled", isDemo: true },
    { id: "calendar-5", date: "2026-07-24", title: "Story Instagram", channel: "instagram", status: "draft", isDemo: true },
  ],
  recentActivity: [
    { id: "activity-1", label: "Calendario demo actualizado", occurredAt: "2026-07-23T12:10:00Z", actorName: "Brandon R." },
  ],
};
