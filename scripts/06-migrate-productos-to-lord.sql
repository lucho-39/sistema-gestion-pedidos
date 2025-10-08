-- Script para migrar productos del Proveedor General (1) al Proveedor LORD (1200)
-- Este script actualiza todos los productos que tienen proveedor_id = 1 para que tengan proveedor_id = 1200

-- Paso 1: Verificar estado actual
SELECT 
  'ANTES DE LA MIGRACIÓN' as estado,
  proveedor_id,
  COUNT(*) as cantidad_productos
FROM productos
GROUP BY proveedor_id
ORDER BY proveedor_id;

-- Paso 2: Mostrar productos que serán migrados
SELECT 
  'PRODUCTOS A MIGRAR' as info,
  articulo_numero,
  descripcion,
  proveedor_id as proveedor_actual
FROM productos
WHERE proveedor_id = 1
ORDER BY articulo_numero;

-- Paso 3: Verificar que el proveedor LORD (1200) existe
SELECT 
  'VERIFICACIÓN PROVEEDOR LORD' as info,
  proveedor_id,
  proveedor_nombre
FROM proveedores
WHERE proveedor_id = 1200;

-- Paso 4: Realizar la migración
-- Actualizar todos los productos del proveedor 1 al proveedor 1200
UPDATE productos
SET 
  proveedor_id = 1200,
  updated_at = NOW()
WHERE proveedor_id = 1;

-- Paso 5: Verificar resultado
SELECT 
  'DESPUÉS DE LA MIGRACIÓN' as estado,
  proveedor_id,
  COUNT(*) as cantidad_productos
FROM productos
GROUP BY proveedor_id
ORDER BY proveedor_id;

-- Paso 6: Mostrar productos migrados
SELECT 
  'PRODUCTOS MIGRADOS A LORD' as info,
  p.articulo_numero,
  p.descripcion,
  p.proveedor_id,
  prov.proveedor_nombre
FROM productos p
LEFT JOIN proveedores prov ON p.proveedor_id = prov.proveedor_id
WHERE p.proveedor_id = 1200
ORDER BY p.articulo_numero;

-- Paso 7: Verificar si quedan productos en proveedor 1
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ MIGRACIÓN EXITOSA - No quedan productos en Proveedor General (1)'
    ELSE '⚠ ADVERTENCIA - Aún hay productos en Proveedor General (1)'
  END as resultado,
  COUNT(*) as productos_restantes
FROM productos
WHERE proveedor_id = 1;
