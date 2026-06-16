"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

function mask(v: string | undefined) {
  if (!v) return "(vacío / undefined)"
  if (v.length < 20) return v
  return `${v.slice(0, 12)}...${v.slice(-8)} (longitud: ${v.length})`
}

export default function DebugResetPage() {
  const [log, setLog] = useState<string[]>([])
  const [running, setRunning] = useState(false)

  function add(line: string) {
    setLog(prev => [...prev, line])
  }

  async function runTest() {
    setRunning(true)
    setLog([])

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    add("=== ENV VARS VISTAS POR EL NAVEGADOR ===")
    add(`URL: ${url ?? "(undefined)"}`)
    add(`ANON KEY: ${mask(key)}`)
    add(`origin: ${window.location.origin}`)

    const redirectTo = `${window.location.origin}/reset-password`
    add("")
    add("=== PASO 1: fetch() directo al endpoint, sin supabase-js ===")
    add(`POST ${url}/auth/v1/recover`)
    try {
      const res = await fetch(`${url}/auth/v1/recover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: key ?? "",
          Authorization: `Bearer ${key ?? ""}`,
        },
        body: JSON.stringify({ email: "diagnostico-no-existe@example.com", redirect_to: redirectTo }),
      })
      add(`status: ${res.status} ${res.statusText}`)
      const text = await res.text()
      add(`body: ${text}`)
    } catch (e: any) {
      add(`EXCEPCIÓN en fetch directo: ${e?.name ?? ""} - ${e?.message ?? String(e)}`)
    }

    add("")
    add("=== PASO 2: supabase.auth.resetPasswordForEmail() (lo que usa la app) ===")
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        "diagnostico-no-existe@example.com",
        { redirectTo }
      )
      add(`data: ${JSON.stringify(data)}`)
      if (error) {
        add(`error.name: ${(error as any).name}`)
        add(`error.status: ${(error as any).status}`)
        add(`error.message: ${error.message}`)
        add(`error completo: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`)
      } else {
        add("Sin error devuelto (data ok).")
      }
    } catch (e: any) {
      add(`EXCEPCIÓN lanzada (catch): ${e?.name ?? ""} - ${e?.message ?? String(e)}`)
      add(`stack: ${e?.stack ?? "(sin stack)"}`)
      try {
        add(`completo: ${JSON.stringify(e, Object.getOwnPropertyNames(e))}`)
      } catch {}
    }

    setRunning(false)
  }

  return (
    <div style={{ padding: 20, fontFamily: "monospace", fontSize: 13, whiteSpace: "pre-wrap", background: "#fff", color: "#111", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>Diagnóstico recuperación de contraseña</h1>
      <button
        onClick={runTest}
        disabled={running}
        style={{ padding: "10px 16px", background: "#16a34a", color: "#fff", borderRadius: 8, border: "none", marginBottom: 16 }}
      >
        {running ? "Ejecutando..." : "Ejecutar diagnóstico"}
      </button>
      <div>{log.join("\n")}</div>
    </div>
  )
}
