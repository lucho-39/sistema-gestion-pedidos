import * as XLSX from "xlsx"
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
      cliente_codigo: string
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
        producto_codigo: string
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
      cliente_codigo: string
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

    worksheetData.push(["REPORTE GENERAL DE PEDIDOS"])
    worksheetData.push([])
    worksheetData.push(["Fecha de Corte:", this.formatDate(data.fecha_corte)])
    worksheetData.push([
      "Período:",
      `${this.formatDate(data.resumen.fecha_inicio)} - ${this.formatDate(data.resumen.fecha_fin)}`,
    ])
    worksheetData.push([])

    worksheetData.push(["RESUMEN"])
    worksheetData.push(["Total de Pedidos:", data.resumen.total_pedidos])
    worksheetData.push(["Total de Productos:", data.resumen.total_productos])
    worksheetData.push(["Total de Clientes:", data.resumen.total_clientes])
    worksheetData.push([])

    worksheetData.push(["DETALLE DE PEDIDOS"])
    worksheetData.push([
      "Pedido ID",
      "Código Cliente",
      "Cliente",
      "Fecha",
      "Producto",
      "Cantidad",
      "Unidad",
      "Proveedor",
    ])

    data.pedidos.forEach((pedido) => {
      pedido.productos.forEach((producto, index) => {
        worksheetData.push([
          index === 0 ? pedido.pedido_id : "",
          index === 0 ? pedido.cliente_codigo : "",
          index === 0 ? pedido.cliente_nombre : "",
          index === 0 ? this.formatDate(pedido.fecha_pedido) : "",
          producto.descripcion,
          producto.cantidad,
          producto.unidad_medida || producto.categoria?.unidad || "unidad",
          producto.proveedor_nombre,
        ])
      })
    })

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    worksheet["!cols"] = [
      { wch: 10 }, // Pedido ID
      { wch: 15 }, // Código Cliente
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

    worksheetData.push(["REPORTE POR PROVEEDOR"])
    worksheetData.push([])
    worksheetData.push(["Fecha de Corte:", this.formatDate(data.fecha_corte)])
    worksheetData.push(["Total de Proveedores:", data.total_proveedores])
    worksheetData.push([])

    worksheetData.push(["PRODUCTOS POR PROVEEDOR"])
    worksheetData.push(["Proveedor", "Artículo", "Código", "Descripción", "Unidad", "Cantidad Total"])

    data.proveedores.forEach((proveedor) => {
      proveedor.productos.forEach((producto, index) => {
        worksheetData.push([
          index === 0 ? proveedor.proveedor_nombre : "",
          producto.articulo_numero,
          producto.producto_codigo || "N/A",
          producto.descripcion,
          producto.unidad_medida || producto.categoria?.unidad || "unidad",
          producto.cantidad_total,
        ])
      })

      worksheetData.push([
        `TOTAL ${proveedor.proveedor_nombre.toUpperCase()}:`,
        "",
        "",
        "",
        "",
        proveedor.total_productos,
      ])
      worksheetData.push([]) // Línea en blanco
    })

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    worksheet["!cols"] = [
      { wch: 25 }, // Proveedor
      { wch: 12 }, // Artículo
      { wch: 15 }, // Código
      { wch: 35 }, // Descripción
      { wch: 10 }, // Unidad
      { wch: 15 }, // Cantidad Total
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, "Por Proveedor")
  }

  private static addPedidosSheet(workbook: any, XLSX: any, data: ReporteData["pedidos"]): void {
    const worksheetData: any[][] = []

    worksheetData.push(["REPORTE DE PEDIDOS"])
    worksheetData.push([])
    worksheetData.push(["Fecha de Corte:", this.formatDate(data.fecha_corte)])
    worksheetData.push(["Total de Pedidos:", data.total_pedidos])
    worksheetData.push([])

    worksheetData.push(["DETALLE DE PEDIDOS"])
    worksheetData.push(["Pedido ID", "Código Cliente", "Cliente", "Fecha", "Producto", "Cantidad", "Unidad"])

    data.pedidos.forEach((pedido) => {
      pedido.productos.forEach((producto, index) => {
        worksheetData.push([
          index === 0 ? pedido.pedido_id : "",
          index === 0 ? pedido.cliente_codigo : "",
          index === 0 ? pedido.cliente_nombre : "",
          index === 0 ? this.formatDate(pedido.fecha_pedido) : "",
          producto.descripcion,
          producto.cantidad,
          producto.unidad_medida || producto.categoria?.unidad || "unidad",
        ])
      })
    })

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    worksheet["!cols"] = [
      { wch: 10 }, // Pedido ID
      { wch: 15 }, // Código Cliente
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

  static generateReportFromPedidos(pedidos: any[], fechaInicio: string, fechaFin: string): ReporteData {
    const fechaCorte = new Date().toISOString()

    const clientesUnicos = new Set()
    let totalProductos = 0
    const pedidosParaReporte: any[] = []

    pedidos.forEach((pedido) => {
      clientesUnicos.add(pedido.cliente_id)
      totalProductos += pedido.productos?.length || 0

      pedidosParaReporte.push({
        pedido_id: pedido.pedido_id,
        cliente_nombre: pedido.cliente?.nombre || "Cliente desconocido",
        cliente_codigo: pedido.cliente?.cliente_codigo || "N/A",
        fecha_pedido: pedido.fecha_pedido,
        productos:
          pedido.productos?.map((p: any) => ({
            descripcion: p.producto?.descripcion || "Producto desconocido",
            cantidad: p.cantidad,
            unidad_medida: p.producto?.categoria?.unidad || "unidad",
            proveedor_nombre: p.producto?.proveedor?.proveedor_nombre || "Proveedor desconocido",
          })) || [],
      })
    })

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
            producto_codigo: p.producto?.producto_codigo || "N/A",
            descripcion: p.producto?.descripcion || "Producto desconocido",
            unidad_medida: p.producto?.categoria?.unidad || "unidad",
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
          cliente_codigo: p.cliente_codigo,
          fecha_pedido: p.fecha_pedido,
          productos: p.productos.map((prod: any) => ({
            descripcion: prod.descripcion,
            cantidad: prod.cantidad,
            unidad_medida: prod.unidad_medida || prod.categoria?.unidad || "unidad",
          })),
        })),
        total_pedidos: pedidos.length,
      },
    }
  }
}

export async function generateExcelFromReporte(
  reporte: ReporteAutomatico,
  tipo: "general" | "productos_por_proveedor" | "pedidos",
): Promise<void> {
  try {
    console.log("Generating Excel from reporte:", reporte.id, "tipo:", tipo)

    const workbook = XLSX.utils.book_new()

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

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
    const filename = `reporte_${tipo}_${timestamp}.xlsx`

    if (tipo === "general") {
      const resumenData = [
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

      const pedidosData = [
        ["ID Pedido", "Código Cliente", "Cliente", "Fecha Pedido", "Producto", "Cantidad", "Unidad", "Proveedor"],
      ]

      reporte.reportes.general.pedidos.forEach((pedido) => {
        pedido.productos?.forEach((producto, index) => {
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
      reporte.reportes.productos_por_proveedor.proveedores.forEach((proveedor, index) => {
        const worksheetData = [
          [`Proveedor: ${proveedor.proveedor_nombre}`],
          [""],
          ["Artículo", "Código Proveedor", "Descripción", "Unidad", "Cantidad Total"],
        ]

        proveedor.productos.forEach((producto) => {
          worksheetData.push([
            producto.articulo_numero,
            producto.producto_codigo || "N/A",
            producto.descripcion,
            producto.unidad_medida || producto.categoria?.unidad || "unidad",
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

      const resumenData = [["Resumen por Proveedores"], [""], ["Proveedor", "Total Productos", "Total Cantidad"]]

      reporte.reportes.productos_por_proveedor.proveedores.forEach((proveedor) => {
        const totalCantidad = proveedor.productos.reduce((sum, p) => sum + p.cantidad_total, 0)
        resumenData.push([proveedor.proveedor_nombre, proveedor.productos.length, totalCantidad])
      })

      const resumenWS = XLSX.utils.aoa_to_sheet(resumenData)
      XLSX.utils.book_append_sheet(workbook, resumenWS, "Resumen Proveedores")
    } else if (tipo === "pedidos") {
      const pedidosData = [["ID Pedido", "Código Cliente", "Cliente", "Fecha", "Producto", "Cantidad", "Unidad"]]

      reporte.reportes.pedidos.pedidos.forEach((pedido) => {
        pedido.productos.forEach((producto, index) => {
          pedidosData.push([
            index === 0 ? pedido.pedido_id : "",
            index === 0 ? pedido.cliente_codigo : "",
            index === 0 ? pedido.cliente_nombre : "",
            index === 0 ? new Date(pedido.fecha_pedido).toLocaleDateString("es-AR") : "",
            producto.descripcion,
            producto.cantidad,
            producto.unidad_medida || producto.categoria?.unidad || "unidad",
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
