import type { ReporteSemanal, ReporteSemanalProductos, ReporteSemanalPedidos } from "./types"

export async function generarExcelReporteGeneral(reporte: ReporteSemanal): Promise<void> {
  try {
    const XLSX = await import("xlsx")

    // Crear workbook
    const wb = XLSX.utils.book_new()

    // Hoja de resumen
    const resumenData = [
      ["REPORTE SEMANAL GENERAL"],
      ["Fecha de corte:", new Date(reporte.fecha_corte).toLocaleDateString("es-AR")],
      [""],
      ["RESUMEN"],
      ["Total de pedidos:", reporte.pedidos.length],
      [
        "Total de productos:",
        reporte.pedidos.reduce(
          (total, pedido) => total + pedido.productos.reduce((subtotal, producto) => subtotal + producto.cantidad, 0),
          0,
        ),
      ],
      [""],
      ["DETALLE DE PEDIDOS"],
      ["Pedido ID", "Cliente", "Fecha", "Productos", "Cantidad Total"],
    ]

    // Agregar datos de pedidos
    reporte.pedidos.forEach((pedido) => {
      const totalProductos = pedido.productos.reduce((total, producto) => total + producto.cantidad, 0)
      resumenData.push([
        pedido.pedido_id,
        pedido.cliente.nombre,
        new Date(pedido.fecha_pedido).toLocaleDateString("es-AR"),
        pedido.productos.length,
        totalProductos,
      ])
    })

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen")

    // Hoja de detalle de productos
    const productosData = [
      ["Pedido ID", "Cliente", "Art. Nº", "Descripción", "Código", "Cantidad", "Unidad", "Proveedor"],
    ]

    reporte.pedidos.forEach((pedido) => {
      pedido.productos.forEach((producto) => {
        productosData.push([
          pedido.pedido_id,
          pedido.cliente.nombre,
          producto.articulo_numero,
          producto.descripcion,
          producto.producto_codigo || "",
          producto.cantidad,
          producto.unidad_medida,
          `${producto.proveedor.proveedor_id} - ${producto.proveedor.proveedor_nombre}`,
        ])
      })
    })

    const wsProductos = XLSX.utils.aoa_to_sheet(productosData)
    XLSX.utils.book_append_sheet(wb, wsProductos, "Detalle Productos")

    // Generar archivo y descargar en el navegador
    const fechaCorte = new Date(reporte.fecha_corte).toISOString().split("T")[0]
    const fileName = `Reporte_General_${fechaCorte}.xlsx`

    // Escribir el workbook como array buffer
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })

    // Crear blob y descargar
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error generando Excel:", error)
    throw new Error("Error al generar el archivo Excel")
  }
}

export async function generarExcelReporteProductos(reporte: ReporteSemanalProductos): Promise<void> {
  try {
    const XLSX = await import("xlsx")

    const wb = XLSX.utils.book_new()

    // Hoja de resumen por proveedor
    const resumenData = [
      ["REPORTE SEMANAL DE PRODUCTOS POR PROVEEDOR"],
      ["Fecha de corte:", new Date(reporte.fecha_corte).toLocaleDateString("es-AR")],
      [""],
      ["RESUMEN POR PROVEEDOR"],
      ["Proveedor", "Cantidad de Productos", "Cantidad Total"],
    ]

    reporte.proveedores.forEach((proveedor) => {
      const cantidadTotal = proveedor.productos.reduce((total, producto) => total + producto.cantidad_total, 0)
      resumenData.push([proveedor.proveedor_nombre, proveedor.productos.length, cantidadTotal])
    })

    resumenData.push([""])
    resumenData.push(["DETALLE POR PROVEEDOR"])

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen")

    // Hoja detallada por cada proveedor
    reporte.proveedores.forEach((proveedor) => {
      const proveedorData = [
        [`PROVEEDOR: ${proveedor.proveedor_nombre}`],
        [""],
        ["Art. Nº", "Producto Cod", "Descripción", "Cantidad Total"],
      ]

      proveedor.productos
        .sort((a, b) => a.articulo_numero - b.articulo_numero)
        .forEach((producto) => {
          proveedorData.push([producto.articulo_numero, producto.producto_codigo, producto.descripcion, producto.cantidad_total])
        })

      const wsProveedor = XLSX.utils.aoa_to_sheet(proveedorData)
      // Limitar nombre de hoja a 31 caracteres (límite de Excel)
      const sheetName = proveedor.proveedor_nombre.substring(0, 31)
      XLSX.utils.book_append_sheet(wb, wsProveedor, sheetName)
    })

    // Generar archivo y descargar
    const fechaCorte = new Date(reporte.fecha_corte).toISOString().split("T")[0]
    const fileName = `Reporte_Productos_${fechaCorte}.xlsx`

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error generando Excel:", error)
    throw new Error("Error al generar el archivo Excel")
  }
}

export async function generarExcelReportePedidos(reporte: ReporteSemanalPedidos): Promise<void> {
  try {
    const XLSX = await import("xlsx")

    const wb = XLSX.utils.book_new()

    // Hoja de resumen
    const resumenData = [
      ["REPORTE SEMANAL DE PEDIDOS"],
      ["Fecha de corte:", new Date(reporte.fecha_corte).toLocaleDateString("es-AR")],
      [""],
      ["RESUMEN"],
      ["Total de pedidos:", reporte.pedidos.length],
      [""],
      ["PEDIDOS ORDENADOS POR FECHA"],
      ["Pedido ID", "Fecha", "Cliente", "Cantidad de Productos", "Total Items"],
    ]

    reporte.pedidos.forEach((pedido) => {
      const totalItems = pedido.productos.reduce((total, producto) => total + producto.cantidad, 0)
      resumenData.push([
        pedido.pedido_id,
        new Date(pedido.fecha_pedido).toLocaleDateString("es-AR"),
        pedido.cliente_nombre,
        pedido.productos.length,
        totalItems,
      ])
    })

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen")

    // Hoja detallada de productos por pedido
    const detalleData = [["Pedido ID", "Fecha", "Cliente", "Producto", "Cantidad"]]

    reporte.pedidos.forEach((pedido) => {
      pedido.productos.forEach((producto) => {
        detalleData.push([
          pedido.pedido_id,
          new Date(pedido.fecha_pedido).toLocaleDateString("es-AR"),
          pedido.cliente_nombre,
          producto.descripcion,
          producto.cantidad,
        ])
      })
    })

    const wsDetalle = XLSX.utils.aoa_to_sheet(detalleData)
    XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle Productos")

    // Generar archivo y descargar
    const fechaCorte = new Date(reporte.fecha_corte).toISOString().split("T")[0]
    const fileName = `Reporte_Pedidos_${fechaCorte}.xlsx`

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error generando Excel:", error)
    throw new Error("Error al generar el archivo Excel")
  }
}
