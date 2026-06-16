export type Plant = {
  id: string
  name: string
  species: string
  image: string
  health: "Saludable" | "Atención" | "Enferma"
  lastWatered: string
  light: string
}

export type Species = {
  id: string
  name: string
  scientific: string
  difficulty: "Fácil" | "Media" | "Difícil"
  water: string
}

export type Task = {
  id: string
  plant: string
  type: "Riego" | "Abono" | "Poda" | "Revisión"
  time: string
}

export const myPlants: Plant[] = [
  {
    id: "monstera",
    name: "Monstera",
    species: "Monstera deliciosa",
    image: "/plants/monstera.png",
    health: "Saludable",
    lastWatered: "Hace 2 días",
    light: "Luz indirecta",
  },
  {
    id: "pothos",
    name: "Potos",
    species: "Epipremnum aureum",
    image: "/plants/pothos.png",
    health: "Atención",
    lastWatered: "Hace 5 días",
    light: "Luz media",
  },
  {
    id: "basil",
    name: "Albahaca",
    species: "Ocimum basilicum",
    image: "/plants/basil.png",
    health: "Saludable",
    lastWatered: "Ayer",
    light: "Sol directo",
  },
  {
    id: "rose",
    name: "Rosal",
    species: "Rosa chinensis",
    image: "/plants/rose.png",
    health: "Enferma",
    lastWatered: "Hace 3 días",
    light: "Sol directo",
  },
]

export const speciesCatalog: Species[] = [
  { id: "1", name: "Monstera", scientific: "Monstera deliciosa", difficulty: "Fácil", water: "Semanal" },
  { id: "2", name: "Potos", scientific: "Epipremnum aureum", difficulty: "Fácil", water: "Semanal" },
  { id: "3", name: "Albahaca", scientific: "Ocimum basilicum", difficulty: "Media", water: "Diario" },
  { id: "4", name: "Rosal", scientific: "Rosa chinensis", difficulty: "Difícil", water: "Cada 2 días" },
  { id: "5", name: "Suculenta", scientific: "Echeveria elegans", difficulty: "Fácil", water: "Quincenal" },
  { id: "6", name: "Lavanda", scientific: "Lavandula angustifolia", difficulty: "Media", water: "Semanal" },
  { id: "7", name: "Helecho", scientific: "Nephrolepis exaltata", difficulty: "Media", water: "Cada 3 días" },
  { id: "8", name: "Cactus", scientific: "Mammillaria", difficulty: "Fácil", water: "Mensual" },
]

export function findSpecies(speciesName: string | undefined | null): Species | undefined {
  if (!speciesName) return undefined
  const q = speciesName.trim().toLowerCase()
  if (!q) return undefined
  return speciesCatalog.find(s =>
    s.scientific.toLowerCase() === q || s.name.toLowerCase() === q ||
    s.scientific.toLowerCase().includes(q) || q.includes(s.scientific.toLowerCase()) ||
    s.name.toLowerCase().includes(q) || q.includes(s.name.toLowerCase())
  )
}

export function waterFrequencyDays(water: string | undefined | null): number {
  const w = (water ?? "").toLowerCase()
  if (w.includes("diario")) return 1
  if (w.includes("cada 2")) return 2
  if (w.includes("cada 3")) return 3
  if (w.includes("semanal")) return 7
  if (w.includes("quincenal")) return 14
  if (w.includes("mensual")) return 30
  return 7
}

export const dailyTasks: Task[] = [
  { id: "t1", plant: "Albahaca", type: "Riego", time: "08:00" },
  { id: "t2", plant: "Monstera", type: "Revisión", time: "09:30" },
  { id: "t3", plant: "Rosal", type: "Abono", time: "12:00" },
  { id: "t4", plant: "Potos", type: "Riego", time: "17:00" },
  { id: "t5", plant: "Lavanda", type: "Poda", time: "18:30" },
]
