export interface Producto {
  articulo_numero: number
  producto_codigo: string
  descripcion: string
  unidad_medida: string
  proveedor: Proveedor
}

export interface Proveedor {
  proveedor_id: number
  proveedor_nombre: string
}

export interface Cliente {
  cliente_id: number
  cliente_codigo: number
  nombre: string
  domicilio: string
  telefono: string
  CUIL: string
}

export interface ProductoPedido extends Producto {
  cantidad: number
}

export interface Pedido {
  pedido_id: number
  cliente: Cliente
  productos: ProductoPedido[]
  fecha_pedido: string
  fecha_creacion?: string
}

export interface ReporteSemanal {
  fecha_corte: string
  pedidos: Pedido[]
}

export interface ReporteProductos {
  fecha_corte: string
  productos: (Producto & { cantidad_total: number })[]
}

export interface ReporteSemanalProductos {
  fecha_corte: string
  proveedores: {
    proveedor_nombre: string
    productos: {
      articulo_numero: number
      producto_codigo: string
      descripcion: string
      cantidad_total: number
    }[]
  }[]
}

export interface ReporteSemanalPedidos {
  fecha_corte: string
  pedidos: {
    pedido_id: number
    fecha_pedido: string
    cliente_nombre: string
    productos: {
      descripcion: string
      cantidad: number
    }[]
  }[]
}
