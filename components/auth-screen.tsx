"use client"

import { useState } from "react"
import { Leaf } from "lucide-react"
import { signIn, signUp } from "@/lib/auth"

export function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode]       = useState<"login" | "signup">("login")
  const [email, setEmail]     = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  async function handle() {
    if (!email || !password) return
    setLoading(true); setError("")
    try {
      if (mode === "login") await signIn(email, password)
      else await signUp(email, password)
      onAuth()
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
        <p className="text-sm text-muted-foreground">
          {mode === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta gratuita"}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <input
          type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Contraseña" onKeyDown={e => e.key === "Enter" && handle()}
          className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button onClick={handle} disabled={loading || !email || !password}
          className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow transition active:scale-95 disabled:opacity-50">
          {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
          {" "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError("") }}
            className="font-medium text-primary underline">
            {mode === "login" ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  )
}
