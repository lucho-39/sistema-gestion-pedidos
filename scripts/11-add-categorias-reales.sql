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
-- ES IDEMPOTENTE y NO depende de que exista un indice unico en "nombre":
-- usa WHERE NOT EXISTS, asi que se puede volver a ejecutar sin duplicar nada
-- y sin riesgo de error.

BEGIN;

INSERT INTO categorias (nombre, unidad)
SELECT v.nombre, v.unidad
FROM (VALUES
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
) AS v(nombre, unidad)
WHERE NOT EXISTS (
  SELECT 1 FROM categorias c WHERE c.nombre = v.nombre
);

COMMIT;

-- Verificacion: tienen que aparecer 23 (las 5 viejas + estas 18)
SELECT id, nombre, unidad
FROM categorias
ORDER BY id;
