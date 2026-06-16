import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error("[diagnose] Falta la variable de entorno GEMINI_API_KEY")
    return NextResponse.json({ error: "Falta configurar la clave de IA en el servidor" }, { status: 500 })
  }

  const { image } = await req.json()
  if (!image) return NextResponse.json({ error: "No image" }, { status: 400 })

  const base64   = image.split(",")[1]
  const mimeType = image.startsWith("data:image/png") ? "image/png" : "image/jpeg"

  const prompt = `Eres un experto en botánica y enfermedades de plantas.
Analiza esta imagen y responde SOLO con un JSON con este formato exacto:
{
  "estado": "Saludable" o "Atención" o "Enferma",
  "diagnostico": "nombre del problema o Planta sana",
  "descripcion": "explicación breve en 1-2 frases",
  "tratamiento": "qué hacer, en 1-2 frases"
}`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64, mimeType } }
    ])

    const text = result.response.text().replace(/```json|```/g, "").trim()

    try {
      return NextResponse.json(JSON.parse(text))
    } catch {
      console.error("[diagnose] Respuesta de IA no es JSON válido:", text)
      return NextResponse.json({ error: "Error parseando respuesta" }, { status: 500 })
    }
  } catch (e: any) {
    console.error("[diagnose] Error llamando a Gemini:", e?.message || e)
    return NextResponse.json({ error: e?.message || "Error al contactar el servicio de IA" }, { status: 500 })
  }
}
