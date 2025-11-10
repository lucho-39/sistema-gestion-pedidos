-- NOTA: Este script es para referencia histórica.
-- La base de datos actual ya tiene datos migrados.
-- Este script está obsoleto y no debe ejecutarse

-- Para agregar nuevos datos de prueba al esquema actual, usar este formato:

-- Insertar proveedores
INSERT INTO proveedores (proveedor_id, proveedor_nombre) VALUES
(300, 'CAELBI'),
(400, 'DABOR'),
(500, 'EMANAL'),
(1000, 'JELUZ'),
(1100, 'KALOPS'),
(1200, 'LORD'),
(1800, 'SERRA'),
(2300, 'WERKE'),
(1, 'Proveedor General')
ON CONFLICT (proveedor_id) DO NOTHING;

-- Asegurarse de que exista una categoría e imagen por defecto
INSERT INTO categorias (nombre, unidad) VALUES
('General', 'unidad')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO imagenes (url_img, txt_alt) VALUES
('/placeholder.svg', 'Imagen por defecto')
ON CONFLICT DO NOTHING;

-- Insertar productos usando el nuevo esquema
-- Usar categoria_id, img_id en lugar de unidad_medida
INSERT INTO productos (articulo_numero, producto_codigo, descripcion, categoria_id, img_id, proveedor_id) VALUES
('1001', 'CAB-001', 'Cable de alimentación 3x2.5mm', 
 (SELECT id FROM categorias WHERE nombre = 'General' LIMIT 1),
 (SELECT id FROM imagenes LIMIT 1),
 300),
('1002', 'INT-001', 'Interruptor simple',
 (SELECT id FROM categorias WHERE nombre = 'General' LIMIT 1),
 (SELECT id FROM imagenes LIMIT 1),
 1000),
('1003', 'TOM-001', 'Tomacorriente doble',
 (SELECT id FROM categorias WHERE nombre = 'General' LIMIT 1),
 (SELECT id FROM imagenes LIMIT 1),
 1000)
ON CONFLICT (producto_id) DO NOTHING;

-- Insertar clientes
INSERT INTO clientes (cliente_codigo, nombre, domicilio, telefono, cuil) VALUES
(101, 'Juan Pérez', 'Av. Corrientes 1234, CABA', '11-4567-8901', '20-12345678-9'),
(102, 'María González', 'San Martín 567, La Plata', '221-456-7890', '27-87654321-3'),
(103, 'Carlos López', 'Belgrano 890, Rosario', '341-234-5678', '20-11223344-5')
ON CONFLICT (cliente_codigo) DO NOTHING;
