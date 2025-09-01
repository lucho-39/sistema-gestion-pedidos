"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, BarChart3, Download, Calendar, TrendingUp, Package, ShoppingCart, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Database } from "@/lib/database"
import { generarReporteSemanalProductos, generarReporteSemanalPedidos } from "@/lib/report-generators"
import {
  generarExcelReporteGeneral,
  generarExcelReporteProductos,
  generarExcelReportePedidos,
} from "@/lib/report-excel-generator"
import type { ReporteSemanal, Pedido, ReporteSemanalProductos, ReporteSemanalPedidos } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function ReportesPage() {
  const [reportesPedidos, setReportesPedidos] = useState<ReporteSemanal[]>([])
  const [reportesProductos, setReportesProductos] = useState<ReporteSemanalProductos[]>([])
  const [reportesPedidosDetalle, setReportesPedidosDetalle] = useState<ReporteSemanalPedidos[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const loadReportes = async () => {
      try {
        setIsLoading(true)
        const loadedReportes = await Database.getReportes()
        const sortedReportes = loadedReportes.sort(
          (a, b) => new Date(b.fecha_corte).getTime() - new Date(a.fecha_corte).getTime(),
        )
        setReportesPedidos(sortedReportes)

        // Cargar reportes de productos y pedidos detalle desde localStorage
        const reportesProductosGuardados = localStorage.getItem("reportes_productos")
        if (reportesProductosGuardados) {
          setReportesProductos(JSON.parse(reportesProductosGuardados))
        }

        const reportesPedidosGuardados = localStorage.getItem("reportes_pedidos_detalle")
        if (reportesPedidosGuardados) {
          setReportesPedidosDetalle(JSON.parse(reportesPedidosGuardados))
        }
      } catch (error) {
        console.error("Error loading reportes:", error)
        toast({
          title: "Error",
          description: "Error al cargar los reportes",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadReportes()
  }, [toast])

  const generarReporteSemanal = async () => {
    try {
      const pedidos = await Database.getPedidos()
      const ahora = new Date()
      const unaSemanaAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)

      const pedidosRecientes = pedidos.filter((pedido) => {
        const fechaPedido = new Date(pedido.fecha_pedido)
        return fechaPedido >= unaSemanaAtras
      })

      const pedidosOrdenados = pedidosRecientes.sort((a, b) => {
        const fechaA = new Date(a.fecha_pedido)
        const fechaB = new Date(b.fecha_pedido)
        return fechaB.getTime() - fechaA.getTime()
      })

      const nuevoReporte: ReporteSemanal = {
        fecha_corte: ahora.toISOString(),
        pedidos: pedidosOrdenados,
      }

      const success = await Database.saveReporte("general", nuevoReporte)
      if (success) {
        const reportesActualizados = [nuevoReporte, ...reportesPedidos]
        setReportesPedidos(reportesActualizados)

        toast({
          title: "Reporte generado",
          description: `Se generó un reporte con ${pedidosOrdenados.length} pedidos de la última semana`,
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo guardar el reporte",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating reporte:", error)
      toast({
        title: "Error",
        description: "Error al generar el reporte",
        variant: "destructive",
      })
    }
  }

  const generarReporteProductos = async () => {
    try {
      const pedidos = await Database.getPedidos()
      const ahora = new Date()
      const unaSemanaAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)

      const pedidosRecientes = pedidos.filter((pedido) => {
        const fechaPedido = new Date(pedido.fecha_pedido)
        return fechaPedido >= unaSemanaAtras
      })

      const reporteProductos = generarReporteSemanalProductos(pedidosRecientes)
      const reportesActuales = [...reportesProductos]
      reportesActuales.unshift(reporteProductos)

      setReportesProductos(reportesActuales)
      localStorage.setItem("reportes_productos", JSON.stringify(reportesActuales))

      const totalProductos = reporteProductos.proveedores.reduce(
        (total, proveedor) =>
          total + proveedor.productos.reduce((subtotal, producto) => subtotal + producto.cantidad_total, 0),
        0,
      )

      toast({
        title: "Reporte de Productos generado",
        description: `Se generó un reporte con ${totalProductos} productos de ${reporteProductos.proveedores.length} proveedores`,
      })
    } catch (error) {
      console.error("Error generating reporte productos:", error)
      toast({
        title: "Error",
        description: "Error al generar el reporte de productos",
        variant: "destructive",
      })
    }
  }

  const generarReportePedidosDetalle = async () => {
    try {
      const pedidos = await Database.getPedidos()
      const ahora = new Date()
      const unaSemanaAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)

      const pedidosRecientes = pedidos.filter((pedido) => {
        const fechaPedido = new Date(pedido.fecha_pedido)
        return fechaPedido >= unaSemanaAtras
      })

      const reportePedidos = generarReporteSemanalPedidos(pedidosRecientes)
      const reportesActuales = [...reportesPedidosDetalle]
      reportesActuales.unshift(reportePedidos)

      setReportesPedidosDetalle(reportesActuales)
      localStorage.setItem("reportes_pedidos_detalle", JSON.stringify(reportesActuales))

      toast({
        title: "Reporte de Pedidos generado",
        description: `Se generó un reporte con ${reportePedidos.pedidos.length} pedidos ordenados por fecha`,
      })
    } catch (error) {
      console.error("Error generating reporte pedidos:", error)
      toast({
        title: "Error",
        description: "Error al generar el reporte de pedidos",
        variant: "destructive",
      })
    }
  }

  const descargarExcelGeneral = async (reporte: ReporteSemanal) => {
    try {
      await generarExcelReporteGeneral(reporte)
      toast({
        title: "Excel descargado",
        description: "El reporte general se ha descargado exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar el archivo Excel",
        variant: "destructive",
      })
    }
  }

  const descargarExcelProductos = async (reporte: ReporteSemanalProductos) => {
    try {
      await generarExcelReporteProductos(reporte)
      toast({
        title: "Excel descargado",
        description: "El reporte de productos se ha descargado exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar el archivo Excel",
        variant: "destructive",
      })
    }
  }

  const descargarExcelPedidos = async (reporte: ReporteSemanalPedidos) => {
    try {
      await generarExcelReportePedidos(reporte)
      toast({
        title: "Excel descargado",
        description: "El reporte de pedidos se ha descargado exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar el archivo Excel",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-AR")
  }

  const calcularTotalProductos = (pedidos: Pedido[]) => {
    return pedidos.reduce(
      (total, pedido) => total + pedido.productos.reduce((subtotal, producto) => subtotal + producto.cantidad, 0),
      0,
    )
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
            <h1 className="text-xl font-bold">Reportes</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando reportes...</p>
          </div>
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
          <h1 className="text-xl font-bold">Reportes</h1>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Reporte General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={generarReporteSemanal} className="w-full" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generar Reporte
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-blue-600" />
                Reporte de Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={generarReporteProductos} className="w-full bg-transparent" size="sm" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Generar por Proveedor
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4 text-orange-600" />
                Reporte de Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={generarReportePedidosDetalle}
                className="w-full bg-transparent"
                size="sm"
                variant="outline"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Generar por Fecha
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="text-xs">
              General
            </TabsTrigger>
            <TabsTrigger value="productos" className="text-xs">
              Productos
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="text-xs">
              Pedidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-3">
            <h2 className="text-lg font-semibold">Reportes Generales</h2>
            {reportesPedidos.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No hay reportes generados</p>
                </CardContent>
              </Card>
            ) : (
              reportesPedidos.map((reporte, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-medium">Reporte Semanal</CardTitle>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(reporte.fecha_corte)}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => descargarExcelGeneral(reporte)}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pedidos:</span>
                      <Badge variant="secondary">{reporte.pedidos.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total productos:</span>
                      <Badge variant="secondary">{calcularTotalProductos(reporte.pedidos)}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="productos" className="space-y-3">
            <h2 className="text-lg font-semibold">Reportes de Productos</h2>
            {reportesProductos.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No hay reportes de productos</p>
                </CardContent>
              </Card>
            ) : (
              reportesProductos.map((reporte, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-medium">Productos por Proveedor</CardTitle>
                        <p className="text-xs text-gray-500">{formatDate(reporte.fecha_corte)}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => descargarExcelProductos(reporte)}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {reporte.proveedores.map((proveedor, provIndex) => (
                      <div key={provIndex} className="border-l-2 border-blue-200 pl-3">
                        <h4 className="font-medium text-sm text-blue-800">{proveedor.proveedor_nombre}</h4>
                        <div className="space-y-1 mt-2">
                          {proveedor.productos.map((producto) => (
                            <div key={producto.articulo_numero} className="text-xs text-gray-600 flex justify-between">
                              <span>
                                #{producto.articulo_numero} // {producto.producto_codigo} - {producto.descripcion}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {producto.cantidad_total}
                              </Badge>
                            </div>
                          ))}
                          {proveedor.productos.length > 3 && (
                            <p className="text-xs text-gray-400">+{proveedor.productos.length - 3} más...</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="pedidos" className="space-y-3">
            <h2 className="text-lg font-semibold">Reportes de Pedidos</h2>
            {reportesPedidosDetalle.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No hay reportes de pedidos</p>
                </CardContent>
              </Card>
            ) : (
              reportesPedidosDetalle.map((reporte, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-medium">Pedidos por Fecha</CardTitle>
                        <p className="text-xs text-gray-500">{formatDate(reporte.fecha_corte)}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => descargarExcelPedidos(reporte)}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {reporte.pedidos.slice(0, 5).map((pedido) => (
                      <div key={pedido.pedido_id} className="border-l-2 border-orange-200 pl-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">
                              #{pedido.pedido_id} - {pedido.cliente_nombre}
                            </h4>
                            <p className="text-xs text-gray-500">{formatDateShort(pedido.fecha_pedido)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {pedido.productos.length} items
                            </Badge>
                            <Link href={`/reportes/pedido/${pedido.pedido_id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          {pedido.productos.slice(0, 2).map((producto, prodIndex) => (
                            <p key={prodIndex} className="text-xs text-gray-600">
                              {producto.cantidad}x {producto.descripcion}
                            </p>
                          ))}
                          {pedido.productos.length > 2 && (
                            <p className="text-xs text-gray-400">+{pedido.productos.length - 2} más...</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {reporte.pedidos.length > 5 && (
                      <p className="text-xs text-gray-400 text-center">+{reporte.pedidos.length - 5} pedidos más...</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
