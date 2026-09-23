-- ============================================
-- Script 14: la direccion de la foto quedo corta
-- ============================================
--
-- Las fotos se guardan en el deposito de Supabase y su direccion publica tiene
-- esta pinta:
--
--   https://luovtdpzbhswcwddnvcl.supabase.co/storage/v1/object/public/productos/12-1758600000000.jpg
--
-- Son entre 89 y 95 caracteres. La columna `imagenes.url_img` era VARCHAR(80),
-- asi que ninguna foto subida desde la app podia guardarse: el archivo se subia
-- bien al deposito, pero la direccion no entraba en la base.
--
-- 300 caracteres deja lugar de sobra para cualquier nombre de archivo.
--
-- El texto alternativo tambien se queda corto con descripciones largas
-- ("Foto: <descripcion>"), asi que pasa de 80 a 200.
--
-- ES IDEMPOTENTE: se puede volver a ejecutar sin romper nada.

ALTER TABLE IF EXISTS imagenes ALTER COLUMN url_img TYPE VARCHAR(300);
ALTER TABLE IF EXISTS imagenes ALTER COLUMN txt_alt TYPE VARCHAR(200);

-- Verificacion: tienen que aparecer las dos filas con los largos nuevos
SELECT
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'imagenes'
  AND column_name IN ('url_img', 'txt_alt')
ORDER BY column_name;
