"use client"

import { useEffect, useState } from "react"
import { Calendar, CheckCircle2, Circle, Trash2, Plus, X } from "lucide-react"
import { getTasks, addTask, toggleTask, deleteTask, getPlants, scheduleNextWatering } from "@/lib/db"
import type { Task, Plant } from "@/lib/supabase"

const taskColors: Record<string, string> = {
  Riego:    "bg-blue-100 text-blue-700",
  Abono:    "bg-green-100 text-green-700",
  Poda:     "bg-orange-100 text-orange-700",
  Revisión: "bg-purple-100 text-purple-700",
}

export function CalendarScreen() {
  const [tasks, setTasks]     = useState<Task[]>([])
  const [plants, setPlants]   = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState({
    plant_id: "", plant_name: "", type: "Riego" as Task["type"],
    scheduled_date: new Date().toISOString().split("T")[0], time: "09:00",
  })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [t, p] = await Promise.all([getTasks(), getPlants()])
      setTasks(t); setPlants(p)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  async function handleToggle(id: string, completed: boolean) {
    try {
      await toggleTask(id, !completed)
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t))
      const task = tasks.find(t => t.id === id)
      if (!completed && task?.type === "Riego" && task.plant_id) {
        const plant = plants.find(p => p.id === task.plant_id)
        if (plant) {
          const nextTask = await scheduleNextWatering(plant)
          if (nextTask) setTasks(prev => [...prev, nextTask])
        }
      }
    } catch { /* silent */ }
  }

  async function handleDelete(id: string) {
    try { await deleteTask(id); setTasks(prev => prev.filter(t => t.id !== id)) }
    catch { /* silent */ }
  }

  async function handleSave() {
    if (!form.plant_name || !form.scheduled_date) return
    setSaving(true)
    try {
      const t = await addTask({ ...form, completed: false })
      setTasks(prev => [...prev, t].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)))
      setModal(false)
    } catch { /* silent */ }
    finally { setSaving(false) }
  }

  const grouped = tasks.reduce<Record<string, Task[]>>((acc, t) => {
    const key = t.scheduled_date
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  function formatDate(d: string) {
    const date = new Date(d + "T00:00:00")
    const today = new Date(); today.setHours(0,0,0,0)
    const diff = Math.floor((date.getTime() - today.getTime()) / 86400000)
    if (diff === 0) return "Hoy"
    if (diff === 1) return "Mañana"
    if (diff === -1) return "Ayer"
    return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
  }

  return (
    <div className="flex flex-col gap-6 px-5 pb-24 pt-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Tareas programadas</p>
          <h1 className="text-2xl font-semibold">Calendario</h1>
        </div>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition active:scale-95">
          <Plus className="size-4" /> Tarea
        </button>
      </header>

      {loading ? (
        Array.from({length:4}).map((_,i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center">
          <Calendar className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No hay tareas programadas.</p>
          <button onClick={() => setModal(true)} className="mt-3 text-sm font-medium text-primary underline">Añadir primera tarea</button>
        </div>
      ) : (
        Object.entries(grouped).sort(([a],[b]) => a.localeCompare(b)).map(([date, dayTasks]) => (
          <section key={date} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold capitalize text-muted-foreground">{formatDate(date)}</h2>
            {dayTasks.map(task => (
              <div key={task.id} className={`flex items-center gap-3 rounded-2xl border p-4 transition ${
                task.completed ? "opacity-50 border-border bg-card" :
                date === new Date().toISOString().split("T")[0] ? "border-primary/40 bg-primary/5" :
                "border-border bg-card"
              }`}>
                <button onClick={() => handleToggle(task.id, task.completed)} className="shrink-0 transition active:scale-95">
                  {task.completed
                    ? <CheckCircle2 className="size-6 text-primary" />
                    : <Circle className="size-6 text-muted-foreground" />}
                </button>
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${taskColors[task.type]}`}>{task.type}</span>
                    <span className="text-xs text-muted-foreground">{task.time}</span>
                  </div>
                  <p className={`text-sm font-medium ${task.completed ? "line-through" : ""}`}>{task.plant_name}</p>
                </div>
                <button onClick={() => handleDelete(task.id)} className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted active:scale-95">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </section>
        ))
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:px-4">
          <div className="w-full rounded-t-3xl bg-background p-6 shadow-xl sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nueva tarea</h2>
              <button onClick={() => setModal(false)} className="rounded-full p-1.5 hover:bg-muted"><X className="size-5" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Planta *</label>
                {plants.length > 0 ? (
                  <select value={form.plant_id}
                    onChange={e => {
                      const p = plants.find(x => x.id === e.target.value)
                      setForm(f => ({...f, plant_id: e.target.value, plant_name: p?.name ?? ""}))
                    }}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
                    <option value="">-- Selecciona planta --</option>
                    {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                ) : (
                  <input
                    value={form.plant_name}
                    onChange={e => setForm(f => ({...f, plant_id: "", plant_name: e.target.value}))}
                    placeholder="Ej: Monstera"
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Tipo</label>
                  <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as Task["type"]}))}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
                    <option>Riego</option><option>Abono</option><option>Poda</option><option>Revisión</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Hora</label>
                  <input type="time" value={form.time} onChange={e => setForm(f => ({...f, time: e.target.value}))}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Fecha *</label>
                <input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({...f, scheduled_date: e.target.value}))}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving || !form.plant_name}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow transition active:scale-95 disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar tarea"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
