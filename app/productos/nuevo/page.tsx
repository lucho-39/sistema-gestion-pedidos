"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/lib/database"
import { ARTICULO_NUMERO_MAX_LENGTH } from "@/lib/types"
import type { Categoria, Imagen, Proveedor } from "@/lib/types"

export default function NuevoProductoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [imagenes, setImagenes] = useState<Imagen[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    articulo_numero: "",
    producto_codigo: "",
    descripcion: "",
    categoria_id: "",
    proveedor_id: "",
    precio_venta: "",
    sin_stock: false,
  })

  useEffect(() => {
    const loadDatos = async () => {
      try {
        const [loadedProveedores, loadedCategorias, loadedImagenes] = await Promise.all([
          Database.getProveedores(),
          Database.getCategorias(),
          Database.getImagenes(),
        ])
        setProveedores(loadedProveedores)
        setCategorias(loadedCategorias)
        setImagenes(loadedImagenes)
      } catch (error) {
        console.error("Error loading datos:", error)
        toast({
          title: "Error",
          description: "Error al cargar proveedores, categorías e imágenes",
          variant: "destructive",
        })
      }
    }

    loadDatos()
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.articulo_numero || !formData.descripcion) {
      toast({
        title: "Error",
        description: "Número de artículo y descripción son obligatorios",
        variant: "destructive",
      })
      return
    }

    if (!formData.categoria_id) {
      toast({
        title: "Error",
        description: "Debe seleccionar una categoría",
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

    setIsLoading(true)

    try {
      // El número de artículo es texto (VARCHAR) en la base, no un número
      const articuloNumero = formData.articulo_numero.trim()

      if (articuloNumero.length > ARTICULO_NUMERO_MAX_LENGTH) {
        toast({
          title: "Error",
          description: `El número de artículo no puede superar los ${ARTICULO_NUMERO_MAX_LENGTH} caracteres`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Verificar si el número de artículo ya existe
      const productos = await Database.getProductos()
      const articuloExiste = productos.some((p) => p.articulo_numero === articuloNumero)

      if (articuloExiste) {
        toast({
          title: "Error",
          description: "Ya existe un producto con ese número de artículo",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const proveedor = proveedores.find((p) => p.proveedor_id === Number(formData.proveedor_id))
      if (!proveedor) {
        toast({
          title: "Error",
          description: "Proveedor no encontrado",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Todo producto nuevo usa la imagen por defecto (no hay selector de imagen todavía)
      const imgId = imagenes[0]?.id
      if (!imgId) {
        toast({
          title: "Error",
          description: "No hay imágenes configuradas. Cargue una imagen antes de crear productos.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const nuevoProducto = {
        articulo_numero: articuloNumero,
        producto_codigo: formData.producto_codigo,
        descripcion: formData.descripcion,
        categoria_id: Number(formData.categoria_id),
        img_id: imgId,
        proveedor_id: proveedor.proveedor_id,
        precio_venta: formData.precio_venta ? Number(formData.precio_venta) : null,
        sin_stock: formData.sin_stock,
      }

      const createdProducto = await Database.createProducto(nuevoProducto)

      if (createdProducto) {
        toast({
          title: "Producto creado",
          description: "El producto se ha registrado exitosamente",
        })
        router.push("/productos")
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear el producto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating producto:", error)
      toast({
        title: "Error",
        description: "Error al crear el producto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 py-2">
          <Link href="/productos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Nuevo Producto</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="articulo_numero">Número de Artículo *</Label>
                <Input
                  id="articulo_numero"
                  type="text"
                  inputMode="numeric"
                  maxLength={ARTICULO_NUMERO_MAX_LENGTH}
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
                <Label htmlFor="descripcion">Descripción *</Label>
                <Input
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleChange("descripcion", e.target.value)}
                  placeholder="Descripción del producto"
                />
              </div>

              <div>
                <Label htmlFor="categoria_id">Categoría *</Label>
                <Select
                  value={formData.categoria_id}
                  onValueChange={(value) => handleChange("categoria_id", value)}
                >
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
                <p className="text-xs text-muted-foreground mt-1">La unidad de medida la define la categoría.</p>
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

              <div>
                <Label htmlFor="precio_venta">Precio de venta</Label>
                <Input
                  id="precio_venta"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formData.precio_venta}
                  onChange={(e) => handleChange("precio_venta", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Opcional: si lo dejás vacío, se carga desde la lista del proveedor.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="sin_stock"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-primary"
                  checked={formData.sin_stock}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sin_stock: e.target.checked }))}
                />
                <Label htmlFor="sin_stock" className="cursor-pointer">
                  Sin stock
                </Label>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Guardando..." : "Guardar Producto"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
