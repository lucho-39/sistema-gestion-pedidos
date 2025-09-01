import { supabase } from "./supabase"
import type { Producto, Cliente, Pedido, Proveedor, ReporteSemanal } from "./types"

export class Database {
  // Helper method to check if tables exist
  static async checkTablesExist(): Promise<{ exists: boolean; missingTables: string[] }> {
    const requiredTables = ["proveedores", "productos", "clientes", "pedidos", "pedido_productos", "reportes_semanales"]
    const missingTables: string[] = []

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
  }

  // PROVEEDORES
  static async getProveedores(): Promise<Proveedor[]> {
    const { data, error } = await supabase.from("proveedores").select("*").order("proveedor_nombre")

    if (error) {
      console.error("Error fetching proveedores:", error)
      if (error.message.includes("does not exist")) {
        throw new Error("Database tables not found. Please run the setup scripts first.")
      }
      return []
    }

    return data.map((p) => ({
      proveedor_id: p.proveedor_id,
      proveedor_nombre: p.proveedor_nombre,
    }))
  }

  static async createProveedor(proveedor: Omit<Proveedor, "created_at" | "updated_at">): Promise<Proveedor | null> {
    const { data, error } = await supabase.from("proveedores").insert([proveedor]).select().single()

    if (error) {
      console.error("Error creating proveedor:", error)
      return null
    }

    return {
      proveedor_id: data.proveedor_id,
      proveedor_nombre: data.proveedor_nombre,
    }
  }

  static async updateProveedor(proveedor_id: number, updates: Partial<Proveedor>): Promise<boolean> {
    const { error } = await supabase.from("proveedores").update(updates).eq("proveedor_id", proveedor_id)

    if (error) {
      console.error("Error updating proveedor:", error)
      return false
    }

    return true
  }

  static async deleteProveedor(proveedor_id: number): Promise<boolean> {
    const { error } = await supabase.from("proveedores").delete().eq("proveedor_id", proveedor_id)

    if (error) {
      console.error("Error deleting proveedor:", error)
      return false
    }

    return true
  }

  // PRODUCTOS
  static async getProductos(): Promise<Producto[]> {
    const { data, error } = await supabase
      .from("productos")
      .select(`
        articulo_numero,
        producto_codigo,
        descripcion,
        unidad_medida,
        proveedor_id,
        created_at,
        updated_at
      `)
      .order("articulo_numero")

    if (error) {
      console.error("Error fetching productos:", error)
      if (error.message.includes("does not exist")) {
        throw new Error("Database tables not found. Please run the setup scripts first.")
      }
      return []
    }

    // Fetch all proveedores separately
    const { data: proveedoresData, error: proveedoresError } = await supabase
      .from("proveedores")
      .select("proveedor_id, proveedor_nombre")

    if (proveedoresError) {
      console.error("Error fetching proveedores:", proveedoresError)
      return []
    }

    // Create a map for quick lookup
    const proveedoresMap = new Map(proveedoresData.map((p) => [p.proveedor_id, p]))

    return data.map((p) => ({
      articulo_numero: p.articulo_numero,
      producto_codigo: p.producto_codigo || "",
      descripcion: p.descripcion,
      unidad_medida: p.unidad_medida,
      proveedor: {
        proveedor_id: p.proveedor_id,
        proveedor_nombre: proveedoresMap.get(p.proveedor_id)?.proveedor_nombre || "Proveedor no encontrado",
      },
    }))
  }

  static async createProducto(producto: Omit<Producto, "created_at" | "updated_at">): Promise<Producto | null> {
    const { data, error } = await supabase
      .from("productos")
      .insert([
        {
          articulo_numero: producto.articulo_numero,
          producto_codigo: producto.producto_codigo,
          descripcion: producto.descripcion,
          unidad_medida: producto.unidad_medida,
          proveedor_id: producto.proveedor.proveedor_id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating producto:", error)
      return null
    }

    // Fetch the proveedor separately
    const { data: proveedorData, error: proveedorError } = await supabase
      .from("proveedores")
      .select("proveedor_id, proveedor_nombre")
      .eq("proveedor_id", data.proveedor_id)
      .single()

    if (proveedorError) {
      console.error("Error fetching proveedor:", proveedorError)
      return null
    }

    return {
      articulo_numero: data.articulo_numero,
      producto_codigo: data.producto_codigo,
      descripcion: data.descripcion,
      unidad_medida: data.unidad_medida,
      proveedor: {
        proveedor_id: proveedorData.proveedor_id,
        proveedor_nombre: proveedorData.proveedor_nombre,
      },
    }
  }

  static async updateProducto(articulo_numero: number, updates: Partial<Producto>): Promise<boolean> {
    const updateData: any = {}

    if (updates.producto_codigo !== undefined) updateData.producto_codigo = updates.producto_codigo
    if (updates.descripcion !== undefined) updateData.descripcion = updates.descripcion
    if (updates.unidad_medida !== undefined) updateData.unidad_medida = updates.unidad_medida
    if (updates.proveedor !== undefined) updateData.proveedor_id = updates.proveedor.proveedor_id

    const { error } = await supabase.from("productos").update(updateData).eq("articulo_numero", articulo_numero)

    if (error) {
      console.error("Error updating producto:", error)
      return false
    }

    return true
  }

  static async deleteProducto(articulo_numero: number): Promise<boolean> {
    const { error } = await supabase.from("productos").delete().eq("articulo_numero", articulo_numero)

    if (error) {
      console.error("Error deleting producto:", error)
      return false
    }

    return true
  }

  static async createProductos(productos: Omit<Producto, "created_at" | "updated_at">[]): Promise<Producto[]> {
    const insertData = productos.map((p) => ({
      articulo_numero: p.articulo_numero,
      producto_codigo: p.producto_codigo,
      descripcion: p.descripcion,
      unidad_medida: p.unidad_medida,
      proveedor_id: p.proveedor.proveedor_id,
    }))

    const { data, error } = await supabase.from("productos").insert(insertData).select()

    if (error) {
      console.error("Error creating productos:", error)
      return []
    }

    // Fetch all proveedores for mapping
    const { data: proveedoresData, error: proveedoresError } = await supabase
      .from("proveedores")
      .select("proveedor_id, proveedor_nombre")

    if (proveedoresError) {
      console.error("Error fetching proveedores:", proveedoresError)
      return []
    }

    const proveedoresMap = new Map(proveedoresData.map((p) => [p.proveedor_id, p]))

    return data.map((p) => ({
      articulo_numero: p.articulo_numero,
      producto_codigo: p.producto_codigo,
      descripcion: p.descripcion,
      unidad_medida: p.unidad_medida,
      proveedor: {
        proveedor_id: p.proveedor_id,
        proveedor_nombre: proveedoresMap.get(p.proveedor_id)?.proveedor_nombre || "Proveedor no encontrado",
      },
    }))
  }

  // CLIENTES
  static async getClientes(): Promise<Cliente[]> {
    const { data, error } = await supabase.from("clientes").select("*").order("nombre")

    if (error) {
      console.error("Error fetching clientes:", error)
      if (error.message.includes("does not exist")) {
        throw new Error("Database tables not found. Please run the setup scripts first.")
      }
      return []
    }

    return data.map((c) => ({
      cliente_id: c.cliente_id,
      cliente_codigo: c.cliente_codigo,
      nombre: c.nombre,
      domicilio: c.domicilio,
      telefono: c.telefono,
      CUIL: c.cuil,
    }))
  }

  static async createCliente(cliente: Omit<Cliente, "cliente_id">): Promise<Cliente | null> {
    const { data, error } = await supabase
      .from("clientes")
      .insert([
        {
          cliente_codigo: cliente.cliente_codigo,
          nombre: cliente.nombre,
          domicilio: cliente.domicilio,
          telefono: cliente.telefono,
          cuil: cliente.CUIL,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating cliente:", error)
      return null
    }

    return {
      cliente_id: data.cliente_id,
      cliente_codigo: data.cliente_codigo,
      nombre: data.nombre,
      domicilio: data.domicilio,
      telefono: data.telefono,
      CUIL: data.cuil,
    }
  }

  static async updateCliente(cliente_id: number, updates: Partial<Cliente>): Promise<boolean> {
    const updateData: any = {}

    if (updates.cliente_codigo !== undefined) updateData.cliente_codigo = updates.cliente_codigo
    if (updates.nombre !== undefined) updateData.nombre = updates.nombre
    if (updates.domicilio !== undefined) updateData.domicilio = updates.domicilio
    if (updates.telefono !== undefined) updateData.telefono = updates.telefono
    if (updates.CUIL !== undefined) updateData.cuil = updates.CUIL

    const { error } = await supabase.from("clientes").update(updateData).eq("cliente_id", cliente_id)

    if (error) {
      console.error("Error updating cliente:", error)
      return false
    }

    return true
  }

  static async deleteCliente(cliente_id: number): Promise<boolean> {
    const { error } = await supabase.from("clientes").delete().eq("cliente_id", cliente_id)

    if (error) {
      console.error("Error deleting cliente:", error)
      return false
    }

    return true
  }

  // PEDIDOS
  static async getPedidos(): Promise<Pedido[]> {
    // First get all pedidos
    const { data: pedidosData, error: pedidosError } = await supabase
      .from("pedidos")
      .select(`
        pedido_id,
        cliente_id,
        fecha_pedido,
        created_at,
        updated_at
      `)
      .order("fecha_pedido", { ascending: false })

    if (pedidosError) {
      console.error("Error fetching pedidos:", pedidosError)
      if (pedidosError.message.includes("does not exist")) {
        throw new Error("Database tables not found. Please run the setup scripts first.")
      }
      return []
    }

    // Get all clientes
    const { data: clientesData, error: clientesError } = await supabase
      .from("clientes")
      .select("cliente_id, cliente_codigo, nombre, domicilio, telefono, cuil")

    if (clientesError) {
      console.error("Error fetching clientes:", clientesError)
      return []
    }

    // Get all pedido_productos
    const { data: pedidoProductosData, error: pedidoProductosError } = await supabase
      .from("pedido_productos")
      .select("pedido_id, articulo_numero, cantidad")

    if (pedidoProductosError) {
      console.error("Error fetching pedido_productos:", pedidoProductosError)
      return []
    }

    // Get all productos with their proveedores
    const productos = await this.getProductos()

    // Create maps for quick lookup
    const clientesMap = new Map(clientesData.map((c) => [c.cliente_id, c]))
    const productosMap = new Map(productos.map((p) => [p.articulo_numero, p]))

    // Group pedido_productos by pedido_id
    const pedidoProductosMap = new Map<number, any[]>()
    pedidoProductosData.forEach((pp) => {
      if (!pedidoProductosMap.has(pp.pedido_id)) {
        pedidoProductosMap.set(pp.pedido_id, [])
      }
      pedidoProductosMap.get(pp.pedido_id)!.push(pp)
    })

    return pedidosData.map((p) => {
      const cliente = clientesMap.get(p.cliente_id)
      const pedidoProductos = pedidoProductosMap.get(p.pedido_id) || []

      return {
        pedido_id: p.pedido_id,
        cliente: {
          cliente_id: cliente?.cliente_id || 0,
          cliente_codigo: cliente?.cliente_codigo || 0,
          nombre: cliente?.nombre || "Cliente no encontrado",
          domicilio: cliente?.domicilio || "",
          telefono: cliente?.telefono || "",
          CUIL: cliente?.cuil || "",
        },
        productos: pedidoProductos.map((pp: any) => {
          const producto = productosMap.get(pp.articulo_numero)
          return {
            articulo_numero: pp.articulo_numero,
            producto_codigo: producto?.producto_codigo || "",
            descripcion: producto?.descripcion || "Producto no encontrado",
            unidad_medida: producto?.unidad_medida || "unidad",
            cantidad: pp.cantidad,
            proveedor: producto?.proveedor || {
              proveedor_id: 1,
              proveedor_nombre: "Proveedor no encontrado",
            },
          }
        }),
        fecha_pedido: p.fecha_pedido,
        fecha_creacion: p.created_at,
      }
    })
  }

  static async createPedido(pedido: Omit<Pedido, "pedido_id" | "fecha_creacion">): Promise<Pedido | null> {
    // Crear el pedido
    const { data: pedidoData, error: pedidoError } = await supabase
      .from("pedidos")
      .insert([
        {
          cliente_id: pedido.cliente.cliente_id,
          fecha_pedido: pedido.fecha_pedido.split("T")[0], // Solo la fecha
        },
      ])
      .select()
      .single()

    if (pedidoError) {
      console.error("Error creating pedido:", pedidoError)
      return null
    }

    // Crear los productos del pedido
    const productosData = pedido.productos.map((p) => ({
      pedido_id: pedidoData.pedido_id,
      articulo_numero: p.articulo_numero,
      cantidad: p.cantidad,
    }))

    const { error: productosError } = await supabase.from("pedido_productos").insert(productosData)

    if (productosError) {
      console.error("Error creating pedido productos:", productosError)
      // Rollback: eliminar el pedido creado
      await supabase.from("pedidos").delete().eq("pedido_id", pedidoData.pedido_id)
      return null
    }

    // Obtener el pedido completo
    const pedidos = await this.getPedidos()
    return pedidos.find((p) => p.pedido_id === pedidoData.pedido_id) || null
  }

  static async updatePedido(pedido_id: number, updates: Partial<Pedido>): Promise<boolean> {
    try {
      // Actualizar datos básicos del pedido
      const updateData: any = {}
      if (updates.cliente) updateData.cliente_id = updates.cliente.cliente_id
      if (updates.fecha_pedido) updateData.fecha_pedido = updates.fecha_pedido.split("T")[0]

      if (Object.keys(updateData).length > 0) {
        const { error: pedidoError } = await supabase.from("pedidos").update(updateData).eq("pedido_id", pedido_id)

        if (pedidoError) {
          console.error("Error updating pedido:", pedidoError)
          return false
        }
      }

      // Si hay productos para actualizar
      if (updates.productos) {
        // Eliminar productos existentes
        const { error: deleteError } = await supabase.from("pedido_productos").delete().eq("pedido_id", pedido_id)

        if (deleteError) {
          console.error("Error deleting pedido productos:", deleteError)
          return false
        }

        // Insertar nuevos productos
        const productosData = updates.productos.map((p) => ({
          pedido_id: pedido_id,
          articulo_numero: p.articulo_numero,
          cantidad: p.cantidad,
        }))

        const { error: insertError } = await supabase.from("pedido_productos").insert(productosData)

        if (insertError) {
          console.error("Error inserting pedido productos:", insertError)
          return false
        }
      }

      return true
    } catch (error) {
      console.error("Error updating pedido:", error)
      return false
    }
  }

  static async deletePedido(pedido_id: number): Promise<boolean> {
    const { error } = await supabase.from("pedidos").delete().eq("pedido_id", pedido_id)

    if (error) {
      console.error("Error deleting pedido:", error)
      return false
    }

    return true
  }

  // REPORTES
  static async getReportes(): Promise<ReporteSemanal[]> {
    const { data, error } = await supabase
      .from("reportes_semanales")
      .select("*")
      .eq("tipo_reporte", "general")
      .order("fecha_corte", { ascending: false })

    if (error) {
      console.error("Error fetching reportes:", error)
      if (error.message.includes("does not exist")) {
        throw new Error("Database tables not found. Please run the setup scripts first.")
      }
      return []
    }

    return data.map((r) => r.datos)
  }

  static async saveReporte(tipo: string, reporte: any): Promise<boolean> {
    const { error } = await supabase.from("reportes_semanales").insert([
      {
        tipo_reporte: tipo,
        fecha_corte: reporte.fecha_corte,
        datos: reporte,
      },
    ])

    if (error) {
      console.error("Error saving reporte:", error)
      return false
    }

    return true
  }

  static async updateReporte(tipo: string, reporte: any): Promise<boolean> {
    // Eliminar reportes anteriores del mismo tipo
    await supabase.from("reportes_semanales").delete().eq("tipo_reporte", tipo)

    // Insertar nuevo reporte
    return await this.saveReporte(tipo, reporte)
  }
}
