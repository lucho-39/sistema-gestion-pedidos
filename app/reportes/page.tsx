"use client"

import { useState, useEffect } from "react"
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
  History,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database } from "@/lib/database"
import { reportAutoScheduler } from "@/lib/report-auto-scheduler"
import { ReportHistoricalGenerator } from "@/lib/report-historical-generator"
import { generateExcelFromReporte } from "@/lib/report-excel-generator"
import type { ReporteAutomatico } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

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
  const [isGeneratingHistorical, setIsGeneratingHistorical] = useState(false)
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

  const generateHistoricalReports = async () => {
    try {
      setIsGeneratingHistorical(true)

      toast({
        title: "Generando Reportes Históricos",
        description: "Este proceso puede tomar varios minutos...",
      })

      const resultado = await ReportHistoricalGenerator.generateHistoricalReports()

      if (resultado.success) {
        toast({
          title: "Reportes Históricos Generados",
          description: `Se generaron ${resultado.reportesGenerados} reportes históricos exitosamente.`,
        })

        await loadReportes()
      } else {
        toast({
          title: "Generación Parcial",
          description: `Se generaron ${resultado.reportesGenerados} reportes, pero hubo ${resultado.errores.length} errores.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating historical reports:", error)
      toast({
        title: "Error",
        description: "Error al generar reportes históricos",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingHistorical(false)
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
      <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex items-center gap-3 py-2 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="touch-manipulation">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold">Reportes</h1>
          </div>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando reportes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 py-2 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="touch-manipulation">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold">Sistema de Reportes</h1>
        </div>

        {/* Estado del Sistema */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">Estado</p>
                  <p className="font-medium text-sm md:text-base truncate">
                    {schedulerStatus.isRunning ? "Activo" : "Inactivo"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">Pendientes</p>
                  <p className="font-medium text-sm md:text-base">{schedulerStatus.pendingOrdersCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">Próximo</p>
                  <p className="font-medium text-xs md:text-sm truncate">
                    {schedulerStatus.nextReportTime ? formatTimeUntilNext(schedulerStatus.timeUntilNext) : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 truncate">Última</p>
                  <p className="font-medium text-xs md:text-sm truncate">
                    {schedulerStatus.lastCheck ? schedulerStatus.lastCheck.toLocaleTimeString("es-AR") : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Controles del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 md:gap-3">
              <Button
                onClick={toggleScheduler}
                variant={schedulerStatus.isRunning ? "destructive" : "default"}
                className="w-full sm:w-auto h-11 text-sm touch-manipulation"
              >
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

              <Button
                onClick={generateManualReport}
                variant="outline"
                className="w-full sm:w-auto h-11 text-sm touch-manipulation bg-transparent"
              >
                <FileText className="h-4 w-4 mr-2" />
                Reporte Manual
              </Button>

              <Button
                onClick={generateHistoricalReports}
                variant="outline"
                disabled={isGeneratingHistorical}
                className="w-full sm:w-auto h-11 text-sm touch-manipulation bg-blue-50 hover:bg-blue-100"
              >
                {isGeneratingHistorical ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <History className="h-4 w-4 mr-2" />
                    Históricos
                  </>
                )}
              </Button>

              <Button
                onClick={toggleNotifications}
                variant="outline"
                className={`w-full sm:w-auto h-11 text-sm touch-manipulation ${notificationsEnabled ? "bg-green-50" : "bg-transparent"}`}
              >
                {notificationsEnabled ? (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Notif. ON
                  </>
                ) : (
                  <>
                    <BellOff className="h-4 w-4 mr-2" />
                    Notif. OFF
                  </>
                )}
              </Button>
            </div>

            <Alert className="mt-4">
              <History className="h-4 w-4" />
              <AlertDescription className="text-xs md:text-sm">
                <strong>Reportes Históricos:</strong> Genera automáticamente un reporte por cada semana anterior que
                tenga pedidos sin reportar. Los pedidos se agrupan desde miércoles 11:00 AM a miércoles 10:59 AM.
              </AlertDescription>
            </Alert>

            <div className="text-xs md:text-sm text-gray-600 space-y-1">
              <p>
                <strong>Sistema Automático:</strong> Genera reportes los miércoles a las 10:59 AM
              </p>
              <p>
                <strong>Período:</strong> Desde el miércoles anterior a las 11:00 AM hasta el miércoles actual a las
                10:59 AM
              </p>
              <p>
                <strong>Exclusión:</strong> Solo incluye pedidos no reportados anteriormente
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pestañas de Reportes */}
        <Tabs defaultValue="automaticos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-11">
            <TabsTrigger value="automaticos" className="text-xs md:text-sm">
              Automáticos ({reportesAutomaticos.length})
            </TabsTrigger>
            <TabsTrigger value="manuales" className="text-xs md:text-sm">
              Manuales ({reportesManuales.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="automaticos" className="space-y-3 md:space-y-4">
            {reportesAutomaticos.length === 0 ? (
              <Card>
                <CardContent className="p-6 md:p-8 text-center">
                  <FileText className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm md:text-base text-gray-500 mb-4">No hay reportes automáticos generados</p>
                  <Button
                    onClick={generateHistoricalReports}
                    size="sm"
                    disabled={isGeneratingHistorical}
                    className="touch-manipulation"
                  >
                    {isGeneratingHistorical ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <History className="h-4 w-4 mr-2" />
                        Generar Reportes Históricos
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              reportesAutomaticos.map((reporte) => (
                <Card key={reporte.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm md:text-base truncate">
                            Reporte #{reporte.id.slice(-8)}
                          </CardTitle>
                          <p className="text-xs md:text-sm text-gray-500 mt-1">
                            {formatDate(reporte.fecha_generacion)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            Automático
                          </Badge>
                          {reporte.id.startsWith("historico_") && (
                            <Badge variant="outline" className="text-xs">
                              Histórico
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs md:text-sm">
                        <div>
                          <p className="text-gray-500">Pedidos</p>
                          <p className="font-medium">{reporte.pedidos_incluidos.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Inicio</p>
                          <p className="font-medium">
                            {new Date(reporte.fecha_inicio_periodo).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Fin</p>
                          <p className="font-medium">
                            {new Date(reporte.fecha_fin_periodo).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Proveedores</p>
                          <p className="font-medium">{reporte.reportes.productos_por_proveedor.proveedores.length}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadExcel(reporte, "general")}
                          className="w-full h-10 text-xs touch-manipulation bg-transparent"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          General
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadExcel(reporte, "productos_por_proveedor")}
                          className="w-full h-10 text-xs touch-manipulation bg-transparent"
                        >
                          <Truck className="h-3 w-3 mr-1" />
                          Por Proveedor
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadExcel(reporte, "pedidos")}
                          className="w-full h-10 text-xs touch-manipulation bg-transparent"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Pedidos
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="manuales" className="space-y-3 md:space-y-4">
            {reportesManuales.length === 0 ? (
              <Card>
                <CardContent className="p-6 md:p-8 text-center">
                  <FileText className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm md:text-base text-gray-500 mb-4">No hay reportes manuales generados</p>
                  <Button onClick={generateManualReport} size="sm" className="touch-manipulation">
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Primer Reporte
                  </Button>
                </CardContent>
              </Card>
            ) : (
              reportesManuales.map((reporte) => (
                <Card key={reporte.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm md:text-base truncate">
                            Reporte #{reporte.id.slice(-8)}
                          </CardTitle>
                          <p className="text-xs md:text-sm text-gray-500 mt-1">
                            {formatDate(reporte.fecha_generacion)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          Manual
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs md:text-sm">
                        <div>
                          <p className="text-gray-500">Pedidos</p>
                          <p className="font-medium">{reporte.pedidos_incluidos.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Inicio</p>
                          <p className="font-medium">
                            {new Date(reporte.fecha_inicio_periodo).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Fin</p>
                          <p className="font-medium">
                            {new Date(reporte.fecha_fin_periodo).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Proveedores</p>
                          <p className="font-medium">{reporte.reportes.productos_por_proveedor.proveedores.length}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadExcel(reporte, "general")}
                          className="w-full h-10 text-xs touch-manipulation bg-transparent"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          General
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadExcel(reporte, "productos_por_proveedor")}
                          className="w-full h-10 text-xs touch-manipulation bg-transparent"
                        >
                          <Truck className="h-3 w-3 mr-1" />
                          Por Proveedor
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadExcel(reporte, "pedidos")}
                          className="w-full h-10 text-xs touch-manipulation bg-transparent"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          Pedidos
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
