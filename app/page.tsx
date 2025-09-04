import Link from "next/link"
import { Package, Users, ShoppingCart, BarChart3, Upload, Plus, Truck, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function HomePage() {
  return (
    <div className="p-4 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h1>
          <p className="text-gray-600">Administra productos, clientes y pedidos</p>
        </div>
         {/*
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            <strong>Primera vez usando la aplicación?</strong> Necesitas configurar la base de datos primero.{" "}
            <Link href="/setup" className="text-blue-600 hover:underline font-medium">
              Ir a Configuración →
            </Link>
          </AlertDescription>
        </Alert>
        */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-blue-600" />
                Productos
              </CardTitle>
              <CardDescription>Gestiona tu productos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/productos" className="block">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Ver Productos
                </Button>
              </Link>
              <Link href="/productos/importar" className="block">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Excel
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-indigo-600" />
                Proveedores
              </CardTitle>
              <CardDescription>Administra tu base de proveedores</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/proveedores" className="block">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Truck className="h-4 w-4 mr-2" />
                  Gestionar Proveedores
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-green-600" />
                Clientes
              </CardTitle>
              <CardDescription>Administra tus clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/clientes" className="block">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Gestionar Clientes
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
                Pedidos
              </CardTitle>
              <CardDescription>Registra y modifica pedidos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/pedidos" className="block">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ver Pedidos
                </Button>
              </Link>
              <Link href="/nuevo/pedidos" className="block">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Pedido
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Reportes
              </CardTitle>
              <CardDescription>Consulta reportes semanales</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/reportes" className="block">
                <Button className="w-full justify-start bg-transparent" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Reportes
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Accesos Rápidos</CardTitle>
              <CardDescription>Funciones más utilizadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/setup" className="block">
                <Button className="w-full justify-start bg-transparent" variant="outline" size="sm">
                  <Database className="h-4 w-4 mr-2" />
                  Configurar BD
                </Button>
              </Link>
              <Link href="/pedidos/nuevo" className="block">
                <Button className="w-full justify-start bg-transparent" variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Pedido
                </Button>
              </Link>
              <Link href="/productos/nuevo" className="block">
                <Button className="w-full justify-start bg-transparent" variant="outline" size="sm">
                  <Package className="h-4 w-4 mr-2" />
                  Nuevo Producto
                </Button>
              </Link>
              <Link href="/clientes/nuevo" className="block">
                <Button className="w-full justify-start bg-transparent" variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Nuevo Cliente
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
