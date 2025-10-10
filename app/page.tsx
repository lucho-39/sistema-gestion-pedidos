"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  Users,
  ShoppingCart,
  FileText,
  TrendingUp,
  Building2,
  PlusCircle,
  Upload,
  Calendar,
} from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  const mainActions = [
    {
      title: "Productos",
      description: "Gestionar catálogo de productos",
      icon: Package,
      href: "/productos",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      actions: [
        { label: "Nuevo Producto", icon: PlusCircle, href: "/productos/nuevo" },
        { label: "Importar Excel", icon: Upload, href: "/productos/importar" },
      ],
    },
    {
      title: "Clientes",
      description: "Administrar base de clientes",
      icon: Users,
      href: "/clientes",
      color: "text-green-600",
      bgColor: "bg-green-50",
      actions: [
        { label: "Nuevo Cliente", icon: PlusCircle, href: "/clientes/nuevo" },
        { label: "Importar Excel", icon: Upload, href: "/clientes/importar" },
      ],
    },
    {
      title: "Proveedores",
      description: "Gestionar proveedores",
      icon: Building2,
      href: "/proveedores",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      actions: [{ label: "Nuevo Proveedor", icon: PlusCircle, href: "/proveedores/nuevo" }],
    },
    {
      title: "Pedidos",
      description: "Gestionar pedidos de clientes",
      icon: ShoppingCart,
      href: "/pedidos",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      actions: [{ label: "Nuevo Pedido", icon: PlusCircle, href: "/pedidos/nuevo" }],
    },
    {
      title: "Reportes",
      description: "Generar y ver reportes",
      icon: FileText,
      href: "/reportes",
      color: "text-red-600",
      bgColor: "bg-red-50",
      actions: [{ label: "Ver Reportes", icon: Calendar, href: "/reportes" }],
    },
  ]

  const stats = [
    { label: "Productos", value: "0", icon: Package, color: "text-blue-600" },
    { label: "Clientes", value: "0", icon: Users, color: "text-green-600" },
    { label: "Pedidos", value: "0", icon: ShoppingCart, color: "text-orange-600" },
    { label: "Reportes", value: "0", icon: FileText, color: "text-red-600" },
  ]

  return (
    <div className="w-full max-w-full min-h-screen overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">
      <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold truncate">Panel de Control</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Sistema de Gestión de Inventario y Pedidos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 sm:w-10 sm:h-10 ${stat.color} flex-shrink-0`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Actions */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">Acciones Rápidas</h2>
          <div className="flex flex-wrap gap-3">
            {mainActions.map((action, index) => (
              <Card
                key={index}
                className="w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)] overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(action.href)}
              >
                <CardHeader className="space-y-3">
                  <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center`}>
                    <action.icon className={`w-6 h-6 ${action.color}`} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">{action.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm truncate">{action.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {action.actions.map((subAction, subIndex) => (
                    <Button
                      key={subIndex}
                      variant="outline"
                      className="w-full h-10 sm:h-11 justify-start bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(subAction.href)
                      }}
                    >
                      <subAction.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{subAction.label}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">Información del Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Estado del Sistema</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Operativo</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Última Actualización</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{new Date().toLocaleDateString("es-AR")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
