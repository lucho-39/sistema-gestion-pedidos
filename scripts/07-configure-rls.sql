-- ============================================
-- Script 7: Seguridad de acceso (Row Level Security)
-- ============================================
--
-- HISTORIA
-- La version original de este script DESHABILITABA RLS (o, en su variante
-- comentada, creaba politicas USING (true)). Con eso, la anon key publica -- que
-- va embebida en el bundle del navegador y cualquiera puede extraer -- permitia
-- leer, insertar, actualizar y borrar en TODAS las tablas.
--
-- Verificado contra la base viva antes de este cambio: con la anon key se
-- obtenia SELECT, UPDATE y DELETE en las 7 tablas (y INSERT, probado aparte).
--
-- QUE HACE AHORA
-- Habilita RLS y deja acceso unicamente a usuarios AUTENTICADOS. El rol anon
-- (sin sesion iniciada) no puede leer ni escribir nada.
--
-- Modelo asumido: un solo negocio, un login compartido. Cualquier usuario
-- autenticado tiene acceso completo. Si mas adelante hace falta separar datos
-- por usuario, hay que agregar columnas de dueno y ajustar las politicas.
--
-- ES IDEMPOTENTE: se puede volver a ejecutar sin romper nada. Re-ejecutarlo es
-- justamente la forma de aplicar el fix a una base que ya existia.
--
-- IMPORTANTE: al aplicarlo, el acceso publico se cierra al instante. Hay que
-- tener la pantalla de login desplegada, o la app deja de funcionar para todos.

BEGIN;

-- 1) Habilitar RLS en todas las tablas
ALTER TABLE IF EXISTS proveedores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categorias       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS imagenes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS productos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clientes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pedidos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pedido_productos ENABLE ROW LEVEL SECURITY;

-- 2) Borrar las politicas permisivas de la version anterior
DROP POLICY IF EXISTS "Permitir todo en proveedores"      ON proveedores;
DROP POLICY IF EXISTS "Permitir todo en categorias"       ON categorias;
DROP POLICY IF EXISTS "Permitir todo en imagenes"         ON imagenes;
DROP POLICY IF EXISTS "Permitir todo en productos"        ON productos;
DROP POLICY IF EXISTS "Permitir todo en clientes"         ON clientes;
DROP POLICY IF EXISTS "Permitir todo en pedidos"          ON pedidos;
DROP POLICY IF EXISTS "Permitir todo en pedido_productos" ON pedido_productos;

-- 3) Acceso solo para usuarios autenticados
DROP POLICY IF EXISTS "authenticated_all_proveedores"      ON proveedores;
DROP POLICY IF EXISTS "authenticated_all_categorias"       ON categorias;
DROP POLICY IF EXISTS "authenticated_all_imagenes"         ON imagenes;
DROP POLICY IF EXISTS "authenticated_all_productos"        ON productos;
DROP POLICY IF EXISTS "authenticated_all_clientes"         ON clientes;
DROP POLICY IF EXISTS "authenticated_all_pedidos"          ON pedidos;
DROP POLICY IF EXISTS "authenticated_all_pedido_productos" ON pedido_productos;

CREATE POLICY "authenticated_all_proveedores"      ON proveedores      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_categorias"       ON categorias       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_imagenes"         ON imagenes         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_productos"        ON productos        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_clientes"         ON clientes         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_pedidos"          ON pedidos          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all_pedido_productos" ON pedido_productos FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMIT;

-- 4) Verificacion: rls_habilitado debe ser true y politicas debe ser 1 en cada tabla
SELECT
    t.tablename,
    t.rowsecurity            AS rls_habilitado,
    count(p.policyname)      AS politicas
FROM pg_tables t
LEFT JOIN pg_policies p
       ON p.tablename  = t.tablename
      AND p.schemaname = t.schemaname
WHERE t.schemaname = 'public'
  AND t.tablename IN (
      'proveedores', 'categorias', 'imagenes', 'productos',
      'clientes', 'pedidos', 'pedido_productos'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
