import { Database } from "./database"
import type { ReporteAutomatico, Pedido } from "./types"

export class ReportHistoricalGenerator {
  /**
   * Genera reportes históricos agrupando pedidos por semanas
   * desde el pedido más antiguo hasta la última semana completa
   */
  static async generateHistoricalReports(): Promise<{
    success: boolean
    reportesGenerados: number
    errores: string[]
  }> {
    const errores: string[] = []
    let reportesGenerados = 0

    try {
      console.log("=== INICIANDO GENERACIÓN DE REPORTES HISTÓRICOS ===")

      // 1. Obtener TODOS los pedidos de la base de datos
      const todosPedidos = await Database.getPedidos()

      if (todosPedidos.length === 0) {
        console.log("No hay pedidos en la base de datos")
        return { success: true, reportesGenerados: 0, errores: [] }
      }

      console.log(`Total de pedidos en la base de datos: ${todosPedidos.length}`)

      // 2. Ordenar pedidos por fecha (más antiguo primero)
      const pedidosOrdenados = todosPedidos.sort((a, b) => {
        return new Date(a.fecha_pedido).getTime() - new Date(b.fecha_pedido).getTime()
      })

      const primerPedido = pedidosOrdenados[0]
      const ultimoPedido = pedidosOrdenados[pedidosOrdenados.length - 1]

      console.log(`Rango de pedidos:`)
      console.log(`  - Más antiguo: ${new Date(primerPedido.fecha_pedido).toLocaleDateString("es-AR")}`)
      console.log(`  - Más reciente: ${new Date(ultimoPedido.fecha_pedido).toLocaleDateString("es-AR")}`)

      // 3. Obtener reportes existentes para no duplicar
      const reportesExistentes = await Database.getReportesAutomaticos()
      const pedidosYaReportados = new Set<number>()

      reportesExistentes.forEach((reporte) => {
        reporte.pedidos_incluidos.forEach((pedidoId) => {
          pedidosYaReportados.add(pedidoId)
        })
      })

      console.log(`Pedidos ya reportados: ${pedidosYaReportados.size}`)

      // 4. Filtrar solo pedidos no reportados
      const pedidosNoReportados = pedidosOrdenados.filter((pedido) => !pedidosYaReportados.has(pedido.pedido_id))

      console.log(`Pedidos sin reportar: ${pedidosNoReportados.length}`)

      if (pedidosNoReportados.length === 0) {
        console.log("Todos los pedidos ya han sido reportados")
        return { success: true, reportesGenerados: 0, errores: [] }
      }

      // 5. Agrupar pedidos por semanas (miércoles a miércoles)
      const semanas = this.agruparPedidosPorSemana(pedidosNoReportados)

      console.log(`\nSemanas encontradas: ${semanas.length}`)

      // 6. Generar un reporte por cada semana
      for (let i = 0; i < semanas.length; i++) {
        const semana = semanas[i]

        console.log(`\n--- Procesando semana ${i + 1}/${semanas.length} ---`)
        console.log(`Período: ${semana.inicio.toLocaleDateString("es-AR")} - ${semana.fin.toLocaleDateString("es-AR")}`)
        console.log(`Pedidos en esta semana: ${semana.pedidos.length}`)

        try {
          const reporte = await this.generarReporteParaSemana(semana.inicio, semana.fin, semana.pedidos)

          if (reporte) {
            reportesGenerados++
            console.log(`✓ Reporte generado: ${reporte.id}`)

            // Marcar pedidos como reportados
            for (const pedido of semana.pedidos) {
              await Database.markPedidoAsReported(pedido.pedido_id, reporte.id)
            }
          } else {
            errores.push(`No se pudo generar reporte para semana ${i + 1}`)
          }
        } catch (error) {
          const errorMsg = `Error generando reporte para semana ${i + 1}: ${error}`
          console.error(errorMsg)
          errores.push(errorMsg)
        }
      }

      console.log(`\n=== GENERACIÓN COMPLETADA ===`)
      console.log(`Reportes generados: ${reportesGenerados}`)
      console.log(`Errores: ${errores.length}`)

      return {
        success: errores.length === 0,
        reportesGenerados,
        errores,
      }
    } catch (error) {
      console.error("Error en generación de reportes históricos:", error)
      errores.push(`Error general: ${error}`)
      return {
        success: false,
        reportesGenerados,
        errores,
      }
    }
  }

  /**
   * Agrupa pedidos por semanas (miércoles 11:00 AM a miércoles 10:59 AM)
   */
  private static agruparPedidosPorSemana(pedidos: Pedido[]): Array<{
    inicio: Date
    fin: Date
    pedidos: Pedido[]
  }> {
    if (pedidos.length === 0) return []

    const semanas: Array<{ inicio: Date; fin: Date; pedidos: Pedido[] }> = []

    // Obtener el primer miércoles antes o igual al primer pedido
    const primerPedidoFecha = new Date(pedidos[0].fecha_pedido)
    let inicioSemanaActual = this.obtenerMiercolesAnterior(primerPedidoFecha)
    inicioSemanaActual.setHours(11, 0, 0, 0)

    let pedidosSemanaActual: Pedido[] = []

    for (const pedido of pedidos) {
      const fechaPedido = new Date(pedido.fecha_pedido)

      // Calcular fin de la semana actual (miércoles siguiente a las 10:59 AM)
      const finSemanaActual = new Date(inicioSemanaActual)
      finSemanaActual.setDate(finSemanaActual.getDate() + 7)
      finSemanaActual.setHours(10, 59, 0, 0)

      // Si el pedido está dentro de esta semana, agregarlo
      if (fechaPedido >= inicioSemanaActual && fechaPedido <= finSemanaActual) {
        pedidosSemanaActual.push(pedido)
      } else {
        // Si hay pedidos en la semana actual, guardarla
        if (pedidosSemanaActual.length > 0) {
          semanas.push({
            inicio: new Date(inicioSemanaActual),
            fin: new Date(finSemanaActual),
            pedidos: [...pedidosSemanaActual],
          })
        }

        // Avanzar a la siguiente semana
        inicioSemanaActual = new Date(finSemanaActual)
        inicioSemanaActual.setMinutes(1) // 11:00 AM del siguiente miércoles
        inicioSemanaActual.setHours(11, 0, 0, 0)

        pedidosSemanaActual = [pedido]
      }
    }

    // Agregar la última semana si tiene pedidos
    if (pedidosSemanaActual.length > 0) {
      const finSemanaActual = new Date(inicioSemanaActual)
      finSemanaActual.setDate(finSemanaActual.getDate() + 7)
      finSemanaActual.setHours(10, 59, 0, 0)

      semanas.push({
        inicio: new Date(inicioSemanaActual),
        fin: new Date(finSemanaActual),
        pedidos: pedidosSemanaActual,
      })
    }

    return semanas
  }

  /**
   * Obtiene el miércoles anterior o igual a la fecha dada
   */
  private static obtenerMiercolesAnterior(fecha: Date): Date {
    const resultado = new Date(fecha)
    const diaSemana = resultado.getDay()

    // Calcular cuántos días retroceder para llegar al miércoles
    let diasAtras: number
    if (diaSemana >= 3) {
      // Si es miércoles o después, retroceder a este miércoles
      diasAtras = diaSemana - 3
    } else {
      // Si es antes del miércoles, retroceder al miércoles anterior
      diasAtras = diaSemana + 4
    }

    resultado.setDate(resultado.getDate() - diasAtras)
    resultado.setHours(11, 0, 0, 0)

    return resultado
  }

  /**
   * Genera un reporte automático para una semana específica
   */
  private static async generarReporteParaSemana(
    inicio: Date,
    fin: Date,
    pedidos: Pedido[],
  ): Promise<ReporteAutomatico | null> {
    try {
      if (pedidos.length === 0) {
        console.log("No hay pedidos para esta semana")
        return null
      }

      const now = new Date()

      // Generar reportes usando la misma lógica que los reportes automáticos
      const reporteGeneral = this.generateGeneralReport(pedidos)
      const reporteProductosPorProveedor = this.generateProductosPorProveedorReport(pedidos)
      const reportePedidos = this.generatePedidosReport(pedidos)

      // Crear reporte automático histórico
      const reporteAutomatico: ReporteAutomatico = {
        id: `historico_${inicio.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
        tipo: "automatico",
        fecha_generacion: now.toISOString(),
        fecha_inicio_periodo: inicio.toISOString(),
        fecha_fin_periodo: fin.toISOString(),
        pedidos_incluidos: pedidos.map((p) => p.pedido_id),
        reportes: {
          general: reporteGeneral,
          productos_por_proveedor: reporteProductosPorProveedor,
          pedidos: reportePedidos,
        },
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }

      // Guardar en base de datos
      const savedReporte = await Database.createReporteAutomatico(reporteAutomatico)

      return savedReporte
    } catch (error) {
      console.error("Error generando reporte para semana:", error)
      return null
    }
  }

  // Métodos auxiliares copiados de ReportScheduler
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
}
