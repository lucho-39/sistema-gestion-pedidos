-- Limpiar productos null en pedido_productos
-- Este script identifica y elimina registros con producto_id null

-- Ver cuántos registros tienen producto_id null
SELECT 
  pp.id,
  pp.pedido_id,
  pp.producto_id,
  pp.cantidad,
  p.pedido_numero
FROM pedido_productos pp
LEFT JOIN pedidos p ON pp.pedido_id = p.pedido_id
WHERE pp.producto_id IS NULL;

-- Eliminar registros con producto_id null
-- IMPORTANTE: Esto eliminará los productos null de los pedidos
DELETE FROM pedido_productos
WHERE producto_id IS NULL;

-- Verificar que se eliminaron
SELECT COUNT(*) as registros_con_null
FROM pedido_productos
WHERE producto_id IS NULL;
