# Integraciones

| Proveedor | Uso | Variables | Estado |
|---|---|---|---|
| OpenAI | Chat y diagnóstico visual heredados | `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL` | Existente; pendiente de adapter |
| Supabase | Auth, PostgreSQL, Storage, Realtime | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | No conectado |
| Meta | Instagram, Facebook, Ads | `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN` | No conectado |
| WhatsApp Cloud API | Inbox y plantillas | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | No conectado |
| Resend | Email transaccional y campañas | `RESEND_API_KEY` | No conectado |
| Stripe | Suscripciones y consumo | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | No conectado |
| Magnific | Upscale y mejora | Por definir según acceso oficial | Adapter pendiente |

Los secretos son exclusivamente de servidor. Los webhooks futuros deben verificar firma, registrar idempotencia y almacenar el evento antes de procesarlo. No existe hoy ninguna conexión real con Meta, WhatsApp, Resend, Stripe, Supabase o Magnific.
