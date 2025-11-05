-- Crear imagen por defecto si no existe
INSERT INTO imagenes (url_img, txt_alt, created_at, updated_at)
SELECT 
  '/placeholder.svg?height=200&width=200',
  'Imagen por defecto',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM imagenes WHERE txt_alt = 'Imagen por defecto'
);

-- Mostrar el ID de la imagen por defecto
SELECT id, url_img, txt_alt FROM imagenes WHERE txt_alt = 'Imagen por defecto';
