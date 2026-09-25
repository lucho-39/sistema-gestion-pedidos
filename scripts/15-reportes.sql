-- ============================================
-- Script 15: los reportes semanales en la base
-- ============================================
--
-- Hasta ahora los reportes se guardaban en el navegador (localStorage): cada
-- computadora tenia los suyos, y se perdian al limpiar los datos del navegador.
-- Ademas solo se generaban si alguien tenia la pantalla de Reportes abierta.
--
-- Esta tabla los guarda en la base, que es lo que pedia el pedido original:
-- almacenados, consultables desde cualquier dispositivo, y generados por el
-- servidor sin depender de nada abierto.
--
-- Un reporte por semana, con las TRES vistas adentro (general, productos por
-- proveedor y pedidos), tal como las arma el generador actual.
--
-- La forma copia el tipo ReporteAutomatico de la app, asi no hay que traducir
-- nada al leerlo o escribirlo.
--
-- ES IDEMPOTENTE: se puede volver a ejecutar sin romper nada.

CREATE TABLE IF NOT EXISTS reportes (
    id                    TEXT PRIMARY KEY,
    tipo                  TEXT NOT NULL CHECK (tipo IN ('automatico', 'manual')),
    fecha_generacion      TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- El periodo que cubre: desde el miercoles anterior hasta el corte.
    fecha_inicio_periodo  TIMESTAMPTZ NOT NULL,
    fecha_fin_periodo     TIMESTAMPTZ NOT NULL,
    -- Los pedidos que entraron en este reporte. Se marcan para que no vuelvan
    -- a salir en el siguiente.
    pedidos_incluidos     INTEGER[] NOT NULL DEFAULT '{}',
    -- Las tres vistas completas (general, productos_por_proveedor, pedidos).
    contenido             JSONB NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consultar por fecha es lo que hace la pantalla (del mas nuevo al mas viejo).
CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON reportes (fecha_generacion DESC);

-- Seguridad: solo usuarios logueados. El visitante puede ver el catalogo, no
-- los reportes del negocio.
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reportes_solo_logueados" ON reportes;
CREATE POLICY "reportes_solo_logueados"
    ON reportes FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verificacion: tiene que aparecer la tabla con sus columnas
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reportes'
ORDER BY ordinal_position;
