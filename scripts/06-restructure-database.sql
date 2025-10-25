-- ============================================
-- Script 06: Reestructurar Base de Datos
-- ============================================
-- Este script migra la estructura de productos a la nueva arquitectura
-- con categorías e imágenes

-- ============================================
-- PASO 1: Crear tabla categorias
-- ============================================
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    unidad VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar categorías por defecto
INSERT INTO categorias (nombre, unidad) VALUES
    ('General', 'unidad'),
    ('Cables', 'metro'),
    ('Materiales', 'kg'),
    ('Líquidos', 'litro'),
    ('Electricidad', 'unidad')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================
-- PASO 2: Crear tabla imagenes
-- ============================================
CREATE TABLE IF NOT EXISTS imagenes (
    id SERIAL PRIMARY KEY,
    url_img VARCHAR(80) NOT NULL,
    txt_alt VARCHAR(60),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar imagen placeholder por defecto
INSERT INTO imagenes (url_img, txt_alt) VALUES
    ('/placeholder.svg', 'Imagen de producto por defecto')
ON CONFLICT DO NOTHING;

-- ============================================
-- PASO 3: Eliminar índices antiguos
-- ============================================
DROP INDEX IF EXISTS idx_productos_proveedor;
DROP INDEX IF EXISTS idx_productos_categoria;
DROP INDEX IF EXISTS idx_productos_imagen;
DROP INDEX IF EXISTS idx_productos_articulo;

-- ============================================
-- PASO 4: Respaldar tabla productos actual
-- ============================================
DO $$
BEGIN
    -- Eliminar respaldo anterior si existe
    DROP TABLE IF EXISTS productos_old CASCADE;
    
    -- Renombrar tabla actual a productos_old si existe
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'productos'
    ) THEN
        ALTER TABLE productos RENAME TO productos_old;
        RAISE NOTICE 'Tabla productos respaldada como productos_old';
    END IF;
END $$;

-- ============================================
-- PASO 5: Crear nueva tabla productos
-- ============================================
CREATE TABLE productos (
    producto_id SERIAL PRIMARY KEY,
    articulo_numero VARCHAR(10),
    producto_codigo VARCHAR(50),
    titulo VARCHAR(50),
    descripcion TEXT NOT NULL,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
    img_id INTEGER NOT NULL REFERENCES imagenes(id) ON DELETE RESTRICT,
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(proveedor_id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PASO 6: Crear índices para nueva tabla
-- ============================================
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX idx_productos_imagen ON productos(img_id);
CREATE INDEX idx_productos_articulo ON productos(articulo_numero);

-- ============================================
-- PASO 7: Migrar datos de productos_old a productos
-- ============================================
DO $$
DECLARE
    default_categoria_id INTEGER;
    default_img_id INTEGER;
    productos_migrados INTEGER := 0;
BEGIN
    -- Obtener IDs por defecto
    SELECT id INTO default_categoria_id FROM categorias WHERE nombre = 'General' LIMIT 1;
    SELECT id INTO default_img_id FROM imagenes LIMIT 1;
    
    -- Verificar si existe la tabla productos_old
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'productos_old'
    ) THEN
        -- Migrar datos
        INSERT INTO productos (
            articulo_numero,
            producto_codigo,
            titulo,
            descripcion,
            categoria_id,
            img_id,
            proveedor_id,
            created_at,
            updated_at
        )
        SELECT 
            articulo_numero::VARCHAR(10),
            COALESCE(producto_codigo, ''),
            COALESCE(LEFT(descripcion, 50), 'Sin título'),
            descripcion,
            CASE 
                WHEN LOWER(unidad_medida) LIKE '%metro%' THEN (SELECT id FROM categorias WHERE nombre = 'Cables' LIMIT 1)
                WHEN LOWER(unidad_medida) LIKE '%kg%' OR LOWER(unidad_medida) LIKE '%kilo%' THEN (SELECT id FROM categorias WHERE nombre = 'Materiales' LIMIT 1)
                WHEN LOWER(unidad_medida) LIKE '%litro%' THEN (SELECT id FROM categorias WHERE nombre = 'Líquidos' LIMIT 1)
                ELSE default_categoria_id
            END,
            default_img_id,
            proveedor_id,
            COALESCE(created_at, NOW()),
            COALESCE(updated_at, NOW())
        FROM productos_old;
        
        GET DIAGNOSTICS productos_migrados = ROW_COUNT;
        RAISE NOTICE '✓ Productos migrados: %', productos_migrados;
    ELSE
        RAISE NOTICE '⚠ No existe tabla productos_old para migrar';
    END IF;
END $$;

-- ============================================
-- PASO 8: Actualizar tabla pedido_productos
-- ============================================
DO $$
DECLARE
    registros_actualizados INTEGER := 0;
BEGIN
    -- Verificar si existe la columna articulo_numero
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'pedido_productos' 
        AND column_name = 'articulo_numero'
    ) THEN
        -- Agregar nueva columna producto_id si no existe
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'pedido_productos' 
            AND column_name = 'producto_id'
        ) THEN
            ALTER TABLE pedido_productos ADD COLUMN producto_id INTEGER;
            RAISE NOTICE '✓ Columna producto_id agregada a pedido_productos';
        END IF;
        
        -- Actualizar producto_id basado en articulo_numero
        UPDATE pedido_productos pp
        SET producto_id = p.producto_id
        FROM productos_old po
        JOIN productos p ON po.articulo_numero::VARCHAR(10) = p.articulo_numero
        WHERE pp.articulo_numero = po.articulo_numero;
        
        GET DIAGNOSTICS registros_actualizados = ROW_COUNT;
        RAISE NOTICE '✓ Registros de pedido_productos actualizados: %', registros_actualizados;
        
        -- Eliminar registros huérfanos (productos que no existen)
        DELETE FROM pedido_productos WHERE producto_id IS NULL;
        
        -- Hacer producto_id NOT NULL
        ALTER TABLE pedido_productos ALTER COLUMN producto_id SET NOT NULL;
        
        -- Agregar foreign key si no existe
        IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_pedido_productos_producto'
            AND table_name = 'pedido_productos'
        ) THEN
            ALTER TABLE pedido_productos 
            ADD CONSTRAINT fk_pedido_productos_producto 
            FOREIGN KEY (producto_id) REFERENCES productos(producto_id) ON DELETE CASCADE;
            RAISE NOTICE '✓ Foreign key agregada a pedido_productos';
        END IF;
        
        -- Eliminar columna antigua articulo_numero
        ALTER TABLE pedido_productos DROP COLUMN articulo_numero;
        RAISE NOTICE '✓ Columna articulo_numero eliminada de pedido_productos';
    ELSE
        RAISE NOTICE '⚠ La tabla pedido_productos ya está actualizada';
    END IF;
END $$;

-- ============================================
-- PASO 9: Crear índice para pedido_productos
-- ============================================
DROP INDEX IF EXISTS idx_pedido_productos_producto;
CREATE INDEX idx_pedido_productos_producto ON pedido_productos(producto_id);

-- ============================================
-- PASO 10: Crear triggers para actualización automática
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS update_productos_updated_at ON productos;
DROP TRIGGER IF EXISTS update_categorias_updated_at ON categorias;
DROP TRIGGER IF EXISTS update_imagenes_updated_at ON imagenes;

-- Crear triggers
CREATE TRIGGER update_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorias_updated_at
    BEFORE UPDATE ON categorias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imagenes_updated_at
    BEFORE UPDATE ON imagenes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
DO $$
DECLARE
    productos_count INTEGER;
    categorias_count INTEGER;
    imagenes_count INTEGER;
    pedido_productos_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO productos_count FROM productos;
    SELECT COUNT(*) INTO categorias_count FROM categorias;
    SELECT COUNT(*) INTO imagenes_count FROM imagenes;
    SELECT COUNT(*) INTO pedido_productos_count FROM pedido_productos;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE '    MIGRACIÓN COMPLETADA EXITOSAMENTE    ';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Productos migrados: %', productos_count;
    RAISE NOTICE 'Categorías disponibles: %', categorias_count;
    RAISE NOTICE 'Imágenes disponibles: %', imagenes_count;
    RAISE NOTICE 'Pedido productos actualizados: %', pedido_productos_count;
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Siguiente paso:';
    RAISE NOTICE '1. Recarga la aplicación';
    RAISE NOTICE '2. Verifica que los productos se muestren correctamente';
    RAISE NOTICE '3. La tabla productos_old puede eliminarse si todo funciona bien';
    RAISE NOTICE '==========================================';
END $$;
