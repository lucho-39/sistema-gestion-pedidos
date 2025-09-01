"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Database, Play, CheckCircle, AlertCircle, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Database as DB } from "@/lib/database"

const CREATE_TABLES_SQL = `-- Crear extensión para UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    proveedor_id INTEGER PRIMARY KEY,
    proveedor_nombre VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    articulo_numero INTEGER PRIMARY KEY,
    producto_codigo VARCHAR(255) DEFAULT '',
    descripcion TEXT NOT NULL,
    unidad_medida VARCHAR(50) NOT NULL DEFAULT 'unidad',
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(proveedor_id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    cliente_id SERIAL PRIMARY KEY,
    cliente_codigo INTEGER NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    domicilio TEXT NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    cuil VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    pedido_id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(cliente_id) ON DELETE RESTRICT,
    fecha_pedido DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla intermedia para productos en pedidos
CREATE TABLE IF NOT EXISTS pedido_productos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(pedido_id) ON DELETE CASCADE,
    articulo_numero INTEGER NOT NULL REFERENCES productos(articulo_numero) ON DELETE RESTRICT,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para reportes semanales (cache)
CREATE TABLE IF NOT EXISTS reportes_semanales (
    id SERIAL PRIMARY KEY,
    tipo_reporte VARCHAR(50) NOT NULL,
    fecha_corte TIMESTAMP WITH TIME ZONE NOT NULL,
    datos JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_productos_descripcion ON productos USING gin(to_tsvector('spanish', descripcion));
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_pedido ON pedido_productos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_articulo ON pedido_productos(articulo_numero);
CREATE INDEX IF NOT EXISTS idx_reportes_tipo_fecha ON reportes_semanales(tipo_reporte, fecha_corte);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON proveedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`

const SEED_DATA_SQL = `-- Insertar proveedores iniciales
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
(2002, 'LUZ-001', 'Lámpara LED 9W', 'unidad', 1200)
ON CONFLICT (articulo_numero) DO NOTHING;

-- Insertar algunos clientes de ejemplo
INSERT INTO clientes (cliente_codigo, nombre, domicilio, telefono, cuil) VALUES
(101, 'Juan Pérez', 'Av. Corrientes 1234, CABA', '11-4567-8901', '20-12345678-9'),
(102, 'María González', 'San Martín 567, La Plata', '221-456-7890', '27-87654321-3'),
(103, 'Carlos López', 'Belgrano 890, Rosario', '341-234-5678', '20-11223344-5')
ON CONFLICT (cliente_codigo) DO NOTHING;`

export default function SetupPage() {
  const [isChecking, setIsChecking] = useState(false)
  const [tablesStatus, setTablesStatus] = useState<{ exists: boolean; missingTables: string[] } | null>(null)
  const { toast } = useToast()

  const checkTables = async () => {
    setIsChecking(true)
    try {
      const status = await DB.checkTablesExist()
      setTablesStatus(status)

      if (status.exists) {
        toast({
          title: "✅ Base de datos configurada",
          description: "Todas las tablas están creadas correctamente",
        })
      } else {
        toast({
          title: "⚠️ Configuración pendiente",
          description: `Faltan ${status.missingTables.length} tabla(s): ${status.missingTables.join(", ")}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error checking tables:", error)
      toast({
        title: "Error",
        description: "Error al verificar las tablas de la base de datos",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado",
      description: "SQL copiado al portapapeles",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
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
            <strong>Configuración requerida:</strong> Antes de usar la aplicación, necesitas ejecutar los scripts SQL en
            tu base de datos Supabase para crear las tablas necesarias.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Verificar Estado de la Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={checkTables} disabled={isChecking} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              {isChecking ? "Verificando..." : "Verificar Tablas"}
            </Button>

            {tablesStatus && (
              <Alert variant={tablesStatus.exists ? "default" : "destructive"}>
                {tablesStatus.exists ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertDescription>
                  {tablesStatus.exists ? (
                    <div>
                      <strong>✅ Base de datos configurada correctamente</strong>
                      <p className="mt-2">
                        Todas las tablas necesarias están creadas. Puedes usar la aplicación normalmente.
                      </p>
                      <Link href="/" className="inline-block mt-3">
                        <Button>Ir al Inicio</Button>
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <strong>⚠️ Configuración pendiente</strong>
                      <p className="mt-2">
                        Faltan las siguientes tablas: <code>{tablesStatus.missingTables.join(", ")}</code>
                      </p>
                      <p className="mt-2">Ejecuta los scripts SQL a continuación en tu base de datos Supabase.</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paso 1: Crear Tablas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Ejecuta este script en el <strong>SQL Editor</strong> de tu dashboard de Supabase:
            </p>

            <div className="relative">
              <Textarea value={CREATE_TABLES_SQL} readOnly className="font-mono text-xs h-64 resize-none" />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 bg-transparent"
                onClick={() => copyToClipboard(CREATE_TABLES_SQL)}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paso 2: Datos Iniciales (Opcional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Ejecuta este script para agregar datos de ejemplo (proveedores, productos y clientes):
            </p>

            <div className="relative">
              <Textarea value={SEED_DATA_SQL} readOnly className="font-mono text-xs h-48 resize-none" />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 bg-transparent"
                onClick={() => copyToClipboard(SEED_DATA_SQL)}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instrucciones Detalladas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <div>
                  <p className="font-medium">Accede a tu proyecto Supabase</p>
                  <p className="text-gray-600">
                    Ve a{" "}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      supabase.com/dashboard
                    </a>{" "}
                    y selecciona tu proyecto.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <div>
                  <p className="font-medium">Abre el SQL Editor</p>
                  <p className="text-gray-600">En el menú lateral, haz clic en "SQL Editor".</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <div>
                  <p className="font-medium">Ejecuta el script de creación</p>
                  <p className="text-gray-600">Copia y pega el script del "Paso 1" en el editor y haz clic en "Run".</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <div>
                  <p className="font-medium">Ejecuta los datos iniciales (opcional)</p>
                  <p className="text-gray-600">Si quieres datos de ejemplo, ejecuta también el script del "Paso 2".</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <div>
                  <p className="font-medium">Verifica la configuración</p>
                  <p className="text-gray-600">
                    Vuelve a esta página y haz clic en "Verificar Tablas" para confirmar que todo está configurado.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Variables de Entorno</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Asegúrate de tener configuradas estas variables de entorno en tu archivo <code>.env.local</code>:
            </p>
            <div className="bg-gray-100 p-3 rounded font-mono text-xs">
              <div>NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
