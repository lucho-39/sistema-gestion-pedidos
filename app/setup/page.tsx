"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Copy, Database, PlayCircle } from "lucide-react"
import { Database as DB } from "@/lib/database"

export default function SetupPage() {
  const [tablesStatus, setTablesStatus] = useState<{
    exists: boolean
    missingTables: string[]
  } | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    checkTables()
  }, [])

  const checkTables = async () => {
    setIsChecking(true)
    const status = await DB.checkTablesExist()
    setTablesStatus(status)
    setIsChecking(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const scripts = [
    {
      title: "1. Crear Tablas",
      description: "Crea la estructura inicial de la base de datos",
      code: `-- ============================================
-- Script 1: Crear Tablas Iniciales
-- ============================================

-- Tabla de Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    proveedor_id SERIAL PRIMARY KEY,
    proveedor_nombre VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Categorías
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    unidad VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Imágenes
CREATE TABLE IF NOT EXISTS imagenes (
    id SERIAL PRIMARY KEY,
    url_img VARCHAR(500) NOT NULL,
    txt_alt VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
    producto_id SERIAL PRIMARY KEY,
    articulo_numero VARCHAR(50),
    producto_codigo VARCHAR(100),
    titulo VARCHAR(255),
    descripcion TEXT NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id),
    img_id INTEGER REFERENCES imagenes(id),
    proveedor_id INTEGER REFERENCES proveedores(proveedor_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    cliente_id SERIAL PRIMARY KEY,
    cliente_codigo INTEGER NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    domicilio VARCHAR(500),
    telefono VARCHAR(50),
    cuil VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    pedido_id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(cliente_id) ON DELETE CASCADE,
    fecha_pedido DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla intermedia Pedido-Productos
CREATE TABLE IF NOT EXISTS pedido_productos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(pedido_id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(producto_id) ON DELETE CASCADE,
    cantidad DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pedido_id, producto_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_pedido ON pedido_productos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_producto ON pedido_productos(producto_id);`,
    },
    {
      title: "2. Datos Iniciales",
      description: "Inserta categorías, imágenes y proveedores básicos",
      code: `-- ============================================
-- Script 2: Datos Iniciales (Seed Data)
-- ============================================

-- Insertar Categorías
INSERT INTO categorias (nombre, unidad) VALUES
('Cables', 'metros'),
('Herramientas', 'unidad'),
('Materiales', 'unidad'),
('Equipos', 'unidad')
ON CONFLICT DO NOTHING;

-- Insertar Imagen por defecto
INSERT INTO imagenes (url_img, txt_alt) VALUES
('/placeholder.svg', 'Imagen por defecto')
ON CONFLICT DO NOTHING;

-- Insertar Proveedores iniciales
INSERT INTO proveedores (proveedor_nombre) VALUES
('RIVA'),
('DIPROGAL'),
('LORD'),
('MARU'),
('OTRO')
ON CONFLICT (proveedor_nombre) DO NOTHING;

-- Verificar datos insertados
SELECT 'Categorías insertadas:' as tabla, COUNT(*) as cantidad FROM categorias
UNION ALL
SELECT 'Imágenes insertadas:', COUNT(*) FROM imagenes
UNION ALL
SELECT 'Proveedores insertados:', COUNT(*) FROM proveedores;`,
    },
    {
      title: "3. Configurar RLS",
      description: "Deshabilita Row Level Security para desarrollo",
      code: `-- ============================================
-- Script 3: Configurar Row Level Security (RLS)
-- ============================================

-- Deshabilitar RLS en todas las tablas (para desarrollo)
ALTER TABLE IF EXISTS proveedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS imagenes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pedidos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pedido_productos DISABLE ROW LEVEL SECURITY;

-- Verificar el estado de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('proveedores', 'categorias', 'imagenes', 'productos', 'clientes', 'pedidos', 'pedido_productos')
ORDER BY tablename;`,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Configuración de Base de Datos</h1>
            <p className="text-gray-600 mt-2">Ejecuta estos scripts en Supabase SQL Editor</p>
          </div>
          <Button onClick={checkTables} disabled={isChecking}>
            <Database className="h-4 w-4 mr-2" />
            {isChecking ? "Verificando..." : "Verificar Tablas"}
          </Button>
        </div>

        {tablesStatus && (
          <Alert variant={tablesStatus.exists ? "default" : "destructive"}>
            {tablesStatus.exists ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription>
              {tablesStatus.exists
                ? "✅ Todas las tablas están configuradas correctamente"
                : `❌ Faltan tablas: ${tablesStatus.missingTables.join(", ")}`}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {scripts.map((script, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="h-5 w-5 text-blue-600" />
                  {script.title}
                </CardTitle>
                <CardDescription>{script.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
                  <pre>{script.code}</pre>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => copyToClipboard(script.code)} variant="outline" className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Script
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">📋 Instrucciones</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 space-y-2">
            <ol className="list-decimal list-inside space-y-2">
              <li>Abre Supabase y ve a SQL Editor</li>
              <li>Copia y ejecuta el Script 1 (Crear Tablas)</li>
              <li>Copia y ejecuta el Script 2 (Datos Iniciales)</li>
              <li>Copia y ejecuta el Script 3 (Configurar RLS)</li>
              <li>Haz clic en "Verificar Tablas" para confirmar</li>
              <li>¡Listo! Regresa a la aplicación</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
