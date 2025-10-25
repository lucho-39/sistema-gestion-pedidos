"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/lib/database"
import type { Producto, Proveedor, Categoria, Imagen } from "@/lib/types"

export default function EditarProductoPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [imagenes, setImagenes] = useState<Imagen[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    articulo_numero: "",
    producto_codigo: "",
    titulo: "",
    descripcion: "",
    categoria_id: "",
    img_id: "",
    proveedor_id: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        console.log("Cargando datos para producto ID:", params.id)

        const [loadedProducto, loadedProveedores, loadedCategorias, loadedImagenes] = await Promise.all([
          Database.getProductoById(Number(params.id)),
          Database.getProveedores(),
          Database.getCategorias(),
          Database.getImagenes(),
        ])

        console.log("Producto cargado:", loadedProducto)
        console.log("Proveedores:", loadedProveedores.length)
        console.log("Categorías:", loadedCategorias.length)
        console.log("Imágenes:", loadedImagenes.length)

        setProveedores(loadedProveedores)
        setCategorias(loadedCategorias)
        setImagenes(loadedImagenes)

        if (loadedProducto) {
          setProducto(loadedProducto)
          setFormData({
            articulo_numero: loadedProducto.articulo_numero || "",
            producto_codigo: loadedProducto.producto_codigo || "",
            titulo: loadedProducto.titulo || "",
            descripcion: loadedProducto.descripcion,
            categoria_id: loadedProducto.categoria_id.toString(),
            img_id: loadedProducto.img_id.toString(),
            proveedor_id: loadedProducto.proveedor_id.toString(),
          })
        } else {
          toast({
            title: "Error",
            description: "Producto no encontrado",
            variant: "destructive",
          })
          router.push("/productos")
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Error al cargar los datos",
          variant: "destructive",
        })
        router.push("/productos")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      loadData()
    }
  }, [params.id, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.descripcion) {
      toast({
        title: "Error",
        description: "La descripción es obligatoria",
        variant: "destructive",
      })
      return
    }

    if (!formData.proveedor_id) {
      toast({
        title: "Error",
        description: "Debe seleccionar un proveedor",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const updates: Partial<Producto> = {
        articulo_numero: formData.articulo_numero || null,
        producto_codigo: formData.producto_codigo,
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        categoria_id: Number(formData.categoria_id),
        img_id: Number(formData.img_id),
        proveedor_id: Number(formData.proveedor_id),
      }

      const success = await Database.updateProducto(Number(params.id), updates)

      if (success) {
        toast({
          title: "Producto actualizado",
          description: "Los cambios se han guardado exitosamente",
        })
        router.push("/productos")
      } else {
        toast({
          title: "Error",
          description: "No se pudieron guardar los cambios",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating producto:", error)
      toast({
        title: "Error",
        description: "Error al actualizar el producto",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <p className="text-center py-8">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!producto) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <p className="text-center py-8">Producto no encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 py-2">
          <Link href="/productos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Editar Producto</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="articulo_numero">Número de Artículo</Label>
                <Input
                  id="articulo_numero"
                  value={formData.articulo_numero}
                  onChange={(e) => handleChange("articulo_numero", e.target.value)}
                  placeholder="Ej: 1001"
                />
              </div>

              <div>
                <Label htmlFor="producto_codigo">Código del Producto</Label>
                <Input
                  id="producto_codigo"
                  value={formData.producto_codigo}
                  onChange={(e) => handleChange("producto_codigo", e.target.value)}
                  placeholder="Ej: A-1001"
                />
              </div>

              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => handleChange("titulo", e.target.value)}
                  placeholder="Título del producto"
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción *</Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleChange("descripcion", e.target.value)}
                  placeholder="Descripción del producto"
                  required
                />
              </div>

              <div>
                <Label htmlFor="categoria_id">Categoría *</Label>
                <Select value={formData.categoria_id} onValueChange={(value) => handleChange("categoria_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.nombre} ({categoria.unidad})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="img_id">Imagen *</Label>
                <Select value={formData.img_id} onValueChange={(value) => handleChange("img_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una imagen" />
                  </SelectTrigger>
                  <SelectContent>
                    {imagenes.map((imagen) => (
                      <SelectItem key={imagen.id} value={imagen.id.toString()}>
                        {imagen.txt_alt || `Imagen ${imagen.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="proveedor_id">Proveedor *</Label>
                <Select value={formData.proveedor_id} onValueChange={(value) => handleChange("proveedor_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores.map((proveedor) => (
                      <SelectItem key={proveedor.proveedor_id} value={proveedor.proveedor_id.toString()}>
                        {proveedor.proveedor_id} - {proveedor.proveedor_nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={isSaving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
