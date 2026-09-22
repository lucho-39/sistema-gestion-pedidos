-- ============================================
-- Script 12: Precio de venta, sin stock y varias categorias
-- ============================================
--
-- PRECIO: las listas traen una columna de precio que hasta ahora se descartaba.
-- Es el precio de VENTA (confirmado por el negocio), no el costo del proveedor.
--
-- SIN STOCK: en esas listas, cuando la celda de precio no trae un numero (viene
-- " $-   "), significa que el producto esta SIN STOCK. Eso es distinto de "no le
-- cargue el precio todavia", y por eso se guarda aparte.
--
-- VARIAS CATEGORIAS: las categorias no son un casillero unico, son caminos de
-- busqueda. Un soplete tiene que aparecer si el cliente busca "gas", "herramientas"
-- o "herreria". Por eso un producto puede estar en varias.
--
--   categoria_id  = la principal (la que ya existia, no se toca)
--   categoria_ids = TODAS, incluida la principal. Es la que usa el buscador.
--
-- NUMERIC(12,2): entra cualquier importe razonable con dos decimales, con margen.
--
-- ES IDEMPOTENTE: se puede volver a ejecutar sin romper nada.
--
-- ORDEN IMPORTANTE: correr esto ANTES de desplegar el codigo que usa estas
-- columnas. Si el codigo sale primero, el importador intenta escribir en una
-- columna que todavia no existe y fallan todas las filas.

BEGIN;

ALTER TABLE IF EXISTS productos ADD COLUMN IF NOT EXISTS precio_venta NUMERIC(12,2);

-- DEFAULT false: los productos ya cargados no quedan marcados como sin stock.
ALTER TABLE IF EXISTS productos ADD COLUMN IF NOT EXISTS sin_stock BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE IF EXISTS productos ADD COLUMN IF NOT EXISTS categoria_ids INTEGER[];

-- Los 1523 productos que ya existen arrancan con su categoria actual como unica
-- opcion de busqueda. No se pierde nada de lo que ya tenian.
UPDATE productos
   SET categoria_ids = ARRAY[categoria_id]
 WHERE categoria_ids IS NULL
   AND categoria_id IS NOT NULL;

COMMIT;

-- Verificacion 1: tienen que aparecer las tres columnas
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'productos'
  AND column_name IN ('precio_venta', 'sin_stock', 'categoria_ids')
ORDER BY column_name;

-- Verificacion 2: cuantos productos quedaron con categoria asignada
SELECT
    COUNT(*) AS total,
    COUNT(categoria_ids) AS con_categorias,
    COUNT(precio_venta) AS con_precio
FROM productos;
