import { supabase, Plant, Task, Diagnosis } from "./supabase"
import { findSpecies, waterFrequencyDays } from "./garden-data"

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")
  return user.id
}

// ─── PLANTS ────────────────────────────────────────────────

export async function getPlants(): Promise<Plant[]> {
  const uid = await getUserId()
  const { data, error } = await supabase
    .from("plants").select("*").eq("user_id", uid)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addPlant(plant: Omit<Plant, "id" | "created_at" | "user_id">): Promise<Plant> {
  const uid = await getUserId()
  const { data, error } = await supabase
    .from("plants").insert({ ...plant, user_id: uid }).select().single()
  if (error) throw error
  return data
}

export async function updatePlant(id: string, updates: Partial<Plant>): Promise<Plant> {
  const { data, error } = await supabase
    .from("plants").update(updates).eq("id", id).select().single()
  if (error) throw error
  return data
}

export async function deletePlant(id: string): Promise<void> {
  const { error } = await supabase.from("plants").delete().eq("id", id)
  if (error) throw error
}

export async function waterPlant(id: string): Promise<void> {
  const { error } = await supabase
    .from("plants").update({ last_watered: new Date().toISOString() }).eq("id", id)
  if (error) throw error
}

// ─── TASKS ─────────────────────────────────────────────────

export async function getTasks(): Promise<Task[]> {
  const uid = await getUserId()
  const { data, error } = await supabase
    .from("tasks").select("*").eq("user_id", uid)
    .order("scheduled_date", { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addTask(task: Omit<Task, "id" | "created_at" | "user_id">): Promise<Task> {
  const uid = await getUserId()
  const { data, error } = await supabase
    .from("tasks").insert({ ...task, user_id: uid }).select().single()
  if (error) throw error
  return data
}

export async function toggleTask(id: string, completed: boolean): Promise<void> {
  const { error } = await supabase.from("tasks").update({ completed }).eq("id", id)
  if (error) throw error
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id)
  if (error) throw error
}

// Crea automáticamente la siguiente tarea de riego según la especie de la planta.
// Devuelve null si ya existe una tarea de riego programada ese mismo día para esa planta.
export async function scheduleNextWatering(plant: Plant): Promise<Task | null> {
  const species = findSpecies(plant.species)
  const days = waterFrequencyDays(species?.water)
  const next = new Date()
  next.setDate(next.getDate() + days)
  const scheduled_date = next.toISOString().split("T")[0]

  const uid = await getUserId()
  const { data: existing, error: checkError } = await supabase
    .from("tasks").select("id").eq("user_id", uid).eq("plant_id", plant.id)
    .eq("type", "Riego").eq("scheduled_date", scheduled_date).limit(1)
  if (checkError) throw checkError
  if (existing && existing.length > 0) return null

  return addTask({
    plant_id: plant.id,
    plant_name: plant.name,
    type: "Riego",
    scheduled_date,
    time: "09:00",
    completed: false,
  })
}

// ─── DIAGNOSES (historial del escáner) ──────────────────────

export async function getDiagnoses(plantId?: string): Promise<Diagnosis[]> {
  const uid = await getUserId()
  let q = supabase.from("diagnoses").select("*").eq("user_id", uid)
    .order("created_at", { ascending: false })
  if (plantId) q = q.eq("plant_id", plantId)
  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function addDiagnosis(d: Omit<Diagnosis, "id" | "created_at" | "user_id">): Promise<Diagnosis> {
  const uid = await getUserId()
  const { data, error } = await supabase
    .from("diagnoses").insert({ ...d, user_id: uid }).select().single()
  if (error) throw error
  return data
}

export async function updateDiagnosis(id: string, updates: Partial<Diagnosis>): Promise<Diagnosis> {
  const { data, error } = await supabase
    .from("diagnoses").update(updates).eq("id", id).select().single()
  if (error) throw error
  return data
}

export async function deleteDiagnosis(id: string): Promise<void> {
  const { error } = await supabase.from("diagnoses").delete().eq("id", id)
  if (error) throw error
}

// ─── STORAGE (fotos) ───────────────────────────────────────

export async function uploadPlantPhoto(file: File, plantId: string): Promise<string> {
  const uid = await getUserId()
  const ext  = file.name.split(".").pop()
  const path = `${uid}/${plantId}.${ext}`

  const { error } = await supabase.storage.from("plants").upload(path, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from("plants").getPublicUrl(path)
  return data.publicUrl
}
