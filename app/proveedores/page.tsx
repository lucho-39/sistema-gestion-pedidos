"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Search, Edit, Trash2, Truck, Database, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database as DB } from "@/lib/database"
import type { Proveedor } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProveedores, setFilteredProveedores] = useState<Proveedor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadProveedores = async () => {
      try {
        setIsLoading(true)
        setNeedsSetup(false)
        const loadedProveedores = await DB.getProveedores()
        setProveedores(loadedProveedores)
        setFilteredProveedores(loadedProveedores)
      } catch (error) {
        console.error("Error loading proveedores:", error)
        if (error instanceof Error && error.message.includes("Database tables not found")) {
          setNeedsSetup(true)
        } else {
          toast({
            title: "Error",
            description: "Error al cargar los proveedores",
            variant: "destructive",
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadProveedores()
  }, [toast])

  useEffect(() => {
    const filtered = proveedores.filter(
      (proveedor) =>
        proveedor.proveedor_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proveedor.proveedor_id.toString().includes(searchTerm),
    )
    setFilteredProveedores(filtered)
  }, [searchTerm, proveedores])

  const handleDelete = async (proveedorId: number) => {
    try {
      // Verificar si el proveedor está siendo usado por algún producto
      const productos = await DB.getProductos()
      const productosConProveedor = productos.filter((p) => p.proveedor.proveedor_id === proveedorId)

      if (productosConProveedor.length > 0) {
        toast({
          title: "No se puede eliminar",
          description: `Este proveedor está siendo usado por ${productosConProveedor.length} producto(s)`,
          variant: "destructive",
        })
        return
      }

      const success = await DB.deleteProveedor(proveedorId)
      if (success) {
        const updatedProveedores = proveedores.filter((p) => p.proveedor_id !== proveedorId)
        setProveedores(updatedProveedores)
        toast({
          title: "Proveedor eliminado",
          description: "El proveedor se ha eliminado exitosamente",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el proveedor",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting proveedor:", error)
      toast({
        title: "Error",
        description: "Error al eliminar el proveedor",
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
            <h1 className="text-xl font-bold">Proveedores</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando proveedores...</p>
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
            <h1 className="text-xl font-bold">Proveedores</h1>
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
                Para gestionar proveedores, primero debes configurar la base de datos ejecutando los scripts SQL en tu
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
          <h1 className="text-xl font-bold">Proveedores</h1>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Link href="/proveedores/nuevo">
            <Button size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {filteredProveedores.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No hay proveedores registrados</p>
              <Link href="/proveedores/nuevo" className="inline-block mt-2">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Proveedor
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProveedores.map((proveedor) => (
              <Card key={proveedor.proveedor_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Truck className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        <span className="truncate">{proveedor.proveedor_nombre}</span>
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          ID: {proveedor.proveedor_id}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Link href={`/proveedores/editar/${proveedor.proveedor_id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(proveedor.proveedor_id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
