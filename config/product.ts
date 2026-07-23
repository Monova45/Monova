import { appConfig } from "@/config/app";

/** @deprecated Use appConfig. Kept temporarily for compatibility with the public pages. */
export const PRODUCT = {
  name: appConfig.name,
  shortName: appConfig.shortName,
  tagline: appConfig.description,
  demoWorkspace: appConfig.demoWorkspaceName,
  supportEmail: appConfig.supportEmail,
} as const;

export const PUBLIC_ROUTES = ["funciones", "precios", "soluciones", "agencias", "empresas", "recursos", "contacto"] as const;
