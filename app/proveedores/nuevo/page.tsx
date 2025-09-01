"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/lib/database"
import type { Proveedor } from "@/lib/types"

export default function NuevoProveedorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    proveedor_id: "",
    proveedor_nombre: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.proveedor_id || !formData.proveedor_nombre) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const proveedores = await Database.getProveedores()

      // Verificar si el ID ya existe
      const idExiste = proveedores.some((p) => p.proveedor_id === Number(formData.proveedor_id))

      if (idExiste) {
        toast({
          title: "Error",
          description: "Ya existe un proveedor con ese ID",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Verificar si el nombre ya existe
      const nombreExiste = proveedores.some(
        (p) => p.proveedor_nombre.toLowerCase() === formData.proveedor_nombre.toLowerCase(),
      )

      if (nombreExiste) {
        toast({
          title: "Error",
          description: "Ya existe un proveedor con ese nombre",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const nuevoProveedor: Proveedor = {
        proveedor_id: Number(formData.proveedor_id),
        proveedor_nombre: formData.proveedor_nombre.trim(),
      }

      const createdProveedor = await Database.createProveedor(nuevoProveedor)

      if (createdProveedor) {
        toast({
          title: "Proveedor creado",
          description: "El proveedor se ha registrado exitosamente",
        })
        router.push("/proveedores")
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear el proveedor",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating proveedor:", error)
      toast({
        title: "Error",
        description: "Error al crear el proveedor",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 py-2">
          <Link href="/proveedores">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Nuevo Proveedor</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Proveedor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="proveedor_id">ID del Proveedor *</Label>
                <Input
                  id="proveedor_id"
                  type="number"
                  value={formData.proveedor_id}
                  onChange={(e) => handleChange("proveedor_id", e.target.value)}
                  placeholder="Ej: 300"
                />
              </div>

              <div>
                <Label htmlFor="proveedor_nombre">Nombre del Proveedor *</Label>
                <Input
                  id="proveedor_nombre"
                  value={formData.proveedor_nombre}
                  onChange={(e) => handleChange("proveedor_nombre", e.target.value)}
                  placeholder="Ej: CAELBI"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Guardando..." : "Guardar Proveedor"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Proveedores Predefinidos</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-600">
            <div className="grid grid-cols-2 gap-2">
              <div>300 - CAELBI</div>
              <div>400 - DABOR</div>
              <div>500 - EMANAL</div>
              <div>1000 - JELUZ</div>
              <div>1100 - KALOPS</div>
              <div>1200 - LORD</div>
              <div>1800 - SERRA</div>
              <div>2300 - WERKE</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
