-- ============================================
-- Script 13: Deposito de fotos de producto
-- ============================================
--
-- Las listas de LORD traen las fotos de los productos adentro del Excel. Para
-- que la app las muestre, hay que guardarlas en algun lado y que tengan una
-- direccion publica.
--
-- Se guardan en el Storage de Supabase (el deposito de archivos), no en la base
-- ni en el repositorio. Las fotos son datos del negocio, no codigo.
--
-- Este bucket es PUBLICO de lectura: cualquiera que tenga la direccion puede ver
-- la foto, igual que ve el catalogo. Escribir (subir o cambiar fotos) solo
-- pueden los usuarios logueados.
--
-- ES IDEMPOTENTE: se puede volver a ejecutar sin romper nada.

BEGIN;

-- 1) El deposito
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

COMMIT;

-- 2) Permisos sobre los archivos (van fuera de la transaccion, uno por uno)
DROP POLICY IF EXISTS "fotos_lectura_publica" ON storage.objects;
CREATE POLICY "fotos_lectura_publica"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'productos');

DROP POLICY IF EXISTS "fotos_subida_logueados" ON storage.objects;
CREATE POLICY "fotos_subida_logueados"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'productos');

DROP POLICY IF EXISTS "fotos_cambio_logueados" ON storage.objects;
CREATE POLICY "fotos_cambio_logueados"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'productos');

DROP POLICY IF EXISTS "fotos_borrado_logueados" ON storage.objects;
CREATE POLICY "fotos_borrado_logueados"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'productos');

-- Verificacion: tiene que aparecer el bucket "productos" con public = true
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'productos';
