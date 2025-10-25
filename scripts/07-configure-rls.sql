-- ============================================
-- Script 7: Configurar Row Level Security (RLS)
-- ============================================
-- Este script deshabilita RLS para desarrollo
-- En producción, deberías crear políticas apropiadas

-- Deshabilitar RLS en todas las tablas
ALTER TABLE IF EXISTS proveedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS imagenes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pedido_productos DISABLE ROW LEVEL SECURITY;

-- Si prefieres usar políticas (OPCIÓN ALTERNATIVA - comentada por defecto)
-- Descomenta las siguientes líneas si prefieres usar políticas en lugar de deshabilitar RLS

/*
-- Habilitar RLS
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_productos ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir todas las operaciones (solo para desarrollo)
CREATE POLICY "Permitir todo en proveedores" ON proveedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en categorias" ON categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en imagenes" ON imagenes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en productos" ON productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en pedidos" ON pedidos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en pedido_productos" ON pedido_productos FOR ALL USING (true) WITH CHECK (true);
*/

-- Verificar el estado de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('proveedores', 'categorias', 'imagenes', 'productos', 'clientes', 'pedidos', 'pedido_productos')
ORDER BY tablename;
