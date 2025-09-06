import * as XLSX from "xlsx"

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
  static generateExcel(reporteData: ReporteData, filename?: string): void {
    try {
      console.log("Generating Excel report with data:", reporteData)

      // Crear un nuevo workbook
      const workbook = XLSX.utils.book_new()

      // 1. Hoja de Reporte General
      this.createGeneralSheet(workbook, reporteData.general)

      // 2. Hoja de Productos por Proveedor
      this.createProveedorSheet(workbook, reporteData.productos_por_proveedor)

      // 3. Hoja de Pedidos
      this.createPedidosSheet(workbook, reporteData.pedidos)

      // Generar el archivo Excel
      const finalFilename = filename || this.generateFilename()
      console.log("Generating Excel file:", finalFilename)

      // Escribir el archivo
      XLSX.writeFile(workbook, finalFilename)

      console.log("Excel file generated successfully:", finalFilename)
    } catch (error) {
      console.error("Error generating Excel report:", error)
      throw new Error("Error al generar el reporte Excel")
    }
  }

  private static createGeneralSheet(workbook: XLSX.WorkBook, data: ReporteData["general"]): void {
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

  private static createProveedorSheet(workbook: XLSX.WorkBook, data: ReporteData["productos_por_proveedor"]): void {
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

  private static createPedidosSheet(workbook: XLSX.WorkBook, data: ReporteData["pedidos"]): void {
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

  private static generateFilename(): string {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, "-").substring(0, 19)
    return `reporte-pedidos-${timestamp}.xlsx`
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
