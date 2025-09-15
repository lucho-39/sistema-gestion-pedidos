-- Crear tablas para el sistema de gestión de inventario

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    proveedor_id SERIAL PRIMARY KEY,
    proveedor_nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    articulo_numero INTEGER PRIMARY KEY,
    producto_codigo VARCHAR(100),
    descripcion TEXT NOT NULL,
    unidad_medida VARCHAR(50) NOT NULL,
    proveedor_id INTEGER REFERENCES proveedores(proveedor_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    cliente_id SERIAL PRIMARY KEY,
    cliente_codigo INTEGER UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    domicilio TEXT,
    telefono VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    pedido_id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(cliente_id),
    fecha_pedido DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos en pedidos
CREATE TABLE IF NOT EXISTS pedido_productos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(pedido_id) ON DELETE CASCADE,
    articulo_numero INTEGER REFERENCES productos(articulo_numero),
    cantidad INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_pedido ON pedido_productos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_articulo ON pedido_productos(articulo_numero);

-- Insertar proveedor por defecto si no existe
INSERT INTO proveedores (proveedor_nombre) 
SELECT 'Proveedor General'
WHERE NOT EXISTS (SELECT 1 FROM proveedores WHERE proveedor_id = 1);
