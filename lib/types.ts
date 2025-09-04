export interface Cliente {
  cliente_id: number
  cliente_codigo: number
  nombre: string
  domicilio: string
  telefono: string
  cuil: string
  created_at: string
  updated_at: string
}

export interface Proveedor {
  proveedor_id: number
  proveedor_nombre: string
  created_at: string
  updated_at: string
}

export interface Producto {
  articulo_numero: number
  producto_codigo: string
  descripcion: string
  unidad_medida: string
  proveedor_id: number
  created_at: string
  updated_at: string
  proveedor: Proveedor
}

export interface PedidoProducto {
  id: number
  pedido_id: number
  articulo_numero: number
  cantidad: number
  created_at: string
  producto?: Producto
}

export interface Pedido {
  pedido_id: number
  cliente_id: number
  fecha_pedido: string
  created_at: string
  updated_at: string
  incluido_en_reporte?: boolean
  fecha_inclusion_reporte?: string
  reporte_id?: string
  cliente?: Cliente
  productos?: PedidoProducto[]
}

export interface ReporteSemanal {
  fecha_corte: string
  resumen: {
    total_pedidos: number
    total_productos: number
    total_clientes: number
    fecha_inicio: string
    fecha_fin: string
  }
  pedidos: Pedido[]
}

export interface ReporteProductosPorProveedor {
  fecha_corte: string
  proveedores: {
    proveedor_id: number
    proveedor_nombre: string
    productos: {
      articulo_numero: number
      descripcion: string
      unidad_medida: string
      cantidad_total: number
    }[]
    total_productos: number
  }[]
  total_proveedores: number
}

export interface ReportePedidos {
  fecha_corte: string
  pedidos: {
    pedido_id: number
    cliente_nombre: string
    fecha_pedido: string
    productos: {
      descripcion: string
      cantidad: number
      unidad_medida: string
    }[]
  }[]
  total_pedidos: number
}

export interface ReporteAutomatico {
  id: string
  tipo: "automatico" | "manual"
  fecha_generacion: string
  fecha_inicio_periodo: string
  fecha_fin_periodo: string
  pedidos_incluidos: number[]
  reportes: {
    general: ReporteSemanal
    productos_por_proveedor: ReporteProductosPorProveedor
    pedidos: ReportePedidos
  }
  created_at: string
  updated_at: string
}

export interface ImportResult {
  success: boolean
  message: string
  imported: number
  errors: string[]
  duplicates: number
}

export interface ExcelRow {
  [key: string]: any
}

export interface ValidationError {
  row: number
  field: string
  message: string
  value: any
}

export interface ImportOptions {
  skipDuplicates: boolean
  validateProveedores: boolean
  createMissingProveedores: boolean
}
