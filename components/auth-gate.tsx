"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"
import { Navigation } from "@/components/navigation"

type Estado = "verificando" | "sin-sesion" | "con-sesion"

/**
 * Verifica la sesión y redirige al login cuando no hay ninguna.
 *
 * OJO: esto es solo experiencia de usuario. La seguridad real la da RLS en la
 * base: un cliente sin sesión recibe un JWT anónimo y las políticas no le
 * permiten leer ni escribir. Aunque alguien saltee esta pantalla, no puede
 * acceder a los datos.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [estado, setEstado] = useState<Estado>("verificando")

  const esLogin = pathname === "/login"
  const configurado = isSupabaseConfigured()

  useEffect(() => {
    // Sin credenciales (build de CI, entorno sin configurar) no hay sesión posible.
    if (!configurado) {
      setEstado("con-sesion")
      return
    }

    let activo = true

    supabase.auth.getSession().then(({ data }) => {
      if (activo) setEstado(data.session ? "con-sesion" : "sin-sesion")
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, session) => {
      setEstado(session ? "con-sesion" : "sin-sesion")
    })

    return () => {
      activo = false
      sub.subscription.unsubscribe()
    }
  }, [configurado])

  useEffect(() => {
    if (estado === "sin-sesion" && !esLogin) router.replace("/login")
    if (estado === "con-sesion" && esLogin) router.replace("/")
  }, [estado, esLogin, router])

  // Sin Supabase configurado no se puede autenticar: se muestra tal cual.
  if (!configurado) return <>{children}</>

  if (esLogin) return <>{children}</>

  if (estado !== "con-sesion") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        {estado === "verificando" ? "Verificando sesión..." : "Redirigiendo al ingreso..."}
      </div>
    )
  }

  return (
    <>
      <Navigation />
      {/* text-white: todo lo que va directo sobre el lienzo teal. Las tarjetas
          se protegen solas con text-card-foreground, asi que su texto sigue oscuro.
          Sin relleno abajo: la barra mobile ahora va arriba y es sticky. */}
      <main className="min-h-screen bg-background">{children}</main>
    </>
  )
}
