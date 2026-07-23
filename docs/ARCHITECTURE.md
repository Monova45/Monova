# Arquitectura

Monova Marketing OS usa una arquitectura modular por capas:

```txt
app → features/components → server/services → repositories → providers/storage
                                  ↓
                              permissions
```

## Reglas

- Los componentes no llaman directamente a proveedores externos.
- Los servicios coordinan casos de uso y reciben repositories por contrato.
- Todo recurso de negocio tendrá `workspace_id`.
- El servidor verifica sesión, membresía y permiso; nunca confía en un workspace enviado sin validación.
- Los datos demo viven en repositories identificados con `isDemo`.
- Los SDK se inicializarán de forma lazy dentro de getters para mantener el build seguro.

## Estado actual

Dashboard usa `DashboardSummary`, `DashboardRepository`, `DemoDashboardRepository` y `getDashboardSummary`. Navegación, permisos, planes y formatos ya son configuración central. El shell permanece como componente cliente por su navegación interactiva; los datos deben migrarse a Server Components cuando Supabase esté conectado.

## Arquitectura objetivo

Las carpetas existentes en la raíz se migrarán progresivamente a `src/` solo cuando el movimiento no mezcle una reescritura masiva con la implementación de Auth. Hasta entonces se conserva el alias `@/*` y la separación por `config`, `features`, `server`, `lib` y `types`.
