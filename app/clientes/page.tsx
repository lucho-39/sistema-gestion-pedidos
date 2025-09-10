"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Search, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/lib/database"
import type { Cliente } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    try {
      setIsLoading(true)
      const data = await Database.getClientes()
      setClientes(data)
    } catch (error) {
      console.error("Error loading clientes:", error)
      toast({
        title: "Error",
        description: "Error al cargar los clientes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteCliente = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
      return
    }

    try {
      await Database.deleteCliente(id)
      await loadClientes()
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente",
      })
    } catch (error) {
      console.error("Error deleting cliente:", error)
      toast({
        title: "Error",
        description: "Error al eliminar el cliente",
        variant: "destructive",
      })
    }
  }

  const filtered = clientes.filter(
    (cliente) =>
      (cliente.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cliente.CUIL || "").includes(searchTerm) ||
      (cliente.telefono || "").includes(searchTerm) ||
      (cliente.cliente_codigo || "").toString().includes(searchTerm),
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-3 py-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Clientes</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando clientes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Clientes</h1>
            <Badge variant="secondary">{clientes.length} total</Badge>
          </div>
          <Link href="/clientes/nuevo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Cliente
            </Button>
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nombre, CUIL, teléfono o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">
                {searchTerm
                  ? "No se encontraron clientes que coincidan con la búsqueda"
                  : "No hay clientes registrados"}
              </p>
              {!searchTerm && (
                <Link href="/clientes/nuevo">
                  <Button className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primer Cliente
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filtered.map((cliente) => (
              <Card key={cliente.cliente_id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{cliente.nombre}</CardTitle>
                      <p className="text-sm text-gray-500">Código: {cliente.cliente_codigo}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/clientes/editar/${cliente.cliente_id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCliente(cliente.cliente_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">CUIL</p>
                      <p className="font-medium">{cliente.CUIL || "No especificado"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Teléfono</p>
                      <p className="font-medium">{cliente.telefono || "No especificado"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Dirección</p>
                      <p className="font-medium">{cliente.direccion || "No especificada"}</p>
                    </div>
                  </div>
                  {cliente.observaciones && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-gray-500 text-xs">Observaciones</p>
                      <p className="text-sm">{cliente.observaciones}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {searchTerm && (
          <div className="text-center text-sm text-gray-500">
            Mostrando {filtered.length} de {clientes.length} clientes
          </div>
        )}
      </div>
    </div>
  )
}
