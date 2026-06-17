# Mi Jardín — Estado del proyecto

> Documento reconstruido a partir del código (la conversación original con Sonnet 4.6 se perdió).
> Sirve para retomar el proyecto donde se dejó.

## Qué es la app

App web (PWA) para cuidar tus plantas de casa. Permite identificar plantas por foto,
diagnosticar enfermedades con IA, llevar un calendario de riegos/tareas, ver estadísticas
y recibir avisos push cuando toca regar.

## Stack técnico

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Estilos:** Tailwind CSS v4 + shadcn/ui + lucide-react (iconos)
- **Backend / datos:** Supabase (auth, base de datos Postgres y Storage)
- **IA:** Google Gemini (`gemini-flash-latest`) vía `@google/generative-ai`
- **Notificaciones:** Web Push (VAPID) + Service Worker (`public/sw.js`)
- **Despliegue:** Vercel (incluye un cron diario)
- **Gestor de paquetes:** pnpm
- **Repo:** https://github.com/bmasbernat-lang/mi-jardin (rama `main`)

## Estructura

```
app/
  page.tsx                -> renderiza <GardenApp />
  layout.tsx
  reset-password/         -> pantalla de recuperación de contraseña
  api/
    identify/             -> identifica especie por foto (Gemini)
    diagnose/             -> diagnostica salud/enfermedad por foto (Gemini)
    care-info/            -> ficha de cuidados por IA si la especie no está en el catálogo
    cron/send-watering-reminders/  -> cron diario que envía push de riego
components/
  garden-app.tsx          -> raíz: gestiona sesión y navegación entre pantallas
  auth-screen.tsx         -> login / registro / reset de contraseña
  home-screen.tsx         -> listado de plantas y detalle (584 líneas, pantalla principal)
  scanner-screen.tsx      -> cámara/foto para identificar o diagnosticar
  diagnosis-screen.tsx    -> resultado del diagnóstico
  calendar-screen.tsx     -> calendario de tareas/riegos
  stats-screen.tsx        -> estadísticas con gráficas
  bottom-nav.tsx          -> navegación inferior (home/scanner/diagnosis/calendar/stats)
  ui/                     -> componentes shadcn
lib/
  supabase.ts             -> cliente Supabase + tipos (Plant, Task, Diagnosis)
  auth.ts                 -> signUp / signIn / signOut / reset / updatePassword
  db.ts                   -> todas las consultas (plantas, tareas, diagnósticos, fotos)
  garden-data.ts          -> catálogo de especies y helpers de frecuencia de riego
  push.ts                 -> suscripción a notificaciones push
public/
  sw.js                   -> service worker
  manifest.json           -> manifiesto PWA
  plants/                 -> imágenes de ejemplo
```

## Modelo de datos (Supabase)

Tablas que el código espera (todas con `user_id` y RLS por usuario):

- **plants** — `id, user_id, name, species, image_url, health (Saludable|Atención|Enferma), last_watered, light, notes, created_at`
- **tasks** — `id, user_id, plant_id, plant_name, type (Riego|Abono|Poda|Revisión), scheduled_date, time, completed, created_at`
- **diagnoses** — `id, user_id, plant_id, plant_name, image_url, estado, diagnostico, descripcion, tratamiento, created_at`
- **push_subscriptions** — `id, user_id, endpoint, p256dh, auth` (único por `endpoint`)

Storage: bucket **`plants`** con rutas `userId/plantId/timestamp.ext` (galería de fotos por planta).

## Variables de entorno

En `.env.local` (local):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

Además, en producción (Vercel) el cron y las push necesitan (revisar que estén puestas allí):
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `CRON_SECRET` (opcional, protege el endpoint del cron)

## Funcionalidades ya implementadas

- Autenticación con email/contraseña + recuperación de contraseña (mostrar/ocultar contraseña).
- Añadir, editar y borrar plantas; marcar como regada.
- Identificación de especie por foto con IA.
- Diagnóstico de enfermedades por foto con IA + historial de diagnósticos.
- Ficha de cuidados generada por IA cuando la especie no está en el catálogo.
- Riego automático: al guardar una planta se programa la siguiente tarea de riego según la especie.
- Galería de fotos por planta (Supabase Storage).
- Modo oscuro.
- Estadísticas con gráficas.
- Notificaciones push de riego (cron diario a las 07:00).

## Historial reciente (git)

Últimos commits, de más reciente a más antiguo:
1. Forzar respuesta JSON de Gemini para evitar fichas/identificaciones fallidas
2. Añade botón para mostrar/ocultar contraseña
3. Modo oscuro, estadísticas con gráficas y notificaciones push de riego
4. Avisos de riego y galería de fotos por planta
5. Ficha de cuidados con IA cuando la especie no está en el catálogo

## Estado del repositorio

- Rama `main` al día con `origin/main` (último commit `b1678c5`).
- Sin cambios pendientes salvo `tsconfig.tsbuildinfo` (archivo generado; conviene añadirlo a `.gitignore`).

## Posibles próximos pasos / pendientes a revisar

- Confirmar que las variables VAPID y `SUPABASE_SERVICE_ROLE_KEY` están configuradas en Vercel (sin ellas, el cron de avisos no envía nada).
- Añadir `tsconfig.tsbuildinfo` al `.gitignore`.
- Decidir si el catálogo fijo de especies (`garden-data.ts`) se mantiene o se sustituye del todo por la IA.
