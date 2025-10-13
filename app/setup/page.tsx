"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Copy, Check, Database, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const SQL_SCRIPTS = {
  "01-create-tables": `-- Crear tablas para el sistema de gestión de inventario

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  proveedor_id INTEGER PRIMARY KEY,
  proveedor_nombre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  articulo_numero INTEGER PRIMARY KEY,
  producto_codigo TEXT,
  descripcion TEXT NOT NULL,
  unidad_medida TEXT NOT NULL,
  proveedor_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(proveedor_id) ON DELETE RESTRICT
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  cliente_id SERIAL PRIMARY KEY,
  cliente_codigo INTEGER UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  domicilio TEXT NOT NULL,
  telefono TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  pedido_id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL,
  fecha_pedido TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(cliente_id) ON DELETE RESTRICT
);

-- Tabla de productos en pedidos
CREATE TABLE IF NOT EXISTS pedido_productos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL,
  articulo_numero INTEGER NOT NULL,
  cantidad NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(pedido_id) ON DELETE CASCADE,
  FOREIGN KEY (articulo_numero) REFERENCES productos(articulo_numero) ON DELETE RESTRICT
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_pedido ON pedido_productos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_articulo ON pedido_productos(articulo_numero);
CREATE INDEX IF NOT EXISTS idx_clientes_codigo ON clientes(cliente_codigo);`,

  "02-seed-data": `-- Insertar proveedores iniciales
INSERT INTO proveedores (proveedor_id, proveedor_nombre) VALUES
(300, 'CAELBI'),
(400, 'DABOR'),
(500, 'EMANAL'),
(1000, 'JELUZ'),
(1100, 'KALOPS'),
(1200, 'LORD'),
(1800, 'SERRA'),
(2300, 'WERKE'),
(1, 'Proveedor General')
ON CONFLICT (proveedor_id) DO NOTHING;

-- Insertar algunos productos de ejemplo
INSERT INTO productos (articulo_numero, producto_codigo, descripcion, unidad_medida, proveedor_id) VALUES
(1001, 'CAB-001', 'Cable de alimentación 3x2.5mm', 'metros', 300),
(1002, 'INT-001', 'Interruptor simple', 'unidad', 1000),
(1003, 'TOM-001', 'Tomacorriente doble', 'unidad', 1000),
(2001, 'CAB-002', 'Cable telefónico 2 pares', 'metros', 400),
(2002, 'LUZ-001', 'Lámpara LED 9W', 'unidad', 1200),
(2003, 'INT-002', 'Interruptor conmutador', 'unidad', 1200),
(2004, 'TOM-002', 'Tomacorriente triple con protección', 'unidad', 1200)
ON CONFLICT (articulo_numero) DO NOTHING;

-- Insertar algunos clientes de ejemplo
INSERT INTO clientes (cliente_codigo, nombre, domicilio, telefono, cuil) VALUES
(101, 'Juan Pérez', 'Av. Corrientes 1234, CABA', '11-4567-8901', '20-12345678-9'),
(102, 'María González', 'San Martín 567, La Plata', '221-456-7890', '27-87654321-3'),
(103, 'Carlos López', 'Belgrano 890, Rosario', '341-234-5678', '20-11223344-5')
ON CONFLICT (cliente_codigo) DO NOTHING;`,

  "03-update-for-auto-reports": `-- Script para agregar soporte de reportes automáticos
-- Este script agrega columnas necesarias para el sistema de reportes automáticos

-- Agregar columnas a la tabla pedidos para tracking de reportes
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS incluido_en_reporte BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_inclusion_reporte TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reporte_id TEXT;

-- Crear índice para búsquedas rápidas de pedidos no reportados
CREATE INDEX IF NOT EXISTS idx_pedidos_incluido_reporte ON pedidos(incluido_en_reporte);
CREATE INDEX IF NOT EXISTS idx_pedidos_reporte_id ON pedidos(reporte_id);

-- Comentarios para documentación
COMMENT ON COLUMN pedidos.incluido_en_reporte IS 'Indica si el pedido ya fue incluido en un reporte automático';
COMMENT ON COLUMN pedidos.fecha_inclusion_reporte IS 'Fecha en que el pedido fue incluido en un reporte';
COMMENT ON COLUMN pedidos.reporte_id IS 'ID del reporte automático que incluye este pedido';`,

  "04-add-cuil-column": `-- Script para agregar la columna CUIL a la tabla clientes
-- Solo agrega la columna si no existe

-- Agregar columna CUIL si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'clientes' 
    AND column_name = 'cuil'
  ) THEN
    ALTER TABLE clientes ADD COLUMN cuil TEXT;
  END IF;
END $$;

-- Crear índice para búsquedas rápidas por CUIL
CREATE INDEX IF NOT EXISTS idx_clientes_cuil ON clientes(cuil);

-- Comentario para documentación
COMMENT ON COLUMN clientes.cuil IS 'CUIL del cliente (opcional)';`,

  "05-verify-and-fix-proveedores": `-- Script para verificar y corregir proveedores
-- Este script asegura que todos los proveedores estén correctamente insertados

-- Primero, verificar qué proveedores existen
SELECT proveedor_id, proveedor_nombre 
FROM proveedores 
ORDER BY proveedor_id;

-- Insertar o actualizar proveedores (usando UPSERT)
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
ON CONFLICT (proveedor_id) 
DO UPDATE SET 
  proveedor_nombre = EXCLUDED.proveedor_nombre,
  updated_at = CURRENT_TIMESTAMP;

-- Verificar que todos los proveedores fueron insertados correctamente
SELECT 
  proveedor_id, 
  proveedor_nombre,
  created_at,
  updated_at
FROM proveedores 
ORDER BY proveedor_id;

-- Contar productos por proveedor
SELECT 
  p.proveedor_id,
  p.proveedor_nombre,
  COUNT(pr.articulo_numero) as total_productos
FROM proveedores p
LEFT JOIN productos pr ON p.proveedor_id = pr.proveedor_id
GROUP BY p.proveedor_id, p.proveedor_nombre
ORDER BY p.proveedor_id;`,
}

export default function SetupPage() {
  const [copiedScript, setCopiedScript] = useState<string | null>(null)

  const copyToClipboard = (scriptName: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedScript(scriptName)
    setTimeout(() => setCopiedScript(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 py-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Configuración de Base de Datos</h1>
        </div>

        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Ejecuta estos scripts en orden en tu proyecto de Supabase para configurar la
            base de datos.
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>¡Nuevo!</strong> Si tienes problemas con el proveedor LORD u otros proveedores, ejecuta el script 05
            para verificar y corregir los datos.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Scripts SQL
            </CardTitle>
            <CardDescription>
              Copia y ejecuta estos scripts en el SQL Editor de Supabase en orden numérico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="01-create-tables" className="w-full">
              <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full">
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
              </TabsList>

              {Object.entries(SQL_SCRIPTS).map(([name, content]) => (
                <TabsContent key={name} value={name} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Script: {name}.sql</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(name, content)}
                      className="gap-2"
                    >
                      {copiedScript === name ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>

                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{content}</code>
                  </pre>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Descripción:</h4>
                    <p className="text-sm text-blue-800">
                      {name === "01-create-tables" &&
                        "Crea las tablas principales: proveedores, productos, clientes, pedidos y pedido_productos con sus relaciones e índices."}
                      {name === "02-seed-data" &&
                        "Inserta datos iniciales: proveedores (CAELBI, DABOR, EMANAL, JELUZ, KALOPS, LORD, SERRA, WERKE), productos de ejemplo y clientes de prueba."}
                      {name === "03-update-for-auto-reports" &&
                        "Agrega columnas para el sistema de reportes automáticos: incluido_en_reporte, fecha_inclusion_reporte y reporte_id."}
                      {name === "04-add-cuil-column" &&
                        "Agrega la columna CUIL a la tabla clientes de forma segura (solo si no existe)."}
                      {name === "05-verify-and-fix-proveedores" &&
                        "Verifica y corrige los proveedores en la base de datos. Usa UPSERT para asegurar que todos los proveedores estén correctamente insertados, incluyendo LORD."}
                    </p>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instrucciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium">Abre Supabase</p>
                  <p className="text-sm text-gray-600">Ve a tu proyecto en Supabase y abre el SQL Editor</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium">Ejecuta los scripts en orden</p>
                  <p className="text-sm text-gray-600">
                    Copia y ejecuta cada script en el orden numérico (01, 02, 03, 04, 05)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium">Verifica los datos</p>
                  <p className="text-sm text-gray-600">
                    Después de ejecutar el script 05, verifica que todos los proveedores estén insertados correctamente
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                  ✓
                </div>
                <div>
                  <p className="font-medium">¡Listo!</p>
                  <p className="text-sm text-gray-600">
                    Tu base de datos está configurada. Vuelve a la página principal para empezar a usar el sistema.
                  </p>
                </div>
              </div>
            </div>

            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Nota sobre proveedores:</strong> El script 05 usa UPSERT para asegurar que todos los proveedores
                estén correctamente insertados. Si ya tienes datos, este script actualizará los nombres sin eliminar
                productos existentes.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 pt-4">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Inicio
                </Button>
              </Link>
              <Link href="/productos" className="flex-1">
                <Button className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  Ir a Productos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
