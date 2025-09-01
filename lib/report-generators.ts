import type { Pedido, ReporteSemanalProductos, ReporteSemanalPedidos } from "./types"

export function generarReporteSemanalProductos(pedidos: Pedido[]): ReporteSemanalProductos {
  // Agrupar productos por proveedor y sumar cantidades
  const productosPorProveedor = new Map<string, Map<number, { producto_codigo: string;descripcion: string; cantidad_total: number }>>()

  pedidos.forEach((pedido) => {
    pedido.productos.forEach((producto) => {
      const proveedorNombre = producto.proveedor.proveedor_nombre
      const articuloNumero = producto.articulo_numero

      if (!productosPorProveedor.has(proveedorNombre)) {
        productosPorProveedor.set(proveedorNombre, new Map())
      }

      const productosProveedor = productosPorProveedor.get(proveedorNombre)!

      if (productosProveedor.has(articuloNumero)) {
        const productoExistente = productosProveedor.get(articuloNumero)!
        productoExistente.cantidad_total += producto.cantidad
      } else {
        productosProveedor.set(articuloNumero, {
          producto_codigo: producto.producto_codigo,
          descripcion: producto.descripcion,
          cantidad_total: producto.cantidad,
        })
      }
    })
  })

  // Convertir a formato del reporte y ordenar
  const proveedores = Array.from(productosPorProveedor.entries()).map(([proveedorNombre, productos]) => {
    const productosOrdenados = Array.from(productos.entries())
      .map(([articuloNumero, data]) => ({
        articulo_numero: articuloNumero,
        producto_codigo: data.producto_codigo,
        descripcion: data.descripcion,
        cantidad_total: data.cantidad_total,
      }))
      .sort((a, b) => a.articulo_numero - b.articulo_numero)

    return {
      proveedor_nombre: proveedorNombre,
      productos: productosOrdenados,
    }
  })

  return {
    fecha_corte: new Date().toISOString(),
    proveedores,
  }
}

export function generarReporteSemanalPedidos(pedidos: Pedido[]): ReporteSemanalPedidos {
  // Ordenar pedidos por fecha
  const pedidosOrdenados = pedidos
    .sort((a, b) => new Date(b.fecha_pedido).getTime() - new Date(a.fecha_pedido).getTime())
    .map((pedido) => ({
      pedido_id: pedido.pedido_id,
      fecha_pedido: pedido.fecha_pedido,
      cliente_nombre: pedido.cliente.nombre,
      productos: pedido.productos.map((producto) => ({
        descripcion: producto.descripcion,
        cantidad: producto.cantidad,
      })),
    }))

  return {
    fecha_corte: new Date().toISOString(),
    pedidos: pedidosOrdenados,
  }
}
