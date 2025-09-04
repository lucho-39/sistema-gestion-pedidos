"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Search, Edit, Trash2, User, Package, Database, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database as DB } from "@/lib/database"
import type { Pedido } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPedidos, setFilteredPedidos] = useState<Pedido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadPedidos = async () => {
      try {
        setIsLoading(true)
        setNeedsSetup(false)
        const loadedPedidos = await DB.getPedidos()
        setPedidos(loadedPedidos)
        setFilteredPedidos(loadedPedidos)
      } catch (error) {
        console.error("Error loading pedidos:", error)
        if (error instanceof Error && error.message.includes("Database tables not found")) {
          setNeedsSetup(true)
        } else {
          toast({
            title: "Error",
            description: "Error al cargar los pedidos",
            variant: "destructive",
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadPedidos()
  }, [toast])

  useEffect(() => {
    const filtered = pedidos.filter(
      (pedido) =>
        pedido.cliente?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pedido.pedido_id.toString().includes(searchTerm) ||
        pedido.productos?.some((p) => p.producto?.descripcion.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredPedidos(filtered)
  }, [searchTerm, pedidos])

  const handleDelete = async (pedidoId: number) => {
    try {
      const success = await DB.deletePedido(pedidoId)
      if (success) {
        const updatedPedidos = pedidos.filter((p) => p.pedido_id !== pedidoId)
        setPedidos(updatedPedidos)
        toast({
          title: "Pedido eliminado",
          description: "El pedido se ha eliminado exitosamente",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el pedido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting pedido:", error)
      toast({
        title: "Error",
        description: "Error al eliminar el pedido",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Sin fecha"
    return new Date(dateString).toLocaleDateString("es-AR")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-3 py-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Pedidos</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando pedidos...</p>
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
            <h1 className="text-xl font-bold">Pedidos</h1>
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
                Para usar la funcionalidad de pedidos, primero debes configurar la base de datos ejecutando los scripts
                SQL en tu proyecto Supabase.
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
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 py-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Pedidos</h1>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar pedidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Link href="/pedidos/nuevo">
            <Button size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {filteredPedidos.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No hay pedidos registrados</p>
                <Link href="/pedidos/nuevo" className="inline-block mt-2">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Pedido
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredPedidos.map((pedido) => (
              <Card key={pedido.pedido_id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-medium">Pedido #{pedido.pedido_id}</CardTitle>
                      <p className="text-xs text-gray-500">{formatDate(pedido.fecha_pedido || pedido.created_at)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/pedidos/editar/${pedido.pedido_id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(pedido.pedido_id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3 w-3 text-gray-500" />
                    <span>{pedido.cliente?.nombre || "Cliente no encontrado"}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-3 w-3 text-gray-500" />
                      <span>{pedido.productos?.length || 0} producto(s)</span>
                    </div>
                    <div className="pl-5 space-y-1">
                      {pedido.productos?.slice(0, 2).map((producto, index) => (
                        <p key={index} className="text-xs text-gray-600">
                          {producto.cantidad}x {producto.producto?.descripcion || "Producto no encontrado"}
                        </p>
                      ))}
                      {(pedido.productos?.length || 0) > 2 && (
                        <p className="text-xs text-gray-500">+{(pedido.productos?.length || 0) - 2} más...</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
