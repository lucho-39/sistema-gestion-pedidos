-- Agregar columnas para el sistema de reportes automáticos a la tabla pedidos
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS incluido_en_reporte BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_inclusion_reporte TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reporte_id VARCHAR(255);

-- Crear tabla para reportes automáticos
CREATE TABLE IF NOT EXISTS reportes_automaticos (
    id VARCHAR(255) PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('automatico', 'manual')),
    fecha_generacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_inicio_periodo TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_fin_periodo TIMESTAMP WITH TIME ZONE NOT NULL,
    datos JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_pedidos_incluido_reporte ON pedidos(incluido_en_reporte);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_pedido ON pedidos(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_reporte_id ON pedidos(reporte_id);
CREATE INDEX IF NOT EXISTS idx_reportes_automaticos_tipo ON reportes_automaticos(tipo);
CREATE INDEX IF NOT EXISTS idx_reportes_automaticos_fecha_generacion ON reportes_automaticos(fecha_generacion);

-- Comentarios para documentación
COMMENT ON COLUMN pedidos.incluido_en_reporte IS 'Indica si el pedido ya fue incluido en un reporte automático o manual';
COMMENT ON COLUMN pedidos.fecha_inclusion_reporte IS 'Fecha y hora cuando el pedido fue incluido en un reporte';
COMMENT ON COLUMN pedidos.reporte_id IS 'ID del reporte en el que fue incluido el pedido';
COMMENT ON TABLE reportes_automaticos IS 'Almacena el historial de reportes automáticos y manuales generados';
COMMENT ON COLUMN reportes_automaticos.tipo IS 'Tipo de reporte: automatico (generado cada miércoles) o manual (generado por usuario)';
COMMENT ON COLUMN reportes_automaticos.datos IS 'Datos completos del reporte en formato JSON';
