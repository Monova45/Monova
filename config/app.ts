export const appConfig = {
  name: "Monova Marketing OS",
  shortName: "Monova",
  description: "El sistema operativo para tu marketing",
  defaultLocale: "es-CO",
  defaultCurrency: "COP",
  defaultTimezone: "America/Bogota",
  demoWorkspaceName: "Universal de Cauchos",
  supportEmail: "hola@monova.co",
  fileLimits: {
    imageBytes: 15 * 1024 * 1024,
    videoBytes: 500 * 1024 * 1024,
    documentBytes: 25 * 1024 * 1024,
  },
} as const;
