import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error("[identify] Falta la variable de entorno GEMINI_API_KEY")
    return NextResponse.json({ error: "Falta configurar la clave de IA en el servidor" }, { status: 500 })
  }

  const { image } = await req.json()
  if (!image) return NextResponse.json({ error: "No image" }, { status: 400 })

  const base64   = image.split(",")[1]
  const mimeType = image.startsWith("data:image/png") ? "image/png" : "image/jpeg"

  const prompt = `Eres un experto en botánica. Identifica la planta de esta imagen.
Da SIEMPRE tu mejor estimación aunque no estés totalmente seguro; no respondas null por falta de seguridad.
Responde SOLO con un JSON con este formato exacto, sin texto adicional:
{
  "nombre_comun": "nombre común más habitual en español (rellena siempre este campo con tu mejor estimación; usa null SOLO si en la imagen no aparece ninguna planta)",
  "especie_cientifica": "nombre científico (género y especie); usa null solo si no puedes aventurar ninguno",
  "confianza": "alta, media o baja"
}`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" },
    })

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64, mimeType } }
    ])

    const text = result.response.text().replace(/```json|```/g, "").trim()

    try {
      return NextResponse.json(JSON.parse(text))
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        try { return NextResponse.json(JSON.parse(match[0])) } catch { /* sigue al error de abajo */ }
      }
      console.error("[identify] Respuesta de IA no es JSON válido:", text)
      return NextResponse.json({ error: "Error parseando respuesta" }, { status: 500 })
    }
  } catch (e: any) {
    console.error("[identify] Error llamando a Gemini:", e?.message || e)
    return NextResponse.json({ error: e?.message || "Error al contactar el servicio de IA" }, { status: 500 })
  }
}
