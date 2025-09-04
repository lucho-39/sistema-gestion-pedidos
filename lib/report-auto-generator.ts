import { LocalStorage } from "./storage"

export interface ReporteAutomatico {
  fecha: string
  pedidos_procesados: number
  productos_mas_pedidos: Array<{
    producto: string
    cantidad: number
  }>
  clientes_activos: number
  total_ventas: number
}

export async function regenerarReportesAutomaticamente(): Promise<ReporteAutomatico[]> {
  console.log("🔄 Iniciando regeneración automática de reportes...")

  try {
    // Obtener datos actuales
    const pedidos = await LocalStorage.getPedidos()
    const clientes = await LocalStorage.getClientes()
    const productos = await LocalStorage.getProductos()

    console.log(
      `📊 Datos obtenidos: ${pedidos.length} pedidos, ${clientes.length} clientes, ${productos.length} productos`,
    )

    // Generar reportes por semana de las últimas 4 semanas
    const reportes: ReporteAutomatico[] = []
    const ahora = new Date()

    for (let semana = 0; semana < 4; semana++) {
      const fechaInicio = new Date(ahora)
      fechaInicio.setDate(fechaInicio.getDate() - (semana + 1) * 7)

      const fechaFin = new Date(fechaInicio)
      fechaFin.setDate(fechaFin.getDate() + 6)

      // Filtrar pedidos de esta semana
      const pedidosSemana = pedidos.filter((pedido) => {
        const fechaPedido = new Date(pedido.fecha_creacion)
        return fechaPedido >= fechaInicio && fechaPedido <= fechaFin
      })

      // Calcular estadísticas
      const productosConteo: { [key: string]: number } = {}
      let totalVentas = 0

      pedidosSemana.forEach((pedido) => {
        pedido.items.forEach((item) => {
          const key = `${item.articulo_numero} - ${item.descripcion}`
          productosConteo[key] = (productosConteo[key] || 0) + item.cantidad
          totalVentas += item.cantidad * (item.precio_unitario || 0)
        })
      })

      // Productos más pedidos
      const productosMasPedidos = Object.entries(productosConteo)
        .map(([producto, cantidad]) => ({ producto, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5)

      // Clientes únicos
      const clientesUnicos = new Set(pedidosSemana.map((p) => p.cliente_codigo))

      const reporte: ReporteAutomatico = {
        fecha: fechaInicio.toISOString().split("T")[0],
        pedidos_procesados: pedidosSemana.length,
        productos_mas_pedidos: productosMasPedidos,
        clientes_activos: clientesUnicos.size,
        total_ventas: totalVentas,
      }

      reportes.push(reporte)

      console.log(
        `📈 Reporte generado para semana ${fechaInicio.toLocaleDateString()}: ${pedidosSemana.length} pedidos`,
      )
    }

    // Guardar reportes
    await LocalStorage.setReportes(
      reportes.map((r) => ({
        id: `auto-${r.fecha}`,
        tipo: "automatico",
        fecha_generacion: new Date().toISOString(),
        datos: r,
      })),
    )

    console.log("✅ Reportes automáticos regenerados exitosamente")
    return reportes
  } catch (error) {
    console.error("❌ Error regenerando reportes automáticos:", error)
    throw error
  }
}
