"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Camera, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database } from "@/lib/database"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import type { Producto } from "@/lib/types"

/**
 * Achica la foto en el mismo telefono antes de subirla.
 *
 * Una foto de celular pesa 3-5 MB y no hace falta semejante archivo para verla
 * en una tarjeta. Se reduce al lado mas largo a 1200px y se guarda como JPEG,
 * que la deja en unos 200 KB sin que se note la diferencia.
 */
async function achicar(file: File, maxLado = 1200): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height))
  const ancho = Math.round(bitmap.width * escala)
  const alto = Math.round(bitmap.height * escala)

  const canvas = document.createElement("canvas")
  canvas.width = ancho
  canvas.height = alto
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo procesar la imagen")
  ctx.drawImage(bitmap, 0, 0, ancho, alto)

  return new Promise((resolver, rechazar) =>
    canvas.toBlob(
      (blob) => (blob ? resolver(blob) : rechazar(new Error("No se pudo procesar la imagen"))),
      "image/jpeg",
      0.85,
    ),
  )
}

export default function FotoProductoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  const [producto, setProducto] = useState<Producto | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [foto, setFoto] = useState<Blob | null>(null)
  const [pesoOriginal, setPesoOriginal] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const cargar = async () => {
      try {
        const p = await Database.getProductoById(Number(params.id))
        if (!p) {
          toast({ title: "Error", description: "Producto no encontrado", variant: "destructive" })
          router.push("/productos")
          return
        }
        setProducto(p)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar el producto")
      } finally {
        setIsLoading(false)
      }
    }
    cargar()
  }, [params.id, router, toast])

  const elegirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setError("")
    try {
      const reducida = await achicar(archivo)
      setPesoOriginal(archivo.size)
      setFoto(reducida)
      setPreview(URL.createObjectURL(reducida))
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer la foto")
    }
  }

  const guardar = async () => {
    if (!foto || !producto) return
    setIsSaving(true)
    setError("")
    try {
      const nombre = `${producto.producto_id}-${Date.now()}.jpg`

      const { error: errorSubida } = await supabase.storage
        .from("productos")
        .upload(nombre, foto, { contentType: "image/jpeg", upsert: true })
      if (errorSubida) throw new Error(`No se pudo subir la foto: ${errorSubida.message}`)

      const { data: publica } = supabase.storage.from("productos").getPublicUrl(nombre)

      const { data: imagen, error: errorImagen } = await supabase
        .from("imagenes")
        .insert([{ url_img: publica.publicUrl, txt_alt: `Foto: ${producto.descripcion}`.slice(0, 200) }])
        .select("id")
        .single()
      if (errorImagen || !imagen) {
        throw new Error(`La foto subió pero no se pudo registrar: ${errorImagen?.message ?? "sin respuesta"}`)
      }

      const { error: errorProducto } = await supabase
        .from("productos")
        .update({ img_id: imagen.id })
        .eq("producto_id", producto.producto_id)
      if (errorProducto) throw new Error(`No se pudo enlazar la foto al producto: ${errorProducto.message}`)

      toast({
        title: "Foto guardada",
        description: `${producto.descripcion.slice(0, 40)} ya tiene su foto.`,
      })
      router.push("/productos")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la foto")
    } finally {
      setIsSaving(false)
    }
  }

  const descartar = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFoto(null)
    setPesoOriginal(0)
    if (inputRef.current) inputRef.current.value = ""
  }

  const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-xl mx-auto py-16 text-center text-foreground/80">Cargando producto...</div>
      </div>
    )
  }

  if (!producto) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-xl mx-auto py-16 text-center text-foreground/80">No se encontró el producto.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-3 py-2">
          <Link href="/productos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Foto del producto</h1>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{producto.descripcion}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {producto.articulo_numero ? `#${producto.articulo_numero}` : "Sin N° de artículo"}
              {producto.producto_codigo ? ` · Cód. ${producto.producto_codigo}` : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <div className="flex h-56 w-56 items-center justify-center rounded-lg border border-border/60 bg-brand-100 p-2">
                <Image
                  src={preview || producto.imagen?.url_img || "/placeholder.svg"}
                  alt={producto.descripcion}
                  width={224}
                  height={224}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {foto && (
              <p className="text-center text-xs text-muted-foreground">
                Foto lista: {kb(pesoOriginal)} → <span className="font-medium text-foreground">{kb(foto.size)}</span>{" "}
                (se achica antes de subirla)
              </p>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!isSupabaseConfigured() && (
              <Alert variant="destructive">
                <AlertDescription>Faltan las credenciales de Supabase.</AlertDescription>
              </Alert>
            )}

            {/* capture="environment" abre directamente la camara trasera en el
                telefono. En la computadora cae al selector de archivos. */}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={elegirFoto}
              className="hidden"
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="w-full sm:flex-1"
                onClick={() => inputRef.current?.click()}
                disabled={isSaving}
              >
                <Camera className="mr-2 h-4 w-4" />
                {preview ? "Sacar otra" : "Sacar foto"}
              </Button>

              {foto && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={descartar}
                    disabled={isSaving}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Descartar
                  </Button>
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    onClick={guardar}
                    disabled={isSaving}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {isSaving ? "Guardando..." : "Guardar foto"}
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Apuntá al producto y sacale la foto. Se achica sola antes de subirla, así no gasta datos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
