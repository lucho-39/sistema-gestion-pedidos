"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useVisitante } from "@/hooks/use-visitante"

const opciones = [
  { nombre: "Productos", href: "/productos/importar", icon: Package },
  { nombre: "Clientes", href: "/clientes/importar", icon: Users, soloReales: true },
]

/**
 * Pestanas para elegir que se importa, desde cualquiera de las dos pantallas.
 * El visitante no ve la de clientes: no tiene acceso a esos datos.
 */
export function ImportarTabs() {
  const pathname = usePathname()
  const visitante = useVisitante()

  const visibles = visitante ? opciones.filter((o) => !o.soloReales) : opciones

  return (
    <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
      {visibles.map((opcion) => {
        const activo = pathname === opcion.href
        const Icon = opcion.icon
        return (
          <Link
            key={opcion.href}
            href={opcion.href}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activo ? "bg-primary text-primary-foreground" : "text-foreground/75 hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {opcion.nombre}
          </Link>
        )
      })}
    </div>
  )
}
