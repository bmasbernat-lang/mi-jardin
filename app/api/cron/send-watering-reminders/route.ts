import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import webpush from "web-push"

// Este endpoint lo llama un cron de Vercel (ver vercel.json) una vez al día.
// Busca las tareas de "Riego" de hoy (o atrasadas) que aún no se han completado,
// y manda una notificación push a cada usuario que tenga el dispositivo suscrito.

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get("authorization")
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  const vapidPublic  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT

  if (!supabaseUrl || !serviceKey) {
    console.error("[cron] Faltan variables de Supabase (service role)")
    return NextResponse.json({ error: "Falta configurar el servidor" }, { status: 500 })
  }
  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    console.error("[cron] Faltan variables VAPID")
    return NextResponse.json({ error: "Falta configurar las notificaciones push" }, { status: 500 })
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const todayStr = new Date().toISOString().slice(0, 10)

  const { data: tasks, error: tasksError } = await admin
    .from("tasks")
    .select("id, user_id, plant_name, scheduled_date")
    .eq("type", "Riego")
    .eq("completed", false)
    .lte("scheduled_date", todayStr)

  if (tasksError) {
    console.error("[cron] Error leyendo tareas:", tasksError.message)
    return NextResponse.json({ error: tasksError.message }, { status: 500 })
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ sent: 0, message: "No hay riegos pendientes" })
  }

  // Agrupar tareas por usuario para enviar un solo aviso con el resumen.
  const byUser = new Map<string, string[]>()
  for (const t of tasks) {
    const list = byUser.get(t.user_id) ?? []
    list.push(t.plant_name)
    byUser.set(t.user_id, list)
  }

  let sent = 0
  let pruned = 0

  for (const [userId, plantNames] of byUser) {
    const { data: subs, error: subsError } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId)

    if (subsError || !subs || subs.length === 0) continue

    const body = plantNames.length === 1
      ? `${plantNames[0]} necesita agua hoy 💧`
      : `${plantNames.length} plantas necesitan agua hoy: ${plantNames.join(", ")}`

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ title: "Mi Jardín · Riego pendiente", body, url: "/" })
        )
        sent++
      } catch (e: any) {
        const status = e?.statusCode
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id)
          pruned++
        } else {
          console.error("[cron] Error enviando notificación:", e?.message || e)
        }
      }
    }
  }

  return NextResponse.json({ sent, pruned, users: byUser.size })
}
