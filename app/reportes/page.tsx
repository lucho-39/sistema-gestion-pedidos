"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Download,
  Calendar,
  Clock,
  FileText,
  Users,
  Package,
  Truck,
  Play,
  Pause,
  RefreshCw,
  Bell,
  BellOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/lib/database"
import { reportAutoScheduler } from "@/lib/report-auto-scheduler"
import { generateExcelFromReporte } from "@/lib/report-excel-generator"
import type { ReporteAutomatico } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface SchedulerStatus {
  isRunning: boolean
  lastCheck: Date | null
  nextReportTime: Date | null
  pendingOrdersCount: number
  timeUntilNext: { days: number; hours: number; minutes: number }
}

export default function ReportesPage() {
  const [reportesAutomaticos, setReportesAutomaticos] = useState<ReporteAutomatico[]>([])
  const [reportesManuales, setReportesManuales] = useState<ReporteAutomatico[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus>({
    isRunning: false,
    lastCheck: null,
    nextReportTime: null,
    pendingOrdersCount: 0,
    timeUntilNext: { days: 0, hours: 0, minutes: 0 },
  })
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadReportes()
    initializeScheduler()
    checkNotificationPermission()

    // Escuchar eventos del programador
    const handleStatusUpdate = (event: CustomEvent) => {
      setSchedulerStatus(event.detail)
    }

    const handleReportGenerated = (event: CustomEvent) => {
      const { reporte } = event.detail
      if (reporte.tipo === "automatico") {
        setReportesAutomaticos((prev) => [reporte, ...prev])
      } else {
        setReportesManuales((prev) => [reporte, ...prev])
      }

      toast({
        title: "Reporte Generado",
        description: `Se ha generado un reporte ${reporte.tipo} con ${reporte.pedidos_incluidos.length} pedidos.`,
      })
    }

    window.addEventListener("schedulerStatusUpdate", handleStatusUpdate as EventListener)
    window.addEventListener("reportGenerated", handleReportGenerated as EventListener)

    return () => {
      window.removeEventListener("schedulerStatusUpdate", handleStatusUpdate as EventListener)
      window.removeEventListener("reportGenerated", handleReportGenerated as EventListener)
    }
  }, [toast])

  const loadReportes = async () => {
    try {
      setIsLoading(true)
      const reportes = await Database.getReportesAutomaticos()

      const automaticos = reportes.filter((r) => r.tipo === "automatico")
      const manuales = reportes.filter((r) => r.tipo === "manual")

      setReportesAutomaticos(automaticos)
      setReportesManuales(manuales)
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

  const initializeScheduler = () => {
    reportAutoScheduler.start()
    setSchedulerStatus(reportAutoScheduler.getStatus())
  }

  const checkNotificationPermission = () => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted")
    }
  }

  const toggleScheduler = () => {
    if (schedulerStatus.isRunning) {
      reportAutoScheduler.stop()
    } else {
      reportAutoScheduler.start()
    }
  }

  const generateManualReport = async () => {
    try {
      const reporte = await reportAutoScheduler.generateManualReport()
      if (reporte) {
        setReportesManuales((prev) => [reporte, ...prev])
      }
    } catch (error) {
      console.error("Error generating manual report:", error)
      toast({
        title: "Error",
        description: "Error al generar el reporte manual",
        variant: "destructive",
      })
    }
  }

  const downloadExcel = async (reporte: ReporteAutomatico, tipo: "general" | "productos_por_proveedor" | "pedidos") => {
    try {
      generateExcelFromReporte(reporte, tipo)
      toast({
        title: "Descarga Iniciada",
        description: `Se ha iniciado la descarga del reporte ${tipo}`,
      })
    } catch (error) {
      console.error("Error downloading Excel:", error)
      toast({
        title: "Error",
        description: "Error al descargar el archivo Excel",
        variant: "destructive",
      })
    }
  }

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false)
    } else {
      const granted = await reportAutoScheduler.requestNotificationPermission()
      setNotificationsEnabled(granted)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-AR")
  }

  const formatTimeUntilNext = (time: { days: number; hours: number; minutes: number }) => {
    if (time.days > 0) {
      return `${time.days}d ${time.hours}h ${time.minutes}m`
    } else if (time.hours > 0) {
      return `${time.hours}h ${time.minutes}m`
    } else {
      return `${time.minutes}m`
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 py-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Sistema de Reportes</h1>
        </div>

        {/* Estado del Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Estado del Sistema</p>
                  <p className="font-medium">{schedulerStatus.isRunning ? "Activo" : "Inactivo"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs text-gray-500">Pedidos Pendientes</p>
                  <p className="font-medium">{schedulerStatus.pendingOrdersCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Próximo Reporte</p>
                  <p className="font-medium text-xs">
                    {schedulerStatus.nextReportTime ? formatTimeUntilNext(schedulerStatus.timeUntilNext) : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-500">Última Verificación</p>
                  <p className="font-medium text-xs">
                    {schedulerStatus.lastCheck ? schedulerStatus.lastCheck.toLocaleTimeString("es-AR") : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Controles del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={toggleScheduler} variant={schedulerStatus.isRunning ? "destructive" : "default"}>
                {schedulerStatus.isRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Detener Sistema
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Sistema
                  </>
                )}
              </Button>

              <Button onClick={generateManualReport} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generar Reporte Manual
              </Button>

              <Button
                onClick={toggleNotifications}
                variant="outline"
                className={notificationsEnabled ? "bg-green-50" : ""}
              >
                {notificationsEnabled ? (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Notificaciones ON
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4 mr-2" />
                    Notificaciones OFF
                  </>
                )}
              </Button>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Sistema Automático:</strong> Genera reportes los miércoles a las 10:59 AM
              </p>
              <p>
                <strong>Período:</strong> Desde el miércoles anterior a las 11:00 AM
              </p>
              <p>
                <strong>Exclusión:</strong> Solo incluye pedidos no reportados anteriormente
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pestañas de Reportes */}
        <Tabs defaultValue="automaticos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="automaticos">Reportes Automáticos ({reportesAutomaticos.length})</TabsTrigger>
            <TabsTrigger value="manuales">Reportes Manuales ({reportesManuales.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="automaticos" className="space-y-4">
            {reportesAutomaticos.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No hay reportes automáticos generados</p>
                </CardContent>
              </Card>
            ) : (
              reportesAutomaticos.map((reporte) => (
                <Card key={reporte.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">Reporte Automático #{reporte.id.slice(-8)}</CardTitle>
                        <p className="text-sm text-gray-500">{formatDate(reporte.fecha_generacion)}</p>
                      </div>
                      <Badge variant="secondary">Automático</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Pedidos</p>
                        <p className="font-medium">{reporte.pedidos_incluidos.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Período Inicio</p>
                        <p className="font-medium">
                          {new Date(reporte.fecha_inicio_periodo).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Período Fin</p>
                        <p className="font-medium">{new Date(reporte.fecha_fin_periodo).toLocaleDateString("es-AR")}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Proveedores</p>
                        <p className="font-medium">{reporte.reportes.productos_por_proveedor.proveedores.length}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => downloadExcel(reporte, "general")}>
                        <Download className="h-3 w-3 mr-1" />
                        General
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadExcel(reporte, "productos_por_proveedor")}
                      >
                        <Truck className="h-3 w-3 mr-1" />
                        Por Proveedor
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadExcel(reporte, "pedidos")}>
                        <Users className="h-3 w-3 mr-1" />
                        Pedidos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="manuales" className="space-y-4">
            {reportesManuales.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No hay reportes manuales generados</p>
                  <Button onClick={generateManualReport} className="mt-2" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Primer Reporte
                  </Button>
                </CardContent>
              </Card>
            ) : (
              reportesManuales.map((reporte) => (
                <Card key={reporte.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">Reporte Manual #{reporte.id.slice(-8)}</CardTitle>
                        <p className="text-sm text-gray-500">{formatDate(reporte.fecha_generacion)}</p>
                      </div>
                      <Badge variant="outline">Manual</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Pedidos</p>
                        <p className="font-medium">{reporte.pedidos_incluidos.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Período Inicio</p>
                        <p className="font-medium">
                          {new Date(reporte.fecha_inicio_periodo).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Período Fin</p>
                        <p className="font-medium">{new Date(reporte.fecha_fin_periodo).toLocaleDateString("es-AR")}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Proveedores</p>
                        <p className="font-medium">{reporte.reportes.productos_por_proveedor.proveedores.length}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => downloadExcel(reporte, "general")}>
                        <Download className="h-3 w-3 mr-1" />
                        General
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadExcel(reporte, "productos_por_proveedor")}
                      >
                        <Truck className="h-3 w-3 mr-1" />
                        Por Proveedor
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => downloadExcel(reporte, "pedidos")}>
                        <Users className="h-3 w-3 mr-1" />
                        Pedidos
                      </Button>
                    </div>
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
