# Seguridad

## Implementado

- Secretos únicamente leídos en Route Handlers.
- `.env.example` sin valores reales.
- RLS base en la migración inicial.
- TypeScript estricto y errores de integración explícitos.

## Bloqueos antes de producción

- Supabase Auth, middleware y sesiones seguras.
- `requireWorkspaceAccess(workspaceId, permission)`.
- rate limiting e idempotencia.
- verificación de firmas de webhooks.
- cifrado de tokens de proveedores.
- validación de inputs y uploads con Zod.
- audit logs y correlation IDs.
- CSP, headers, OAuth state y protección de redirects.

La ruta `/app` es demostrativa y no debe tratarse como protegida hasta completar Auth.
