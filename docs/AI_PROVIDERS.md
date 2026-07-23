# Proveedores de IA

`lib/ai/provider.ts` define el contrato inicial. OpenAI opera mediante `/api/chat`. Magnific Creative Upscaler está implementado en `lib/ai/magnific-provider.ts` con creación y consulta asíncrona de jobs.

Magnific utiliza `https://api.magnific.com/v1/ai/image-upscaler` y el encabezado `x-magnific-api-key`. Los jobs locales se persisten en PostgreSQL y se consultan mediante `/api/jobs/[id]`. Hasta conectar Supabase Storage, los archivos de entrada se transmiten temporalmente como Base64 con límite de 5 MB.

Cada adapter deberá implementar:

- timeout y cancelación;
- errores normalizados;
- request ID del proveedor;
- coste estimado y consumo;
- logs sin prompt sensible ni secretos;
- retry limitado para errores recuperables.

Los endpoints OpenAI existentes son funcionalidad heredada y todavía no cumplen el registry final.
