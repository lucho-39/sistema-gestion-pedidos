-- Crear extensión para UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    proveedor_id INTEGER PRIMARY KEY,
    proveedor_nombre VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    articulo_numero INTEGER PRIMARY KEY,
    producto_codigo VARCHAR(255) DEFAULT '',
    descripcion TEXT NOT NULL,
    unidad_medida VARCHAR(50) NOT NULL DEFAULT 'unidad',
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(proveedor_id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    cliente_id SERIAL PRIMARY KEY,
    cliente_codigo INTEGER NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    domicilio TEXT NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    cuil VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    pedido_id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(cliente_id) ON DELETE RESTRICT,
    fecha_pedido DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla intermedia para productos en pedidos
CREATE TABLE IF NOT EXISTS pedido_productos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(pedido_id) ON DELETE CASCADE,
    articulo_numero INTEGER NOT NULL REFERENCES productos(articulo_numero) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para reportes semanales (cache)
CREATE TABLE IF NOT EXISTS reportes_semanales (
    id SERIAL PRIMARY KEY,
    tipo_reporte VARCHAR(50) NOT NULL, -- 'general', 'productos', 'pedidos'
    fecha_corte TIMESTAMP WITH TIME ZONE NOT NULL,
    datos JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_productos_descripcion ON productos USING gin(to_tsvector('spanish', descripcion));
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_pedido ON pedido_productos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_articulo ON pedido_productos(articulo_numero);
CREATE INDEX IF NOT EXISTS idx_reportes_tipo_fecha ON reportes_semanales(tipo_reporte, fecha_corte);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON proveedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
