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
import type { Cliente } from "@/lib/types"

export default function NuevoClientePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    cliente_codigo: "",
    nombre: "",
    domicilio: "",
    telefono: "",
    cuil: "00-00000000-0",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.cliente_codigo || !formData.nombre || !formData.domicilio) {
      toast({
        title: "Error",
        description: "Los campos Código, Nombre y Domicilio son obligatorios",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const clientes = await Database.getClientes()

      const codigoExiste = clientes.some((c) => c.cliente_codigo === Number(formData.cliente_codigo))

      if (codigoExiste) {
        toast({
          title: "Error",
          description: "Ya existe un cliente con ese código",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const nuevoCliente: Omit<Cliente, "cliente_id"> = {
        cliente_codigo: Number(formData.cliente_codigo),
        nombre: formData.nombre,
        domicilio: formData.domicilio,
        telefono: formData.telefono || "",
        cuil: formData.cuil || "00-00000000-0",
      }

      const createdCliente = await Database.createCliente(nuevoCliente)

      if (createdCliente) {
        toast({
          title: "Cliente creado",
          description: "El cliente se ha registrado exitosamente",
        })
        router.push("/clientes")
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear el cliente",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating cliente:", error)
      toast({
        title: "Error",
        description: "Error al crear el cliente",
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
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 py-2">
          <Link href="/clientes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Nuevo Cliente</h1>
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
                <Label htmlFor="telefono">Teléfono (opcional)</Label>
                <Input
                  id="telefono"
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => handleChange("telefono", e.target.value)}
                  placeholder="Ingresa el teléfono"
                />
              </div>

              <div>
                <Label htmlFor="cuil">CUIL (opcional)</Label>
                <Input
                  id="cuil"
                  type="text"
                  value={formData.cuil}
                  onChange={(e) => handleChange("cuil", e.target.value)}
                  placeholder="XX-XXXXXXXX-X"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? "Guardando..." : "Guardar Cliente"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
