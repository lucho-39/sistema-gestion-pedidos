import Link from "next/link"
import { Package, Users, Truck, ShoppingCart, BarChart3, FileSpreadsheet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const modules = [
  {
    title: "Productos",
    description: "Gestiona tu inventario de productos",
    icon: Package,
    href: "/productos",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Clientes",
    description: "Administra la información de tus clientes",
    icon: Users,
    href: "/clientes",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    title: "Proveedores",
    description: "Mantén un registro de tus proveedores",
    icon: Truck,
    href: "/proveedores",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "Pedidos",
    description: "Crea y gestiona pedidos de clientes",
    icon: ShoppingCart,
    href: "/pedidos",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    title: "Reportes",
    description: "Genera reportes automáticos y manuales",
    icon: BarChart3,
    href: "/reportes",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  {
    title: "Importar Productos",
    description: "Importa productos desde Excel",
    icon: FileSpreadsheet,
    href: "/productos/importar",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">Sistema de Gestión</h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Administra productos, clientes, proveedores, pedidos y reportes desde un solo lugar
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.href} href={module.href} className="group">
                <Card className="h-full transition-all duration-200 hover:shadow-xl hover:-translate-y-1 active:scale-95 touch-manipulation">
                  <CardHeader className="pb-3 md:pb-4">
                    <div
                      className={`w-12 h-12 md:w-14 md:h-14 ${module.bgColor} rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className={`w-6 h-6 md:w-7 md:h-7 ${module.color}`} />
                    </div>
                    <CardTitle className="text-lg md:text-xl">{module.title}</CardTitle>
                    <CardDescription className="text-sm md:text-base">{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="ghost"
                      className="w-full group-hover:bg-gray-100 text-sm md:text-base h-10 md:h-11"
                    >
                      Abrir módulo →
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 md:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Total Productos</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">--</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Total Clientes</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">--</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Pedidos Activos</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">--</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader className="pb-2 md:pb-3">
              <CardDescription className="text-xs md:text-sm">Proveedores</CardDescription>
              <CardTitle className="text-2xl md:text-3xl">--</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
