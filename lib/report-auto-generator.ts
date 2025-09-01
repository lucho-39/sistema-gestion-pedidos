import { LocalStorage } from "./storage"
import { generarReporteSemanalProductos, generarReporteSemanalPedidos } from "./report-generators"
import type { ReporteSemanal } from "./types"

export function regenerarReportesAutomaticamente(): void {
  const pedidos = LocalStorage.getPedidos()
  const ahora = new Date()
  const unaSemanaAtras = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Filtrar pedidos de la última semana
  const pedidosRecientes = pedidos.filter((pedido) => {
    const fechaPedido = new Date(pedido.fecha_pedido)
    return fechaPedido >= unaSemanaAtras
  })

  // Ordenar pedidos por fecha más reciente primero
  const pedidosOrdenados = pedidosRecientes.sort((a, b) => {
    const fechaA = new Date(a.fecha_pedido)
    const fechaB = new Date(b.fecha_pedido)
    return fechaB.getTime() - fechaA.getTime()
  })

  // Regenerar reporte general
  const nuevoReporteGeneral: ReporteSemanal = {
    fecha_corte: ahora.toISOString(),
    pedidos: pedidosOrdenados,
  }

  const reportesGenerales = LocalStorage.getReportes()
  // Reemplazar el reporte más reciente o agregar uno nuevo
  if (reportesGenerales.length > 0) {
    reportesGenerales[0] = nuevoReporteGeneral
  } else {
    reportesGenerales.unshift(nuevoReporteGeneral)
  }
  LocalStorage.setReportes(reportesGenerales)

  // Regenerar reporte de productos
  const reporteProductos = generarReporteSemanalProductos(pedidosRecientes)
  const reportesProductos = JSON.parse(localStorage.getItem("reportes_productos") || "[]")
  if (reportesProductos.length > 0) {
    reportesProductos[0] = reporteProductos
  } else {
    reportesProductos.unshift(reporteProductos)
  }
  localStorage.setItem("reportes_productos", JSON.stringify(reportesProductos))

  // Regenerar reporte de pedidos
  const reportePedidos = generarReporteSemanalPedidos(pedidosRecientes)
  const reportesPedidos = JSON.parse(localStorage.getItem("reportes_pedidos_detalle") || "[]")
  if (reportesPedidos.length > 0) {
    reportesPedidos[0] = reportePedidos
  } else {
    reportesPedidos.unshift(reportePedidos)
  }
  localStorage.setItem("reportes_pedidos_detalle", JSON.stringify(reportesPedidos))
}
