-- Agregar columna CUIL a la tabla clientes si no existe

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'cuil'
    ) THEN
        ALTER TABLE clientes ADD COLUMN cuil VARCHAR(15);
        RAISE NOTICE 'Columna CUIL agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna CUIL ya existe';
    END IF;
END $$;

-- Crear índice para búsquedas rápidas por CUIL
CREATE INDEX IF NOT EXISTS idx_clientes_cuil ON clientes(cuil);
