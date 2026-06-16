import { supabase } from "./supabase"

// Convierte la clave pública VAPID (base64 url-safe) al formato que pide el navegador.
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

// true si estamos en un iPhone/iPad con Safari y la app NO está añadida a la pantalla de inicio.
// En ese caso iOS no permite usar notificaciones push (es una limitación de Apple, no de la app).
export function isIosNotInstalled(): boolean {
  if (typeof window === "undefined") return false
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true
  return isIos && !isStandalone
}

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return null
  return reg.pushManager.getSubscription()
}

// Pide permiso y suscribe este dispositivo a los avisos push, guardando la suscripción en Supabase.
export async function subscribeToPush(): Promise<void> {
  if (isIosNotInstalled()) {
    throw new Error("En iPhone, primero añade Mi Jardín a la pantalla de inicio (botón Compartir → Añadir a pantalla de inicio) para poder activar los avisos.")
  }
  if (!pushSupported()) {
    throw new Error("Este navegador no soporta notificaciones push.")
  }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) throw new Error("Falta configurar las notificaciones push en el servidor.")

  const reg = await navigator.serviceWorker.register("/sw.js")
  const permission = await Notification.requestPermission()
  if (permission !== "granted") throw new Error("Has bloqueado el permiso de notificaciones.")

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const json = sub.toJSON()
  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint: json.endpoint!,
    p256dh: json.keys!.p256dh,
    auth: json.keys!.auth,
  }, { onConflict: "endpoint" })
  if (error) throw error
}
