"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Search, Edit, Trash2, Database, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database as DB } from "@/lib/database"
import type { Producto } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadProductos = async () => {
      try {
        setIsLoading(true)
        setNeedsSetup(false)
        const loadedProductos = await DB.getProductos()
        setProductos(loadedProductos)
        setFilteredProductos(loadedProductos)
      } catch (error) {
        console.error("Error loading productos:", error)
        if (error instanceof Error && error.message.includes("Database tables not found")) {
          setNeedsSetup(true)
        } else {
          toast({
            title: "Error",
            description: "Error al cargar los productos",
            variant: "destructive",
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadProductos()
  }, [toast])

  useEffect(() => {
    const filtered = productos.filter(
      (producto) =>
        producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.producto_codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.articulo_numero.toString().includes(searchTerm),
    )
    setFilteredProductos(filtered)
  }, [searchTerm, productos])

  const handleDelete = async (articuloNumero: number) => {
    try {
      const success = await DB.deleteProducto(articuloNumero)
      if (success) {
        const updatedProductos = productos.filter((p) => p.articulo_numero !== articuloNumero)
        setProductos(updatedProductos)
        toast({
          title: "Producto eliminado",
          description: "El producto se ha eliminado exitosamente",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el producto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting producto:", error)
      toast({
        title: "Error",
        description: "Error al eliminar el producto",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center gap-3 py-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Productos</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando productos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (needsSetup) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-3 py-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Productos</h1>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Base de datos no configurada</strong>
              <p className="mt-2">
                Las tablas de la base de datos no existen. Necesitas ejecutar los scripts de configuración primero.
              </p>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Configuración Requerida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Para gestionar productos, primero debes configurar la base de datos ejecutando los scripts SQL en tu
                proyecto Supabase.
              </p>

              <div className="space-y-2">
                <Link href="/setup" className="block">
                  <Button className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Ir a Configuración
                  </Button>
                </Link>

                <Link href="/" className="block">
                  <Button variant="outline" className="w-full bg-transparent">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Inicio
                  </Button>
                </Link>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  <strong>¿Qué necesitas hacer?</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Ir a la página de configuración</li>
                  <li>Copiar los scripts SQL</li>
                  <li>Ejecutarlos en Supabase</li>
                  <li>Volver a esta página</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-3 py-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Productos</h1>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Link href="/productos/nuevo">
            <Button size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {filteredProductos.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No hay productos registrados</p>
              <Link href="/productos/nuevo" className="inline-block mt-2">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProductos.map((producto) => (
              <Card key={producto.articulo_numero} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate">#{producto.articulo_numero}</CardTitle>
                      <p className="text-xs text-gray-900 mt-1 line-clamp-2">{producto.descripcion}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        Código: {producto.producto_codigo || "Sin código"}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Link href={`/productos/editar/${producto.articulo_numero}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(producto.articulo_numero)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {producto.unidad_medida}
                    </Badge>
                    <p className="text-xs text-gray-600 truncate">{producto.proveedor.proveedor_nombre}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
