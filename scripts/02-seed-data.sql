-- Insertar proveedores iniciales
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

-- Insertar algunos productos de ejemplo
INSERT INTO productos (articulo_numero, producto_codigo, descripcion, unidad_medida, proveedor_id) VALUES
(1001, 'CAB-001', 'Cable de alimentación 3x2.5mm', 'metros', 300),
(1002, 'INT-001', 'Interruptor simple', 'unidad', 1000),
(1003, 'TOM-001', 'Tomacorriente doble', 'unidad', 1000),
(2001, 'CAB-002', 'Cable telefónico 2 pares', 'metros', 400),
(2002, 'LUZ-001', 'Lámpara LED 9W', 'unidad', 1200)
ON CONFLICT (articulo_numero) DO NOTHING;

-- Insertar algunos clientes de ejemplo
INSERT INTO clientes (cliente_codigo, nombre, domicilio, telefono, cuil) VALUES
(101, 'Juan Pérez', 'Av. Corrientes 1234, CABA', '11-4567-8901', '20-12345678-9'),
(102, 'María González', 'San Martín 567, La Plata', '221-456-7890', '27-87654321-3'),
(103, 'Carlos López', 'Belgrano 890, Rosario', '341-234-5678', '20-11223344-5')
ON CONFLICT (cliente_codigo) DO NOTHING;
