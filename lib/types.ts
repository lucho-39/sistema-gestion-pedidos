// Tipos base para el sistema de gestión de inventario

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

export interface Cliente {
  cliente_id: number
  cliente_codigo: number
  nombre: string
  domicilio: string
  telefono: string
  cuil?: string
  created_at?: string
  updated_at?: string
}

export interface ProductoPedido {
  id: number
  pedido_id: number
  producto_id: number
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

export interface ReporteAutomatico {
  id: string
  tipo: "automatico" | "manual"
  fecha_generacion: string
  fecha_inicio_periodo: string
  fecha_fin_periodo: string
  pedidos_incluidos: number[]
  reportes: any
  created_at: string
  updated_at: string
}
