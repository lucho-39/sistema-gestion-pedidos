import { supabase, isSupabaseConfigured } from "./supabase"
import type { Producto, Cliente, Pedido, Proveedor, Categoria, Imagen } from "./types"

export class Database {
  private static cuilColumnExists: boolean | null = null

  private static async checkCuilColumn(): Promise<boolean> {
    if (this.cuilColumnExists !== null) {
      return this.cuilColumnExists
    }

    try {
      const { error } = await supabase.from("clientes").select("cuil").limit(1)
      this.cuilColumnExists = !error
      return this.cuilColumnExists
    } catch {
      this.cuilColumnExists = false
      return false
    }
  }

  static async checkTablesExist(): Promise<{ exists: boolean; missingTables: string[] }> {
    const requiredTables = [
      "proveedores",
      "productos",
      "clientes",
      "pedidos",
      "pedido_productos",
      "categorias",
      "imagenes",
    ]
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

  // ============================================
  // CATEGORÍAS
  // ============================================
  static async getCategorias(): Promise<Categoria[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.log("Supabase no está configurado")
        return []
      }

      const { data, error } = await supabase
        .from("categorias")
        .select("id, nombre, unidad, created_at, updated_at")
        .order("nombre")

      if (error) {
        console.error("Error fetching categorias:", error)
        return []
      }

      console.log(`Categorías cargadas: ${data?.length || 0}`)
      return data || []
    } catch (error) {
      console.error("Error in getCategorias:", error)
      return []
    }
  }

  // ============================================
  // IMÁGENES
  // ============================================
  static async getImagenes(): Promise<Imagen[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.log("Supabase no está configurado")
        return []
      }

      const { data, error } = await supabase
        .from("imagenes")
        .select("id, url_img, txt_alt, created_at, updated_at")
        .order("id")

      if (error) {
        console.error("Error fetching imagenes:", error)
        return []
      }

      console.log(`Imágenes cargadas: ${data?.length || 0}`)
      return data || []
    } catch (error) {
      console.error("Error in getImagenes:", error)
      return []
    }
  }

  // ============================================
  // PROVEEDORES
  // ============================================
  static async getProveedores(): Promise<Proveedor[]> {
    try {
      if (!isSupabaseConfigured()) {
        console.log("Supabase no está configurado")
        return []
      }

      const { data, error } = await supabase
        .from("proveedores")
        .select("proveedor_id, proveedor_nombre, created_at, updated_at")
        .order("proveedor_nombre")

      if (error) {
        console.error("Error fetching proveedores:", error)
        if (error.message.includes("does not exist")) {
          throw new Error("Database tables not found. Please run the setup scripts first.")
        }
        return []
      }

      console.log(`Proveedores cargados: ${data?.length || 0}`)
      return data || []
    } catch (error) {
      console.error("Error in getProveedores:", error)
      throw error
    }
  }

  static async getProveedorById(id: number): Promise<Proveedor | null> {
    try {
      if (!isSupabaseConfigured()) {
        return null
      }

      const { data, error } = await supabase
        .from("proveedores")
        .select("proveedor_id, proveedor_nombre, created_at, updated_at")
        .eq("proveedor_id", id)
        .single()

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

  // ============================================
  // PRODUCTOS
  // ============================================
  static async getProductos(): Promise<Producto[]> {
    try {
      console.log("=== Iniciando getProductos ===")

      if (!isSupabaseConfigured()) {
        console.log("❌ Supabase no está configurado")
        return []
      }

      console.log("✅ Supabase configurado, obteniendo productos...")

      // Obtener productos
      const { data: productosData, error: productosError } = await supabase
        .from("productos")
        .select(
          "producto_id, articulo_numero, producto_codigo, titulo, descripcion, categoria_id, img_id, proveedor_id, created_at, updated_at",
        )
        .order("producto_id", { ascending: false })

      if (productosError) {
        console.error("❌ Error fetching productos:", productosError)
        if (productosError.message.includes("does not exist")) {
          throw new Error("Database tables not found. Please run the setup scripts first.")
        }
        return []
      }

      console.log(`✅ Productos obtenidos: ${productosData?.length || 0}`)

      if (!productosData || productosData.length === 0) {
        console.log("⚠️ No hay productos en la base de datos")
        return []
      }

      // Obtener datos relacionados
      console.log("Obteniendo categorías...")
      const { data: categoriasData, error: categoriasError } = await supabase.from("categorias").select("*")
      if (categoriasError) {
        console.error("Error obteniendo categorías:", categoriasError)
      } else {
        console.log(`✅ Categorías: ${categoriasData?.length || 0}`)
      }

      console.log("Obteniendo imágenes...")
      const { data: imagenesData, error: imagenesError } = await supabase.from("imagenes").select("*")
      if (imagenesError) {
        console.error("Error obteniendo imágenes:", imagenesError)
      } else {
        console.log(`✅ Imágenes: ${imagenesData?.length || 0}`)
      }

      console.log("Obteniendo proveedores...")
      const { data: proveedoresData, error: proveedoresError } = await supabase.from("proveedores").select("*")
      if (proveedoresError) {
        console.error("Error obteniendo proveedores:", proveedoresError)
      } else {
        console.log(`✅ Proveedores: ${proveedoresData?.length || 0}`)
      }

      // Crear mapas para búsqueda rápida
      const categoriasMap = new Map(categoriasData?.map((c) => [c.id, c]) || [])
      const imagenesMap = new Map(imagenesData?.map((i) => [i.id, i]) || [])
      const proveedoresMap = new Map(proveedoresData?.map((p) => [p.proveedor_id, p]) || [])

      // Combinar datos
      const productos = productosData.map((p) => {
        const categoria = categoriasMap.get(p.categoria_id)
        const imagen = imagenesMap.get(p.img_id)
        const proveedor = proveedoresMap.get(p.proveedor_id)

        if (!proveedor) {
          console.warn(`⚠️ Producto ${p.producto_id} sin proveedor (proveedor_id: ${p.proveedor_id})`)
        }

        return {
          producto_id: p.producto_id,
          articulo_numero: p.articulo_numero,
          producto_codigo: p.producto_codigo || "",
          titulo: p.titulo || "",
          descripcion: p.descripcion,
          categoria_id: p.categoria_id,
          img_id: p.img_id,
          proveedor_id: p.proveedor_id,
          created_at: p.created_at,
          updated_at: p.updated_at,
          categoria,
          imagen,
          proveedor,
        }
      })

      console.log(`✅ Productos procesados correctamente: ${productos.length}`)
      console.log("Primera muestra:", productos[0])
      console.log("=== Fin getProductos ===")

      return productos
    } catch (error) {
      console.error("❌ Error in getProductos:", error)
      throw error
    }
  }

  static async getProductoById(productoId: number): Promise<Producto | null> {
    try {
      if (!isSupabaseConfigured()) {
        return null
      }

      const { data: productoData, error: productoError } = await supabase
        .from("productos")
        .select(
          "producto_id, articulo_numero, producto_codigo, titulo, descripcion, categoria_id, img_id, proveedor_id, created_at, updated_at",
        )
        .eq("producto_id", productoId)
        .single()

      if (productoError) throw productoError

      const { data: categoriaData } = await supabase
        .from("categorias")
        .select("*")
        .eq("id", productoData.categoria_id)
        .single()
      const { data: imagenData } = await supabase.from("imagenes").select("*").eq("id", productoData.img_id).single()
      const { data: proveedorData } = await supabase
        .from("proveedores")
        .select("*")
        .eq("proveedor_id", productoData.proveedor_id)
        .single()

      return {
        producto_id: productoData.producto_id,
        articulo_numero: productoData.articulo_numero,
        producto_codigo: productoData.producto_codigo || "",
        titulo: productoData.titulo || "",
        descripcion: productoData.descripcion,
        categoria_id: productoData.categoria_id,
        img_id: productoData.img_id,
        proveedor_id: productoData.proveedor_id,
        created_at: productoData.created_at,
        updated_at: productoData.updated_at,
        categoria: categoriaData,
        imagen: imagenData,
        proveedor: proveedorData,
      }
    } catch (error) {
      console.error("Error fetching producto:", error)
      return null
    }
  }

  static async createProducto(
    producto: Omit<Producto, "producto_id" | "created_at" | "updated_at" | "categoria" | "imagen" | "proveedor">,
  ): Promise<Producto | null> {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Database not configured")
      }

      const { data, error } = await supabase
        .from("productos")
        .insert([
          {
            articulo_numero: producto.articulo_numero || null,
            producto_codigo: producto.producto_codigo || "",
            titulo: producto.titulo || "",
            descripcion: producto.descripcion,
            categoria_id: producto.categoria_id,
            img_id: producto.img_id,
            proveedor_id: producto.proveedor_id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return await this.getProductoById(data.producto_id)
    } catch (error) {
      console.error("Error creating producto:", error)
      return null
    }
  }

  static async updateProducto(productoId: number, producto: Partial<Producto>): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        return false
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      }

      if (producto.articulo_numero !== undefined) updateData.articulo_numero = producto.articulo_numero || null
      if (producto.producto_codigo !== undefined) updateData.producto_codigo = producto.producto_codigo
      if (producto.titulo !== undefined) updateData.titulo = producto.titulo
      if (producto.descripcion !== undefined) updateData.descripcion = producto.descripcion
      if (producto.categoria_id !== undefined) updateData.categoria_id = producto.categoria_id
      if (producto.img_id !== undefined) updateData.img_id = producto.img_id
      if (producto.proveedor_id !== undefined) updateData.proveedor_id = producto.proveedor_id

      const { error } = await supabase.from("productos").update(updateData).eq("producto_id", productoId)

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error updating producto:", error)
      return false
    }
  }

  static async deleteProducto(productoId: number): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        return false
      }

      const { error } = await supabase.from("productos").delete().eq("producto_id", productoId)

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

      const insertData = productos.map((p) => ({
        articulo_numero: p.articulo_numero || null,
        producto_codigo: p.producto_codigo || "",
        titulo: p.titulo || "",
        descripcion: p.descripcion,
        categoria_id: p.categoria_id,
        img_id: p.img_id,
        proveedor_id: p.proveedor_id,
      }))

      const { data, error } = await supabase.from("productos").insert(insertData).select()

      if (error) throw error

      const productosCompletos = await Promise.all((data || []).map((p) => this.getProductoById(p.producto_id)))

      return productosCompletos.filter((p): p is Producto => p !== null)
    } catch (error) {
      console.error("Error in createProductos:", error)
      throw error
    }
  }

  // ============================================
  // CLIENTES
  // ============================================
  static async getClientes(): Promise<Cliente[]> {
    try {
      if (!isSupabaseConfigured()) {
        return []
      }

      const hasCuil = await this.checkCuilColumn()
      const selectColumns = hasCuil
        ? "cliente_id, cliente_codigo, nombre, domicilio, telefono, cuil, created_at, updated_at"
        : "cliente_id, cliente_codigo, nombre, domicilio, telefono, created_at, updated_at"

      const { data, error } = await supabase.from("clientes").select(selectColumns).order("nombre")

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

      const hasCuil = await this.checkCuilColumn()
      const selectColumns = hasCuil
        ? "cliente_id, cliente_codigo, nombre, domicilio, telefono, cuil, created_at, updated_at"
        : "cliente_id, cliente_codigo, nombre, domicilio, telefono, created_at, updated_at"

      const { data, error } = await supabase.from("clientes").select(selectColumns).eq("cliente_id", id).single()

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

      const hasCuil = await this.checkCuilColumn()

      const insertData: any = {
        cliente_codigo: cliente.cliente_codigo,
        nombre: cliente.nombre,
        domicilio: cliente.domicilio,
        telefono: cliente.telefono,
      }

      if (hasCuil && cliente.cuil) {
        insertData.cuil = cliente.cuil
      }

      const { data, error } = await supabase.from("clientes").insert([insertData]).select().single()

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

      const hasCuil = await this.checkCuilColumn()

      const updateData: any = {
        ...cliente,
        updated_at: new Date().toISOString(),
      }

      if (!hasCuil) {
        delete updateData.cuil
      }

      delete updateData.cliente_id
      delete updateData.created_at

      const { error } = await supabase.from("clientes").update(updateData).eq("cliente_id", id)

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

  static async createClientes(clientes: any[]): Promise<Cliente[]> {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Database not configured")
      }

      const hasCuil = await this.checkCuilColumn()

      const insertData = clientes.map((c) => {
        const data: any = {
          cliente_codigo: c.cliente_codigo,
          nombre: c.nombre,
          domicilio: c.domicilio,
          telefono: c.telefono,
        }

        if (hasCuil && c.cuil) {
          data.cuil = c.cuil
        }

        return data
      })

      const { data, error } = await supabase.from("clientes").insert(insertData).select()

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Error in createClientes:", error)
      throw error
    }
  }

  // ============================================
  // PEDIDOS
  // ============================================
  static async getPedidos(): Promise<Pedido[]> {
    try {
      if (!isSupabaseConfigured()) {
        return []
      }

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
        return []
      }

      const hasCuil = await this.checkCuilColumn()
      const clienteColumns = hasCuil
        ? "cliente_id, cliente_codigo, nombre, domicilio, telefono, cuil, created_at, updated_at"
        : "cliente_id, cliente_codigo, nombre, domicilio, telefono, created_at, updated_at"

      const { data: clientesData } = await supabase.from("clientes").select(clienteColumns)
      const { data: pedidoProductosData } = await supabase
        .from("pedido_productos")
        .select("id, pedido_id, producto_id, cantidad, created_at")

      const productos = await this.getProductos()
      const clientesMap = new Map((clientesData || []).map((c) => [c.cliente_id, c]))
      const productosMap = new Map(productos.map((p) => [p.producto_id, p]))

      const pedidoProductosMap = new Map<number, any[]>()
      ;(pedidoProductosData || []).forEach((pp) => {
        if (!pedidoProductosMap.has(pp.pedido_id)) {
          pedidoProductosMap.set(pp.pedido_id, [])
        }
        pedidoProductosMap.get(pp.pedido_id)!.push(pp)
      })

      const pedidosCompletos = pedidosData.map((pedido) => {
        const cliente = clientesMap.get(pedido.cliente_id) || {
          cliente_id: pedido.cliente_id,
          cliente_codigo: 0,
          nombre: "Cliente no encontrado",
          domicilio: "",
          telefono: "",
          created_at: "",
          updated_at: "",
        }

        const pedidoProductos = pedidoProductosMap.get(pedido.pedido_id) || []

        const productos = pedidoProductos.map((pp) => {
          const producto = productosMap.get(pp.producto_id)

          return {
            id: pp.id,
            pedido_id: pp.pedido_id,
            producto_id: pp.producto_id,
            cantidad: pp.cantidad || 0,
            created_at: pp.created_at,
            producto: producto || undefined,
          }
        })

        return {
          pedido_id: pedido.pedido_id,
          cliente_id: pedido.cliente_id,
          fecha_pedido: pedido.fecha_pedido,
          created_at: pedido.created_at,
          updated_at: pedido.updated_at,
          incluido_en_reporte: false,
          fecha_inclusion_reporte: undefined,
          reporte_id: undefined,
          cliente: cliente,
          productos: productos,
        }
      })

      return pedidosCompletos
    } catch (error) {
      console.error("Error in getPedidos:", error)
      return []
    }
  }

  static async getPedidoById(id: number): Promise<Pedido | null> {
    try {
      if (!isSupabaseConfigured()) {
        return null
      }

      const { data: pedidoData, error: pedidoError } = await supabase
        .from("pedidos")
        .select("pedido_id, cliente_id, fecha_pedido, created_at, updated_at")
        .eq("pedido_id", id)
        .single()

      if (pedidoError) {
        console.error("Error obteniendo pedido:", pedidoError)
        throw pedidoError
      }

      const hasCuil = await this.checkCuilColumn()
      const clienteColumns = hasCuil
        ? "cliente_id, cliente_codigo, nombre, domicilio, telefono, cuil, created_at, updated_at"
        : "cliente_id, cliente_codigo, nombre, domicilio, telefono, created_at, updated_at"

      const { data: clienteData } = await supabase
        .from("clientes")
        .select(clienteColumns)
        .eq("cliente_id", pedidoData.cliente_id)
        .single()

      const { data: pedidoProductosData, error: ppError } = await supabase
        .from("pedido_productos")
        .select("id, pedido_id, producto_id, cantidad, created_at")
        .eq("pedido_id", id)

      if (ppError) {
        console.error("Error obteniendo pedido_productos:", ppError)
      }

      const productos = await this.getProductos()
      const productosMap = new Map(productos.map((p) => [p.producto_id, p]))

      const productosCompletos = (pedidoProductosData || []).map((pp) => {
        const producto = productosMap.get(pp.producto_id)

        return {
          id: pp.id,
          pedido_id: pp.pedido_id,
          producto_id: pp.producto_id,
          articulo_numero: producto?.articulo_numero || null,
          cantidad: pp.cantidad || 0,
          created_at: pp.created_at,
          producto: producto,
        }
      })

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

      return pedidoCompleto
    } catch (error) {
      console.error("Error in getPedidoById:", error)
      return null
    }
  }

  static async createPedido(pedido: Omit<Pedido, "pedido_id" | "created_at">): Promise<Pedido | null> {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Database not configured")
      }

      const cliente_id =
        typeof pedido.cliente === "object" && pedido.cliente ? pedido.cliente.cliente_id : pedido.cliente_id

      if (!cliente_id) {
        console.error("No cliente_id found in pedido data")
        return null
      }

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

      if (pedidoError) throw pedidoError

      const productosData =
        pedido.productos?.map((producto) => ({
          pedido_id: nuevoPedido.pedido_id,
          producto_id: producto.producto_id,
          cantidad: producto.cantidad,
        })) || []

      if (productosData.length > 0) {
        const { error: productosError } = await supabase.from("pedido_productos").insert(productosData)

        if (productosError) {
          console.error("Error insertando productos:", productosError)
          await supabase.from("pedidos").delete().eq("pedido_id", nuevoPedido.pedido_id)
          throw productosError
        }
      }

      const pedidoCompleto = await this.getPedidoById(nuevoPedido.pedido_id)
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
      productos?: { producto_id: number; cantidad: number }[]
    },
  ): Promise<boolean> {
    try {
      if (!isSupabaseConfigured()) {
        return false
      }

      const updateData: any = { updated_at: new Date().toISOString() }
      if (pedido.cliente_id) updateData.cliente_id = pedido.cliente_id
      if (pedido.fecha_pedido) updateData.fecha_pedido = pedido.fecha_pedido

      const { error: pedidoError } = await supabase.from("pedidos").update(updateData).eq("pedido_id", id)

      if (pedidoError) throw pedidoError

      if (pedido.productos) {
        const { error: deleteError } = await supabase.from("pedido_productos").delete().eq("pedido_id", id)

        if (deleteError) throw deleteError

        const productosData = pedido.productos.map((producto) => ({
          pedido_id: id,
          producto_id: producto.producto_id,
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

      const { error: productosError } = await supabase.from("pedido_productos").delete().eq("pedido_id", id)

      if (productosError) throw productosError

      const { error: pedidoError } = await supabase.from("pedidos").delete().eq("pedido_id", id)

      if (pedidoError) throw pedidoError

      return true
    } catch (error) {
      console.error("Error deleting pedido:", error)
      return false
    }
  }

  // ============================================
  // REPORTES
  // ============================================
  static async getReportesAutomaticos(): Promise<any[]> {
    try {
      const stored = localStorage.getItem("reportes_automaticos")
      const reportes = stored ? JSON.parse(stored) : []
      return reportes
    } catch (error) {
      console.error("Error reading reportes from localStorage:", error)
      return []
    }
  }

  static async createReporteAutomatico(reporte: any): Promise<any | null> {
    try {
      const existing = await this.getReportesAutomaticos()
      const updated = [reporte, ...existing]
      localStorage.setItem("reportes_automaticos", JSON.stringify(updated))
      return reporte
    } catch (error) {
      console.error("Error saving reporte to localStorage:", error)
      return null
    }
  }

  static async saveReporteAutomatico(reporte: any): Promise<boolean> {
    const result = await this.createReporteAutomatico(reporte)
    return result !== null
  }

  static async getPedidosSinReportar(): Promise<Pedido[]> {
    try {
      const todosPedidos = await this.getPedidos()
      const reportesAutomaticos = await this.getReportesAutomaticos()

      const pedidosReportados = new Set<number>()
      reportesAutomaticos.forEach((reporte) => {
        reporte.pedidos_incluidos?.forEach((pedidoId: number) => {
          pedidosReportados.add(pedidoId)
        })
      })

      const pedidosSinReportar = todosPedidos.filter((pedido) => !pedidosReportados.has(pedido.pedido_id))
      return pedidosSinReportar
    } catch (error) {
      console.error("Error getting unreported pedidos:", error)
      return []
    }
  }

  static async markPedidoAsReported(pedidoId: number, reporteId: string): Promise<boolean> {
    try {
      const reportedOrders = JSON.parse(localStorage.getItem("reported_orders") || "{}")
      reportedOrders[pedidoId] = {
        reporte_id: reporteId,
        fecha_inclusion: new Date().toISOString(),
      }
      localStorage.setItem("reported_orders", JSON.stringify(reportedOrders))
      return true
    } catch (error) {
      console.error("Error marking pedido as reported:", error)
      return false
    }
  }

  static async isPedidoReported(pedidoId: number): Promise<boolean> {
    try {
      const reportedOrders = JSON.parse(localStorage.getItem("reported_orders") || "{}")
      return !!reportedOrders[pedidoId]
    } catch (error) {
      console.error("Error checking if pedido is reported:", error)
      return false
    }
  }
}
