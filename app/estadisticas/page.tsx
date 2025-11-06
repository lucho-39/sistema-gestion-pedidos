"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database } from "@/lib/database"
import { TrendingUp, Package } from "lucide-react"
import type { Producto, Proveedor } from "@/lib/types"

interface ProductRanking {
  producto: Producto
  total_pedidos: number
  total_cantidad: number
}

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(true)
  const [productsRanking, setProductsRanking] = useState<ProductRanking[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [selectedProveedor, setSelectedProveedor] = useState<string>("all")

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      setLoading(true)
      const [ranking, proveedoresData] = await Promise.all([Database.getProductsRanking(), Database.getProveedores()])

      setProductsRanking(ranking)
      setProveedores(proveedoresData)
    } catch (error) {
      console.error("Error loading statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter products by selected proveedor
  const filteredProducts =
    selectedProveedor === "all"
      ? productsRanking
      : productsRanking.filter((item) => item.producto.proveedor_id === Number.parseInt(selectedProveedor))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
          </div>
          <p className="text-gray-600">Ranking de productos más presentes en pedidos</p>
        </div>

        {/* Products Ranking */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-lg">Productos Más Presentes en Pedidos</CardTitle>
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <CardDescription>Ordenados por cantidad de pedidos en los que aparecen</CardDescription>
              </div>

              {/* Proveedor Filter */}
              <div className="w-full sm:w-64">
                <Select value={selectedProveedor} onValueChange={setSelectedProveedor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proveedores</SelectItem>
                    {proveedores.map((proveedor) => (
                      <SelectItem key={proveedor.proveedor_id} value={proveedor.proveedor_id.toString()}>
                        {proveedor.proveedor_nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="space-y-3">
                {filteredProducts.map((item, index) => (
                  <div
                    key={item.producto.producto_id}
                    className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      {/* Ranking Number */}
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm flex-shrink-0 ${
                          index === 0
                            ? "bg-yellow-400 text-yellow-900"
                            : index === 1
                              ? "bg-gray-300 text-gray-700"
                              : index === 2
                                ? "bg-orange-400 text-orange-900"
                                : "bg-blue-200 text-blue-700"
                        }`}
                      >
                        {index + 1}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 mb-1">{item.producto.descripcion}</p>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          <span>Art. {item.producto.articulo_numero || "N/A"}</span>
                          {item.producto.proveedor && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600">{item.producto.proveedor.proveedor_nombre}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                        <Badge variant="secondary" className="whitespace-nowrap">
                          {item.total_pedidos} {item.total_pedidos === 1 ? "pedido" : "pedidos"}
                        </Badge>
                        <Badge className="whitespace-nowrap">{item.total_cantidad} unidades</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  {selectedProveedor === "all"
                    ? "No hay datos disponibles"
                    : "No hay productos de este proveedor en pedidos"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
