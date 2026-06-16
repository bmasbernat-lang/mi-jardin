"use client"

import { useEffect, useState } from "react"
import { CheckCircle, AlertTriangle, XCircle, Leaf, LinkIcon } from "lucide-react"
import { getPlants, updatePlant } from "@/lib/db"
import type { Plant } from "@/lib/supabase"

type DiagResult = {
  estado: "Saludable" | "Atención" | "Enferma"
  diagnostico: string
  descripcion: string
  tratamiento: string
}

const estadoConfig = {
  Saludable: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  "Atención": { icon: AlertTriangle, color: "text-amber-600",  bg: "bg-amber-50",   border: "border-amber-200" },
  Enferma:   { icon: XCircle,       color: "text-red-600",    bg: "bg-red-50",     border: "border-red-200" },
}

export function DiagnosisScreen({ data }: { data: { image: string; result: string } | null }) {
  const [plants, setPlants]       = useState<Plant[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [linking, setLinking]     = useState(false)
  const [linked, setLinked]       = useState(false)

  useEffect(() => {
    getPlants().then(setPlants).catch(() => {})
    setLinked(false)
    setSelectedId("")
  }, [data])
  if (!data) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5">
      <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10">
        <Leaf className="size-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="font-medium text-foreground">Sin diagnóstico</p>
        <p className="mt-1 text-sm text-muted-foreground">Ve al escáner y sube una foto de tu planta</p>
      </div>
    </div>
  )

  let result: DiagResult | null = null
  try { result = JSON.parse(data.result) } catch {}

  if (!result) return (
    <div className="px-5 pt-8">
      <p className="text-sm text-red-600">Error procesando el diagnóstico.</p>
    </div>
  )

  const cfg = estadoConfig[result.estado] ?? estadoConfig["Atención"]
  const Icon = cfg.icon

  async function handleLink() {
    if (!selectedId) return
    setLinking(true)
    try {
      await updatePlant(selectedId, { health: result!.estado })
      setLinked(true)
    } catch {}
    finally { setLinking(false) }
  }

  return (
    <div className="flex flex-col gap-5 px-5 pb-24 pt-8">
      <header>
        <p className="text-sm text-muted-foreground">Resultado del análisis</p>
        <h1 className="text-2xl font-semibold">Diagnóstico</h1>
      </header>

      <img src={data.image} alt="planta analizada"
        className="aspect-video w-full rounded-3xl object-cover shadow-sm" />

      <div className={`rounded-3xl border p-5 ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-center gap-3 mb-3">
          <Icon className={`size-6 ${cfg.color}`} />
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{result.estado}</p>
            <p className="text-base font-semibold text-foreground">{result.diagnostico}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{result.descripcion}</p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <p className="mb-2 text-sm font-semibold text-foreground">Tratamiento recomendado</p>
        <p className="text-sm text-muted-foreground">{result.tratamiento}</p>
      </div>

      {plants.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <LinkIcon className="size-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Vincular a una planta</p>
          </div>
          {linked ? (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <CheckCircle className="size-4" /> Estado actualizado correctamente
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary">
                <option value="">-- Selecciona planta --</option>
                {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button
                onClick={handleLink}
                disabled={!selectedId || linking}
                className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition active:scale-95 disabled:opacity-50">
                {linking ? "..." : "Aplicar"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
