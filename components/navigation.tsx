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

      {/* Mobile Navigation - Top Bar */}
      {/* UNA fila con scroll horizontal: con 8 secciones, dos filas se comian
          un sexto de la pantalla. Se desliza para ver las que quedan afuera. */}
      <nav className="md:hidden sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="flex overflow-x-auto">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex shrink-0 flex-col items-center justify-center gap-0.5 px-4 py-2 text-xs transition-colors active:scale-95 touch-manipulation",
                  isActive(item.href)
                    ? "bg-brand-100 font-semibold text-brand-700"
                    : "text-foreground/75 hover:bg-brand-100",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={cerrarSesion}
            className="flex shrink-0 flex-col items-center justify-center gap-0.5 px-4 py-2 text-xs text-foreground/75 transition-colors hover:bg-brand-100 active:scale-95 touch-manipulation"
          >
            <LogOut className="h-5 w-5" />
            <span>Salir</span>
          </button>
        </div>
      </nav>
    </>
  )
}
