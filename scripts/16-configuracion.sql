-- ============================================
-- Script 16: configuracion del sistema
-- ============================================
--
-- El boton "Detener Sistema" hoy solo apaga el scheduler del navegador. Con el
-- cron generando los reportes en el servidor, ese boton no alcanza: hace falta
-- un estado que el servidor pueda leer.
--
-- Esta tabla guarda esa configuracion. Arranca con el sistema de reportes
-- activo, que es como esta hoy.
--
-- Para que sirve:
--   - Detener los reportes por una contingencia (feriados largos, la ferreteria
--     cerrada, un proveedor que no entrega). Los pedidos se acumulan y salen
--     todos juntos cuando se reactive, en lugar de salir reportes vacios.
--   - Cerrar antes, por una semana corta, se hace con "Reporte Manual": ese
--     boton genera y marca los pedidos, asi el miercoles no sale un segundo.
--
-- ES IDEMPOTENTE: se puede volver a ejecutar sin romper nada.

CREATE TABLE IF NOT EXISTS configuracion (
    clave      TEXT PRIMARY KEY,
    valor      TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Arranca activo. Si ya existe la fila, no la pisa.
INSERT INTO configuracion (clave, valor)
VALUES ('reportes_activos', 'true')
ON CONFLICT (clave) DO NOTHING;

-- Seguridad: solo usuarios logueados.
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "configuracion_solo_logueados" ON configuracion;
CREATE POLICY "configuracion_solo_logueados"
    ON configuracion FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verificacion: tiene que aparecer una fila con reportes_activos = true
SELECT clave, valor, updated_at FROM configuracion;
