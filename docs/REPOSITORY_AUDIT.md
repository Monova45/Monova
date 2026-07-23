# Auditoría del repositorio

Fecha: 23 de julio de 2026.

## Stack detectado

| Área | Estado |
|---|---|
| Framework | Next.js 16.2.9, App Router y Turbopack |
| Runtime | Node.js; Route Handlers con runtime `nodejs` |
| UI | React 19.2.7, Tailwind CSS 3.4.19, Lucide y Framer Motion |
| Lenguaje | TypeScript 6.0.3 con `strict: true` |
| Gestor | npm con `package-lock.json` |
| Base de datos | No conectada. Existe una migración inicial para PostgreSQL/Supabase |
| Autenticación | No conectada. Login y registro son superficies demo |
| Hosting | Vercel configurado como framework Next.js |
| Calidad inicial | TypeScript y build correctos; lint roto por uso de `next lint`; no había tests |

## Arquitectura encontrada

- Rutas públicas: `/`, `/:slug` para páginas comerciales y acceso, `/legacy`.
- Ruta privada demostrativa: `/app/[[...section]]`.
- APIs heredadas: `/api/chat` y `/api/diagnostico-visual`, conectadas directamente a OpenAI desde servidor.
- UI SaaS: concentrada en `components/marketing-app.tsx`.
- UI anterior: `components/office-experience.tsx`, conservada en `/legacy`.
- Configuración inicial: `config/product.ts`.
- IA: contrato inicial en `lib/ai/provider.ts`.
- Datos: no existe persistencia activa; toda la aplicación nueva opera en demo.
- Variables reales detectadas localmente: OpenAI y un token OIDC de Vercel. No se copiaron valores.

## Elementos reutilizables

- Identidad visual, iconografía y assets Monova.
- Route Handlers OpenAI existentes, pendientes de adaptarse al registry de proveedores.
- Experiencia corporativa anterior, conservada y aislada.
- Shell responsive, navegación y superficies especializadas creadas para Marketing OS.
- Migración base de workspaces, miembros, marcas, generaciones y jobs.

## Riesgos

### Críticos

- No existe autenticación ni autorización real; `/app` no está protegida.
- No hay conexión activa a Supabase ni políticas RLS verificadas en una base real.
- Los endpoints OpenAI heredados no usan el nuevo provider registry.

### Altos

- `marketing-app.tsx` sigue siendo grande y debe dividirse por feature.
- La migración cubre solo una parte del modelo exigido.
- No existen rate limiting, idempotencia, auditoría ni verificación de webhooks.
- El formulario demo de acceso no debe confundirse con autenticación.

### Medios

- Tailwind está en v3 mientras el ecosistema actual ya ofrece v4; migrarlo no es necesario para esta etapa.
- Dependencias declaradas como `latest` reducen reproducibilidad futura, aunque el lockfile fija la instalación actual.
- Los datos demo todavía se renderizan en cliente; la siguiente etapa debe obtenerlos desde Server Components.

## Errores iniciales

- `npm run lint`: fallaba porque Next.js 16 interpreta `next lint` como una ruta inexistente.
- `npm run typecheck`: no existía el script, aunque `npx tsc --noEmit` pasaba.
- `npm run test`: no existía.
- `npm run build`: correcto.

## Plan de migración

### Se conservan

- `app/api/chat/route.ts`
- `app/api/diagnostico-visual/route.ts`
- `components/office-experience.tsx`
- assets públicos y configuración Vercel.

### Se modifican progresivamente

- `components/marketing-app.tsx`: extraer AppShell, navegación y features.
- `app/globals.css`: migrar tokens a variables semánticas.
- rutas dinámicas: convertirlas en segmentos explícitos cuando Auth/Server Components estén listos.
- migraciones: ampliar por dominios y verificar RLS.

### Nuevos fundamentos

- Configuración central en `config/`.
- Tipos en `types/`.
- Repositories y servicios en `server/`.
- Datos demo aislados en `features/*/data`.
- Tests unitarios con Vitest.

### Fases

1. Fundamentos, auditoría, shell y dashboard tipado.
2. Supabase Auth, middleware, onboarding y acceso multiworkspace.
3. Brand Center, Storage y recursos.
4. Registry de IA, ledger y jobs.
5. Planner, Social, Analytics, Meta y WhatsApp.
6. CRM, automatizaciones y billing.
