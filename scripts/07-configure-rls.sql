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

-- 2) Borrar TODAS las politicas existentes en estas tablas, sin importar el
--    nombre. Si alguien creo politicas a mano desde el dashboard con otro
--    nombre, un DROP por nombre no las tocaria y el agujero seguiria abierto.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
          'proveedores', 'categorias', 'imagenes', 'productos',
          'clientes', 'pedidos', 'pedido_productos'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 3) Politicas, con soporte para el usuario VISITANTE
--
-- El visitante entra con login ANONIMO de Supabase, asi que tecnicamente es un
-- usuario autenticado, pero con el claim is_anonymous = true en su token. Eso
-- permite separarlo de los usuarios reales directamente en la base.
--
--   * Tablas de CATALOGO (productos, categorias, imagenes):
--       lectura para cualquier autenticado (visitante incluido);
--       escritura solo para los que NO son visitantes.
--   * Tablas SENSIBLES (clientes, proveedores, pedidos, pedido_productos):
--       el visitante no tiene acceso NINGUNO.
--
-- La restriccion vive ACA, en la base: aunque alguien abra la consola del
-- navegador y dispare consultas a mano, el servidor las rechaza.
DO $$
DECLARE
  t text;
  catalogo     text[] := ARRAY['productos', 'categorias', 'imagenes'];
  sensibles    text[] := ARRAY['clientes', 'proveedores', 'pedidos', 'pedido_productos'];
  no_visitante text   := '(auth.jwt() ->> ''is_anonymous'') IS DISTINCT FROM ''true''';
BEGIN
  FOREACH t IN ARRAY catalogo LOOP
    -- lectura: cualquier autenticado
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (true)', t || '_select', t);
    -- escritura: solo los que no son visitantes
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (%s) WITH CHECK (%s)',
      t || '_write', t, no_visitante, no_visitante
    );
  END LOOP;

  FOREACH t IN ARRAY sensibles LOOP
    -- ni lectura ni escritura para el visitante
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (%s) WITH CHECK (%s)',
      t || '_solo_reales', t, no_visitante, no_visitante
    );
  END LOOP;
END $$;

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
