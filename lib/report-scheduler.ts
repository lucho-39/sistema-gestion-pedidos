import { Database } from "./database"
import type { ReporteAutomatico, Pedido } from "./types"

export class ReportScheduler {
  static async generateAutomaticReport(): Promise<ReporteAutomatico | null> {
    try {
      console.log("Iniciando generación de reporte automático...")

      const pedidosSinReportar = await Database.getPedidosSinReportar()

      if (pedidosSinReportar.length === 0) {
        console.log("No hay pedidos sin reportar")
        return null
      }

      console.log(`Encontrados ${pedidosSinReportar.length} pedidos sin reportar`)

      const now = new Date()
      const lastWednesday = this.getLastWednesdayAt6PM()
      const currentWednesday = this.getCurrentWednesdayAt6PM()

      console.log("Período de reporte:")
      console.log(`- Inicio: ${lastWednesday.toISOString()}`)
      console.log(`- Fin: ${currentWednesday.toISOString()}`)

      // Filtrar pedidos del período actual (desde último miércoles 18:00 hasta hoy 18:00)
      const pedidosDelPeriodo = pedidosSinReportar.filter((pedido) => {
        const fechaPedido = new Date(pedido.fecha_pedido)
        const enPeriodo = fechaPedido >= lastWednesday && fechaPedido <= currentWednesday

        if (enPeriodo) {
          console.log(`- Pedido ${pedido.pedido_id} incluido: ${fechaPedido.toISOString()}`)
        }

        return enPeriodo
      })

      if (pedidosDelPeriodo.length === 0) {
        console.log("No hay pedidos en el período actual")
        return null
      }

      console.log(`${pedidosDelPeriodo.length} pedidos del período serán incluidos en el reporte`)

      const reporteGeneral = this.generateGeneralReport(pedidosDelPeriodo)
      const reporteProductosPorProveedor = this.generateProductosPorProveedorReport(pedidosDelPeriodo)
      const reportePedidos = this.generatePedidosReport(pedidosDelPeriodo)

      const reporteAutomatico: ReporteAutomatico = {
        id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tipo: "automatico",
        fecha_generacion: now.toISOString(),
        fecha_inicio_periodo: lastWednesday.toISOString(),
        fecha_fin_periodo: currentWednesday.toISOString(),
        pedidos_incluidos: pedidosDelPeriodo.map((p) => p.pedido_id),
        reportes: {
          general: reporteGeneral,
          productos_por_proveedor: reporteProductosPorProveedor,
          pedidos: reportePedidos,
        },
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }

      const savedReporte = await Database.createReporteAutomatico(reporteAutomatico)

      if (savedReporte) {
        console.log(`Reporte automático generado con ID: ${savedReporte.id}`)

        await this.markOrdersAsReported(
          pedidosDelPeriodo.map((p) => p.pedido_id),
          savedReporte.id,
        )

        return savedReporte
      }

      return null
    } catch (error) {
      console.error("Error generando reporte automático:", error)
      throw error
    }
  }

  static async generateManualReport(): Promise<ReporteAutomatico | null> {
    try {
      console.log("Iniciando generación de reporte manual...")

      const pedidosSinReportar = await Database.getPedidosSinReportar()

      if (pedidosSinReportar.length === 0) {
        console.log("No hay pedidos sin reportar para reporte manual")
        return null
      }

      console.log(`Generando reporte manual con ${pedidosSinReportar.length} pedidos`)

      const now = new Date()
      const lastWednesday = this.getLastWednesdayAt6PM()

      const pedidosParaReporte = pedidosSinReportar.filter((pedido) => {
        const fechaPedido = new Date(pedido.fecha_pedido)
        return fechaPedido <= now
      })

      if (pedidosParaReporte.length === 0) {
        console.log("No hay pedidos para incluir en el reporte manual")
        return null
      }

      console.log(`${pedidosParaReporte.length} pedidos serán incluidos en el reporte manual`)

      const fechaInicio =
        pedidosParaReporte.length > 0
          ? new Date(Math.min(...pedidosParaReporte.map((p) => new Date(p.fecha_pedido).getTime())))
          : lastWednesday
      const fechaFin = now

      const reporteGeneral = this.generateGeneralReport(pedidosParaReporte)
      const reporteProductosPorProveedor = this.generateProductosPorProveedorReport(pedidosParaReporte)
      const reportePedidos = this.generatePedidosReport(pedidosParaReporte)

      const reporteManual: ReporteAutomatico = {
        id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tipo: "manual",
        fecha_generacion: now.toISOString(),
        fecha_inicio_periodo: fechaInicio.toISOString(),
        fecha_fin_periodo: fechaFin.toISOString(),
        pedidos_incluidos: pedidosParaReporte.map((p) => p.pedido_id),
        reportes: {
          general: reporteGeneral,
          productos_por_proveedor: reporteProductosPorProveedor,
          pedidos: reportePedidos,
        },
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }

      const savedReporte = await Database.createReporteAutomatico(reporteManual)

      if (savedReporte) {
        console.log(`Reporte manual generado con ID: ${savedReporte.id}`)

        await this.markOrdersAsReported(
          pedidosParaReporte.map((p) => p.pedido_id),
          savedReporte.id,
        )

        return savedReporte
      }

      return null
    } catch (error) {
      console.error("Error generando reporte manual:", error)
      throw error
    }
  }

  static shouldGenerateReport(): boolean {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const hour = now.getHours()
    const minute = now.getMinutes()

    // Miércoles (día 3) a las 18:00 (6:00 PM)
    const isWednesday = dayOfWeek === 3
    const isCorrectTime = hour === 18 && minute === 0

    console.log(`Verificando si es momento de generar reporte:`)
    console.log(`- Día actual: ${dayOfWeek} (${isWednesday ? "Miércoles ✓" : "No es miércoles"})`)
    console.log(`- Hora actual: ${hour}:${minute} (${isCorrectTime ? "18:00 ✓" : "No es 18:00"})`)

    return isWednesday && isCorrectTime
  }

  static getNextWednesday(): Date {
    const now = new Date()
    const dayOfWeek = now.getDay()

    let daysUntilWednesday: number

    if (dayOfWeek === 3) {
      const currentHour = now.getHours()

      if (currentHour >= 18) {
        daysUntilWednesday = 7
      } else {
        daysUntilWednesday = 0
      }
    } else if (dayOfWeek < 3) {
      daysUntilWednesday = 3 - dayOfWeek
    } else {
      daysUntilWednesday = 7 - dayOfWeek + 3
    }

    const nextWednesday = new Date(now)
    nextWednesday.setDate(now.getDate() + daysUntilWednesday)
    nextWednesday.setHours(18, 0, 0, 0)

    return nextWednesday
  }

  static getLastWednesdayAt6PM(): Date {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const currentHour = now.getHours()

    let daysAgo: number

    if (dayOfWeek === 3) {
      if (currentHour < 18) {
        daysAgo = 7
      } else {
        daysAgo = 0
      }
    } else if (dayOfWeek > 3) {
      daysAgo = dayOfWeek - 3
    } else {
      daysAgo = dayOfWeek + 4
    }

    const lastWednesday = new Date(now)
    lastWednesday.setDate(now.getDate() - daysAgo)
    lastWednesday.setHours(18, 0, 0, 0)

    return lastWednesday
  }

  static getCurrentWednesdayAt6PM(): Date {
    const now = new Date()
    const dayOfWeek = now.getDay()

    if (dayOfWeek === 3) {
      const currentWednesday = new Date(now)
      currentWednesday.setHours(18, 0, 0, 0)
      return currentWednesday
    } else {
      return this.getNextWednesday()
    }
  }

  static getTimeUntilNextReport(): { days: number; hours: number; minutes: number } {
    const now = new Date()
    const nextReport = this.getNextWednesday()
    const diff = nextReport.getTime() - now.getTime()

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return { days, hours, minutes }
  }

  static async getPendingOrdersCount(): Promise<number> {
    try {
      const pedidosSinReportar = await Database.getPedidosSinReportar()
      return pedidosSinReportar.length
    } catch (error) {
      console.error("Error getting pending orders count:", error)
      return 0
    }
  }

  private static generateGeneralReport(pedidos: Pedido[]) {
    const resumen = {
      total_pedidos: pedidos.length,
      total_productos: pedidos.reduce((sum, p) => sum + (p.productos?.length || 0), 0),
      total_clientes: new Set(pedidos.map((p) => p.cliente_id)).size,
      fecha_inicio:
        pedidos.length > 0
          ? new Date(Math.min(...pedidos.map((p) => new Date(p.fecha_pedido).getTime()))).toISOString()
          : new Date().toISOString(),
      fecha_fin:
        pedidos.length > 0
          ? new Date(Math.max(...pedidos.map((p) => new Date(p.fecha_pedido).getTime()))).toISOString()
          : new Date().toISOString(),
    }

    return {
      fecha_corte: new Date().toISOString(),
      resumen,
      pedidos,
    }
  }

  private static generateProductosPorProveedorReport(pedidos: Pedido[]) {
    const proveedoresMap = new Map()

    pedidos.forEach((pedido) => {
      pedido.productos?.forEach((pedidoProducto) => {
        const producto = pedidoProducto.producto
        if (!producto?.proveedor) return

        const proveedorNombre = producto.proveedor.proveedor_nombre

        if (!proveedoresMap.has(proveedorNombre)) {
          proveedoresMap.set(proveedorNombre, {
            proveedor_id: producto.proveedor.proveedor_id,
            proveedor_nombre: proveedorNombre,
            productos: new Map(),
            total_productos: 0,
          })
        }

        const proveedor = proveedoresMap.get(proveedorNombre)
        const productoKey = producto.articulo_numero

        if (!proveedor.productos.has(productoKey)) {
          proveedor.productos.set(productoKey, {
            articulo_numero: producto.articulo_numero,
            producto_codigo: producto.producto_codigo,
            descripcion: producto.descripcion,
            unidad_medida: producto.unidad_medida,
            cantidad_total: 0,
          })
        }

        const productoData = proveedor.productos.get(productoKey)
        productoData.cantidad_total += pedidoProducto.cantidad
      })
    })

    const proveedores = Array.from(proveedoresMap.values()).map((proveedor) => ({
      ...proveedor,
      productos: Array.from(proveedor.productos.values()),
      total_productos: proveedor.productos.size,
    }))

    return {
      fecha_corte: new Date().toISOString(),
      proveedores,
      total_proveedores: proveedores.length,
    }
  }

  private static generatePedidosReport(pedidos: Pedido[]) {
    const pedidosData = pedidos.map((pedido) => ({
      pedido_id: pedido.pedido_id,
      cliente_nombre: pedido.cliente?.nombre || "N/A",
      fecha_pedido: pedido.fecha_pedido,
      productos:
        pedido.productos?.map((pp) => ({
          descripcion: pp.producto?.descripcion || "N/A",
          cantidad: pp.cantidad,
          unidad_medida: pp.producto?.unidad_medida || "N/A",
        })) || [],
    }))

    return {
      fecha_corte: new Date().toISOString(),
      pedidos: pedidosData,
      total_pedidos: pedidos.length,
    }
  }

  private static async markOrdersAsReported(pedidoIds: number[], reporteId: string): Promise<void> {
    try {
      for (const pedidoId of pedidoIds) {
        await Database.markPedidoAsReported(pedidoId, reporteId)
      }
      console.log(`Marcados ${pedidoIds.length} pedidos como reportados`)
    } catch (error) {
      console.error("Error marking orders as reported:", error)
    }
  }

  static async obtenerHistorialReportes(): Promise<ReporteAutomatico[]> {
    try {
      return await Database.getReportesAutomaticos()
    } catch (error) {
      console.error("Error getting reports history:", error)
      return []
    }
  }
}
