import type { ReporteSemanal, ReporteProductosPorProveedor, ReportePedidos } from "./types"

export interface ReporteData {
  general: ReporteSemanal
  productos_por_proveedor: ReporteProductosPorProveedor
  pedidos: ReportePedidos
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

  private static addGeneralSheet(workbook: any, XLSX: any, reporte: ReporteSemanal): void {
    const data: any[][] = []

    // Encabezado del reporte
    data.push(["REPORTE GENERAL SEMANAL"])
    data.push([])
    data.push(["Fecha de corte:", this.formatDate(reporte.fecha_corte)])
    data.push([
      "Período:",
      `${this.formatDate(reporte.resumen.fecha_inicio)} - ${this.formatDate(reporte.resumen.fecha_fin)}`,
    ])
    data.push([])

    // Resumen
    data.push(["RESUMEN"])
    data.push(["Total de pedidos:", reporte.resumen.total_pedidos])
    data.push(["Total de productos:", reporte.resumen.total_productos])
    data.push(["Total de clientes:", reporte.resumen.total_clientes])
    data.push([])

    // Encabezados de pedidos
    data.push(["DETALLE DE PEDIDOS"])
    data.push(["Pedido ID", "Cliente", "Fecha", "Productos", "Cantidades"])

    // Datos de pedidos
    reporte.pedidos.forEach((pedido) => {
      const productos = pedido.productos?.map((p) => p.producto?.descripcion || "N/A").join("; ") || "Sin productos"
      const cantidades = pedido.productos?.map((p) => p.cantidad).join("; ") || "0"

      data.push([
        pedido.pedido_id,
        pedido.cliente?.nombre || "Cliente no encontrado",
        this.formatDate(pedido.fecha_pedido),
        productos,
        cantidades,
      ])
    })

    // Crear hoja
    const worksheet = XLSX.utils.aoa_to_sheet(data)

    // Ajustar anchos de columna
    worksheet["!cols"] = [
      { wch: 12 }, // Pedido ID
      { wch: 25 }, // Cliente
      { wch: 12 }, // Fecha
      { wch: 40 }, // Productos
      { wch: 15 }, // Cantidades
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte General")
  }

  private static addProductosPorProveedorSheet(workbook: any, XLSX: any, reporte: ReporteProductosPorProveedor): void {
    const data: any[][] = []

    // Encabezado del reporte
    data.push(["PRODUCTOS POR PROVEEDOR"])
    data.push([])
    data.push(["Fecha de corte:", this.formatDate(reporte.fecha_corte)])
    data.push(["Total de proveedores:", reporte.total_proveedores])
    data.push([])

    // Datos por proveedor
    reporte.proveedores.forEach((proveedor) => {
      data.push([`PROVEEDOR: ${proveedor.proveedor_nombre} (ID: ${proveedor.proveedor_id})`])
      data.push(["Artículo", "Descripción", "Unidad", "Cantidad Total"])

      proveedor.productos.forEach((producto) => {
        data.push([producto.articulo_numero, producto.descripcion, producto.unidad_medida, producto.cantidad_total])
      })

      data.push(["", "", "TOTAL PRODUCTOS:", proveedor.total_productos])
      data.push([])
    })

    // Crear hoja
    const worksheet = XLSX.utils.aoa_to_sheet(data)

    // Ajustar anchos de columna
    worksheet["!cols"] = [
      { wch: 12 }, // Artículo
      { wch: 35 }, // Descripción
      { wch: 12 }, // Unidad
      { wch: 15 }, // Cantidad
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, "Por Proveedor")
  }

  private static addPedidosSheet(workbook: any, XLSX: any, reporte: ReportePedidos): void {
    const data: any[][] = []

    // Encabezado del reporte
    data.push(["REPORTE DE PEDIDOS"])
    data.push([])
    data.push(["Fecha de corte:", this.formatDate(reporte.fecha_corte)])
    data.push(["Total de pedidos:", reporte.total_pedidos])
    data.push([])

    // Encabezados
    data.push(["Pedido ID", "Cliente", "Fecha", "Producto", "Cantidad", "Unidad"])

    // Datos de pedidos
    reporte.pedidos.forEach((pedido) => {
      pedido.productos.forEach((producto, index) => {
        data.push([
          index === 0 ? pedido.pedido_id : "", // Solo mostrar ID en la primera fila
          index === 0 ? pedido.cliente_nombre : "", // Solo mostrar cliente en la primera fila
          index === 0 ? this.formatDate(pedido.fecha_pedido) : "", // Solo mostrar fecha en la primera fila
          producto.descripcion,
          producto.cantidad,
          producto.unidad_medida,
        ])
      })
      data.push([]) // Línea en blanco entre pedidos
    })

    // Crear hoja
    const worksheet = XLSX.utils.aoa_to_sheet(data)

    // Ajustar anchos de columna
    worksheet["!cols"] = [
      { wch: 12 }, // Pedido ID
      { wch: 25 }, // Cliente
      { wch: 12 }, // Fecha
      { wch: 35 }, // Producto
      { wch: 10 }, // Cantidad
      { wch: 12 }, // Unidad
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
      return dateString
    }
  }

  // Método auxiliar para generar reportes desde pedidos
  static generateReportFromPedidos(pedidos: any[], fechaInicio: string, fechaFin: string): ReporteData {
    const fechaCorte = new Date().toISOString()

    // Reporte general
    const general: ReporteSemanal = {
      fecha_corte: fechaCorte,
      resumen: {
        total_pedidos: pedidos.length,
        total_productos: pedidos.reduce((sum, p) => sum + (p.productos?.length || 0), 0),
        total_clientes: new Set(pedidos.map((p) => p.cliente_id)).size,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      },
      pedidos: pedidos,
    }

    // Reporte por proveedor
    const proveedoresMap = new Map()
    pedidos.forEach((pedido) => {
      pedido.productos?.forEach((pp: any) => {
        const producto = pp.producto
        if (producto && producto.proveedor) {
          const proveedorId = producto.proveedor.proveedor_id
          if (!proveedoresMap.has(proveedorId)) {
            proveedoresMap.set(proveedorId, {
              proveedor_id: proveedorId,
              proveedor_nombre: producto.proveedor.proveedor_nombre,
              productos: new Map(),
              total_productos: 0,
            })
          }

          const proveedor = proveedoresMap.get(proveedorId)
          const articuloNumero = producto.articulo_numero

          if (!proveedor.productos.has(articuloNumero)) {
            proveedor.productos.set(articuloNumero, {
              articulo_numero: articuloNumero,
              descripcion: producto.descripcion,
              unidad_medida: producto.unidad_medida,
              cantidad_total: 0,
            })
          }

          proveedor.productos.get(articuloNumero).cantidad_total += pp.cantidad
          proveedor.total_productos += pp.cantidad
        }
      })
    })

    const productos_por_proveedor: ReporteProductosPorProveedor = {
      fecha_corte: fechaCorte,
      proveedores: Array.from(proveedoresMap.values()).map((p) => ({
        ...p,
        productos: Array.from(p.productos.values()),
      })),
      total_proveedores: proveedoresMap.size,
    }

    // Reporte de pedidos
    const pedidosReporte: ReportePedidos = {
      fecha_corte: fechaCorte,
      pedidos: pedidos.map((pedido) => ({
        pedido_id: pedido.pedido_id,
        cliente_nombre: pedido.cliente?.nombre || "Cliente no encontrado",
        fecha_pedido: pedido.fecha_pedido,
        productos:
          pedido.productos?.map((pp: any) => ({
            descripcion: pp.producto?.descripcion || "Producto no encontrado",
            cantidad: pp.cantidad,
            unidad_medida: pp.producto?.unidad_medida || "unidad",
          })) || [],
      })),
      total_pedidos: pedidos.length,
    }

    return {
      general,
      productos_por_proveedor,
      pedidos: pedidosReporte,
    }
  }
}
