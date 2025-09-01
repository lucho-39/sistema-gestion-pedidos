"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, User, Calendar, Package, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/lib/database"
import type { Pedido } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function DetallePedidoPage() {
  const params = useParams()
  const { toast } = useToast()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadPedido = async () => {
      try {
        setIsLoading(true)
        const pedidos = await Database.getPedidos()
        const pedidoEncontrado = pedidos.find((p) => p.pedido_id === Number(params.id))
        setPedido(pedidoEncontrado || null)
      } catch (error) {
        console.error("Error loading pedido:", error)
        toast({
          title: "Error",
          description: "Error al cargar el pedido",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPedido()
  }, [params.id, toast])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calcularTotalProductos = () => {
    if (!pedido) return 0
    return pedido.productos.reduce((total, producto) => total + producto.cantidad, 0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-3 py-2">
            <Link href="/reportes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Detalle del Pedido</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando pedido...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 py-2">
            <Link href="/reportes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Pedido no encontrado</h1>
          </div>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">El pedido solicitado no existe</p>
              <Link href="/reportes" className="inline-block mt-4">
                <Button variant="outline" className="w-full bg-transparent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Reportes
                </Button>
              </Link>
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
          <Link href="/reportes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Pedido #{pedido.pedido_id}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Información del Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{pedido.cliente.nombre}</p>
              <p className="text-sm text-gray-600">Código: #{pedido.cliente.cliente_codigo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">📍 {pedido.cliente.domicilio}</p>
              <p className="text-sm text-gray-600">📞 {pedido.cliente.telefono}</p>
              <p className="text-sm text-gray-600">🆔 CUIL: {pedido.cliente.CUIL}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Información del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fecha del pedido:</span>
              <Badge variant="secondary">{formatDate(pedido.fecha_pedido)}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total productos:</span>
              <Badge variant="secondary">{calcularTotalProductos()}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tipos de productos:</span>
              <Badge variant="secondary">{pedido.productos.length}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Productos del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pedido.productos.map((producto, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      #{producto.articulo_numero} - {producto.descripcion}
                    </p>
                    <p className="text-xs text-gray-500">Código: {producto.producto_codigo || "Sin código"}</p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {producto.cantidad} {producto.unidad_medida}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Truck className="h-3 w-3" />
                  <span>
                    {producto.proveedor.proveedor_id} - {producto.proveedor.proveedor_nombre}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
