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
import type { Cliente } from "@/lib/types"

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    cliente_codigo: "",
    nombre: "",
    domicilio: "",
    telefono: "",
    CUIL: "",
  })

  useEffect(() => {
    const loadCliente = async () => {
      try {
        setIsLoading(true)
        const clientes = await Database.getClientes()
        const clienteEncontrado = clientes.find((c) => c.cliente_id === Number(params.id))

        if (clienteEncontrado) {
          setCliente(clienteEncontrado)
          setFormData({
            cliente_codigo: clienteEncontrado.cliente_codigo?.toString() || "",
            nombre: clienteEncontrado.nombre,
            domicilio: clienteEncontrado.domicilio,
            telefono: clienteEncontrado.telefono,
            CUIL: clienteEncontrado.CUIL,
          })
        } else {
          toast({
            title: "Error",
            description: "Cliente no encontrado",
            variant: "destructive",
          })
          router.push("/clientes")
        }
      } catch (error) {
        console.error("Error loading cliente:", error)
        toast({
          title: "Error",
          description: "Error al cargar el cliente",
          variant: "destructive",
        })
        router.push("/clientes")
      } finally {
        setIsLoading(false)
      }
    }

    loadCliente()
  }, [params.id, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.cliente_codigo || !formData.nombre || !formData.domicilio || !formData.telefono || !formData.CUIL) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Verificar si el código de cliente ya existe (excluyendo el actual)
      const clientes = await Database.getClientes()
      const codigoExiste = clientes.some(
        (c) => c.cliente_codigo === Number(formData.cliente_codigo) && c.cliente_id !== Number(params.id),
      )

      if (codigoExiste) {
        toast({
          title: "Error",
          description: "Ya existe un cliente con ese código",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      const updates: Partial<Cliente> = {
        cliente_codigo: Number(formData.cliente_codigo),
        nombre: formData.nombre,
        domicilio: formData.domicilio,
        telefono: formData.telefono,
        CUIL: formData.CUIL,
      }

      const success = await Database.updateCliente(Number(params.id), updates)

      if (success) {
        toast({
          title: "Cliente actualizado",
          description: "Los cambios se han guardado exitosamente",
        })
        router.push("/clientes")
      } else {
        toast({
          title: "Error",
          description: "No se pudieron guardar los cambios",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating cliente:", error)
      toast({
        title: "Error",
        description: "Error al actualizar el cliente",
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

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <p className="text-center py-8">Cliente no encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 py-2">
          <Link href="/clientes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Editar Cliente</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="cliente_codigo">Código de Cliente *</Label>
                <Input
                  id="cliente_codigo"
                  type="number"
                  value={formData.cliente_codigo}
                  onChange={(e) => handleChange("cliente_codigo", e.target.value)}
                  placeholder="Código numérico del cliente"
                />
              </div>

              <div>
                <Label htmlFor="nombre">Nombre completo *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  placeholder="Ingresa el nombre completo"
                />
              </div>

              <div>
                <Label htmlFor="domicilio">Domicilio *</Label>
                <Input
                  id="domicilio"
                  value={formData.domicilio}
                  onChange={(e) => handleChange("domicilio", e.target.value)}
                  placeholder="Ingresa la dirección"
                />
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  placeholder="Ingresa el teléfono"
                />
              </div>

              <div>
                <Label htmlFor="cuil">CUIL *</Label>
                <Input
                  id="cuil"
                  value={formData.CUIL}
                  onChange={(e) => handleChange("CUIL", e.target.value)}
                  placeholder="XX-XXXXXXXX-X"
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
