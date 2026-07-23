# Base de datos

PostgreSQL mediante Supabase está conectado a través del Shared Pooler. La cadena permanece únicamente en `.env.local`.

La migración `0001_marketing_os_core.sql` creó perfiles, workspaces, miembros, marcas, generaciones y jobs. `0002_secure_core_rls.sql` habilitó RLS en las seis tablas y sustituyó las políticas recursivas por la función segura `is_workspace_member`. `0003_demo_workspace.sql` creó de forma reproducible el workspace demo usado por los jobs locales.

## Reglas

- UUID como clave primaria.
- `workspace_id` obligatorio en recursos de negocio.
- timestamps con zona horaria.
- índices por workspace, estado y fecha.
- membresía validada en políticas RLS y nuevamente en servicios sensibles.
- datos demo con `is_demo = true`.

## Pendiente

Agregar migraciones separadas para contenido, storage, analytics, ads, CRM, conversaciones, automatizaciones, billing y auditoría. Auth, Storage y el cliente Supabase requieren todavía URL y claves API.
