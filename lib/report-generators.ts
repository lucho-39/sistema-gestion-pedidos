import type { Pedido, Cliente, Producto } from "./types"

export interface ReportePedido {
  pedido: Pedido
  cliente: Cliente | null
  items_detalle: Array<{
    producto: Producto | null
    cantidad: number
    subtotal: number
  }>
  total: number
}

export interface ReporteSemanal {
  id: string
  semana_inicio: string
  semana_fin: string
  pedidos: Pedido[]
  resumen: {
    total_pedidos: number
    total_items: number
    productos_unicos: number
    clientes_unicos: number
  }
  productos_mas_pedidos: Array<{
    articulo_numero: number
    descripcion: string
    cantidad_total: number
    veces_pedido: number
  }>
  clientes_activos: Array<{
    cliente_codigo: number
    nombre: string
    pedidos_realizados: number
    items_totales: number
  }>
}

export async function generarReportePedido(
  pedido: Pedido,
  clientes: Cliente[],
  productos: Producto[],
): Promise<ReportePedido> {
  // Buscar cliente
  const cliente = clientes.find((c) => c.cliente_codigo === pedido.cliente_codigo) || null

  // Procesar items con detalles
  const items_detalle = pedido.items.map((item) => {
    const producto = productos.find((p) => p.articulo_numero === item.articulo_numero) || null
    const subtotal = item.cantidad * (item.precio_unitario || 0)

    return {
      producto,
      cantidad: item.cantidad,
      subtotal,
    }
  })

  // Calcular total
  const total = items_detalle.reduce((sum, item) => sum + item.subtotal, 0)

  return {
    pedido,
    cliente,
    items_detalle,
    total,
  }
}

export async function generarReporteSemanal(
  fechaInicio: Date,
  fechaFin: Date,
  pedidos: Pedido[],
  clientes: Cliente[],
  productos: Producto[],
): Promise<ReporteSemanal> {
  // Filtrar pedidos de la semana
  const pedidosSemana = pedidos.filter((pedido) => {
    const fechaPedido = new Date(pedido.fecha_creacion)
    return fechaPedido >= fechaInicio && fechaPedido <= fechaFin
  })

  // Calcular resumen
  const totalItems = pedidosSemana.reduce(
    (sum, pedido) => sum + pedido.items.reduce((itemSum, item) => itemSum + item.cantidad, 0),
    0,
  )

  const productosUnicos = new Set(pedidosSemana.flatMap((pedido) => pedido.items.map((item) => item.articulo_numero)))
    .size

  const clientesUnicos = new Set(pedidosSemana.map((pedido) => pedido.cliente_codigo)).size

  // Productos más pedidos
  const conteoProductos: { [key: number]: { cantidad: number; veces: number; descripcion: string } } = {}

  pedidosSemana.forEach((pedido) => {
    pedido.items.forEach((item) => {
      if (!conteoProductos[item.articulo_numero]) {
        conteoProductos[item.articulo_numero] = {
          cantidad: 0,
          veces: 0,
          descripcion: item.descripcion,
        }
      }
      conteoProductos[item.articulo_numero].cantidad += item.cantidad
      conteoProductos[item.articulo_numero].veces += 1
    })
  })

  const productosMasPedidos = Object.entries(conteoProductos)
    .map(([articulo, data]) => ({
      articulo_numero: Number.parseInt(articulo),
      descripcion: data.descripcion,
      cantidad_total: data.cantidad,
      veces_pedido: data.veces,
    }))
    .sort((a, b) => b.cantidad_total - a.cantidad_total)
    .slice(0, 10)

  // Clientes activos
  const conteoClientes: { [key: number]: { pedidos: number; items: number; nombre: string } } = {}

  pedidosSemana.forEach((pedido) => {
    if (!conteoClientes[pedido.cliente_codigo]) {
      const cliente = clientes.find((c) => c.cliente_codigo === pedido.cliente_codigo)
      conteoClientes[pedido.cliente_codigo] = {
        pedidos: 0,
        items: 0,
        nombre: cliente?.nombre || `Cliente ${pedido.cliente_codigo}`,
      }
    }
    conteoClientes[pedido.cliente_codigo].pedidos += 1
    conteoClientes[pedido.cliente_codigo].items += pedido.items.reduce((sum, item) => sum + item.cantidad, 0)
  })

  const clientesActivos = Object.entries(conteoClientes)
    .map(([codigo, data]) => ({
      cliente_codigo: Number.parseInt(codigo),
      nombre: data.nombre,
      pedidos_realizados: data.pedidos,
      items_totales: data.items,
    }))
    .sort((a, b) => b.pedidos_realizados - a.pedidos_realizados)

  return {
    id: `semanal-${fechaInicio.toISOString().split("T")[0]}`,
    semana_inicio: fechaInicio.toISOString().split("T")[0],
    semana_fin: fechaFin.toISOString().split("T")[0],
    pedidos: pedidosSemana,
    resumen: {
      total_pedidos: pedidosSemana.length,
      total_items: totalItems,
      productos_unicos: productosUnicos,
      clientes_unicos: clientesUnicos,
    },
    productos_mas_pedidos: productosMasPedidos,
    clientes_activos: clientesActivos,
  }
}

export function formatearFecha(fecha: string | Date): string {
  const date = typeof fecha === "string" ? new Date(fecha) : fecha
  return date.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(monto)
}
