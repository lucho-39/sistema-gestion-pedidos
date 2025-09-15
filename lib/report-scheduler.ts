import { Database } from "./database"
import type { ReporteAutomatico, Pedido } from "./types"

export class ReportScheduler {
  static async generateAutomaticReport(): Promise<ReporteAutomatico | null> {
    try {
      console.log("Iniciando generación de reporte automático...")

      // Obtener pedidos sin reportar
      const pedidosSinReportar = await Database.getPedidosSinReportar()

      if (pedidosSinReportar.length === 0) {
        console.log("No hay pedidos sin reportar")
        return null
      }

      console.log(`Encontrados ${pedidosSinReportar.length} pedidos sin reportar`)

      // Calcular fechas del período
      const now = new Date()
      const lastWednesday = this.getLastWednesday()
      const currentWednesday = this.getCurrentWednesday()

      // Filtrar pedidos del período actual
      const pedidosDelPeriodo = pedidosSinReportar.filter((pedido) => {
        const fechaPedido = new Date(pedido.fecha_pedido)
        return fechaPedido >= lastWednesday && fechaPedido < currentWednesday
      })

      if (pedidosDelPeriodo.length === 0) {
        console.log("No hay pedidos en el período actual")
        return null
      }

      // Generar reportes
      const reporteGeneral = this.generateGeneralReport(pedidosDelPeriodo)
      const reporteProductosPorProveedor = this.generateProductosPorProveedorReport(pedidosDelPeriodo)
      const reportePedidos = this.generatePedidosReport(pedidosDelPeriodo)

      // Crear reporte automático
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

      // Guardar en base de datos usando el método correcto
      const savedReporte = await Database.createReporteAutomatico(reporteAutomatico)

      if (savedReporte) {
        console.log(`Reporte automático generado con ID: ${savedReporte.id}`)

        // Marcar pedidos como incluidos en reporte
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

      // Obtener pedidos sin reportar
      const pedidosSinReportar = await Database.getPedidosSinReportar()

      if (pedidosSinReportar.length === 0) {
        console.log("No hay pedidos sin reportar para reporte manual")
        return null
      }

      console.log(`Generando reporte manual con ${pedidosSinReportar.length} pedidos`)

      // Para reportes manuales, aplicar la regla de corte del miércoles 10:59 AM
      const now = new Date()
      const lastWednesday = this.getLastWednesday()

      // Filtrar pedidos hasta el último miércoles a las 10:59 AM
      const pedidosParaReporte = pedidosSinReportar.filter((pedido) => {
        const fechaPedido = new Date(pedido.fecha_pedido)
        return fechaPedido < lastWednesday
      })

      if (pedidosParaReporte.length === 0) {
        console.log("No hay pedidos que cumplan con la regla de corte del miércoles 10:59 AM")
        return null
      }

      console.log(`Aplicando regla de corte: ${pedidosParaReporte.length} pedidos incluidos`)

      // Calcular fechas del período
      const fechaInicio =
        pedidosParaReporte.length > 0
          ? new Date(Math.min(...pedidosParaReporte.map((p) => new Date(p.fecha_pedido).getTime())))
          : lastWednesday
      const fechaFin = lastWednesday

      // Generar reportes
      const reporteGeneral = this.generateGeneralReport(pedidosParaReporte)
      const reporteProductosPorProveedor = this.generateProductosPorProveedorReport(pedidosParaReporte)
      const reportePedidos = this.generatePedidosReport(pedidosParaReporte)

      // Crear reporte manual
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

      // Guardar en base de datos usando el método correcto
      const savedReporte = await Database.createReporteAutomatico(reporteManual)

      if (savedReporte) {
        console.log(`Reporte manual generado con ID: ${savedReporte.id}`)

        // Marcar pedidos como incluidos en reporte
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
    const dayOfWeek = now.getDay() // 0 = domingo, 3 = miércoles
    const hour = now.getHours()
    const minute = now.getMinutes()

    // Miércoles a las 10:59 AM
    return dayOfWeek === 3 && hour === 10 && minute === 59
  }

  static getNextWednesday(): Date {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const daysUntilWednesday = dayOfWeek <= 3 ? 3 - dayOfWeek : 7 - dayOfWeek + 3

    const nextWednesday = new Date(now)
    nextWednesday.setDate(now.getDate() + daysUntilWednesday)
    nextWednesday.setHours(10, 59, 0, 0)

    return nextWednesday
  }

  static getLastWednesday(): Date {
    const now = new Date()
    const dayOfWeek = now.getDay()

    // Calcular días desde el último miércoles
    let daysSinceLastWednesday: number
    if (dayOfWeek === 3) {
      // Si es miércoles, verificar la hora
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()

      if (currentHour < 10 || (currentHour === 10 && currentMinute < 59)) {
        // Si es antes de las 10:59 AM, usar el miércoles anterior
        daysSinceLastWednesday = 7
      } else {
        // Si es después de las 10:59 AM, usar hoy
        daysSinceLastWednesday = 0
      }
    } else if (dayOfWeek > 3) {
      // Jueves a sábado
      daysSinceLastWednesday = dayOfWeek - 3
    } else {
      // Domingo a martes
      daysSinceLastWednesday = dayOfWeek + 4
    }

    const lastWednesday = new Date(now)
    lastWednesday.setDate(now.getDate() - daysSinceLastWednesday)
    lastWednesday.setHours(10, 59, 0, 0) // 10:59 AM del miércoles

    return lastWednesday
  }

  static getCurrentWednesday(): Date {
    const now = new Date()
    const dayOfWeek = now.getDay()

    if (dayOfWeek === 3) {
      // Si es miércoles, usar hoy a las 10:59 AM
      const currentWednesday = new Date(now)
      currentWednesday.setHours(10, 59, 0, 0)
      return currentWednesday
    } else {
      // Si no es miércoles, obtener el próximo miércoles
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
            producto_codigo: producto.producto_codigo, // Agregar código del producto
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
