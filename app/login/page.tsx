"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"

/**
 * Traduce el error de Supabase a algo accionable.
 *
 * Un mensaje generico esconde causas muy distintas: credenciales mal escritas,
 * un usuario sin confirmar, o un proyecto mal apuntado en las variables de
 * entorno. Mostrar el motivo real ahorra tiempo de diagnostico.
 */
function traducirError(mensaje: string): string {
  const m = mensaje.toLowerCase()

  if (m.includes("invalid login credentials")) {
    return "Email o contraseña incorrectos."
  }
  if (m.includes("email not confirmed")) {
    return "El usuario existe pero el email no está confirmado. Confirmalo desde Supabase → Authentication → Users."
  }
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("load failed")) {
    return "No se pudo conectar con Supabase. Puede ser la conexión, o que la URL del proyecto esté mal configurada."
  }
  return `Error de ingreso: ${mensaje}`
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const configurado = isSupabaseConfigured()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

      if (signInError) {
        setError(traducirError(signInError.message))
        return
      }

      router.replace("/")
    } catch (err) {
      setError(traducirError(err instanceof Error ? err.message : String(err)))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background p-4">
      <Image
        src="/logo.png"
        alt="Punto Ferretero"
        width={378}
        height={561}
        className="h-28 w-auto"
        priority
      />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Ingreso</CardTitle>
          <CardDescription className="font-bold text-foreground">Punto Ferretero</CardDescription>
        </CardHeader>
        <CardContent>
          {!configurado ? (
            <p className="text-sm text-red-600">
              Faltan las credenciales de Supabase. Configurá <code>.env.local</code> antes de ingresar.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
