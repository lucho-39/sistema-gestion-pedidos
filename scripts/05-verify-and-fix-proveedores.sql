-- Script para verificar y corregir proveedores
-- Este script asegura que todos los proveedores estén correctamente insertados

-- Primero, verificar qué proveedores existen
SELECT proveedor_id, proveedor_nombre 
FROM proveedores 
ORDER BY proveedor_id;

-- Insertar o actualizar proveedores (usando UPSERT)
INSERT INTO proveedores (proveedor_id, proveedor_nombre) VALUES
(1, 'Proveedor General'),
(300, 'CAELBI'),
(400, 'DABOR'),
(500, 'EMANAL'),
(1000, 'JELUZ'),
(1100, 'KALOPS'),
(1200, 'LORD'),
(1800, 'SERRA'),
(2300, 'WERKE')
ON CONFLICT (proveedor_id) 
DO UPDATE SET 
  proveedor_nombre = EXCLUDED.proveedor_nombre,
  updated_at = CURRENT_TIMESTAMP;

-- Verificar que todos los proveedores fueron insertados correctamente
SELECT 
  proveedor_id, 
  proveedor_nombre,
  created_at,
  updated_at
FROM proveedores 
ORDER BY proveedor_id;

-- Contar productos por proveedor
SELECT 
  p.proveedor_id,
  p.proveedor_nombre,
  COUNT(pr.articulo_numero) as total_productos
FROM proveedores p
LEFT JOIN productos pr ON p.proveedor_id = pr.proveedor_id
GROUP BY p.proveedor_id, p.proveedor_nombre
ORDER BY p.proveedor_id;
