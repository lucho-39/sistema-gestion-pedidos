"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/lib/database"
import type { Proveedor } from "@/lib/types"

export default function EditarProveedorPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [proveedor, setProveedor] = useState<Proveedor | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    proveedor_id: "",
    proveedor_nombre: "",
  })

  useEffect(() => {
    const loadProveedor = async () => {
      try {
        setIsLoading(true)
        const proveedores = await Database.getProveedores()
        const proveedorEncontrado = proveedores.find((p) => p.proveedor_id === Number(params.id))

        if (proveedorEncontrado) {
          setProveedor(proveedorEncontrado)
          setFormData({
            proveedor_id: proveedorEncontrado.proveedor_id.toString(),
            proveedor_nombre: proveedorEncontrado.proveedor_nombre,
          })
        } else {
          toast({
            title: "Error",
            description: "Proveedor no encontrado",
            variant: "destructive",
          })
          router.push("/proveedores")
        }
      } catch (error) {
        console.error("Error loading proveedor:", error)
        toast({
          title: "Error",
          description: "Error al cargar el proveedor",
          variant: "destructive",
        })
        router.push("/proveedores")
      } finally {
        setIsLoading(false)
      }
    }

    loadProveedor()
  }, [params.id, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.proveedor_nombre) {
      toast({
        title: "Error",
        description: "El nombre del proveedor es obligatorio",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const proveedores = await Database.getProveedores()

      // Verificar si el nombre ya existe (excluyendo el actual)
      const nombreExiste = proveedores.some(
        (p) =>
          p.proveedor_nombre.toLowerCase() === formData.proveedor_nombre.toLowerCase() &&
          p.proveedor_id !== Number(params.id),
      )

      if (nombreExiste) {
        toast({
          title: "Error",
          description: "Ya existe un proveedor con ese nombre",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      const updates: Partial<Proveedor> = {
        proveedor_nombre: formData.proveedor_nombre.trim(),
      }

      const success = await Database.updateProveedor(Number(params.id), updates)

      if (success) {
        toast({
          title: "Proveedor actualizado",
          description: "Los cambios se han guardado exitosamente",
        })
        router.push("/proveedores")
      } else {
        toast({
          title: "Error",
          description: "No se pudieron guardar los cambios",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating proveedor:", error)
      toast({
        title: "Error",
        description: "Error al actualizar el proveedor",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <p className="text-center py-8">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!proveedor) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <p className="text-center py-8">Proveedor no encontrado</p>
        </div>
      </div>
    )
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
          <h1 className="text-xl font-bold">Editar Proveedor</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Proveedor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="proveedor_id">ID del Proveedor</Label>
                <Input id="proveedor_id" type="number" value={formData.proveedor_id} disabled className="bg-gray-100" />
                <p className="text-xs text-gray-500 mt-1">El ID del proveedor no se puede modificar</p>
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

              <Button type="submit" disabled={isSaving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
