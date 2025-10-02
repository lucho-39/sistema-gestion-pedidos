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
  private lastReportGeneration: Date | null = null

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

    console.log("=== INICIANDO PROGRAMADOR AUTOMÁTICO ===")
    console.log(`Próximo reporte programado para: ${this.nextReportTime.toLocaleString("es-AR")}`)

    // Verificar cada minuto (60 segundos)
    this.intervalId = setInterval(() => {
      this.checkAndGenerateReport()
    }, 60000)

    // Verificación inicial inmediata
    this.checkAndGenerateReport()

    console.log("Programador automático iniciado - Verificando cada 60 segundos")
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

      console.log(`\n=== VERIFICACIÓN AUTOMÁTICA: ${this.lastCheck.toLocaleTimeString("es-AR")} ===`)

      // Actualizar contador de pedidos pendientes
      this.pendingOrdersCount = await ReportScheduler.getPendingOrdersCount()
      console.log(`Pedidos sin reportar: ${this.pendingOrdersCount}`)

      // Verificar si es momento de generar reporte
      const shouldGenerate = ReportScheduler.shouldGenerateReport()

      if (shouldGenerate) {
        console.log("✓ ES MOMENTO DE GENERAR REPORTE AUTOMÁTICO")

        // Verificar si ya se generó un reporte en los últimos 2 minutos
        // (para evitar duplicados si la verificación se ejecuta múltiples veces)
        if (this.lastReportGeneration) {
          const timeSinceLastReport = Date.now() - this.lastReportGeneration.getTime()
          const twoMinutesInMs = 2 * 60 * 1000

          if (timeSinceLastReport < twoMinutesInMs) {
            console.log("⚠ Ya se generó un reporte hace menos de 2 minutos, omitiendo...")
            this.dispatchStatusUpdate()
            return
          }
        }

        console.log("Generando reporte automático...")
        const reporte = await ReportScheduler.generateAutomaticReport()

        if (reporte) {
          this.lastReportGeneration = new Date()

          console.log(`✓ REPORTE GENERADO EXITOSAMENTE`)
          console.log(`  - ID: ${reporte.id}`)
          console.log(`  - Pedidos incluidos: ${reporte.pedidos_incluidos.length}`)
          console.log(
            `  - Período: ${new Date(reporte.fecha_inicio_periodo).toLocaleDateString("es-AR")} - ${new Date(reporte.fecha_fin_periodo).toLocaleDateString("es-AR")}`,
          )

          // Mostrar notificación
          this.showNotification(
            "Reporte Automático Generado",
            `Se generó un reporte con ${reporte.pedidos_incluidos.length} pedidos del período semanal.`,
          )

          // Actualizar próximo reporte
          this.nextReportTime = ReportScheduler.getNextWednesday()
          console.log(`Próximo reporte: ${this.nextReportTime.toLocaleString("es-AR")}`)

          // Disparar evento personalizado
          this.dispatchReportGenerated(reporte)
        } else {
          console.log("⚠ No se generó reporte (sin pedidos nuevos en el período)")
        }
      } else {
        console.log("○ No es momento de generar reporte")

        // Mostrar tiempo hasta el próximo reporte
        const timeUntil = ReportScheduler.getTimeUntilNextReport()
        console.log(`Próximo reporte en: ${timeUntil.days}d ${timeUntil.hours}h ${timeUntil.minutes}m`)
      }

      this.dispatchStatusUpdate()
    } catch (error) {
      console.error("❌ Error en verificación automática:", error)
    }
  }

  async generateManualReport(): Promise<ReporteAutomatico | null> {
    try {
      console.log("\n=== GENERANDO REPORTE MANUAL ===")

      const reporte = await ReportScheduler.generateManualReport()

      if (reporte) {
        console.log(`✓ REPORTE MANUAL GENERADO`)
        console.log(`  - ID: ${reporte.id}`)
        console.log(`  - Pedidos incluidos: ${reporte.pedidos_incluidos.length}`)

        // Mostrar notificación
        this.showNotification(
          "Reporte Manual Generado",
          `Se generó un reporte manual con ${reporte.pedidos_incluidos.length} pedidos.`,
        )

        // Actualizar contador
        this.pendingOrdersCount = await ReportScheduler.getPendingOrdersCount()

        // Disparar evento personalizado
        this.dispatchReportGenerated(reporte)
        this.dispatchStatusUpdate()

        return reporte
      } else {
        console.log("⚠ No hay pedidos pendientes para incluir en el reporte")
        this.showNotification("Sin Pedidos Pendientes", "No hay pedidos pendientes para incluir en el reporte.")
        return null
      }
    } catch (error) {
      console.error("❌ Error generando reporte manual:", error)
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
