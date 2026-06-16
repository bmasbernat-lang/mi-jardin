"use client"

import { useEffect, useState } from "react"
import { Droplets, Stethoscope, Leaf, CalendarRange, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { getPlants, getTasks, getDiagnoses } from "@/lib/db"
import type { Plant, Task, Diagnosis } from "@/lib/supabase"

// Devuelve el lunes de la semana de una fecha, a las 00:00.
function startOfWeek(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

export function StatsScreen() {
  const [plants, setPlants] = useState<Plant[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getPlants(), getTasks(), getDiagnoses()])
      .then(([p, t, d]) => { setPlants(p); setTasks(t); setDiagnoses(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-4 px-5 pb-24 pt-8">
        <h1 className="text-2xl font-semibold">Estadísticas</h1>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-3xl bg-muted" />
        ))}
      </div>
    )
  }

  const sanas = plants.filter(p => p.health === "Saludable").length
  const atencion = plants.filter(p => p.health === "Atención").length
  const enfermas = plants.filter(p => p.health === "Enferma").length
  const totalSalud = sanas + atencion + enfermas || 1

  const riegosCompletados = tasks.filter(t => t.type === "Riego" && t.completed).length

  const diasJardin = plants.length
    ? Math.max(1, Math.floor(
        (Date.now() - new Date(plants.reduce((min, p) => (p.created_at < min ? p.created_at : min), plants[0].created_at)).getTime())
        / 86400000
      ))
    : 0

  // Riegos completados en cada una de las últimas 6 semanas.
  const weeks = Array.from({ length: 6 }).map((_, i) => {
    const start = startOfWeek(new Date())
    start.setDate(start.getDate() - (5 - i) * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    const count = tasks.filter(t => {
      if (t.type !== "Riego" || !t.completed) return false
      const d = new Date(t.scheduled_date)
      return d >= start && d < end
    }).length
    return { label: start.toLocaleDateString("es-ES", { day: "numeric", month: "short" }), count }
  })
  const maxWeek = Math.max(1, ...weeks.map(w => w.count))

  // Diagnósticos realizados en cada uno de los últimos 6 meses.
  const months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (5 - i))
    const count = diagnoses.filter(dg => {
      const dd = new Date(dg.created_at)
      return dd.getFullYear() === d.getFullYear() && dd.getMonth() === d.getMonth()
    }).length
    return { label: d.toLocaleDateString("es-ES", { month: "short" }), count }
  })
  const maxMonth = Math.max(1, ...months.map(m => m.count))

  return (
    <div className="flex flex-col gap-6 px-5 pb-24 pt-8">
      <header>
        <p className="text-sm text-muted-foreground">La evolución de tu jardín</p>
        <h1 className="text-2xl font-semibold">Estadísticas</h1>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 rounded-3xl border border-border bg-card p-4">
          <Leaf className="size-4 text-primary" />
          <span className="text-xl font-semibold">{plants.length}</span>
          <span className="text-xs text-muted-foreground">Plantas en total</span>
        </div>
        <div className="flex flex-col gap-1 rounded-3xl border border-border bg-card p-4">
          <Droplets className="size-4 text-primary" />
          <span className="text-xl font-semibold">{riegosCompletados}</span>
          <span className="text-xs text-muted-foreground">Riegos hechos</span>
        </div>
        <div className="flex flex-col gap-1 rounded-3xl border border-border bg-card p-4">
          <Stethoscope className="size-4 text-primary" />
          <span className="text-xl font-semibold">{diagnoses.length}</span>
          <span className="text-xs text-muted-foreground">Diagnósticos</span>
        </div>
        <div className="flex flex-col gap-1 rounded-3xl border border-border bg-card p-4">
          <CalendarRange className="size-4 text-primary" />
          <span className="text-xl font-semibold">{diasJardin}</span>
          <span className="text-xs text-muted-foreground">Días cuidando tu jardín</span>
        </div>
      </section>

      {plants.length > 0 && (
        <section className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Estado actual de tus plantas</h2>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(sanas / totalSalud) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-xs text-muted-foreground">{sanas}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-amber-600" />
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${(atencion / totalSalud) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-xs text-muted-foreground">{atencion}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="size-4 shrink-0 text-red-600" />
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-red-500" style={{ width: `${(enfermas / totalSalud) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-xs text-muted-foreground">{enfermas}</span>
            </div>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Riegos por semana</h2>
        <div className="flex items-end justify-between gap-2" style={{ height: 96 }}>
          {weeks.map((w, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">{w.count}</span>
              <div className="w-full rounded-t-md bg-primary" style={{ height: `${(w.count / maxWeek) * 64 + 4}px` }} />
              <span className="text-[10px] text-muted-foreground">{w.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Diagnósticos por mes</h2>
        <div className="flex items-end justify-between gap-2" style={{ height: 96 }}>
          {months.map((m, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">{m.count}</span>
              <div className="w-full rounded-t-md bg-primary/70" style={{ height: `${(m.count / maxMonth) * 64 + 4}px` }} />
              <span className="text-[10px] text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {plants.length === 0 && (
        <p className="rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Añade plantas y riégalas para empezar a ver tus estadísticas.
        </p>
      )}
    </div>
  )
}
