import { createClient } from "@supabase/supabase-js"

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Plant = {
  id: string
  user_id: string
  name: string
  species: string
  image_url: string
  health: "Saludable" | "Atención" | "Enferma"
  last_watered: string
  light: string
  notes: string
  created_at: string
}

export type Task = {
  id: string
  user_id: string
  plant_id: string
  plant_name: string
  type: "Riego" | "Abono" | "Poda" | "Revisión"
  scheduled_date: string
  time: string
  completed: boolean
  created_at: string
}

export type Diagnosis = {
  id: string
  user_id: string
  plant_id: string | null
  plant_name: string | null
  image_url: string
  estado: "Saludable" | "Atención" | "Enferma"
  diagnostico: string
  descripcion: string
  tratamiento: string
  created_at: string
}
