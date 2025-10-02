"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, Users, Truck, ShoppingCart, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const navigationItems = [
  {
    name: "Inicio",
    href: "/",
    icon: Home,
  },
  {
    name: "Productos",
    href: "/productos",
    icon: Package,
  },
  {
    name: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    name: "Proveedores",
    href: "/proveedores",
    icon: Truck,
  },
  {
    name: "Pedidos",
    href: "/pedidos",
    icon: ShoppingCart,
  },
  {
    name: "Reportes",
    href: "/reportes",
    icon: BarChart3,
  },
]

export function Navigation() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop Navigation - Top Bar */}
      <nav className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Package className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Sistema de Gestión</span>
              </Link>
            </div>
            <div className="flex space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom shadow-lg">
        <div className="grid grid-cols-6 h-20">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 transition-colors active:scale-95 touch-manipulation",
                  isActive(item.href)
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-[10px] font-medium leading-tight">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile Bottom Padding - Updated height to match navigation */}
      <div className="md:hidden h-20" />
    </>
  )
}
