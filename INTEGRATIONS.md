# Integraciones

| Proveedor | Uso | Variables | Estado |
|---|---|---|---|
| OpenAI | Chat y diagnóstico visual heredados | `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL` | Existente; pendiente de adapter |
| Supabase | Auth, PostgreSQL, Storage, Realtime | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | No conectado |
| Meta | Instagram, Facebook, Ads | `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN` | No conectado |
| WhatsApp Cloud API | Validación, envío y webhook firmado | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `META_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | Implementado; requiere credenciales |
| Resend | Email transaccional y campañas | `RESEND_API_KEY` | No conectado |
| Stripe | Suscripciones y consumo | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | No conectado |
| Magnific | Upscale y mejora | Por definir según acceso oficial | Adapter pendiente |

Los secretos son exclusivamente de servidor. El webhook de WhatsApp valida la firma de Meta y responde rápidamente; la persistencia e idempotencia de conversaciones se activarán al conectar Supabase y Auth. No se presenta una conexión como activa hasta que Meta valida realmente el token y el número.
