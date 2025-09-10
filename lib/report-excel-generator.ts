import type { ReporteAutomatico } from "./types"

export interface ReporteData {
  general: {
    fecha_corte: string
    resumen: {
      total_pedidos: number
      total_productos: number
      total_clientes: number
      fecha_inicio: string
      fecha_fin: string
    }
    pedidos: Array<{
      pedido_id: number
      cliente_nombre: string
      fecha_pedido: string
      productos: Array<{
        descripcion: string
        cantidad: number
        unidad_medida: string
        proveedor_nombre: string
      }>
    }>
  }
  productos_por_proveedor: {
    fecha_corte: string
    proveedores: Array<{
      proveedor_id: number
      proveedor_nombre: string
      productos: Array<{
        articulo_numero: number
        descripcion: string
        unidad_medida: string
        cantidad_total: number
      }>
      total_productos: number
    }>
    total_proveedores: number
  }
  pedidos: {
    fecha_corte: string
    pedidos: Array<{
      pedido_id: number
      cliente_nombre: string
      fecha_pedido: string
      productos: Array<{
        descripcion: string
        cantidad: number
        unidad_medida: string
      }>
    }>
    total_pedidos: number
  }
}

export class ReportExcelGenerator {
  static async generateExcel(reporteData: ReporteData, filename = "reporte.xlsx"): Promise<void> {
    try {
      // Importar dinámicamente la librería xlsx
      const XLSX = await import("xlsx")

      // Crear un nuevo workbook
      const workbook = XLSX.utils.book_new()

      // Generar hoja de reporte general
      this.addGeneralSheet(workbook, XLSX, reporteData.general)

      // Generar hoja de productos por proveedor
      this.addProductosPorProveedorSheet(workbook, XLSX, reporteData.productos_por_proveedor)

      // Generar hoja de pedidos
      this.addPedidosSheet(workbook, XLSX, reporteData.pedidos)

      // Generar el archivo Excel
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

      // Crear blob y descargar
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

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

  private static addGeneralSheet(workbook: any, XLSX: any, data: ReporteData["general"]): void {
    const worksheetData: any[][] = []

    // Encabezado del reporte
    worksheetData.push(["REPORTE GENERAL DE PEDIDOS"])
    worksheetData.push([])
    worksheetData.push(["Fecha de Corte:", this.formatDate(data.fecha_corte)])
    worksheetData.push([
      "Período:",
      `${this.formatDate(data.resumen.fecha_inicio)} - ${this.formatDate(data.resumen.fecha_fin)}`,
    ])
    worksheetData.push([])

    // Resumen
    worksheetData.push(["RESUMEN"])
    worksheetData.push(["Total de Pedidos:", data.resumen.total_pedidos])
    worksheetData.push(["Total de Productos:", data.resumen.total_productos])
    worksheetData.push(["Total de Clientes:", data.resumen.total_clientes])
    worksheetData.push([])

    // Detalle de pedidos
    worksheetData.push(["DETALLE DE PEDIDOS"])
    worksheetData.push(["Pedido ID", "Cliente", "Fecha", "Producto", "Cantidad", "Unidad", "Proveedor"])

    data.pedidos.forEach((pedido) => {
      pedido.productos.forEach((producto, index) => {
        worksheetData.push([
          index === 0 ? pedido.pedido_id : "",
          index === 0 ? pedido.cliente_nombre : "",
          index === 0 ? this.formatDate(pedido.fecha_pedido) : "",
          producto.descripcion,
          producto.cantidad,
          producto.unidad_medida,
          producto.proveedor_nombre,
        ])
      })
    })

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Configurar anchos de columna
    worksheet["!cols"] = [
      { wch: 10 }, // Pedido ID
      { wch: 25 }, // Cliente
      { wch: 12 }, // Fecha
      { wch: 30 }, // Producto
      { wch: 10 }, // Cantidad
      { wch: 10 }, // Unidad
      { wch: 20 }, // Proveedor
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte General")
  }

  private static addProductosPorProveedorSheet(
    workbook: any,
    XLSX: any,
    data: ReporteData["productos_por_proveedor"],
  ): void {
    const worksheetData: any[][] = []

    // Encabezado del reporte
    worksheetData.push(["REPORTE POR PROVEEDOR"])
    worksheetData.push([])
    worksheetData.push(["Fecha de Corte:", this.formatDate(data.fecha_corte)])
    worksheetData.push(["Total de Proveedores:", data.total_proveedores])
    worksheetData.push([])

    // Detalle por proveedor
    worksheetData.push(["PRODUCTOS POR PROVEEDOR"])
    worksheetData.push(["Proveedor", "Artículo", "Descripción", "Unidad", "Cantidad Total"])

    data.proveedores.forEach((proveedor) => {
      proveedor.productos.forEach((producto, index) => {
        worksheetData.push([
          index === 0 ? proveedor.proveedor_nombre : "",
          producto.articulo_numero,
          producto.descripcion,
          producto.unidad_medida,
          producto.cantidad_total,
        ])
      })

      // Línea de total por proveedor
      worksheetData.push([`TOTAL ${proveedor.proveedor_nombre.toUpperCase()}:`, "", "", "", proveedor.total_productos])
      worksheetData.push([]) // Línea en blanco
    })

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Configurar anchos de columna
    worksheet["!cols"] = [
      { wch: 25 }, // Proveedor
      { wch: 12 }, // Artículo
      { wch: 35 }, // Descripción
      { wch: 10 }, // Unidad
      { wch: 15 }, // Cantidad Total
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, "Por Proveedor")
  }

  private static addPedidosSheet(workbook: any, XLSX: any, data: ReporteData["pedidos"]): void {
    const worksheetData: any[][] = []

    // Encabezado del reporte
    worksheetData.push(["REPORTE DE PEDIDOS"])
    worksheetData.push([])
    worksheetData.push(["Fecha de Corte:", this.formatDate(data.fecha_corte)])
    worksheetData.push(["Total de Pedidos:", data.total_pedidos])
    worksheetData.push([])

    // Detalle de pedidos
    worksheetData.push(["DETALLE DE PEDIDOS"])
    worksheetData.push(["Pedido ID", "Cliente", "Fecha", "Producto", "Cantidad", "Unidad"])

    data.pedidos.forEach((pedido) => {
      pedido.productos.forEach((producto, index) => {
        worksheetData.push([
          index === 0 ? pedido.pedido_id : "",
          index === 0 ? pedido.cliente_nombre : "",
          index === 0 ? this.formatDate(pedido.fecha_pedido) : "",
          producto.descripcion,
          producto.cantidad,
          producto.unidad_medida,
        ])
      })
    })

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // Configurar anchos de columna
    worksheet["!cols"] = [
      { wch: 10 }, // Pedido ID
      { wch: 25 }, // Cliente
      { wch: 12 }, // Fecha
      { wch: 35 }, // Producto
      { wch: 10 }, // Cantidad
      { wch: 10 }, // Unidad
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos")
  }

  private static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  private static generateFilename(tipo: string): string {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, "-").substring(0, 19)
    return `reporte-${tipo}-${timestamp}.xlsx`
  }

  // Método auxiliar para generar reportes desde pedidos
  static generateReportFromPedidos(pedidos: any[], fechaInicio: string, fechaFin: string): ReporteData {
    const fechaCorte = new Date().toISOString()

    // Procesar datos para reporte general
    const clientesUnicos = new Set()
    let totalProductos = 0
    const pedidosParaReporte: any[] = []

    pedidos.forEach((pedido) => {
      clientesUnicos.add(pedido.cliente_id)
      totalProductos += pedido.productos?.length || 0

      pedidosParaReporte.push({
        pedido_id: pedido.pedido_id,
        cliente_nombre: pedido.cliente?.nombre || "Cliente desconocido",
        fecha_pedido: pedido.fecha_pedido,
        productos:
          pedido.productos?.map((p: any) => ({
            descripcion: p.producto?.descripcion || "Producto desconocido",
            cantidad: p.cantidad,
            unidad_medida: p.producto?.unidad_medida || "unidad",
            proveedor_nombre: p.producto?.proveedor?.proveedor_nombre || "Proveedor desconocido",
          })) || [],
      })
    })

    // Procesar datos por proveedor
    const proveedoresMap = new Map()
    pedidos.forEach((pedido) => {
      pedido.productos?.forEach((p: any) => {
        const proveedorId = p.producto?.proveedor?.proveedor_id || 0
        const proveedorNombre = p.producto?.proveedor?.proveedor_nombre || "Proveedor desconocido"

        if (!proveedoresMap.has(proveedorId)) {
          proveedoresMap.set(proveedorId, {
            proveedor_id: proveedorId,
            proveedor_nombre: proveedorNombre,
            productos: new Map(),
            total_productos: 0,
          })
        }

        const proveedor = proveedoresMap.get(proveedorId)
        const articuloNumero = p.articulo_numero

        if (!proveedor.productos.has(articuloNumero)) {
          proveedor.productos.set(articuloNumero, {
            articulo_numero: articuloNumero,
            descripcion: p.producto?.descripcion || "Producto desconocido",
            unidad_medida: p.producto?.unidad_medida || "unidad",
            cantidad_total: 0,
          })
        }

        proveedor.productos.get(articuloNumero).cantidad_total += p.cantidad
        proveedor.total_productos += p.cantidad
      })
    })

    const proveedoresArray = Array.from(proveedoresMap.values()).map((proveedor) => ({
      ...proveedor,
      productos: Array.from(proveedor.productos.values()),
    }))

    return {
      general: {
        fecha_corte: fechaCorte,
        resumen: {
          total_pedidos: pedidos.length,
          total_productos: totalProductos,
          total_clientes: clientesUnicos.size,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
        },
        pedidos: pedidosParaReporte,
      },
      productos_por_proveedor: {
        fecha_corte: fechaCorte,
        proveedores: proveedoresArray,
        total_proveedores: proveedoresArray.length,
      },
      pedidos: {
        fecha_corte: fechaCorte,
        pedidos: pedidosParaReporte.map((p) => ({
          pedido_id: p.pedido_id,
          cliente_nombre: p.cliente_nombre,
          fecha_pedido: p.fecha_pedido,
          productos: p.productos.map((prod: any) => ({
            descripcion: prod.descripcion,
            cantidad: prod.cantidad,
            unidad_medida: prod.unidad_medida,
          })),
        })),
        total_pedidos: pedidos.length,
      },
    }
  }
}

// Función principal que se exporta para usar en la página de reportes
export async function generateExcelFromReporte(
  reporte: ReporteAutomatico,
  tipo: "general" | "productos_por_proveedor" | "pedidos",
): Promise<void> {
  try {
    console.log("Generating Excel from reporte:", reporte.id, "tipo:", tipo)

    // Convertir el reporte automático al formato esperado por el generador
    const reporteData: ReporteData = {
      general: {
        fecha_corte: reporte.fecha_generacion,
        resumen: {
          total_pedidos: reporte.pedidos_incluidos.length,
          total_productos: reporte.reportes.general.resumen.total_productos,
          total_clientes: reporte.reportes.general.resumen.total_clientes,
          fecha_inicio: reporte.fecha_inicio_periodo,
          fecha_fin: reporte.fecha_fin_periodo,
        },
        pedidos: reporte.reportes.general.pedidos || [],
      },
      productos_por_proveedor: reporte.reportes.productos_por_proveedor,
      pedidos: reporte.reportes.pedidos,
    }

    // Generar nombre de archivo específico
    const filename = ReportExcelGenerator.generateFilename(tipo)

    // Generar el Excel según el tipo solicitado
    let excelData: ReporteData
    switch (tipo) {
      case "general":
        excelData = {
          general: reporteData.general,
          productos_por_proveedor: { fecha_corte: "", proveedores: [], total_proveedores: 0 },
          pedidos: { fecha_corte: "", pedidos: [], total_pedidos: 0 },
        }
        break
      case "productos_por_proveedor":
        excelData = {
          general: {
            fecha_corte: "",
            resumen: { total_pedidos: 0, total_productos: 0, total_clientes: 0, fecha_inicio: "", fecha_fin: "" },
            pedidos: [],
          },
          productos_por_proveedor: reporteData.productos_por_proveedor,
          pedidos: { fecha_corte: "", pedidos: [], total_pedidos: 0 },
        }
        break
      case "pedidos":
        excelData = {
          general: {
            fecha_corte: "",
            resumen: { total_pedidos: 0, total_productos: 0, total_clientes: 0, fecha_inicio: "", fecha_fin: "" },
            pedidos: [],
          },
          productos_por_proveedor: { fecha_corte: "", proveedores: [], total_proveedores: 0 },
          pedidos: reporteData.pedidos,
        }
        break
      default:
        excelData = reporteData
    }

    await ReportExcelGenerator.generateExcel(excelData, filename)
    console.log("Excel generated successfully:", filename)
  } catch (error) {
    console.error("Error generating Excel from reporte:", error)
    throw error
  }
}

// Función auxiliar para generar nombre de archivo
function generateFilename(tipo: string): string {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[:.]/g, "-").substring(0, 19)
  return `reporte-${tipo}-${timestamp}.xlsx`
}
