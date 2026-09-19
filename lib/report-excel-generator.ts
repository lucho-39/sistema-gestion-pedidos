import * as XLSX from "xlsx"
import type { Pedido, ProductoPedido, ReporteAutomatico, ReporteData } from "./types"

// Las hojas se arman como matrices de celdas de texto o numero.
type CeldaExcel = string | number

type ProveedorReporte = ReporteData["productos_por_proveedor"]["proveedores"][number]
type ProductoDeProveedorReporte = ProveedorReporte["productos"][number]
type PedidoReporte = ReporteData["pedidos"]["pedidos"][number]
type ProductoDePedidoReporte = PedidoReporte["productos"][number]

export async function generateExcelFromReporte(
  reporte: ReporteAutomatico,
  tipo: "general" | "productos_por_proveedor" | "pedidos",
): Promise<void> {
  try {
    console.log("Generating Excel from reporte:", reporte.id, "tipo:", tipo)

    const workbook = XLSX.utils.book_new()

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
    const filename = `reporte_${tipo}_${timestamp}.xlsx`

    if (tipo === "general") {
      const resumenData: CeldaExcel[][] = [
        ["Reporte General"],
        [""],
        ["Fecha de Generación", new Date(reporte.fecha_generacion).toLocaleString("es-AR")],
        ["Período Inicio", new Date(reporte.fecha_inicio_periodo).toLocaleString("es-AR")],
        ["Período Fin", new Date(reporte.fecha_fin_periodo).toLocaleString("es-AR")],
        ["Tipo de Reporte", reporte.tipo],
        [""],
        ["Resumen"],
        ["Total Pedidos", reporte.reportes.general.resumen.total_pedidos],
        ["Total Productos", reporte.reportes.general.resumen.total_productos],
        ["Total Clientes", reporte.reportes.general.resumen.total_clientes],
      ]

      const resumenWS = XLSX.utils.aoa_to_sheet(resumenData)
      XLSX.utils.book_append_sheet(workbook, resumenWS, "Resumen")

      const pedidosData: CeldaExcel[][] = [
        ["ID Pedido", "Código Cliente", "Cliente", "Fecha Pedido", "Producto", "Cantidad", "Unidad", "Proveedor"],
      ]

      reporte.reportes.general.pedidos.forEach((pedido: Pedido) => {
        pedido.productos?.forEach((producto: ProductoPedido, index: number) => {
          pedidosData.push([
            index === 0 ? pedido.pedido_id : "",
            index === 0 ? pedido.cliente?.cliente_codigo || "N/A" : "",
            index === 0 ? pedido.cliente?.nombre || "N/A" : "",
            index === 0 ? new Date(pedido.fecha_pedido).toLocaleDateString("es-AR") : "",
            producto.producto?.descripcion || "N/A",
            producto.cantidad,
            producto.producto?.categoria?.unidad || "u",
            producto.producto?.proveedor?.proveedor_nombre || "N/A",
          ])
        })
      })

      const pedidosWS = XLSX.utils.aoa_to_sheet(pedidosData)

      pedidosWS["!cols"] = [
        { wch: 10 }, // ID Pedido
        { wch: 15 }, // Código Cliente
        { wch: 25 }, // Cliente
        { wch: 12 }, // Fecha
        { wch: 35 }, // Producto
        { wch: 10 }, // Cantidad
        { wch: 10 }, // Unidad
        { wch: 20 }, // Proveedor
      ]

      XLSX.utils.book_append_sheet(workbook, pedidosWS, "Pedidos Detallados")
    } else if (tipo === "productos_por_proveedor") {
      reporte.reportes.productos_por_proveedor.proveedores.forEach((proveedor: ProveedorReporte, index: number) => {
        const worksheetData: CeldaExcel[][] = [
          [`Proveedor: ${proveedor.proveedor_nombre}`],
          [""],
          ["Artículo", "Código Proveedor", "Descripción", "Unidad", "Cantidad Total"],
        ]

        proveedor.productos.forEach((producto: ProductoDeProveedorReporte) => {
          worksheetData.push([
            producto.articulo_numero,
            producto.producto_codigo || "N/A",
            producto.descripcion,
            producto.unidad_medida || "unidad",
            producto.cantidad_total,
          ])
        })

        worksheetData.push(["", "", "", "TOTAL PRODUCTOS:", proveedor.productos.length])

        const ws = XLSX.utils.aoa_to_sheet(worksheetData)

        ws["!cols"] = [
          { wch: 10 }, // Artículo
          { wch: 18 }, // Código Proveedor
          { wch: 40 }, // Descripción
          { wch: 10 }, // Unidad
          { wch: 15 }, // Cantidad
        ]

        const sheetName = `${proveedor.proveedor_nombre.substring(0, 25)}${index + 1}`
        XLSX.utils.book_append_sheet(workbook, ws, sheetName)
      })

      const resumenData: CeldaExcel[][] = [
        ["Resumen por Proveedores"],
        [""],
        ["Proveedor", "Total Productos", "Total Cantidad"],
      ]

      reporte.reportes.productos_por_proveedor.proveedores.forEach((proveedor: ProveedorReporte) => {
        const totalCantidad = proveedor.productos.reduce(
          (sum: number, p: ProductoDeProveedorReporte) => sum + p.cantidad_total,
          0,
        )
        resumenData.push([proveedor.proveedor_nombre, proveedor.productos.length, totalCantidad])
      })

      const resumenWS = XLSX.utils.aoa_to_sheet(resumenData)
      XLSX.utils.book_append_sheet(workbook, resumenWS, "Resumen Proveedores")
    } else if (tipo === "pedidos") {
      const pedidosData: CeldaExcel[][] = [
        ["ID Pedido", "Código Cliente", "Cliente", "Fecha", "Producto", "Cantidad", "Unidad"],
      ]

      reporte.reportes.pedidos.pedidos.forEach((pedido: PedidoReporte) => {
        pedido.productos.forEach((producto: ProductoDePedidoReporte, index: number) => {
          pedidosData.push([
            index === 0 ? pedido.pedido_id : "",
            index === 0 ? pedido.cliente_codigo : "",
            index === 0 ? pedido.cliente_nombre : "",
            index === 0 ? new Date(pedido.fecha_pedido).toLocaleDateString("es-AR") : "",
            producto.descripcion,
            producto.cantidad,
            producto.unidad_medida || "unidad",
          ])
        })
      })

      const pedidosWS = XLSX.utils.aoa_to_sheet(pedidosData)

      pedidosWS["!cols"] = [
        { wch: 10 }, // ID Pedido
        { wch: 15 }, // Código Cliente
        { wch: 25 }, // Cliente
        { wch: 12 }, // Fecha
        { wch: 35 }, // Producto
        { wch: 10 }, // Cantidad
        { wch: 10 }, // Unidad
      ]

      XLSX.utils.book_append_sheet(workbook, pedidosWS, "Lista de Pedidos")
    }

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    console.log(`Excel file ${filename} generated and downloaded successfully`)
  } catch (error) {
    console.error("Error generating Excel:", error)
    throw error
  }
}
