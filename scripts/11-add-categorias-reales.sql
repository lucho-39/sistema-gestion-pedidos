-- ============================================
-- Script 11: Categorias reales del negocio
-- ============================================
--
-- Las 5 categorias que existian (General, Cables, Materiales, Liquidos,
-- Electricidad) venian del catalogo electrico de SERRA. Pero el negocio es una
-- ferreteria, y su catalogo real (LORD) usa 18 rubros mas.
--
-- Este script agrega esas 18. NO borra ni renombra las existentes: hay 659
-- productos ya cargados que las usan.
--
-- La unidad de medida sale de la categoria, asi que se define aca:
--   * "Venta por Rollo" -> metro  (se corta por metro)
--   * el resto          -> unidad
--
-- ES IDEMPOTENTE: usa ON CONFLICT, se puede volver a ejecutar sin romper nada
-- y sin duplicar. La columna nombre tiene indice unico, que es lo que lo hace
-- posible.

BEGIN;

INSERT INTO categorias (nombre, unidad) VALUES
  ('Ferretería',      'unidad'),
  ('Sanitarios',      'unidad'),
  ('Herramientas',    'unidad'),
  ('Pinturería',      'unidad'),
  ('Librería',        'unidad'),
  ('Jardinería',      'unidad'),
  ('Plomería',        'unidad'),
  ('Venta por Rollo', 'metro'),
  ('Herrería',        'unidad'),
  ('Bazar',           'unidad'),
  ('Repuestos',       'unidad'),
  ('Carpintería',     'unidad'),
  ('Electrónica',     'unidad'),
  ('Camping',         'unidad'),
  ('Automotor',       'unidad'),
  ('Exhibidores',     'unidad'),
  ('Gas',             'unidad'),
  ('Vidriería',       'unidad')
ON CONFLICT (nombre) DO NOTHING;

COMMIT;

-- Verificacion: tienen que aparecer las 23 (las 5 viejas + estas 18)
SELECT id, nombre, unidad
FROM categorias
ORDER BY id;
