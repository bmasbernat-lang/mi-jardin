"use client"

import { useState } from "react"
import { Leaf, Eye, EyeOff } from "lucide-react"
import { signIn, signUp, resetPassword } from "@/lib/auth"

export function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode]       = useState<"login" | "signup" | "forgot">("login")
  const [email, setEmail]     = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [sent, setSent]       = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handle() {
    if (mode === "forgot") {
      if (!email) return
      setLoading(true); setError("")
      try { await resetPassword(email); setSent(true) }
      catch (e: any) { setError(e.message) }
      finally { setLoading(false) }
      return
    }
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

  function switchMode(m: "login" | "signup" | "forgot") {
    setMode(m); setError(""); setSent(false)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10">
          <Leaf className="size-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Mi Jardín</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "login" ? "Inicia sesión para continuar" :
           mode === "signup" ? "Crea tu cuenta gratuita" :
           "Recupera tu contraseña"}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {mode === "forgot" && sent ? (
          <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Te hemos enviado un enlace a {email} para restablecer tu contraseña. Revisa también la carpeta de spam.
          </div>
        ) : (
          <>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {mode !== "forgot" && (
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Contraseña" onKeyDown={e => e.key === "Enter" && handle()}
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
            )}
            {mode === "login" && (
              <p className="text-right text-sm">
                <button onClick={() => switchMode("forgot")} className="text-muted-foreground underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </p>
            )}
            <button onClick={handle} disabled={loading || !email || (mode !== "forgot" && !password)}
              className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow transition active:scale-95 disabled:opacity-50">
              {loading ? "Cargando..." :
               mode === "login" ? "Entrar" :
               mode === "signup" ? "Crear cuenta" :
               "Enviar enlace"}
            </button>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" && (
            <>
              ¿No tienes cuenta?{" "}
              <button onClick={() => switchMode("signup")} className="font-medium text-primary underline">Regístrate</button>
            </>
          )}
          {mode === "signup" && (
            <>
              ¿Ya tienes cuenta?{" "}
              <button onClick={() => switchMode("login")} className="font-medium text-primary underline">Inicia sesión</button>
            </>
          )}
          {mode === "forgot" && (
            <button onClick={() => switchMode("login")} className="font-medium text-primary underline">Volver a inicio de sesión</button>
          )}
        </p>
      </div>
    </div>
  )
}
