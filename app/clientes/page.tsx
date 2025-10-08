"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, Search, Edit, Trash2, Phone, MapPin, Database, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database as DB } from "@/lib/database"
import type { Cliente } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadClientes = async () => {
      try {
        setIsLoading(true)
        setNeedsSetup(false)
        const loadedClientes = await DB.getClientes()
        setClientes(loadedClientes)
        setFilteredClientes(loadedClientes)
      } catch (error) {
        console.error("Error loading clientes:", error)
        if (error instanceof Error && error.message.includes("Database tables not found")) {
          setNeedsSetup(true)
        } else {
          toast({
            title: "Error",
            description: "Error al cargar los clientes",
            variant: "destructive",
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadClientes()
  }, [toast])

  useEffect(() => {
    const filtered = clientes.filter(
      (cliente) =>
        (cliente.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cliente.cuil || "").includes(searchTerm) ||
        (cliente.telefono || "").includes(searchTerm) ||
        (cliente.cliente_codigo || "").toString().includes(searchTerm),
    )
    setFilteredClientes(filtered)
  }, [searchTerm, clientes])

  const handleDelete = async (clienteId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
      return
    }

    try {
      const success = await DB.deleteCliente(clienteId)
      if (success) {
        const updatedClientes = clientes.filter((c) => c.cliente_id !== clienteId)
        setClientes(updatedClientes)
        toast({
          title: "Cliente eliminado",
          description: "El cliente se ha eliminado exitosamente",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el cliente",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting cliente:", error)
      toast({
        title: "Error",
        description: "Error al eliminar el cliente",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-4">
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

  if (needsSetup) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-3 py-2">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Clientes</h1>
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Base de datos no configurada</strong>
              <p className="mt-2">
                Las tablas de la base de datos no existen. Necesitas ejecutar los scripts de configuración primero.
              </p>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Configuración Requerida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Para gestionar clientes, primero debes configurar la base de datos ejecutando los scripts SQL en tu
                proyecto Supabase.
              </p>

              <div className="space-y-2">
                <Link href="/setup" className="block">
                  <Button className="w-full">
                    <Database className="h-4 w-4 mr-2" />
                    Ir a Configuración
                  </Button>
                </Link>

                <Link href="/" className="block">
                  <Button variant="outline" className="w-full bg-transparent">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Inicio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto space-y-4 w-full overflow-x-hidden">
        <div className="flex items-center gap-3 py-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold truncate">Clientes</h1>
        </div>

        <div className="flex gap-2 w-full">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 flex-shrink-0" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 w-full"
            />
          </div>
          <Link href="/clientes/nuevo">
            <Button size="sm" className="h-11 whitespace-nowrap">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          {filteredClientes.length === 0 ? (
            <Card className="w-full">
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">
                  {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
                </p>
                <Link href="/clientes/nuevo" className="inline-block mt-2">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Cliente
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredClientes.map((cliente) => (
              <Card
                key={cliente.cliente_id}
                className="w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)] overflow-hidden"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base font-medium truncate flex-1 min-w-0">
                      #{cliente.cliente_codigo} - {cliente.nombre}
                    </CardTitle>
                    <div className="flex gap-1 flex-shrink-0">
                      <Link href={`/clientes/editar/${cliente.cliente_id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDelete(cliente.cliente_id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{cliente.domicilio}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{cliente.telefono}</span>
                  </div>
                  {cliente.cuil && <p className="text-xs text-gray-500 truncate">CUIL: {cliente.cuil}</p>}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
