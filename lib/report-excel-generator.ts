import * as XLSX from "xlsx"
import type { ReporteAutomatico } from "./types"

// Función principal para generar y descargar Excel desde un reporte
export function generateExcelFromReporte(
  reporte: ReporteAutomatico,
  tipo: "general" | "productos_por_proveedor" | "pedidos",
): void {
  try {
    let workbook: XLSX.WorkBook

    switch (tipo) {
      case "general":
        workbook = generateGeneralExcel(reporte)
        break
      case "productos_por_proveedor":
        workbook = generateProductosPorProveedorExcel(reporte)
        break
      case "pedidos":
        workbook = generatePedidosExcel(reporte)
        break
      default:
        throw new Error(`Tipo de reporte no válido: ${tipo}`)
    }

    // Generar nombre único para el archivo
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "")
    const filename = `reporte_${tipo}_${timestamp}.xlsx`

    // Descargar el archivo
    downloadExcelFile(workbook, filename)
  } catch (error) {
    console.error("Error generating Excel:", error)
    throw error
  }
}

// Generar Excel del reporte general
function generateGeneralExcel(reporte: ReporteAutomatico): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()

  // Hoja 1: Resumen
  const resumenData = [
    ["Reporte General"],
    [""],
    ["Fecha de Generación", new Date(reporte.fecha_generacion).toLocaleString("es-AR")],
    ["Período Inicio", new Date(reporte.fecha_inicio_periodo).toLocaleDateString("es-AR")],
    ["Período Fin", new Date(reporte.fecha_fin_periodo).toLocaleDateString("es-AR")],
    ["Tipo", reporte.tipo === "automatico" ? "Automático" : "Manual"],
    [""],
    ["RESUMEN"],
    ["Total Pedidos", reporte.reportes.general.resumen.total_pedidos],
    ["Total Productos", reporte.reportes.general.resumen.total_productos],
    ["Total Clientes", reporte.reportes.general.resumen.total_clientes],
  ]

  const resumenWS = XLSX.utils.aoa_to_sheet(resumenData)

  // Ajustar anchos de columna
  resumenWS["!cols"] = [{ width: 20 }, { width: 30 }]

  XLSX.utils.book_append_sheet(workbook, resumenWS, "Resumen")

  // Hoja 2: Pedidos Detallados
  const pedidosHeaders = ["Pedido ID", "Cliente", "Fecha Pedido", "Producto", "Cantidad", "Unidad", "Proveedor"]

  const pedidosData: any[][] = [pedidosHeaders]

  reporte.reportes.general.pedidos.forEach((pedido) => {
    if (pedido.productos && pedido.productos.length > 0) {
      pedido.productos.forEach((producto) => {
        pedidosData.push([
          pedido.pedido_id,
          pedido.cliente?.nombre || "N/A",
          new Date(pedido.fecha_pedido).toLocaleDateString("es-AR"),
          producto.producto?.descripcion || "N/A",
          producto.cantidad,
          producto.producto?.unidad_medida || "N/A",
          producto.producto?.proveedor?.proveedor_nombre || "N/A",
        ])
      })
    } else {
      pedidosData.push([
        pedido.pedido_id,
        pedido.cliente?.nombre || "N/A",
        new Date(pedido.fecha_pedido).toLocaleDateString("es-AR"),
        "Sin productos",
        0,
        "N/A",
        "N/A",
      ])
    }
  })

  const pedidosWS = XLSX.utils.aoa_to_sheet(pedidosData)

  // Ajustar anchos de columna
  pedidosWS["!cols"] = [
    { width: 10 },
    { width: 25 },
    { width: 12 },
    { width: 40 },
    { width: 10 },
    { width: 10 },
    { width: 25 },
  ]

  XLSX.utils.book_append_sheet(workbook, pedidosWS, "Pedidos Detallados")

  return workbook
}

// Generar Excel de productos por proveedor
function generateProductosPorProveedorExcel(reporte: ReporteAutomatico): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()

  // Hoja 1: Resumen por Proveedor
  const resumenHeaders = ["Proveedor", "Total Productos Diferentes", "Cantidad Total Pedida"]

  const resumenData: any[][] = [resumenHeaders]

  reporte.reportes.productos_por_proveedor.proveedores.forEach((proveedor) => {
    const cantidadTotal = proveedor.productos.reduce((sum, p) => sum + p.cantidad_total, 0)
    resumenData.push([proveedor.proveedor_nombre, proveedor.productos.length, cantidadTotal])
  })

  const resumenWS = XLSX.utils.aoa_to_sheet(resumenData)

  // Ajustar anchos de columna
  resumenWS["!cols"] = [{ width: 30 }, { width: 20 }, { width: 20 }]

  XLSX.utils.book_append_sheet(workbook, resumenWS, "Resumen por Proveedor")

  // Hoja 2: Detalle por Proveedor
  const detalleHeaders = ["Proveedor", "Artículo Número", "Descripción", "Unidad Medida", "Cantidad Total"]

  const detalleData: any[][] = [detalleHeaders]

  reporte.reportes.productos_por_proveedor.proveedores.forEach((proveedor) => {
    proveedor.productos.forEach((producto) => {
      detalleData.push([
        proveedor.proveedor_nombre,
        producto.articulo_numero,
        producto.descripcion,
        producto.unidad_medida,
        producto.cantidad_total,
      ])
    })
  })

  const detalleWS = XLSX.utils.aoa_to_sheet(detalleData)

  // Ajustar anchos de columna
  detalleWS["!cols"] = [{ width: 25 }, { width: 15 }, { width: 40 }, { width: 15 }, { width: 15 }]

  XLSX.utils.book_append_sheet(workbook, detalleWS, "Detalle por Proveedor")

  return workbook
}

// Generar Excel de pedidos
function generatePedidosExcel(reporte: ReporteAutomatico): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()

  // Hoja 1: Lista de Pedidos
  const pedidosHeaders = ["Pedido ID", "Cliente", "Fecha Pedido", "Total Productos"]

  const pedidosData: any[][] = [pedidosHeaders]

  reporte.reportes.pedidos.pedidos.forEach((pedido) => {
    pedidosData.push([
      pedido.pedido_id,
      pedido.cliente_nombre,
      new Date(pedido.fecha_pedido).toLocaleDateString("es-AR"),
      pedido.productos.length,
    ])
  })

  const pedidosWS = XLSX.utils.aoa_to_sheet(pedidosData)

  // Ajustar anchos de columna
  pedidosWS["!cols"] = [{ width: 12 }, { width: 30 }, { width: 15 }, { width: 15 }]

  XLSX.utils.book_append_sheet(workbook, pedidosWS, "Lista de Pedidos")

  // Hoja 2: Productos por Pedido
  const productosHeaders = ["Pedido ID", "Cliente", "Producto", "Cantidad", "Unidad Medida"]

  const productosData: any[][] = [productosHeaders]

  reporte.reportes.pedidos.pedidos.forEach((pedido) => {
    pedido.productos.forEach((producto) => {
      productosData.push([
        pedido.pedido_id,
        pedido.cliente_nombre,
        producto.descripcion,
        producto.cantidad,
        producto.unidad_medida,
      ])
    })
  })

  const productosWS = XLSX.utils.aoa_to_sheet(productosData)

  // Ajustar anchos de columna
  productosWS["!cols"] = [{ width: 12 }, { width: 25 }, { width: 40 }, { width: 10 }, { width: 15 }]

  XLSX.utils.book_append_sheet(workbook, productosWS, "Productos por Pedido")

  return workbook
}

// Función auxiliar para descargar el archivo Excel
function downloadExcelFile(workbook: XLSX.WorkBook, filename: string): void {
  try {
    // Generar el archivo Excel como array buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      compression: true,
    })

    // Crear blob y URL para descarga
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    const url = window.URL.createObjectURL(blob)

    // Crear elemento de descarga temporal
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.style.display = "none"

    // Agregar al DOM, hacer clic y remover
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Limpiar URL temporal
    window.URL.revokeObjectURL(url)

    console.log(`Excel file downloaded: ${filename}`)
  } catch (error) {
    console.error("Error downloading Excel file:", error)
    throw error
  }
}

// Función auxiliar para generar nombres únicos de archivo
export function generateUniqueFilename(prefix: string, extension = "xlsx"): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "")
  const random = Math.random().toString(36).substr(2, 5)
  return `${prefix}_${timestamp}_${random}.${extension}`
}

// Función auxiliar para formatear fechas
export function formatDateForExcel(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-AR")
}

// Función auxiliar para formatear números
export function formatNumberForExcel(num: number): string {
  return num.toLocaleString("es-AR")
}
