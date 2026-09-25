import { createClient } from "@supabase/supabase-js"

// Use placeholder values during build time if env vars are not available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"

// En el servidor (la ruta que dispara el cron) se usa la clave de servicio, que
// puede escribir sin pasar por RLS. En el navegador esa variable no existe —las
// variables sin NEXT_PUBLIC_ no viajan al cliente— asi que cae a la publica.
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseKey)

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
  datos: Record<string, unknown>
  created_at?: string
  updated_at?: string
}
