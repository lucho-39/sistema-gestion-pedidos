import { ReportScheduler } from "./report-scheduler"
import { generateExcelFromReporte } from "./report-excel-generator"
import type { ReporteAutomatico } from "./types"

export class ReportAutoScheduler {
  private static instance: ReportAutoScheduler | null = null
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false
  private lastCheck: Date | null = null
  private nextReportTime: Date | null = null
  private pendingOrdersCount = 0

  static getInstance(): ReportAutoScheduler {
    if (!this.instance) {
      this.instance = new ReportAutoScheduler()
    }
    return this.instance
  }

  start(): void {
    if (this.isRunning) {
      console.log("El programador automático ya está ejecutándose")
      return
    }

    this.isRunning = true
    this.nextReportTime = ReportScheduler.getNextWednesday()

    // Verificar cada minuto
    this.intervalId = setInterval(() => {
      this.checkAndGenerateReport()
    }, 60000) // 60 segundos

    // Verificación inicial
    this.checkAndGenerateReport()

    console.log("Programador automático iniciado")
    this.dispatchStatusUpdate()
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log("Programador automático detenido")
    this.dispatchStatusUpdate()
  }

  private async checkAndGenerateReport(): Promise<void> {
    try {
      this.lastCheck = new Date()

      // Actualizar contador de pedidos pendientes
      this.pendingOrdersCount = await ReportScheduler.getPendingOrdersCount()

      // Verificar si es momento de generar reporte
      if (ReportScheduler.shouldGenerateReport()) {
        console.log("Generando reporte automático...")

        const reporte = await ReportScheduler.generateAutomaticReport()

        if (reporte) {
          // Mostrar notificación
          this.showNotification(
            "Reporte Automático Generado",
            `Se ha generado un reporte automático con ${reporte.pedidos_incluidos.length} pedidos.`,
          )

          // Actualizar próximo reporte
          this.nextReportTime = ReportScheduler.getNextWednesday()

          // Disparar evento personalizado
          this.dispatchReportGenerated(reporte)
        } else {
          console.log("No se generó reporte automático (sin pedidos nuevos)")
        }
      }

      this.dispatchStatusUpdate()
    } catch (error) {
      console.error("Error en verificación automática:", error)
    }
  }

  async generateManualReport(): Promise<ReporteAutomatico | null> {
    try {
      console.log("Generando reporte manual...")

      const reporte = await ReportScheduler.generateManualReport()

      if (reporte) {
        // Mostrar notificación
        this.showNotification(
          "Reporte Manual Generado",
          `Se ha generado un reporte manual con ${reporte.pedidos_incluidos.length} pedidos.`,
        )

        // Actualizar contador
        this.pendingOrdersCount = await ReportScheduler.getPendingOrdersCount()

        // Disparar evento personalizado
        this.dispatchReportGenerated(reporte)
        this.dispatchStatusUpdate()

        return reporte
      } else {
        this.showNotification("Sin Pedidos Pendientes", "No hay pedidos pendientes para incluir en el reporte.")
        return null
      }
    } catch (error) {
      console.error("Error generando reporte manual:", error)
      this.showNotification("Error", "Error al generar el reporte manual.")
      return null
    }
  }

  async downloadReportExcel(
    reporte: ReporteAutomatico,
    tipo: "general" | "productos_por_proveedor" | "pedidos",
  ): Promise<void> {
    try {
      await generateExcelFromReporte(reporte, tipo)

      this.showNotification("Descarga Iniciada", `Se ha iniciado la descarga del reporte ${tipo}.`)
    } catch (error) {
      console.error("Error descargando reporte Excel:", error)
      this.showNotification("Error de Descarga", "Error al descargar el reporte Excel.")
      throw error
    }
  }

  private showNotification(title: string, body: string): void {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      })
    } else if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, {
            body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
          })
        }
      })
    }
  }

  private dispatchReportGenerated(reporte: ReporteAutomatico): void {
    const event = new CustomEvent("reportGenerated", {
      detail: { reporte },
    })
    window.dispatchEvent(event)
  }

  private dispatchStatusUpdate(): void {
    const timeUntilNext = ReportScheduler.getTimeUntilNextReport()

    const event = new CustomEvent("schedulerStatusUpdate", {
      detail: {
        isRunning: this.isRunning,
        lastCheck: this.lastCheck,
        nextReportTime: this.nextReportTime,
        pendingOrdersCount: this.pendingOrdersCount,
        timeUntilNext,
      },
    })
    window.dispatchEvent(event)
  }

  // Getters para el estado actual
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: this.lastCheck,
      nextReportTime: this.nextReportTime,
      pendingOrdersCount: this.pendingOrdersCount,
      timeUntilNext: ReportScheduler.getTimeUntilNextReport(),
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }
    return false
  }
}

// Instancia global
export const reportAutoScheduler = ReportAutoScheduler.getInstance()
