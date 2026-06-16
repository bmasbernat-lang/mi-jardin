import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error("[care-info] Falta la variable de entorno GEMINI_API_KEY")
    return NextResponse.json({ error: "Falta configurar la clave de IA en el servidor" }, { status: 500 })
  }

  const { name, species } = await req.json()
  const planta = species || name
  if (!planta) return NextResponse.json({ error: "No species" }, { status: 400 })

  const prompt = `Eres un experto en botánica y cuidado de plantas de interior y exterior.
Para la planta "${planta}", responde SOLO con un JSON con este formato exacto, sin texto adicional:
{
  "dificultad": "Fácil" o "Media" o "Difícil",
  "riego": "frecuencia de riego recomendada, por ejemplo: Diario, Cada 2 días, Cada 3 días, Semanal, Quincenal o Mensual",
  "luz": "necesidad de luz recomendada, por ejemplo: Sol directo, Luz indirecta, Luz media o Sombra",
  "consejo": "un consejo breve de cuidado en 1-2 frases, en español"
}`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })

    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json|```/g, "").trim()

    try {
      return NextResponse.json(JSON.parse(text))
    } catch {
      console.error("[care-info] Respuesta de IA no es JSON válido:", text)
      return NextResponse.json({ error: "Error parseando respuesta" }, { status: 500 })
    }
  } catch (e: any) {
    console.error("[care-info] Error llamando a Gemini:", e?.message || e)
    return NextResponse.json({ error: e?.message || "Error al contactar el servicio de IA" }, { status: 500 })
  }
}
