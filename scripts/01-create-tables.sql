-- Crear tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    proveedor_id SERIAL PRIMARY KEY,
    proveedor_nombre VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    articulo_numero SERIAL PRIMARY KEY,
    producto_codigo VARCHAR(100),
    descripcion TEXT NOT NULL,
    unidad_medida VARCHAR(50) NOT NULL DEFAULT 'unidad',
    proveedor_id INTEGER REFERENCES proveedores(proveedor_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    cliente_id SERIAL PRIMARY KEY,
    cliente_codigo INTEGER NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    domicilio TEXT,
    telefono VARCHAR(50),
    cuil VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de pedidos (actualizada con campos de reporte)
CREATE TABLE IF NOT EXISTS pedidos (
    pedido_id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(cliente_id) ON DELETE CASCADE,
    fecha_pedido DATE NOT NULL,
    incluido_en_reporte BOOLEAN DEFAULT FALSE,
    fecha_inclusion_reporte TIMESTAMP WITH TIME ZONE,
    reporte_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de productos por pedido
CREATE TABLE IF NOT EXISTS pedido_productos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(pedido_id) ON DELETE CASCADE,
    articulo_numero INTEGER REFERENCES productos(articulo_numero) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de reportes semanales
CREATE TABLE IF NOT EXISTS reportes_semanales (
    id SERIAL PRIMARY KEY,
    tipo_reporte VARCHAR(50) NOT NULL,
    fecha_corte TIMESTAMP WITH TIME ZONE NOT NULL,
    datos JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de reportes automáticos
CREATE TABLE IF NOT EXISTS reportes_automaticos (
    id VARCHAR(255) PRIMARY KEY,
    fecha_generacion TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_inicio_periodo TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin_periodo TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('automatico', 'manual')),
    datos JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_reporte ON pedidos(incluido_en_reporte, fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_pedido ON pedido_productos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_articulo ON pedido_productos(articulo_numero);
CREATE INDEX IF NOT EXISTS idx_reportes_tipo_fecha ON reportes_semanales(tipo_reporte, fecha_corte);
CREATE INDEX IF NOT EXISTS idx_reportes_automaticos_fecha ON reportes_automaticos(fecha_generacion);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON proveedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
