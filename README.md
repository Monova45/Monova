# Monova Marketing OS

El sistema operativo para tu marketing: una plataforma SaaS modular para creación, planificación, canales, conversaciones y analítica.

## Stack detectado

- Next.js 16.2.9 (App Router), React 19.2.7 y TypeScript 6 estricto.
- Tailwind CSS 3.4, Framer Motion y Lucide.
- Dos Route Handlers OpenAI heredados: `/api/chat` y `/api/diagnostico-visual`.
- Sin autenticación ni base de datos conectadas. La migración inicial para Supabase está en `supabase/migrations`.

## Ejecutar

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`. La demo privada está en `/app/dashboard`; no requiere credenciales reales.

## Rutas

- Públicas: `/`, `/funciones`, `/precios`, `/soluciones`, `/agencias`, `/empresas`, `/recursos`, `/contacto`.
- Acceso: `/login`, `/registro`.
- Aplicación: `/app/dashboard` y todos los módulos declarados en el sidebar.
- Experiencia anterior conservada: `/legacy`.

## Arquitectura

- `app/`: rutas públicas, privadas y API.
- `components/marketing-app.tsx`: shell y superficies demo de la primera entrega.
- `config/product.ts`: nombre, tagline y datos centrales.
- `lib/ai/provider.ts`: contrato multiproveedor.
- `supabase/migrations/`: esquema PostgreSQL y RLS inicial.
- `IMPLEMENTATION_STATUS.md`: alcance real por estado.
- `INTEGRATIONS.md`: credenciales, límites y conexión de proveedores.

## Validación

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

No se debe afirmar que una integración está conectada hasta validar sus credenciales y completar una prueba real.

La documentación técnica se encuentra en [`docs/`](docs/), comenzando por
[`docs/REPOSITORY_AUDIT.md`](docs/REPOSITORY_AUDIT.md) y
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
