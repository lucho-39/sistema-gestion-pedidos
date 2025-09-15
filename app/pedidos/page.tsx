"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Eye, Edit, Trash2, Calendar, User, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/lib/database"
import type { Pedido } from "@/lib/types"

export default function PedidosPage() {
  const { toast } = useToast()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [filteredPedidos, setFilteredPedidos] = useState<Pedido[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPedidos()
  }, [])

  useEffect(() => {
    filterPedidos()
  }, [searchTerm, pedidos])

  const loadPedidos = async () => {
    try {
      setIsLoading(true)
      const data = await Database.getPedidos()
      setPedidos(data)
    } catch (error) {
      console.error("Error loading pedidos:", error)
      toast({
        title: "Error",
        description: "Error al cargar los pedidos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterPedidos = () => {
    if (!searchTerm.trim()) {
      setFilteredPedidos(pedidos)
      return
    }

    const filtered = pedidos.filter((pedido) => {
      const searchLower = searchTerm.toLowerCase()

      // Buscar por ID del pedido
      if (pedido.pedido_id.toString().includes(searchLower)) {
        return true
      }

      // Buscar por nombre del cliente
      if (pedido.cliente?.nombre?.toLowerCase().includes(searchLower)) {
        return true
      }

      // Buscar por código del cliente
      if (pedido.cliente?.cliente_codigo?.toString().includes(searchLower)) {
        return true
      }

      // Buscar por fecha
      if (pedido.fecha_pedido?.includes(searchTerm)) {
        return true
      }

      return false
    })

    setFilteredPedidos(filtered)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este pedido?")) {
      return
    }

    try {
      const success = await Database.deletePedido(id)
      if (success) {
        toast({
          title: "Pedido eliminado",
          description: "El pedido se ha eliminado correctamente",
        })
        loadPedidos()
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("es-AR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (error) {
      return "Fecha no válida"
    }
  }

  const calcularTotalProductos = (pedido: Pedido) => {
    if (!pedido.productos) return 0
    return pedido.productos.reduce((total, producto) => total + (producto.cantidad || 0), 0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Pedidos</h1>
            <Link href="/pedidos/nuevo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Pedido
              </Button>
            </Link>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando pedidos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pedidos</h1>
          <Link href="/pedidos/nuevo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Pedido
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por ID, cliente, código o fecha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredPedidos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {searchTerm ? "No se encontraron pedidos que coincidan con la búsqueda" : "No hay pedidos registrados"}
              </p>
              {!searchTerm && (
                <Link href="/pedidos/nuevo">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer pedido
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPedidos.map((pedido) => (
              <Card key={pedido.pedido_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Pedido #{pedido.pedido_id}</CardTitle>
                    <div className="flex gap-1">
                      <Link href={`/reportes/pedido/${pedido.pedido_id}`}>
                        <Button variant="ghost" size="sm" title="Ver pedido">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Link href={`/pedidos/editar/${pedido.pedido_id}`}>
                        <Button variant="ghost" size="sm" title="Editar pedido">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(pedido.pedido_id)}
                        className="text-red-600 hover:text-red-700"
                        title="Eliminar pedido"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">{pedido.cliente?.nombre || "Cliente no encontrado"}</p>
                      <p className="text-xs text-gray-500">Código: #{pedido.cliente?.cliente_codigo || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span>{formatDate(pedido.fecha_pedido)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-orange-600" />
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {pedido.productos?.length || 0} tipos
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {calcularTotalProductos(pedido)} unidades
                      </Badge>
                    </div>
                  </div>

                  {pedido.productos && pedido.productos.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-2">Productos principales:</p>
                      <div className="space-y-1">
                        {pedido.productos.slice(0, 2).map((producto, index) => (
                          <div key={index} className="text-xs text-gray-600 flex justify-between">
                            <span className="truncate flex-1 mr-2">
                              {producto.producto?.descripcion || "Producto no encontrado"}
                            </span>
                            <span className="text-gray-400">
                              {producto.cantidad || 0} {producto.producto?.unidad_medida || "unidad"}
                            </span>
                          </div>
                        ))}
                        {pedido.productos.length > 2 && (
                          <p className="text-xs text-gray-400">+{pedido.productos.length - 2} productos más</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {searchTerm && filteredPedidos.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Mostrando {filteredPedidos.length} de {pedidos.length} pedidos
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
