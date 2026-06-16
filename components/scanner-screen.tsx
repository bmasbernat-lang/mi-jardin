"use client"

import { useRef, useState } from "react"
import { Camera, Upload, Loader2 } from "lucide-react"

export function ScannerScreen({ onResult }: { onResult: (image: string, result: string) => void }) {
  const fileRef  = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  async function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const image = e.target?.result as string
      setPreview(image)
      setLoading(true); setError("")
      try {
        const res  = await fetch("/api/diagnose", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image })
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        onResult(image, JSON.stringify(data))
      } catch (e: any) {
        setError("Error al analizar la imagen. Inténtalo de nuevo.")
      } finally { setLoading(false) }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-6 px-5 pb-24 pt-8">
      <header>
        <p className="text-sm text-muted-foreground">Detecta enfermedades</p>
        <h1 className="text-2xl font-semibold">Escáner</h1>
      </header>

      <div
        onClick={() => fileRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-border bg-card p-12 transition hover:border-primary hover:bg-primary/5">
        {preview ? (
          <img src={preview} alt="preview" className="max-h-64 rounded-2xl object-contain" />
        ) : (
          <>
            <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10">
              <Camera className="size-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Sube una foto de tu planta</p>
              <p className="mt-1 text-sm text-muted-foreground">Toca para seleccionar desde la cámara o galería</p>
            </div>
          </>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl bg-primary/10 px-4 py-4">
          <Loader2 className="size-5 animate-spin text-primary" />
          <p className="text-sm font-medium text-primary">Analizando con IA...</p>
        </div>
      )}

      {preview && !loading && (
        <button onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-medium transition active:scale-95">
          <Upload className="size-4" /> Cambiar foto
        </button>
      )}
    </div>
  )
}
