"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, Database, Settings, ExternalLink, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Database as DB } from "@/lib/database"
import { isSupabaseConfigured } from "@/lib/supabase"

export default function SetupPage() {
  const { toast } = useToast()
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})
  const [verificationResult, setVerificationResult] = useState<{
    configured: boolean
    tablesExist: boolean
    checking: boolean
  }>({
    configured: false,
    tablesExist: false,
    checking: false,
  })

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates((prev) => ({ ...prev, [key]: true }))
      toast({
        title: "Copiado",
        description: "Script copiado al portapapeles",
      })
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }))
      }, 2000)
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      })
    }
  }

  const verifySetup = async () => {
    setVerificationResult((prev) => ({ ...prev, checking: true }))

    try {
      const configured = isSupabaseConfigured()
      let tablesExist = false

      if (configured) {
        tablesExist = await DB.checkTablesExist()
      }

      setVerificationResult({
        configured,
        tablesExist,
        checking: false,
      })

      if (configured && tablesExist) {
        toast({
          title: "✅ Configuración completa",
          description: "La base de datos está configurada correctamente",
        })
      } else if (!configured) {
        toast({
          title: "⚠️ Variables de entorno faltantes",
          description: "Configure las variables de entorno de Supabase",
          variant: "destructive",
        })
      } else {
        toast({
          title: "⚠️ Tablas faltantes",
          description: "Ejecute los scripts SQL en Supabase",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error verifying setup:", error)
      setVerificationResult({
        configured: false,
        tablesExist: false,
        checking: false,
      })
      toast({
        title: "Error",
        description: "Error al verificar la configuración",
        variant: "destructive",
      })
    }
  }

  const createTablesScript = `-- Crear tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    proveedor_id SERIAL PRIMARY KEY,
    proveedor_nombre VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    articulo_numero SERIAL PRIMARY KEY,
    producto_codigo VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    unidad_medida VARCHAR(50) NOT NULL,
    proveedor_id INTEGER REFERENCES proveedores(proveedor_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de clientes
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

-- Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    pedido_id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(cliente_id) ON DELETE CASCADE,
    fecha_pedido DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de productos en pedidos
CREATE TABLE IF NOT EXISTS pedido_productos (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos(pedido_id) ON DELETE CASCADE,
    articulo_numero INTEGER REFERENCES productos(articulo_numero) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de reportes semanales
CREATE TABLE IF NOT EXISTS reportes_semanales (
    id SERIAL PRIMARY KEY,
    tipo_reporte VARCHAR(100) NOT NULL,
    fecha_corte DATE NOT NULL,
    datos JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_pedido ON pedido_productos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_productos_articulo ON pedido_productos(articulo_numero);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON reportes_semanales(fecha_corte);
CREATE INDEX IF NOT EXISTS idx_reportes_tipo ON reportes_semanales(tipo_reporte);`

  const seedDataScript = `-- Insertar proveedores de ejemplo
INSERT INTO proveedores (proveedor_nombre) VALUES 
('Proveedor A'),
('Proveedor B'),
('Proveedor C')
ON CONFLICT (proveedor_nombre) DO NOTHING;

-- Insertar productos de ejemplo
INSERT INTO productos (producto_codigo, descripcion, unidad_medida, proveedor_id) VALUES 
('PROD001', 'Producto de ejemplo 1', 'Unidad', 1),
('PROD002', 'Producto de ejemplo 2', 'Kilogramo', 2),
('PROD003', 'Producto de ejemplo 3', 'Litro', 3)
ON CONFLICT (producto_codigo) DO NOTHING;

-- Insertar clientes de ejemplo
INSERT INTO clientes (cliente_codigo, nombre, domicilio, telefono, cuil) VALUES 
(1001, 'Cliente Ejemplo 1', 'Dirección 123', '123-456-7890', '20-12345678-9'),
(1002, 'Cliente Ejemplo 2', 'Dirección 456', '098-765-4321', '20-87654321-0')
ON CONFLICT (cliente_codigo) DO NOTHING;`

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Configuración de Base de Datos</h1>
          <p className="text-gray-600">Configure su base de datos Supabase para usar el sistema</p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Importante:</strong> Debe completar todos los pasos para que el sistema funcione correctamente.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="env" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="env">1. Variables</TabsTrigger>
            <TabsTrigger value="tables">2. Tablas</TabsTrigger>
            <TabsTrigger value="data">3. Datos</TabsTrigger>
            <TabsTrigger value="verify">4. Verificar</TabsTrigger>
          </TabsList>

          <TabsContent value="env" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Paso 1: Configurar Variables de Entorno
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Instrucciones:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>
                      Vaya a su proyecto en{" "}
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Supabase Dashboard <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                    <li>Navegue a Settings → API</li>
                    <li>Copie la URL del proyecto y la clave anónima</li>
                    <li>Configure las variables de entorno en Vercel:</li>
                  </ol>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm">Variables de Entorno</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          `NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`,
                          "env",
                        )
                      }
                    >
                      {copiedStates.env ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <pre className="text-xs overflow-x-auto">
                    {`NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`}
                  </pre>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>En Vercel:</strong> Vaya a Project Settings → Environment Variables y agregue estas
                    variables.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Paso 2: Crear Tablas de Base de Datos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Instrucciones:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Vaya a su proyecto en Supabase Dashboard</li>
                    <li>Navegue a SQL Editor</li>
                    <li>Copie y pegue el siguiente script</li>
                    <li>Haga clic en "Run" para ejecutar</li>
                  </ol>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm">Script de Creación de Tablas</span>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(createTablesScript, "tables")}>
                      {copiedStates.tables ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <pre className="text-xs overflow-x-auto max-h-64">{createTablesScript}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Paso 3: Insertar Datos de Ejemplo (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Instrucciones:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>En el SQL Editor de Supabase</li>
                    <li>Copie y pegue el siguiente script</li>
                    <li>Haga clic en "Run" para ejecutar</li>
                  </ol>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm">Script de Datos de Ejemplo</span>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(seedDataScript, "seed")}>
                      {copiedStates.seed ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <pre className="text-xs overflow-x-auto max-h-64">{seedDataScript}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verify" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Paso 4: Verificar Configuración
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <Button onClick={verifySetup} disabled={verificationResult.checking} className="w-full">
                    {verificationResult.checking ? "Verificando..." : "Verificar Configuración"}
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Variables de Entorno</span>
                      <Badge variant={verificationResult.configured ? "default" : "destructive"}>
                        {verificationResult.configured ? "✅ Configuradas" : "❌ Faltantes"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Tablas de Base de Datos</span>
                      <Badge variant={verificationResult.tablesExist ? "default" : "destructive"}>
                        {verificationResult.tablesExist ? "✅ Creadas" : "❌ Faltantes"}
                      </Badge>
                    </div>
                  </div>

                  {verificationResult.configured && verificationResult.tablesExist && (
                    <Alert>
                      <Check className="h-4 w-4" />
                      <AlertDescription>
                        <strong>¡Configuración completa!</strong> Su sistema está listo para usar. Puede navegar a
                        cualquier sección de la aplicación.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <Button asChild>
            <a href="/">Volver al Inicio</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
