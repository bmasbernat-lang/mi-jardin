"use client"

import { useEffect, useState } from "react"
import { CheckCircle, AlertTriangle, XCircle, Leaf, LinkIcon, History, Trash2 } from "lucide-react"
import { getPlants, updatePlant, addDiagnosis, updateDiagnosis, getDiagnoses, deleteDiagnosis } from "@/lib/db"
import type { Plant, Diagnosis } from "@/lib/supabase"

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

function formatRelative(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (diff <= 0) return "Hoy"
  if (diff === 1) return "Ayer"
  return `Hace ${diff} días`
}

export function DiagnosisScreen({ data }: { data: { image: string; result: string } | null }) {
  const [plants, setPlants]         = useState<Plant[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [linking, setLinking]       = useState(false)
  const [linked, setLinked]         = useState(false)
  const [savedId, setSavedId]       = useState<string | null>(null)
  const [history, setHistory]       = useState<Diagnosis[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    getPlants().then(setPlants).catch(() => {})
    setLinked(false)
    setSelectedId("")
    setSavedId(null)

    let result: DiagResult | null = null
    if (data) {
      try { result = JSON.parse(data.result) } catch {}
    }

    async function persistAndRefresh() {
      try {
        if (data && result) {
          const saved = await addDiagnosis({
            plant_id: null,
            plant_name: null,
            image_url: data.image,
            estado: result.estado,
            diagnostico: result.diagnostico,
            descripcion: result.descripcion,
            tratamiento: result.tratamiento,
          })
          setSavedId(saved.id)
        }
      } catch { /* silent */ }
      try { setHistory(await getDiagnoses()) }
      catch { /* silent */ }
      finally { setHistoryLoading(false) }
    }
    persistAndRefresh()
  }, [data])

  let result: DiagResult | null = null
  if (data) { try { result = JSON.parse(data.result) } catch {} }

  async function handleLink() {
    if (!selectedId || !result) return
    setLinking(true)
    try {
      await updatePlant(selectedId, { health: result.estado })
      const plant = plants.find(p => p.id === selectedId)
      if (savedId) {
        const updated = await updateDiagnosis(savedId, { plant_id: selectedId, plant_name: plant?.name ?? null })
        setHistory(prev => prev.map(h => h.id === updated.id ? updated : h))
      }
      setLinked(true)
    } catch {}
    finally { setLinking(false) }
  }

  async function handleDeleteHistory(id: string) {
    try {
      await deleteDiagnosis(id)
      setHistory(prev => prev.filter(h => h.id !== id))
    } catch {}
  }

  const historySection = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <History className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Historial de diagnósticos</p>
      </div>
      {historyLoading ? (
        Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)
      ) : history.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Aún no hay diagnósticos guardados.
        </p>
      ) : (
        history.map(h => {
          const cfg = estadoConfig[h.estado] ?? estadoConfig["Atención"]
          const Icon = cfg.icon
          return (
            <div key={h.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <img src={h.image_url} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <Icon className={`size-3.5 ${cfg.color}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{h.estado}</span>
                </div>
                <p className="truncate text-sm font-medium">{h.diagnostico}</p>
                <p className="text-xs text-muted-foreground">
                  {h.plant_name ? h.plant_name : "Sin vincular"} · {formatRelative(h.created_at)}
                </p>
              </div>
              <button onClick={() => handleDeleteHistory(h.id)}
                className="shrink-0 rounded-xl p-1.5 text-muted-foreground hover:bg-muted active:scale-95">
                <Trash2 className="size-4" />
              </button>
            </div>
          )
        })
      )}
    </div>
  )

  if (!data || !result) {
    return (
      <div className="flex flex-col gap-6 px-5 pb-24 pt-8">
        {!data ? (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10">
              <Leaf className="size-8 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Sin diagnóstico nuevo</p>
              <p className="mt-1 text-sm text-muted-foreground">Ve al escáner y sube una foto de tu planta</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-600">Error procesando el diagnóstico.</p>
        )}
        {historySection}
      </div>
    )
  }

  const cfg = estadoConfig[result.estado] ?? estadoConfig["Atención"]
  const Icon = cfg.icon

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

      {historySection}
    </div>
  )
}
