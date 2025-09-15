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
    try {
      if (!isSupabaseConfigured()) {
        console.log("Supabase not configured, returning empty array")
        return []
      }

      // Usar solo las columnas que sabemos que existen según el schema
      const { data, error } = await supabase
        .from("clientes")
        .select("cliente_id, cliente_codigo, nombre, domicilio, telefono, created_at, updated_at")
        .order("nombre")

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
    try {
      if (!isSupabaseConfigured()) {
        return null
      }

      const { data, error } = await supabase
        .from("clientes")
        .select("cliente_id, cliente_codigo, nombre, domicilio, telefono, created_at, updated_at")
        .eq("cliente_id", id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error fetching cliente:", error)
      return null
    }
  }

  static async createCliente(
    cliente: Omit<Cliente, "cliente_id" | "created_at" | "updated_at">,
  ): Promise<Cliente | null> {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Database not configured")
      }

      const { data, error } = await supabase.from("clientes").insert([cliente]).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating cliente:", error)
      return null
    }
  }

  static async updateCliente(id: number, cliente: Partial<Cliente>): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        return false
      }

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
    try {
      if (!isSupabaseConfigured()) {
        return false
      }

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
    try {
      if (!isSupabaseConfigured()) {
        console.log("Supabase not configured, returning empty array")
        return []
      }

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
    try {
      if (!isSupabaseConfigured()) {
        return null
      }

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
  ): Promise<Proveedor | null> {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Database not configured")
      }

      const { data, error } = await supabase.from("proveedores").insert([proveedor]).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Error creating proveedor:", error)
      return null
    }
  }

  static async updateProveedor(id: number, proveedor: Partial<Proveedor>): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        return false
      }

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
    try {
      if (!isSupabaseConfigured()) {
        return false
      }

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
    try {
      if (!isSupabaseConfigured()) {
        console.log("Supabase not configured, returning empty array")
        return []
      }

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
    try {
      if (!isSupabaseConfigured()) {
        return null
      }

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

  static async createProducto(producto: Omit<Producto, "created_at" | "updated_at">): Promise<Producto | null> {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Database not configured")
      }

      const { data, error } = await supabase
        .from("productos")
        .insert([
          {
            articulo_numero: producto.articulo_numero,
            producto_codigo: producto.producto_codigo,
            descripcion: producto.descripcion,
            unidad_medida: producto.unidad_medida,
            proveedor_id: producto.proveedor_id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Obtener proveedor para el producto creado
      const proveedor = await this.getProveedorById(data.proveedor_id)

      return {
        ...data,
        proveedor: proveedor || {
          proveedor_id: data.proveedor_id,
          proveedor_nombre: "Proveedor no encontrado",
          created_at: "",
          updated_at: "",
        },
      }
    } catch (error) {
      console.error("Error creating producto:", error)
      return null
    }
  }

  static async updateProducto(articuloNumero: number, producto: Partial<Producto>): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        return false
      }

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
    try {
      if (!isSupabaseConfigured()) {
        return false
      }

      const { error } = await supabase.from("productos").delete().eq("articulo_numero", articuloNumero)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error deleting producto:", error)
      return false
    }
  }

  static async createProductos(productos: any[]): Promise<Producto[]> {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Database not configured")
      }

      console.log("Creating productos with data:", productos)

      // Validar que todos los productos tengan proveedor_id válido
      const invalidProducts = productos.filter((p) => !p.proveedor_id || p.proveedor_id <= 0)
      if (invalidProducts.length > 0) {
        console.error("Invalid products found:", invalidProducts)
        throw new Error(`${invalidProducts.length} productos tienen proveedor_id inválido`)
      }

      // Preparar datos para inserción
      const insertData = productos.map((p) => ({
        articulo_numero: p.articulo_numero,
        producto_codigo: p.producto_codigo || "",
        descripcion: p.descripcion,
        unidad_medida: p.unidad_medida,
        proveedor_id: p.proveedor_id, // Debe ser un número válido
      }))

      console.log("Insert data:", insertData)

      const { data, error } = await supabase.from("productos").insert(insertData).select()

      if (error) {
        console.error("Error creating productos:", error)
        throw error
      }

      console.log("Products created successfully:", data)

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
      throw error
    }
  }

  // Pedidos - Completamente reescrito con consultas independientes y manejo de errores mejorado
  static async getPedidos(): Promise<Pedido[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.log("Supabase not configured, returning empty array")
        return []
      }

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

      // 2. Obtener clientes por separado - SOLO columnas que existen según el schema
      const { data: clientesData, error: clientesError } = await supabase
        .from("clientes")
        .select("cliente_id, cliente_codigo, nombre, domicilio, telefono, created_at, updated_at")

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
        // Obtener cliente - sin cuil ya que no existe en el schema
        const cliente = clientesMap.get(pedido.cliente_id) || {
          cliente_id: pedido.cliente_id,
          cliente_codigo: 0,
          nombre: "Cliente no encontrado",
          domicilio: "",
          telefono: "",
          created_at: "",
          updated_at: "",
        }

        // Obtener productos del pedido
        const pedidoProductos = pedidoProductosMap.get(pedido.pedido_id) || []

        const productos = pedidoProductos.map((pp) => {
          const producto = productosMap.get(pp.articulo_numero)
          let proveedor = null

          if (producto && producto.proveedor_id) {
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
            cantidad: pp.cantidad || 0,
            created_at: pp.created_at,
            producto: producto
              ? {
                  articulo_numero: producto.articulo_numero,
                  producto_codigo: producto.producto_codigo || "",
                  descripcion: producto.descripcion || "Descripción no disponible",
                  unidad_medida: producto.unidad_medida || "unidad",
                  proveedor_id: producto.proveedor_id || 1,
                  created_at: producto.created_at || "",
                  updated_at: producto.updated_at || "",
                  proveedor: proveedor || {
                    proveedor_id: 1,
                    proveedor_nombre: "Proveedor no encontrado",
                    created_at: "",
                    updated_at: "",
                  },
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
      // En lugar de lanzar el error, devolver array vacío para evitar crashes
      return []
    }
  }

  static async getPedidoById(id: number): Promise<Pedido | null> {
    try {
      if (!isSupabaseConfigured()) {
        return null
      }

      console.log(`Getting pedido by ID: ${id}`)

      // 1. Obtener pedido básico
      const { data: pedidoData, error: pedidoError } = await supabase
        .from("pedidos")
        .select("pedido_id, cliente_id, fecha_pedido, created_at, updated_at")
        .eq("pedido_id", id)
        .single()

      if (pedidoError) {
        console.error("Error fetching pedido:", pedidoError)
        throw pedidoError
      }

      console.log("Pedido data:", pedidoData)

      // 2. Obtener cliente por separado - SOLO columnas que existen
      const { data: clienteData, error: clienteError } = await supabase
        .from("clientes")
        .select("cliente_id, cliente_codigo, nombre, domicilio, telefono, created_at, updated_at")
        .eq("cliente_id", pedidoData.cliente_id)
        .single()

      if (clienteError) {
        console.error("Error fetching cliente:", clienteError)
      }

      console.log("Cliente data:", clienteData)

      // 3. Obtener productos del pedido por separado
      const { data: pedidoProductosData, error: pedidoProductosError } = await supabase
        .from("pedido_productos")
        .select("id, pedido_id, articulo_numero, cantidad, created_at")
        .eq("pedido_id", id)

      if (pedidoProductosError) {
        console.error("Error fetching pedido productos:", pedidoProductosError)
      }

      console.log("Pedido productos data:", pedidoProductosData)

      // 4. Si hay productos, obtener sus detalles
      let productosCompletos: any[] = []
      if (pedidoProductosData && pedidoProductosData.length > 0) {
        const articuloNumeros = pedidoProductosData.map((pp) => pp.articulo_numero)

        // Obtener productos
        const { data: productosData, error: productosError } = await supabase
          .from("productos")
          .select("articulo_numero, producto_codigo, descripcion, unidad_medida, proveedor_id, created_at, updated_at")
          .in("articulo_numero", articuloNumeros)

        if (productosError) {
          console.error("Error fetching productos:", productosError)
        }

        console.log("Productos data:", productosData)

        // Obtener proveedores si hay productos
        if (productosData && productosData.length > 0) {
          const proveedorIds = [...new Set(productosData.map((p) => p.proveedor_id).filter(Boolean))]

          const { data: proveedoresData, error: proveedoresError } = await supabase
            .from("proveedores")
            .select("proveedor_id, proveedor_nombre, created_at, updated_at")
            .in("proveedor_id", proveedorIds)

          if (proveedoresError) {
            console.error("Error fetching proveedores:", proveedoresError)
          }

          console.log("Proveedores data:", proveedoresData)

          // Crear mapas
          const productosMap = new Map((productosData || []).map((p) => [p.articulo_numero, p]))
          const proveedoresMap = new Map((proveedoresData || []).map((p) => [p.proveedor_id, p]))

          // Combinar datos
          productosCompletos = pedidoProductosData.map((pp) => {
            const producto = productosMap.get(pp.articulo_numero)
            const proveedor = producto && producto.proveedor_id ? proveedoresMap.get(producto.proveedor_id) : null

            return {
              id: pp.id,
              pedido_id: pp.pedido_id,
              articulo_numero: pp.articulo_numero,
              cantidad: pp.cantidad || 0,
              created_at: pp.created_at,
              producto: producto
                ? {
                    articulo_numero: producto.articulo_numero,
                    producto_codigo: producto.producto_codigo || "",
                    descripcion: producto.descripcion || "Descripción no disponible",
                    unidad_medida: producto.unidad_medida || "unidad",
                    proveedor_id: producto.proveedor_id || 1,
                    created_at: producto.created_at || "",
                    updated_at: producto.updated_at || "",
                    proveedor: proveedor || {
                      proveedor_id: producto.proveedor_id || 1,
                      proveedor_nombre: "Proveedor no encontrado",
                      created_at: "",
                      updated_at: "",
                    },
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
        }
      }

      const pedidoCompleto = {
        pedido_id: pedidoData.pedido_id,
        cliente_id: pedidoData.cliente_id,
        fecha_pedido: pedidoData.fecha_pedido,
        created_at: pedidoData.created_at,
        updated_at: pedidoData.updated_at,
        incluido_en_reporte: false,
        fecha_inclusion_reporte: undefined,
        reporte_id: undefined,
        cliente: clienteData || {
          cliente_id: pedidoData.cliente_id,
          cliente_codigo: 0,
          nombre: "Cliente no encontrado",
          domicilio: "",
          telefono: "",
          created_at: "",
          updated_at: "",
        },
        productos: productosCompletos,
      }

      console.log("Complete pedido:", pedidoCompleto)
      return pedidoCompleto
    } catch (error) {
      console.error("Error in getPedidoById:", error)
      return null
    }
  }

  // Método corregido para crear pedidos
  static async createPedido(pedido: Omit<Pedido, "pedido_id" | "fecha_creacion">): Promise<Pedido | null> {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Database not configured")
      }

      console.log("Creating pedido with data:", pedido)

      // Extraer cliente_id del objeto cliente
      const cliente_id =
        typeof pedido.cliente === "object" && pedido.cliente ? pedido.cliente.cliente_id : pedido.cliente_id

      if (!cliente_id) {
        console.error("No cliente_id found in pedido data")
        return null
      }

      // Crear el pedido básico
      const { data: nuevoPedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert([
          {
            cliente_id: cliente_id,
            fecha_pedido: pedido.fecha_pedido,
          },
        ])
        .select("pedido_id, cliente_id, fecha_pedido, created_at, updated_at")
        .single()

      if (pedidoError) {
        console.error("Error creating pedido:", pedidoError)
        throw pedidoError
      }

      console.log("Pedido created:", nuevoPedido)

      // Preparar productos para insertar
      const productosData =
        pedido.productos?.map((producto) => ({
          pedido_id: nuevoPedido.pedido_id,
          articulo_numero: producto.articulo_numero,
          cantidad: producto.cantidad,
        })) || []

      if (productosData.length > 0) {
        const { error: productosError } = await supabase.from("pedido_productos").insert(productosData)

        if (productosError) {
          console.error("Error creating pedido productos:", productosError)
          // Intentar eliminar el pedido creado si falló la inserción de productos
          await supabase.from("pedidos").delete().eq("pedido_id", nuevoPedido.pedido_id)
          throw productosError
        }

        console.log(`Created ${productosData.length} pedido productos`)
      }

      // Obtener el pedido completo usando el método separado
      const pedidoCompleto = await this.getPedidoById(nuevoPedido.pedido_id)
      console.log("Final pedido completo:", pedidoCompleto)

      return pedidoCompleto
    } catch (error) {
      console.error("Error in createPedido:", error)
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
    try {
      if (!isSupabaseConfigured()) {
        return false
      }

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
    try {
      if (!isSupabaseConfigured()) {
        return false
      }

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
