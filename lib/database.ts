import { supabase, isSupabaseConfigured } from "./supabase"
import type { Producto, Cliente, Pedido, Proveedor, ReporteAutomatico } from "./types"

export class Database {
  // Helper method to check if database is configured
  private static checkConfiguration() {
    if (!isSupabaseConfigured()) {
      throw new Error("Database not configured. Please set up your Supabase environment variables.")
    }
  }

  // Helper method to check if tables exist
  static async checkTablesExist(): Promise<{ exists: boolean; missingTables: string[] }> {
    const requiredTables = ["proveedores", "productos", "clientes", "pedidos", "pedido_productos"]
    const missingTables: string[] = []

    try {
      if (!isSupabaseConfigured()) {
        return { exists: false, missingTables: requiredTables }
      }

      for (const table of requiredTables) {
        const { error } = await supabase.from(table).select("*").limit(1)
        if (error && error.message.includes("does not exist")) {
          missingTables.push(table)
        }
      }

      return {
        exists: missingTables.length === 0,
        missingTables,
      }
    } catch (error) {
      console.error("Error checking tables:", error)
      return { exists: false, missingTables: requiredTables }
    }
  }

  // Clientes
  static async getClientes(): Promise<Cliente[]> {
    this.checkConfiguration()

    try {
      const { data, error } = await supabase.from("clientes").select("*").order("nombre")

      if (error) {
        console.error("Error fetching clientes:", error)
        if (error.message.includes("does not exist")) {
          throw new Error("Database tables not found. Please run the setup scripts first.")
        }
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getClientes:", error)
      return []
    }
  }

  static async getClienteById(id: number): Promise<Cliente | null> {
    this.checkConfiguration()

    try {
      const { data, error } = await supabase.from("clientes").select("*").eq("cliente_id", id).single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching cliente:", error)
      return null
    }
  }

  static async createCliente(cliente: Omit<Cliente, "cliente_id" | "created_at" | "updated_at">): Promise<boolean> {
    this.checkConfiguration()

    try {
      const { error } = await supabase.from("clientes").insert([cliente])

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error creating cliente:", error)
      return false
    }
  }

  static async updateCliente(id: number, cliente: Partial<Cliente>): Promise<boolean> {
    this.checkConfiguration()

    try {
      const { error } = await supabase
        .from("clientes")
        .update({ ...cliente, updated_at: new Date().toISOString() })
        .eq("cliente_id", id)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error updating cliente:", error)
      return false
    }
  }

  static async deleteCliente(id: number): Promise<boolean> {
    this.checkConfiguration()

    try {
      const { error } = await supabase.from("clientes").delete().eq("cliente_id", id)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error deleting cliente:", error)
      return false
    }
  }

  // Proveedores
  static async getProveedores(): Promise<Proveedor[]> {
    this.checkConfiguration()

    try {
      const { data, error } = await supabase.from("proveedores").select("*").order("proveedor_nombre")

      if (error) {
        console.error("Error fetching proveedores:", error)
        if (error.message.includes("does not exist")) {
          throw new Error("Database tables not found. Please run the setup scripts first.")
        }
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getProveedores:", error)
      return []
    }
  }

  static async getProveedorById(id: number): Promise<Proveedor | null> {
    this.checkConfiguration()

    try {
      const { data, error } = await supabase.from("proveedores").select("*").eq("proveedor_id", id).single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching proveedor:", error)
      return null
    }
  }

  static async createProveedor(
    proveedor: Omit<Proveedor, "proveedor_id" | "created_at" | "updated_at">,
  ): Promise<boolean> {
    this.checkConfiguration()

    try {
      const { error } = await supabase.from("proveedores").insert([proveedor])

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error creating proveedor:", error)
      return false
    }
  }

  static async updateProveedor(id: number, proveedor: Partial<Proveedor>): Promise<boolean> {
    this.checkConfiguration()

    try {
      const { error } = await supabase
        .from("proveedores")
        .update({ ...proveedor, updated_at: new Date().toISOString() })
        .eq("proveedor_id", id)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error updating proveedor:", error)
      return false
    }
  }

  static async deleteProveedor(id: number): Promise<boolean> {
    this.checkConfiguration()

    try {
      const { error } = await supabase.from("proveedores").delete().eq("proveedor_id", id)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error deleting proveedor:", error)
      return false
    }
  }

  // Productos - Consultas completamente separadas
  static async getProductos(): Promise<Producto[]> {
    this.checkConfiguration()

    try {
      console.log("Fetching productos with separate queries...")

      // 1. Obtener productos básicos
      const { data: productosData, error: productosError } = await supabase
        .from("productos")
        .select("articulo_numero, producto_codigo, descripcion, unidad_medida, proveedor_id, created_at, updated_at")
        .order("articulo_numero")

      if (productosError) {
        console.error("Error fetching productos:", productosError)
        if (productosError.message.includes("does not exist")) {
          throw new Error("Database tables not found. Please run the setup scripts first.")
        }
        return []
      }

      if (!productosData || productosData.length === 0) {
        console.log("No productos found")
        return []
      }

      console.log(`Found ${productosData.length} productos`)

      // 2. Obtener proveedores por separado
      const { data: proveedoresData, error: proveedoresError } = await supabase
        .from("proveedores")
        .select("proveedor_id, proveedor_nombre, created_at, updated_at")

      if (proveedoresError) {
        console.error("Error fetching proveedores:", proveedoresError)
        return []
      }

      console.log(`Found ${proveedoresData?.length || 0} proveedores`)

      // 3. Crear mapa de proveedores para búsqueda rápida
      const proveedoresMap = new Map(proveedoresData?.map((p) => [p.proveedor_id, p]) || [])

      // 4. Combinar datos manualmente
      const productos = productosData.map((p) => ({
        articulo_numero: p.articulo_numero,
        producto_codigo: p.producto_codigo || "",
        descripcion: p.descripcion,
        unidad_medida: p.unidad_medida,
        proveedor_id: p.proveedor_id,
        created_at: p.created_at,
        updated_at: p.updated_at,
        proveedor: proveedoresMap.get(p.proveedor_id) || {
          proveedor_id: p.proveedor_id,
          proveedor_nombre: "Proveedor no encontrado",
          created_at: "",
          updated_at: "",
        },
      }))

      console.log(`Successfully combined ${productos.length} productos with proveedores`)
      return productos
    } catch (error) {
      console.error("Error in getProductos:", error)
      return []
    }
  }

  static async getProductoById(articuloNumero: number): Promise<Producto | null> {
    this.checkConfiguration()

    try {
      // Obtener producto
      const { data: productoData, error: productoError } = await supabase
        .from("productos")
        .select("articulo_numero, producto_codigo, descripcion, unidad_medida, proveedor_id, created_at, updated_at")
        .eq("articulo_numero", articuloNumero)
        .single()

      if (productoError) throw productoError

      // Obtener proveedor por separado
      const { data: proveedorData, error: proveedorError } = await supabase
        .from("proveedores")
        .select("proveedor_id, proveedor_nombre, created_at, updated_at")
        .eq("proveedor_id", productoData.proveedor_id)
        .single()

      if (proveedorError) {
        console.error("Error fetching proveedor:", proveedorError)
        return null
      }

      return {
        articulo_numero: productoData.articulo_numero,
        producto_codigo: productoData.producto_codigo || "",
        descripcion: productoData.descripcion,
        unidad_medida: productoData.unidad_medida,
        proveedor_id: productoData.proveedor_id,
        created_at: productoData.created_at,
        updated_at: productoData.updated_at,
        proveedor: proveedorData,
      }
    } catch (error) {
      console.error("Error fetching producto:", error)
      return null
    }
  }

  static async createProducto(producto: Omit<Producto, "created_at" | "updated_at">): Promise<boolean> {
    this.checkConfiguration()

    try {
      const { error } = await supabase.from("productos").insert([
        {
          articulo_numero: producto.articulo_numero,
          producto_codigo: producto.producto_codigo,
          descripcion: producto.descripcion,
          unidad_medida: producto.unidad_medida,
          proveedor_id: producto.proveedor_id,
        },
      ])

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error creating producto:", error)
      return false
    }
  }

  static async updateProducto(articuloNumero: number, producto: Partial<Producto>): Promise<boolean> {
    this.checkConfiguration()

    try {
      const { error } = await supabase
        .from("productos")
        .update({
          producto_codigo: producto.producto_codigo,
          descripcion: producto.descripcion,
          unidad_medida: producto.unidad_medida,
          proveedor_id: producto.proveedor_id,
          updated_at: new Date().toISOString(),
        })
        .eq("articulo_numero", articuloNumero)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error updating producto:", error)
      return false
    }
  }

  static async deleteProducto(articuloNumero: number): Promise<boolean> {
    this.checkConfiguration()

    try {
      const { error } = await supabase.from("productos").delete().eq("articulo_numero", articuloNumero)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error deleting producto:", error)
      return false
    }
  }

  static async createProductos(productos: Omit<Producto, "created_at" | "updated_at">[]): Promise<Producto[]> {
    this.checkConfiguration()

    try {
      const insertData = productos.map((p) => ({
        articulo_numero: p.articulo_numero,
        producto_codigo: p.producto_codigo,
        descripcion: p.descripcion,
        unidad_medida: p.unidad_medida,
        proveedor_id: p.proveedor_id,
      }))

      const { data, error } = await supabase.from("productos").insert(insertData).select()

      if (error) {
        console.error("Error creating productos:", error)
        return []
      }

      // Fetch all proveedores for mapping
      const { data: proveedoresData, error: proveedoresError } = await supabase
        .from("proveedores")
        .select("proveedor_id, proveedor_nombre, created_at, updated_at")

      if (proveedoresError) {
        console.error("Error fetching proveedores:", proveedoresError)
        return []
      }

      const proveedoresMap = new Map(proveedoresData.map((p) => [p.proveedor_id, p]))

      return data.map((p) => ({
        articulo_numero: p.articulo_numero,
        producto_codigo: p.producto_codigo || "",
        descripcion: p.descripcion,
        unidad_medida: p.unidad_medida,
        proveedor_id: p.proveedor_id,
        created_at: p.created_at,
        updated_at: p.updated_at,
        proveedor: proveedoresMap.get(p.proveedor_id) || {
          proveedor_id: p.proveedor_id,
          proveedor_nombre: "Proveedor no encontrado",
          created_at: "",
          updated_at: "",
        },
      }))
    } catch (error) {
      console.error("Error in createProductos:", error)
      return []
    }
  }

  // Pedidos - Completamente reescrito con consultas independientes
  static async getPedidos(): Promise<Pedido[]> {
    this.checkConfiguration()

    try {
      console.log("Starting getPedidos with completely separate queries...")

      // 1. Obtener pedidos básicos solamente
      const { data: pedidosData, error: pedidosError } = await supabase
        .from("pedidos")
        .select("pedido_id, cliente_id, fecha_pedido, created_at, updated_at")
        .order("fecha_pedido", { ascending: false })

      if (pedidosError) {
        console.error("Error fetching pedidos:", pedidosError)
        if (pedidosError.message.includes("does not exist")) {
          throw new Error("Database tables not found. Please run the setup scripts first.")
        }
        return []
      }

      if (!pedidosData || pedidosData.length === 0) {
        console.log("No pedidos found")
        return []
      }

      console.log(`Found ${pedidosData.length} pedidos`)

      // 2. Obtener clientes por separado
      const { data: clientesData, error: clientesError } = await supabase
        .from("clientes")
        .select("cliente_id, cliente_codigo, nombre, domicilio, telefono, cuil, created_at, updated_at")

      if (clientesError) {
        console.error("Error fetching clientes:", clientesError)
      }

      console.log(`Found ${clientesData?.length || 0} clientes`)

      // 3. Obtener pedido_productos por separado
      const { data: pedidoProductosData, error: pedidoProductosError } = await supabase
        .from("pedido_productos")
        .select("id, pedido_id, articulo_numero, cantidad, created_at")

      if (pedidoProductosError) {
        console.error("Error fetching pedido_productos:", pedidoProductosError)
      }

      console.log(`Found ${pedidoProductosData?.length || 0} pedido_productos`)

      // 4. Obtener productos por separado
      const { data: productosData, error: productosError } = await supabase
        .from("productos")
        .select("articulo_numero, producto_codigo, descripcion, unidad_medida, proveedor_id, created_at, updated_at")

      if (productosError) {
        console.error("Error fetching productos:", productosError)
      }

      console.log(`Found ${productosData?.length || 0} productos`)

      // 5. Obtener proveedores por separado
      const { data: proveedoresData, error: proveedoresError } = await supabase
        .from("proveedores")
        .select("proveedor_id, proveedor_nombre, created_at, updated_at")

      if (proveedoresError) {
        console.error("Error fetching proveedores:", proveedoresError)
      }

      console.log(`Found ${proveedoresData?.length || 0} proveedores`)

      // 6. Crear mapas para búsqueda eficiente
      const clientesMap = new Map((clientesData || []).map((c) => [c.cliente_id, c]))
      const productosMap = new Map((productosData || []).map((p) => [p.articulo_numero, p]))
      const proveedoresMap = new Map((proveedoresData || []).map((p) => [p.proveedor_id, p]))

      // 7. Agrupar pedido_productos por pedido_id
      const pedidoProductosMap = new Map<number, any[]>()
      ;(pedidoProductosData || []).forEach((pp) => {
        if (!pedidoProductosMap.has(pp.pedido_id)) {
          pedidoProductosMap.set(pp.pedido_id, [])
        }
        pedidoProductosMap.get(pp.pedido_id)!.push(pp)
      })

      // 8. Combinar todos los datos manualmente
      const pedidosCompletos = pedidosData.map((pedido) => {
        // Obtener cliente
        const cliente = clientesMap.get(pedido.cliente_id) || {
          cliente_id: pedido.cliente_id,
          cliente_codigo: 0,
          nombre: "Cliente no encontrado",
          domicilio: "",
          telefono: "",
          cuil: "",
          created_at: "",
          updated_at: "",
        }

        // Obtener productos del pedido
        const pedidoProductos = pedidoProductosMap.get(pedido.pedido_id) || []

        const productos = pedidoProductos.map((pp) => {
          const producto = productosMap.get(pp.articulo_numero)
          let proveedor = null

          if (producto) {
            proveedor = proveedoresMap.get(producto.proveedor_id) || {
              proveedor_id: producto.proveedor_id,
              proveedor_nombre: "Proveedor no encontrado",
              created_at: "",
              updated_at: "",
            }
          }

          return {
            id: pp.id,
            pedido_id: pp.pedido_id,
            articulo_numero: pp.articulo_numero,
            cantidad: pp.cantidad,
            created_at: pp.created_at,
            producto: producto
              ? {
                  articulo_numero: producto.articulo_numero,
                  producto_codigo: producto.producto_codigo || "",
                  descripcion: producto.descripcion,
                  unidad_medida: producto.unidad_medida,
                  proveedor_id: producto.proveedor_id,
                  created_at: producto.created_at,
                  updated_at: producto.updated_at,
                  proveedor: proveedor!,
                }
              : {
                  articulo_numero: pp.articulo_numero,
                  producto_codigo: "",
                  descripcion: "Producto no encontrado",
                  unidad_medida: "unidad",
                  proveedor_id: 1,
                  created_at: "",
                  updated_at: "",
                  proveedor: {
                    proveedor_id: 1,
                    proveedor_nombre: "Proveedor no encontrado",
                    created_at: "",
                    updated_at: "",
                  },
                },
          }
        })

        return {
          pedido_id: pedido.pedido_id,
          cliente_id: pedido.cliente_id,
          fecha_pedido: pedido.fecha_pedido,
          created_at: pedido.created_at,
          updated_at: pedido.updated_at,
          incluido_en_reporte: false, // Default value
          fecha_inclusion_reporte: undefined,
          reporte_id: undefined,
          cliente: cliente,
          productos: productos,
        }
      })

      console.log(`Successfully combined data for ${pedidosCompletos.length} pedidos`)
      return pedidosCompletos
    } catch (error) {
      console.error("Error in getPedidos:", error)
      return []
    }
  }

  static async getPedidoById(id: number): Promise<Pedido | null> {
    this.checkConfiguration()

    try {
      // Obtener pedido básico
      const { data: pedidoData, error: pedidoError } = await supabase
        .from("pedidos")
        .select("pedido_id, cliente_id, fecha_pedido, created_at, updated_at")
        .eq("pedido_id", id)
        .single()

      if (pedidoError) throw pedidoError

      // Obtener cliente por separado
      const { data: clienteData, error: clienteError } = await supabase
        .from("clientes")
        .select("cliente_id, cliente_codigo, nombre, domicilio, telefono, cuil, created_at, updated_at")
        .eq("cliente_id", pedidoData.cliente_id)
        .single()

      if (clienteError) {
        console.error("Error fetching cliente:", clienteError)
      }

      // Obtener productos del pedido por separado
      const { data: pedidoProductosData, error: pedidoProductosError } = await supabase
        .from("pedido_productos")
        .select("id, pedido_id, articulo_numero, cantidad, created_at")
        .eq("pedido_id", id)

      if (pedidoProductosError) {
        console.error("Error fetching pedido productos:", pedidoProductosError)
      }

      return {
        pedido_id: pedidoData.pedido_id,
        cliente_id: pedidoData.cliente_id,
        fecha_pedido: pedidoData.fecha_pedido,
        created_at: pedidoData.created_at,
        updated_at: pedidoData.updated_at,
        incluido_en_reporte: false,
        fecha_inclusion_reporte: undefined,
        reporte_id: undefined,
        cliente: clienteData || null,
        productos: pedidoProductosData || [],
      }
    } catch (error) {
      console.error("Error fetching pedido:", error)
      return null
    }
  }

  static async createPedido(pedido: {
    cliente_id: number
    fecha_pedido: string
    productos: { articulo_numero: number; cantidad: number }[]
  }): Promise<number | null> {
    this.checkConfiguration()

    try {
      // Crear el pedido
      const { data: nuevoPedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert([
          {
            cliente_id: pedido.cliente_id,
            fecha_pedido: pedido.fecha_pedido,
          },
        ])
        .select("pedido_id")
        .single()

      if (pedidoError) throw pedidoError

      // Crear los productos del pedido
      const productosData = pedido.productos.map((producto) => ({
        pedido_id: nuevoPedido.pedido_id,
        articulo_numero: producto.articulo_numero,
        cantidad: producto.cantidad,
      }))

      const { error: productosError } = await supabase.from("pedido_productos").insert(productosData)

      if (productosError) throw productosError

      return nuevoPedido.pedido_id
    } catch (error) {
      console.error("Error creating pedido:", error)
      return null
    }
  }

  static async updatePedido(
    id: number,
    pedido: {
      cliente_id?: number
      fecha_pedido?: string
      productos?: { articulo_numero: number; cantidad: number }[]
    },
  ): Promise<boolean> {
    this.checkConfiguration()

    try {
      // Actualizar el pedido
      const updateData: any = { updated_at: new Date().toISOString() }
      if (pedido.cliente_id) updateData.cliente_id = pedido.cliente_id
      if (pedido.fecha_pedido) updateData.fecha_pedido = pedido.fecha_pedido

      const { error: pedidoError } = await supabase.from("pedidos").update(updateData).eq("pedido_id", id)

      if (pedidoError) throw pedidoError

      // Actualizar productos si se proporcionan
      if (pedido.productos) {
        // Eliminar productos existentes
        const { error: deleteError } = await supabase.from("pedido_productos").delete().eq("pedido_id", id)

        if (deleteError) throw deleteError

        // Insertar nuevos productos
        const productosData = pedido.productos.map((producto) => ({
          pedido_id: id,
          articulo_numero: producto.articulo_numero,
          cantidad: producto.cantidad,
        }))

        const { error: insertError } = await supabase.from("pedido_productos").insert(productosData)

        if (insertError) throw insertError
      }

      return true
    } catch (error) {
      console.error("Error updating pedido:", error)
      return false
    }
  }

  static async deletePedido(id: number): Promise<boolean> {
    this.checkConfiguration()

    try {
      // Eliminar productos del pedido primero
      const { error: productosError } = await supabase.from("pedido_productos").delete().eq("pedido_id", id)

      if (productosError) throw productosError

      // Eliminar el pedido
      const { error: pedidoError } = await supabase.from("pedidos").delete().eq("pedido_id", id)

      if (pedidoError) throw pedidoError

      return true
    } catch (error) {
      console.error("Error deleting pedido:", error)
      return false
    }
  }

  // Reportes Automáticos - Solo usar localStorage para evitar problemas con la tabla
  static async getReportesAutomaticos(): Promise<ReporteAutomatico[]> {
    try {
      console.log("Getting reportes from localStorage...")
      const stored = localStorage.getItem("reportes_automaticos")
      const reportes = stored ? JSON.parse(stored) : []
      console.log(`Found ${reportes.length} reportes in localStorage`)
      return reportes
    } catch (error) {
      console.error("Error reading reportes from localStorage:", error)
      return []
    }
  }

  // Método que usa solo localStorage para evitar problemas con la tabla
  static async createReporteAutomatico(reporte: ReporteAutomatico): Promise<ReporteAutomatico | null> {
    try {
      console.log("Saving reporte to localStorage only...")

      // Obtener reportes existentes
      const existing = await this.getReportesAutomaticos()

      // Agregar el nuevo reporte al inicio
      const updated = [reporte, ...existing]

      // Guardar en localStorage
      localStorage.setItem("reportes_automaticos", JSON.stringify(updated))

      console.log(`Reporte saved to localStorage with ID: ${reporte.id}`)
      return reporte
    } catch (error) {
      console.error("Error saving reporte to localStorage:", error)
      return null
    }
  }

  // Método legacy para compatibilidad
  static async saveReporteAutomatico(reporte: ReporteAutomatico): Promise<boolean> {
    const result = await this.createReporteAutomatico(reporte)
    return result !== null
  }

  // Método para obtener pedidos sin reportar usando localStorage
  static async getPedidosSinReportar(): Promise<Pedido[]> {
    try {
      console.log("Getting unreported pedidos...")

      // Obtener todos los pedidos
      const todosPedidos = await this.getPedidos()
      console.log(`Total pedidos: ${todosPedidos.length}`)

      // Obtener reportes automáticos para saber qué pedidos ya fueron reportados
      const reportesAutomaticos = await this.getReportesAutomaticos()
      console.log(`Total reportes: ${reportesAutomaticos.length}`)

      // Crear set de pedidos ya reportados
      const pedidosReportados = new Set<number>()
      reportesAutomaticos.forEach((reporte) => {
        reporte.pedidos_incluidos.forEach((pedidoId) => {
          pedidosReportados.add(pedidoId)
        })
      })

      console.log(`Pedidos reportados: ${pedidosReportados.size}`)

      // Filtrar pedidos no reportados
      const pedidosSinReportar = todosPedidos.filter((pedido) => !pedidosReportados.has(pedido.pedido_id))
      console.log(`Pedidos sin reportar: ${pedidosSinReportar.length}`)

      return pedidosSinReportar
    } catch (error) {
      console.error("Error getting unreported pedidos:", error)
      return []
    }
  }

  static async markPedidoAsReported(pedidoId: number, reporteId: string): Promise<boolean> {
    try {
      console.log(`Marking pedido ${pedidoId} as reported in localStorage...`)

      // Usar localStorage para marcar pedidos como reportados
      const reportedOrders = JSON.parse(localStorage.getItem("reported_orders") || "{}")
      reportedOrders[pedidoId] = {
        reporte_id: reporteId,
        fecha_inclusion: new Date().toISOString(),
      }
      localStorage.setItem("reported_orders", JSON.stringify(reportedOrders))

      console.log(`Pedido ${pedidoId} marked as reported`)
      return true
    } catch (error) {
      console.error("Error marking pedido as reported:", error)
      return false
    }
  }

  static async isPedidoReported(pedidoId: number): Promise<boolean> {
    try {
      // Verificar en localStorage
      const reportedOrders = JSON.parse(localStorage.getItem("reported_orders") || "{}")
      return !!reportedOrders[pedidoId]
    } catch (error) {
      console.error("Error checking if pedido is reported:", error)
      return false
    }
  }
}
