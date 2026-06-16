"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Leaf, Eye, EyeOff } from "lucide-react"
import { updatePassword } from "@/lib/auth"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm]   = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const [done, setDone]         = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handle() {
    if (!password || password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return }
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return }
    setLoading(true); setError("")
    try {
      await updatePassword(password)
      setDone(true)
      setTimeout(() => router.replace("/"), 1500)
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10">
          <Leaf className="size-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Mi Jardín</h1>
        <p className="text-sm text-muted-foreground">Elige una nueva contraseña</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {done ? (
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Contraseña actualizada. Redirigiendo...
          </div>
        ) : (
          <>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Nueva contraseña"
                className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 pr-12 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repite la contraseña" onKeyDown={e => e.key === "Enter" && handle()}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 pr-12 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <button onClick={handle} disabled={loading || !password || !confirm}
              className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow transition active:scale-95 disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar contraseña"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
