"use client"

import { useState } from "react"
import { Copy, Check, Database, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"

const SQL_SCRIPTS = {
  "01-create-tables": `-- Crear tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  proveedor_id INTEGER PRIMARY KEY,
  proveedor_nombre TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  articulo_numero INTEGER PRIMARY KEY,
  producto_codigo TEXT,
  descripcion TEXT NOT NULL,
  unidad_medida TEXT NOT NULL DEFAULT 'unidad',
  proveedor_id INTEGER REFERENCES proveedores(proveedor_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  cliente_id SERIAL PRIMARY KEY,
  cliente_codigo INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  domicilio TEXT,
  telefono TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  pedido_id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(cliente_id),
  fecha_pedido DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de productos en pedidos
CREATE TABLE IF NOT EXISTS pedido_productos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER REFERENCES pedidos(pedido_id) ON DELETE CASCADE,
  articulo_numero INTEGER REFERENCES productos(articulo_numero),
  cantidad DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_pedido ON pedido_productos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_articulo ON pedido_productos(articulo_numero);`,

  "02-seed-data": `-- Insertar proveedores de ejemplo
INSERT INTO proveedores (proveedor_id, proveedor_nombre) VALUES
  (1, 'Proveedor General'),
  (300, 'CAELBI'),
  (400, 'DABOR'),
  (500, 'EMANAL'),
  (1000, 'JELUZ'),
  (1100, 'KALOPS'),
  (1200, 'LORD'),
  (1800, 'SERRA'),
  (2300, 'WERKE')
ON CONFLICT (proveedor_id) DO NOTHING;

-- Insertar productos de ejemplo usando LORD (1200)
INSERT INTO productos (articulo_numero, producto_codigo, descripcion, unidad_medida, proveedor_id) VALUES
  (12345, 'INT10A', 'Interruptor simple 10A', 'unidad', 1200),
  (12346, 'TOM2', 'Tomacorriente doble', 'unidad', 1200),
  (12347, 'INT-CONM', 'Interruptor conmutador', 'unidad', 1200),
  (12348, 'TOM3', 'Tomacorriente triple', 'unidad', 1200)
ON CONFLICT (articulo_numero) DO NOTHING;

-- Insertar clientes de ejemplo
INSERT INTO clientes (cliente_codigo, nombre, domicilio, telefono) VALUES
  (1001, 'Cliente Ejemplo 1', 'Calle Falsa 123', '555-0001'),
  (1002, 'Cliente Ejemplo 2', 'Av. Principal 456', '555-0002')
ON CONFLICT DO NOTHING;`,

  "03-update-for-auto-reports": `-- Script para agregar soporte a reportes automáticos
-- Este script es opcional y se puede ejecutar más adelante si se necesita

-- Agregar columnas para tracking de reportes (opcional)
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS incluido_en_reporte BOOLEAN DEFAULT FALSE;

ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS fecha_inclusion_reporte TIMESTAMP;

ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS reporte_id TEXT;

-- Crear índice para búsquedas rápidas de pedidos sin reportar
CREATE INDEX IF NOT EXISTS idx_pedidos_reportados 
ON pedidos(incluido_en_reporte, fecha_pedido);`,

  "04-add-cuil-column": `-- Script para agregar la columna CUIL a la tabla clientes
-- Este campo es opcional y puede usarse para identificación fiscal

-- Verificar si la columna ya existe antes de agregarla
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'clientes' 
    AND column_name = 'cuil'
  ) THEN
    ALTER TABLE clientes ADD COLUMN cuil TEXT;
    CREATE INDEX IF NOT EXISTS idx_clientes_cuil ON clientes(cuil);
  END IF;
END $$;

-- Verificar resultado
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'clientes'
ORDER BY ordinal_position;`,

  "05-verify-and-fix-proveedores": `-- Script para verificar y corregir proveedores
-- Este script usa UPSERT para insertar o actualizar proveedores sin eliminar datos

-- Paso 1: Mostrar proveedores actuales
SELECT 
  'PROVEEDORES ACTUALES' as info,
  proveedor_id, 
  proveedor_nombre,
  (SELECT COUNT(*) FROM productos WHERE productos.proveedor_id = proveedores.proveedor_id) as cantidad_productos
FROM proveedores
ORDER BY proveedor_id;

-- Paso 2: Insertar o actualizar todos los proveedores (UPSERT)
INSERT INTO proveedores (proveedor_id, proveedor_nombre, created_at, updated_at) VALUES
  (1, 'Proveedor General', NOW(), NOW()),
  (300, 'CAELBI', NOW(), NOW()),
  (400, 'DABOR', NOW(), NOW()),
  (500, 'EMANAL', NOW(), NOW()),
  (1000, 'JELUZ', NOW(), NOW()),
  (1100, 'KALOPS', NOW(), NOW()),
  (1200, 'LORD', NOW(), NOW()),
  (1800, 'SERRA', NOW(), NOW()),
  (2300, 'WERKE', NOW(), NOW())
ON CONFLICT (proveedor_id) 
DO UPDATE SET 
  proveedor_nombre = EXCLUDED.proveedor_nombre,
  updated_at = NOW();

-- Paso 3: Verificar proveedores después de la actualización
SELECT 
  'PROVEEDORES ACTUALIZADOS' as info,
  proveedor_id, 
  proveedor_nombre,
  (SELECT COUNT(*) FROM productos WHERE productos.proveedor_id = proveedores.proveedor_id) as cantidad_productos
FROM proveedores
ORDER BY proveedor_id;

-- Paso 4: Mostrar productos por proveedor
SELECT 
  'PRODUCTOS POR PROVEEDOR' as info,
  p.proveedor_id,
  prov.proveedor_nombre,
  COUNT(*) as cantidad_productos
FROM productos p
LEFT JOIN proveedores prov ON p.proveedor_id = prov.proveedor_id
GROUP BY p.proveedor_id, prov.proveedor_nombre
ORDER BY p.proveedor_id;`,

  "06-migrate-productos-to-lord": `-- Script para migrar productos del Proveedor General (1) al Proveedor LORD (1200)

-- Paso 1: Verificar estado actual
SELECT 
  'ANTES DE LA MIGRACIÓN' as estado,
  proveedor_id,
  COUNT(*) as cantidad_productos
FROM productos
GROUP BY proveedor_id
ORDER BY proveedor_id;

-- Paso 2: Mostrar productos que serán migrados
SELECT 
  'PRODUCTOS A MIGRAR' as info,
  articulo_numero,
  descripcion,
  proveedor_id as proveedor_actual
FROM productos
WHERE proveedor_id = 1
ORDER BY articulo_numero;

-- Paso 3: Verificar que el proveedor LORD (1200) existe
SELECT 
  'VERIFICACIÓN PROVEEDOR LORD' as info,
  proveedor_id,
  proveedor_nombre
FROM proveedores
WHERE proveedor_id = 1200;

-- Paso 4: Realizar la migración
UPDATE productos
SET 
  proveedor_id = 1200,
  updated_at = NOW()
WHERE proveedor_id = 1;

-- Paso 5: Verificar resultado
SELECT 
  'DESPUÉS DE LA MIGRACIÓN' as estado,
  proveedor_id,
  COUNT(*) as cantidad_productos
FROM productos
GROUP BY proveedor_id
ORDER BY proveedor_id;

-- Paso 6: Mostrar productos migrados
SELECT 
  'PRODUCTOS MIGRADOS A LORD' as info,
  p.articulo_numero,
  p.descripcion,
  p.proveedor_id,
  prov.proveedor_nombre
FROM productos p
LEFT JOIN proveedores prov ON p.proveedor_id = prov.proveedor_id
WHERE p.proveedor_id = 1200
ORDER BY p.articulo_numero;

-- Paso 7: Verificar si quedan productos en proveedor 1
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ MIGRACIÓN EXITOSA - No quedan productos en Proveedor General (1)'
    ELSE '⚠ ADVERTENCIA - Aún hay productos en Proveedor General (1)'
  END as resultado,
  COUNT(*) as productos_restantes
FROM productos
WHERE proveedor_id = 1;`,
}

export default function SetupPage() {
  const [copiedScript, setCopiedScript] = useState<string | null>(null)

  const copyToClipboard = (scriptName: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedScript(scriptName)
    setTimeout(() => setCopiedScript(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 pb-24 md:pb-8">
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Configuración de Base de Datos</h1>
            <p className="text-gray-600 text-sm md:text-base">Scripts SQL para configurar Supabase</p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Instrucciones:</strong> Copia cada script SQL y ejecútalo en el SQL Editor de Supabase en orden.
            Asegúrate de ejecutar los scripts en el orden numérico (01, 02, 03, etc.).
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="01-create-tables" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="01-create-tables" className="text-xs">
              01 Tablas
            </TabsTrigger>
            <TabsTrigger value="02-seed-data" className="text-xs">
              02 Datos
            </TabsTrigger>
            <TabsTrigger value="03-update-for-auto-reports" className="text-xs">
              03 Reportes
            </TabsTrigger>
            <TabsTrigger value="04-add-cuil-column" className="text-xs">
              04 CUIL
            </TabsTrigger>
            <TabsTrigger value="05-verify-and-fix-proveedores" className="text-xs">
              05 Verificar
            </TabsTrigger>
            <TabsTrigger value="06-migrate-productos-to-lord" className="text-xs">
              06 Migrar
            </TabsTrigger>
          </TabsList>

          {Object.entries(SQL_SCRIPTS).map(([key, content]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-base md:text-lg">{key.replace(/-/g, " ").toUpperCase()}</span>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(key, content)} className="gap-2">
                      {copiedScript === key ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span className="hidden sm:inline">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span className="hidden sm:inline">Copiar</span>
                        </>
                      )}
                    </Button>
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    {key === "01-create-tables" && "Crea las tablas principales del sistema"}
                    {key === "02-seed-data" && "Inserta datos de ejemplo y proveedores"}
                    {key === "03-update-for-auto-reports" && "Agrega soporte para reportes automáticos (opcional)"}
                    {key === "04-add-cuil-column" && "Agrega columna CUIL a clientes (opcional)"}
                    {key === "05-verify-and-fix-proveedores" &&
                      "Verifica y corrige todos los proveedores sin eliminar datos"}
                    {key === "06-migrate-productos-to-lord" &&
                      "Migra productos del Proveedor General (1) a LORD (1200)"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {key === "06-migrate-productos-to-lord" && (
                    <Alert className="mb-4 bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 text-xs md:text-sm">
                        <strong>⚠️ Script de Migración:</strong> Este script moverá TODOS los productos que actualmente
                        tienen proveedor_id = 1 (Proveedor General) al proveedor_id = 1200 (LORD). Revisa los resultados
                        antes de continuar.
                      </AlertDescription>
                    </Alert>
                  )}
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs md:text-sm max-h-96 md:max-h-[500px]">
                    <code>{content}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Pasos de Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs md:text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <p className="font-medium">Ejecuta el script "01 Tablas"</p>
                <p className="text-gray-600 text-xs">Crea todas las tablas necesarias en Supabase</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <p className="font-medium">Ejecuta el script "02 Datos"</p>
                <p className="text-gray-600 text-xs">Inserta proveedores y datos de ejemplo</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <div>
                <p className="font-medium">Ejecuta el script "05 Verificar"</p>
                <p className="text-gray-600 text-xs">Verifica que el proveedor LORD (1200) existe correctamente</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                4
              </div>
              <div>
                <p className="font-medium">Ejecuta el script "06 Migrar" (IMPORTANTE)</p>
                <p className="text-gray-600 text-xs">
                  Migra todos los productos del Proveedor General (1) a LORD (1200)
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs">
                5
              </div>
              <div>
                <p className="font-medium">Scripts opcionales</p>
                <p className="text-gray-600 text-xs">
                  Ejecuta "03 Reportes" y "04 CUIL" según necesites estas funcionalidades
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
