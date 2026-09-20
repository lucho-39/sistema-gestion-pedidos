// Tipos base para el sistema de gestión de inventario

// Largo máximo de productos.articulo_numero (VARCHAR(10) en la base)
export const ARTICULO_NUMERO_MAX_LENGTH = 10

export interface Proveedor {
  proveedor_id: number
  proveedor_nombre: string
  created_at?: string
  updated_at?: string
}

export interface Categoria {
  id: number
  nombre: string
  unidad: string
  created_at?: string
  updated_at?: string
}

export interface Imagen {
  id: number
  url_img: string
  txt_alt?: string
  created_at?: string
  updated_at?: string
}

export interface Producto {
  producto_id: number
  articulo_numero?: string | null
  producto_codigo?: string
  titulo?: string
  descripcion: string
  categoria_id: number
  img_id: number
  proveedor_id: number
  created_at?: string
  updated_at?: string
  categoria?: Categoria
  imagen?: Imagen
  proveedor?: Proveedor
}

// Producto tal como se envía al crear: sin los campos que genera la base
export type ProductoNuevo = Omit<Producto, "producto_id" | "created_at" | "updated_at">

export interface Cliente {
  cliente_id: number
  cliente_codigo: number
  nombre: string
  domicilio: string
  telefono: string
  email?: string
  cuil?: string
  created_at?: string
  updated_at?: string
}

export interface ProductoPedido {
  id: number
  pedido_id: number
  producto_id: number
  articulo_numero?: string | null
  cantidad: number
  created_at?: string
  producto?: Producto
}

export interface Pedido {
  pedido_id: number
  cliente_id: number
  fecha_pedido: string
  created_at?: string
  updated_at?: string
  incluido_en_reporte?: boolean
  fecha_inclusion_reporte?: string
  reporte_id?: string
  cliente: Cliente
  productos: ProductoPedido[]
}

// Contenido de ReporteAutomatico.reportes, tal como lo arman report-scheduler
// y report-historical-generator.
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
    // La sección "general" guarda los pedidos crudos (ver generateGeneralReport)
    pedidos: Pedido[]
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
      cliente_codigo: string | number
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

export interface ReporteAutomatico {
  id: string
  tipo: "automatico" | "manual"
  fecha_generacion: string
  fecha_inicio_periodo: string
  fecha_fin_periodo: string
  pedidos_incluidos: number[]
  reportes: ReporteData
  created_at: string
  updated_at: string
}
