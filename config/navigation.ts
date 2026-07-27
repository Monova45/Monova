export type NavigationIcon =
  | "dashboard" | "assistant" | "creative" | "image" | "video" | "magnific"
  | "resources" | "planner" | "social" | "whatsapp" | "analytics" | "ads"
  | "email" | "page" | "automation" | "crm" | "brand" | "team" | "billing" | "settings";

export interface NavigationItem {
  slug: string;
  label: string;
  icon: NavigationIcon;
  group: "create" | "manage" | "workspace";
  badge?: string;
}

export const appNavigation: readonly NavigationItem[] = [
  { slug: "dashboard", label: "Dashboard", icon: "dashboard", group: "create" },
  { slug: "assistant", label: "AI Assistant", icon: "assistant", group: "create" },
  { slug: "creative-studio", label: "Creative Studio", icon: "creative", group: "create" },
  { slug: "video-studio", label: "Video Studio", icon: "video", group: "create" },
  { slug: "video-editor", label: "Video Editor", icon: "video", group: "create", badge: "BETA" },
  { slug: "magnific", label: "Escalar imagen", icon: "magnific", group: "create" },
  { slug: "resources", label: "Recursos", icon: "resources", group: "manage" },
  { slug: "planner", label: "Planner", icon: "planner", group: "manage" },
  { slug: "social", label: "Redes sociales", icon: "social", group: "manage" },
  { slug: "whatsapp", label: "WhatsApp", icon: "whatsapp", group: "manage", badge: "3" },
  { slug: "analytics", label: "Analytics", icon: "analytics", group: "manage" },
  { slug: "meta-ads", label: "Meta Ads", icon: "ads", group: "manage" },
  { slug: "email", label: "Email Marketing", icon: "email", group: "manage" },
  { slug: "landing-pages", label: "Landing Pages", icon: "page", group: "manage" },
  { slug: "blog", label: "Blog y SEO", icon: "page", group: "manage" },
  { slug: "automations", label: "Automatizaciones", icon: "automation", group: "manage" },
  { slug: "crm", label: "Clientes CRM", icon: "crm", group: "manage" },
  { slug: "brand-center", label: "Brand Center", icon: "brand", group: "workspace" },
  { slug: "team", label: "Equipo", icon: "team", group: "workspace" },
  { slug: "billing", label: "Facturación", icon: "billing", group: "workspace" },
  { slug: "settings", label: "Ajustes", icon: "settings", group: "workspace" },
] as const;
