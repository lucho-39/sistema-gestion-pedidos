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
import type { Producto, Proveedor } from "@/lib/types"

export default function EditarProductoPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    articulo_numero: "",
    producto_codigo: "",
    descripcion: "",
    unidad_medida: "unidad",
    proveedor_id: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [productos, loadedProveedores] = await Promise.all([Database.getProductos(), Database.getProveedores()])

        setProveedores(loadedProveedores)

        const productoEncontrado = productos.find((p) => p.articulo_numero === Number(params.id))

        if (productoEncontrado) {
          setProducto(productoEncontrado)
          setFormData({
            articulo_numero: productoEncontrado.articulo_numero.toString(),
            producto_codigo: productoEncontrado.producto_codigo,
            descripcion: productoEncontrado.descripcion,
            unidad_medida: productoEncontrado.unidad_medida,
            proveedor_id: productoEncontrado.proveedor.proveedor_id.toString(),
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

    loadData()
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
      // Determinar unidad de medida automáticamente si contiene "cable"
      let unidadMedida = formData.unidad_medida
      if (formData.descripcion.toLowerCase().includes("cable")) {
        unidadMedida = "metros"
      }

      const proveedor = proveedores.find((p) => p.proveedor_id === Number(formData.proveedor_id))
      if (!proveedor) {
        toast({
          title: "Error",
          description: "Proveedor no encontrado",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      const updates: Partial<Producto> = {
        producto_codigo: formData.producto_codigo,
        descripcion: formData.descripcion,
        unidad_medida: unidadMedida,
        proveedor: proveedor,
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
                  type="number"
                  value={formData.articulo_numero}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">El número de artículo no se puede modificar</p>
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
                <Label htmlFor="descripcion">Descripción *</Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleChange("descripcion", e.target.value)}
                  placeholder="Descripción del producto"
                />
              </div>

              <div>
                <Label htmlFor="unidad_medida">Unidad de Medida</Label>
                <Select value={formData.unidad_medida} onValueChange={(value) => handleChange("unidad_medida", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidad">Unidad</SelectItem>
                    <SelectItem value="metros">Metros</SelectItem>
                    <SelectItem value="kilogramos">Kilogramos</SelectItem>
                    <SelectItem value="litros">Litros</SelectItem>
                  </SelectContent>
                </Select>
                {formData.descripcion.toLowerCase().includes("cable") && (
                  <p className="text-xs text-blue-600 mt-1">
                    ℹ️ Se detectó "cable" en la descripción. Se asignará "metros" automáticamente.
                  </p>
                )}
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
