import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function POST(req: NextRequest) {
  const { image } = await req.json()
  if (!image) return NextResponse.json({ error: "No image" }, { status: 400 })

  const base64     = image.split(",")[1]
  const mimeType   = image.startsWith("data:image/png") ? "image/png" : "image/jpeg"
  const model      = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const prompt = `Eres un experto en botánica y enfermedades de plantas.
Analiza esta imagen y responde SOLO con un JSON con este formato exacto:
{
  "estado": "Saludable" o "Atención" o "Enferma",
  "diagnostico": "nombre del problema o Planta sana",
  "descripcion": "explicación breve en 1-2 frases",
  "tratamiento": "qué hacer, en 1-2 frases"
}`

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64, mimeType } }
  ])

  const text = result.response.text().replace(/```json|```/g, "").trim()

  try {
    return NextResponse.json(JSON.parse(text))
  } catch {
    return NextResponse.json({ error: "Error parseando respuesta" }, { status: 500 })
  }
}
