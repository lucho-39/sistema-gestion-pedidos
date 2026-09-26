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
      const desde = this.getPreviousCutoff()
      const hasta = this.getCurrentCutoff()

      console.log("Período de reporte:")
      console.log(`- Inicio: ${desde.toISOString()}`)
      console.log(`- Fin: ${hasta.toISOString()}`)

      // Solo los pedidos del período: desde el corte anterior hasta el corte
      // vigente (miércoles 10:59 de Argentina). El reporte manual respeta la
      // misma regla de corte que el automático.
      const pedidosDelPeriodo = pedidosSinReportar.filter((pedido) => {
        const fechaPedido = new Date(pedido.fecha_pedido)
        const enPeriodo = fechaPedido >= desde && fechaPedido <= hasta

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
        fecha_inicio_periodo: desde.toISOString(),
        fecha_fin_periodo: hasta.toISOString(),
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
      const lastWednesday = this.getPreviousCutoff()

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

  // El corte semanal es el miercoles a las 10:59 en Argentina, que son las
  // 13:59 UTC. Se calcula en UTC a proposito: asi da el mismo instante en el
  // navegador (que corre en hora local) y en el servidor (que corre en UTC).
  // Argentina no cambia de horario, asi que el desfasaje es fijo.
  private static readonly CORTE_HORA_UTC = 13
  private static readonly CORTE_MINUTO_UTC = 59

  static shouldGenerateReport(): boolean {
    const ahora = new Date()
    const corte = this.getCurrentCutoff()
    // El cron pasa una vez por minuto cerca del corte; si por lo que sea corre
    // unos segundos despues, igual cuenta.
    const diff = ahora.getTime() - corte.getTime()
    return diff >= 0 && diff < 120_000
  }

  /** El corte vigente: el ultimo miercoles 10:59 (13:59 UTC) que ya paso. */
  static getCurrentCutoff(): Date {
    const ahora = new Date()
    const corte = new Date(ahora)
    corte.setUTCHours(this.CORTE_HORA_UTC, this.CORTE_MINUTO_UTC, 0, 0)

    // Cuantos dias retroceder para caer en el miercoles del corte.
    const atras = (ahora.getUTCDay() + 7 - 3) % 7
    corte.setUTCDate(corte.getUTCDate() - atras)

    // Tolerancia de una hora: en el plan Hobby los cron de Vercel corren en
    // cualquier momento dentro de la hora programada. Si el reporte sale a las
    // 13:05, el corte de hoy a las 13:59 todavia "no paso" y el periodo se iria
    // a la semana anterior, dejando el reporte vacio sin ningun error visible.
    // Un corte que cae dentro de la proxima hora se toma como el vigente.
    const tolerancia = 60 * 60 * 1000
    if (corte.getTime() > ahora.getTime() + tolerancia) {
      corte.setUTCDate(corte.getUTCDate() - 7)
    }

    return corte
  }

  /** El corte anterior: donde arranca el periodo que se reporta. */
  static getPreviousCutoff(): Date {
    const anterior = this.getCurrentCutoff()
    anterior.setUTCDate(anterior.getUTCDate() - 7)
    return anterior
  }

  /** El proximo corte, para mostrar cuanto falta. */
  static getNextCutoff(): Date {
    const proximo = this.getCurrentCutoff()
    proximo.setUTCDate(proximo.getUTCDate() + 7)
    return proximo
  }

  /** Se mantiene para no romper llamadas existentes. */
  static getNextWednesday(): Date {
    return this.getNextCutoff()
  }

  static getTimeUntilNextReport(): { days: number; hours: number; minutes: number } {
    const ahora = new Date()
    const proximo = this.getNextCutoff()
    const diff = proximo.getTime() - ahora.getTime()

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
            unidad_medida: producto.categoria?.unidad || "unidad",
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
      cliente_codigo: pedido.cliente?.cliente_codigo ?? "N/A",
      fecha_pedido: pedido.fecha_pedido,
      productos:
        pedido.productos?.map((pp) => ({
          descripcion: pp.producto?.descripcion || "N/A",
          cantidad: pp.cantidad,
          unidad_medida: pp.producto?.categoria?.unidad || "unidad",
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
