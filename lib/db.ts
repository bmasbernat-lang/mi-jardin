import { supabase, Plant, Task } from "./supabase"

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
