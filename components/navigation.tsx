"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Home, Package, Users, Truck, ShoppingCart, BarChart3, TrendingUp, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useVisitante } from "@/hooks/use-visitante"

// soloReales: secciones que el visitante no puede usar (no solo escribir:
// directamente no tiene acceso a esos datos).
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
    soloReales: true,
  },
  {
    name: "Proveedores",
    href: "/proveedores",
    icon: Truck,
    soloReales: true,
  },
  {
    name: "Pedidos",
    href: "/pedidos",
    icon: ShoppingCart,
    soloReales: true,
  },
  {
    name: "Estadísticas",
    href: "/estadisticas",
    icon: TrendingUp,
    soloReales: true,
  },
  {
    name: "Reportes",
    href: "/reportes",
    icon: BarChart3,
    soloReales: true,
  },
]

export function Navigation() {
  const pathname = usePathname()
  const visitante = useVisitante()

  // El visitante solo ve las secciones a las que tiene acceso.
  const items = visitante ? navigationItems.filter((item) => !item.soloReales) : navigationItems

  const cerrarSesion = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      // Si el servidor no responde, el usuario quedaria atrapado adentro.
      // Limpiamos al menos la sesion local.
      console.error("Error al cerrar sesión, limpiando la sesión local:", error)
      try {
        await supabase.auth.signOut({ scope: "local" })
      } catch (errorLocal) {
        console.error("Tampoco se pudo limpiar la sesión local:", errorLocal)
      }
    }

    // Recarga completa en vez de navegacion del router: garantiza que la app
    // relea la sesion desde cero y no quede el estado viejo en memoria.
    window.location.href = "/login"
  }

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop Navigation - Top Bar */}
      <nav className="hidden md:block bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/logo.png"
                  alt="Punto Ferretero"
                  width={378}
                  height={561}
                  className="h-10 w-auto"
                  priority
                />
                <span className="text-xl font-bold text-foreground">Punto Ferretero</span>
              </Link>
            </div>
            <div className="flex space-x-8">
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-brand-100 text-brand-700"
                        : "text-foreground/75 hover:text-foreground hover:bg-brand-100",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              <button
                type="button"
                onClick={cerrarSesion}
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-foreground/75 hover:text-foreground hover:bg-brand-100 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom Bar */}
      {/* 7 items + Salir = 8: entran justo en 4 columnas x 2 filas */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom shadow-lg">
        <div className="grid grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 py-2 transition-colors active:scale-95 touch-manipulation",
                  isActive(item.href)
                    ? "text-brand-700 bg-brand-50"
                    : "text-foreground/75 hover:text-foreground hover:bg-brand-100",
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-[10px] font-medium leading-tight">{item.name}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={cerrarSesion}
            className="flex flex-col items-center justify-center space-y-1 py-2 text-muted-foreground transition-colors active:scale-95 touch-manipulation hover:text-foreground hover:bg-accent"
          >
            <LogOut className="h-6 w-6" />
            <span className="text-[10px] font-medium leading-tight">Salir</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Padding - altura de la barra de dos filas */}
      <div className="md:hidden h-32" />
    </>
  )
}
