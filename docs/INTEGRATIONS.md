# Integraciones

| Proveedor | Uso | Estado |
|---|---|---|
| OpenAI | Chat y diagnóstico heredados | CONNECTED |
| Supabase PostgreSQL | Base de datos mediante Shared Pooler | CONNECTED |
| Supabase Auth/Storage/Realtime | Sesiones, archivos y tiempo real | BLOCKED_BY_CREDENTIALS |
| Meta | OAuth, redes, Ads e Insights | BLOCKED_BY_CREDENTIALS |
| WhatsApp Cloud API | Inbox y mensajes | BLOCKED_BY_CREDENTIALS |
| Freepik / Magnific | Enhancement y Upscaler | CONNECTED; adapter pendiente |
| Resend | Email | BLOCKED_BY_CREDENTIALS |
| Stripe/Wompi | Billing | PENDING |

Las variables están enumeradas en `.env.example`. Ninguna UI debe mostrar “conectado” sin una validación real del servidor.
