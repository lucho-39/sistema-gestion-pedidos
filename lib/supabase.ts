import { createClient } from "@supabase/supabase-js"

// Use placeholder values during build time if env vars are not available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder-key"
  )
}

// Database types for better type safety
export interface DatabaseProveedor {
  proveedor_id: number
  proveedor_nombre: string
  created_at?: string
  updated_at?: string
}

export interface DatabaseProducto {
  articulo_numero: number
  producto_codigo: string
  descripcion: string
  unidad_medida: string
  proveedor_id: number
  created_at?: string
  updated_at?: string
  proveedores?: DatabaseProveedor
}

export interface DatabaseCliente {
  cliente_id: number
  cliente_codigo: number
  nombre: string
  domicilio: string
  telefono: string
  cuil: string
  created_at?: string
  updated_at?: string
}

export interface DatabasePedidoProducto {
  id: number
  pedido_id: number
  articulo_numero: number
  cantidad: number
  productos?: DatabaseProducto
}

export interface DatabasePedido {
  pedido_id: number
  cliente_id: number
  fecha_pedido: string
  created_at?: string
  updated_at?: string
  clientes?: DatabaseCliente
  pedido_productos?: DatabasePedidoProducto[]
}

export interface DatabaseReporteSemanal {
  id: number
  tipo_reporte: string
  fecha_corte: string
  datos: any
  created_at?: string
  updated_at?: string
}
