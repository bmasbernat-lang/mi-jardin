"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Search, Droplets, Sun, Leaf, Plus, Trash2, Pencil, X, Check, Camera, LogOut, Info, CheckCircle2, AlertTriangle, XCircle, CalendarClock, Loader2 } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import { getPlants, addPlant, updatePlant, deletePlant, waterPlant, uploadPlantPhoto, getTasks, scheduleNextWatering } from "@/lib/db"
import type { Plant, Task } from "@/lib/supabase"
import { speciesCatalog, findSpecies } from "@/lib/garden-data"

const healthStyles: Record<string, string> = {
  Saludable: "bg-emerald-100 text-emerald-700",
  "Atención": "bg-amber-100 text-amber-700",
  Enferma:   "bg-red-100 text-red-700",
}

const emptyForm = {
  name: "", species: "", light: "Luz indirecta",
  health: "Saludable" as Plant["health"], notes: "",
  image_url: "/placeholder.svg",
  last_watered: new Date().toISOString(),
}

export function HomeScreen({ user, onSignOut }: { user: User | null; onSignOut: () => void }) {
  const [plants, setPlants]   = useState<Plant[]>([])
  const [tasks, setTasks]     = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery]     = useState("")
  const [modal, setModal]     = useState<"add" | "edit" | null>(null)
  const [editing, setEditing] = useState<Plant | null>(null)
  const [form, setForm]       = useState(emptyForm)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState("")
  const [careModal, setCareModal] = useState<Plant | null>(null)
  const photoInputRef         = useRef<HTMLInputElement>(null)
  const nameInputRef          = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile]       = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [identifying, setIdentifying]   = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const [p, t] = await Promise.all([getPlants(), getTasks()])
      setPlants(p); setTasks(t)
    }
    catch { setError("Error cargando plantas") }
    finally { setLoading(false) }
  }

  function openAdd(initial?: Partial<typeof emptyForm>) {
    setForm({ ...emptyForm, ...initial }); setEditing(null)
    setPhotoFile(null); setPhotoPreview(null)
    setError("")
    setModal("add")
  }

  function openEdit(p: Plant) {
    setForm({ name: p.name, species: p.species ?? "", light: p.light ?? "Luz indirecta",
      health: p.health, notes: p.notes ?? "", image_url: p.image_url ?? "/placeholder.svg",
      last_watered: p.last_watered })
    setEditing(p)
    setPhotoFile(null); setPhotoPreview(p.image_url || null)
    setError("")
    setModal("edit")
  }

  function handlePhotoFile(file: File) {
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPhotoPreview(dataUrl)
      identifyPlant(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  // Identifica la especie con IA a partir de la foto y rellena nombre/especie si están vacíos.
  async function identifyPlant(image: string) {
    setIdentifying(true)
    try {
      const res = await fetch("/api/identify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      })
      const data = await res.json()
      const nombre  = data?.nombre_comun || null
      const especie = data?.especie_cientifica || null
      if (nombre || especie) {
        setForm(f => ({
          ...f,
          name: f.name.trim() ? f.name : (nombre ?? f.name),
          species: f.species.trim() ? f.species : (especie ?? nombre ?? f.species),
        }))
      }
    } catch { /* identificación best-effort: si falla, el usuario rellena a mano */ }
    finally { setIdentifying(false) }
  }

  async function handleSave() {
    setError("")
    if (!form.name.trim()) {
      setError("Escribe un nombre para la planta antes de guardar")
      nameInputRef.current?.focus()
      return
    }
    setSaving(true)
    try {
      if (modal === "add") {
        let p = await addPlant(form)
        if (photoFile) {
          const url = await uploadPlantPhoto(photoFile, p.id)
          p = await updatePlant(p.id, { image_url: url })
        }
        setPlants(prev => [p, ...prev])
      } else if (editing) {
        const updates: Partial<typeof form> = { ...form }
        if (photoFile) {
          updates.image_url = await uploadPlantPhoto(photoFile, editing.id)
        }
        const p = await updatePlant(editing.id, updates)
        setPlants(prev => prev.map(x => x.id === editing.id ? p : x))
      }
      setModal(null)
    } catch (e: any) {
      setError(`Error guardando planta: ${e?.message || e?.error_description || JSON.stringify(e)}`)
    }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta planta?")) return
    try { await deletePlant(id); setPlants(prev => prev.filter(p => p.id !== id)) }
    catch { setError("Error eliminando planta") }
  }

  async function handleWater(id: string) {
    try {
      await waterPlant(id)
      setPlants(prev => prev.map(p =>
        p.id === id ? { ...p, last_watered: new Date().toISOString() } : p))
      const plant = plants.find(p => p.id === id)
      if (plant) {
        const nextTask = await scheduleNextWatering({ ...plant, last_watered: new Date().toISOString() })
        if (nextTask) setTasks(prev => [...prev, nextTask])
      }
    } catch { setError("Error actualizando riego") }
  }

  function formatWatered(iso: string) {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
    if (diff === 0) return "Hoy"; if (diff === 1) return "Ayer"
    return `Hace ${diff} días`
  }

  const filtered = query ? speciesCatalog.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.scientific.toLowerCase().includes(query.toLowerCase())) : []

  const sanas      = plants.filter(p => p.health === "Saludable").length
  const atencion   = plants.filter(p => p.health === "Atención").length
  const enfermas   = plants.filter(p => p.health === "Enferma").length
  const todayStr   = new Date().toISOString().split("T")[0]
  const tareasHoy  = tasks.filter(t => !t.completed && t.scheduled_date === todayStr).length
  const careInfo   = careModal ? findSpecies(careModal.species) : undefined

  return (
    <div className="flex flex-col gap-6 px-5 pb-24 pt-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Buen día, {user?.email?.split("@")[0] ?? "jardinero"}
          </p>
          <h1 className="text-2xl font-semibold">Mi jardín</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onSignOut}
            className="flex items-center justify-center rounded-2xl border border-border bg-card p-2.5 text-muted-foreground transition hover:text-destructive active:scale-95">
            <LogOut className="size-4" />
          </button>
          <button onClick={() => openAdd()}
            className="flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition active:scale-95">
            <Plus className="size-4" /> Añadir
          </button>
        </div>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar especies..."
          className="w-full rounded-2xl border border-border bg-card py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error} <button onClick={() => setError("")} className="ml-2 underline">Cerrar</button>
        </div>
      )}

      {!loading && !query && plants.length > 0 && (
        <section className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-3">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span className="text-sm font-semibold">{sanas}</span>
            <span className="text-[10px] text-muted-foreground">Sanas</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-3">
            <AlertTriangle className="size-4 text-amber-600" />
            <span className="text-sm font-semibold">{atencion}</span>
            <span className="text-[10px] text-muted-foreground">Atención</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-3">
            <XCircle className="size-4 text-red-600" />
            <span className="text-sm font-semibold">{enfermas}</span>
            <span className="text-[10px] text-muted-foreground">Enfermas</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card py-3">
            <CalendarClock className="size-4 text-primary" />
            <span className="text-sm font-semibold">{tareasHoy}</span>
            <span className="text-[10px] text-muted-foreground">Hoy</span>
          </div>
        </section>
      )}

      {query ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</h2>
          {filtered.map(s => (
            <div key={s.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-accent"><Leaf className="size-5 text-primary" /></div>
                <div><p className="text-sm font-medium">{s.name}</p><p className="text-xs italic text-muted-foreground">{s.scientific}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-medium">{s.difficulty}</p>
                  <p className="text-xs text-muted-foreground">Riego {s.water.toLowerCase()}</p>
                </div>
                <button
                  onClick={() => { openAdd({ name: s.name, species: s.scientific }); setQuery("") }}
                  className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground transition active:scale-95">
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No encontramos esa especie.</p>}
        </section>
      ) : (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mis Plantas</h2>
            <span className="text-sm text-muted-foreground">{loading ? "Cargando..." : `${plants.length} plantas`}</span>
          </div>
          {loading ? Array.from({length:3}).map((_,i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-muted" />) :
           plants.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <Leaf className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No tienes plantas aún.</p>
              <button onClick={() => openAdd()} className="mt-3 text-sm font-medium text-primary underline">Añadir la primera</button>
            </div>
          ) : plants.map(plant => (
            <article key={plant.id} className="flex items-center gap-4 rounded-3xl border border-border bg-card p-3 shadow-sm">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-accent">
                <Image src={plant.image_url || "/placeholder.svg"} alt={plant.name} fill sizes="80px" className="object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-base font-semibold">{plant.name}</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${healthStyles[plant.health]}`}>{plant.health}</span>
                </div>
                <p className="truncate text-xs italic text-muted-foreground">{plant.species}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Droplets className="size-3.5 text-primary" />{formatWatered(plant.last_watered)}</span>
                  <span className="flex items-center gap-1"><Sun className="size-3.5 text-amber-500" />{plant.light}</span>
                </div>
                <div className="mt-1 flex gap-2">
                  <button onClick={() => handleWater(plant.id)}
                    className="flex items-center gap-1 rounded-xl bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary active:scale-95">
                    <Droplets className="size-3" /> Regar
                  </button>
                  <button onClick={() => openEdit(plant)}
                    className="flex items-center gap-1 rounded-xl bg-muted px-2.5 py-1 text-xs font-medium active:scale-95">
                    <Pencil className="size-3" /> Editar
                  </button>
                  <button onClick={() => setCareModal(plant)}
                    className="flex items-center gap-1 rounded-xl bg-muted px-2.5 py-1 text-xs font-medium active:scale-95">
                    <Info className="size-3" />
                  </button>
                  <button onClick={() => handleDelete(plant.id)}
                    className="flex items-center gap-1 rounded-xl bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 active:scale-95">
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:px-4">
          <div className="flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-background shadow-xl sm:rounded-3xl">
          <div className="overflow-y-auto p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{modal === "add" ? "Nueva planta" : "Editar planta"}</h2>
              <button onClick={() => setModal(null)} className="rounded-full p-1.5 hover:bg-muted"><X className="size-5" /></button>
            </div>
            {error && (
              <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            <div className="flex flex-col gap-3">
              {/* Foto */}
              <div>
                <label className="mb-1 block text-sm font-medium">Foto</label>
                {photoPreview ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted">
                    <img src={photoPreview} alt="preview" className="h-full w-full object-cover" />
                    <button onClick={() => photoInputRef.current?.click()}
                      className="absolute bottom-2 right-2 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-medium text-white active:scale-95">
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => photoInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-5 text-sm text-muted-foreground transition hover:border-primary hover:text-primary active:scale-95">
                    <Camera className="size-4" /> Añadir foto
                  </button>
                )}
                <input ref={photoInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                  onChange={e => e.target.files?.[0] && handlePhotoFile(e.target.files[0])} />
                {identifying && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" /> Identificando planta con IA...
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Nombre *</label>
                <input ref={nameInputRef} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Ej: Mi monstera"
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Especie</label>
                <input value={form.species} onChange={e => setForm(f => ({...f, species: e.target.value}))} placeholder="Ej: Monstera deliciosa"
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Estado</label>
                  <select value={form.health} onChange={e => setForm(f => ({...f, health: e.target.value as Plant["health"]}))}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
                    <option>Saludable</option><option>Atención</option><option>Enferma</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Luz</label>
                  <select value={form.light} onChange={e => setForm(f => ({...f, light: e.target.value}))}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary">
                    <option>Sol directo</option><option>Luz indirecta</option><option>Luz media</option><option>Sombra</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Notas</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} placeholder="Observaciones..."
                  className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          </div>
          <div className="border-t border-border p-4">
            <button onClick={handleSave} disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow transition active:scale-95 disabled:opacity-50">
              {saving ? "Guardando..." : <><Check className="size-4" /> Guardar</>}
            </button>
          </div>
          </div>
        </div>
      )}

      {careModal && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:px-4" onClick={() => setCareModal(null)}>
          <div className="w-full rounded-t-3xl bg-background p-6 shadow-xl sm:rounded-3xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ficha de cuidados</h2>
              <button onClick={() => setCareModal(null)} className="rounded-full p-1.5 hover:bg-muted"><X className="size-5" /></button>
            </div>
            <p className="mb-4 text-sm font-medium text-foreground">{careModal.name}{careModal.species ? ` · ${careModal.species}` : ""}</p>
            {careInfo ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-2xl bg-accent px-4 py-3">
                  <span className="text-sm text-muted-foreground">Dificultad</span>
                  <span className="text-sm font-semibold">{careInfo.difficulty}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-accent px-4 py-3">
                  <span className="text-sm text-muted-foreground">Riego recomendado</span>
                  <span className="text-sm font-semibold">{careInfo.water}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-accent px-4 py-3">
                  <span className="text-sm text-muted-foreground">Luz actual</span>
                  <span className="text-sm font-semibold">{careModal.light}</span>
                </div>
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Todavía no tenemos ficha de cuidados para esta especie.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
