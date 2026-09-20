-- ============================================
-- Script 10: Agregar email a clientes
-- ============================================
--
-- La tabla clientes no tenia columna de email, asi que el importador de
-- clientes leia la columna "Email" del Excel y la descartaba.
--
-- Este script la agrega. Es el UNICO cambio de esquema; las politicas de
-- seguridad (script 07) no necesitan tocarse: son por tabla, no por columna.
--
-- ES IDEMPOTENTE: se puede volver a ejecutar sin romper nada.
--
-- ORDEN IMPORTANTE: correr esto ANTES de desplegar el codigo que usa el email.
-- Si el codigo sale primero, el importador de clientes va a fallar al intentar
-- escribir en una columna que todavia no existe.

BEGIN;

ALTER TABLE IF EXISTS clientes ADD COLUMN IF NOT EXISTS email VARCHAR(150);

COMMIT;

-- Verificacion: tiene que aparecer la fila con email
SELECT
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clientes'
ORDER BY ordinal_position;
