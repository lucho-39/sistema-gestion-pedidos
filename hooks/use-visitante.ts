"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Devuelve true cuando la sesion activa es de un VISITANTE (login anonimo).
 *
 * OJO: esto es solo para la interfaz. La restriccion real la aplica RLS en la
 * base de datos, asi que esconder un boton aca es comodidad, no seguridad.
 * Aunque alguien saltee la pantalla, el servidor le va a rechazar la escritura.
 */
export function useVisitante(): boolean {
  const [visitante, setVisitante] = useState(false)

  useEffect(() => {
    let activo = true

    const leer = () => {
      supabase.auth
        .getUser()
        .then(({ data }) => {
          if (activo) setVisitante(Boolean(data.user?.is_anonymous))
        })
        .catch(() => {
          if (activo) setVisitante(false)
        })
    }

    leer()
    const { data: sub } = supabase.auth.onAuthStateChange(leer)

    return () => {
      activo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return visitante
}
