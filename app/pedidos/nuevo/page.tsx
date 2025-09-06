"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Trash2, Search, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/lib/database"
import type { Cliente, Producto } from "@/lib/types"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ProductoPedido extends Producto {
  cantidad: number
}

export default function NuevoPedidoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [busquedaCliente, setBusquedaCliente] = useState("")
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false)
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoPedido[]>([])
  const [busquedaProducto, setBusquedaProducto] = useState("")
  const [fechaPedido, setFechaPedido] = useState<string>(new Date().toISOString().split("T")[0])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const clienteInputRef = useRef<HTMLInputElement>(null)
  const clienteListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [loadedClientes, loadedProductos] = await Promise.all([Database.getClientes(), Database.getProductos()])
        setClientes(loadedClientes)
        setProductos(loadedProductos)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Error al cargar los datos",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Cerrar lista de clientes al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clienteInputRef.current &&
        clienteListRef.current &&
        !clienteInputRef.current.contains(event.target as Node) &&
        !clienteListRef.current.contains(event.target as Node)
      ) {
        setMostrarListaClientes(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clienteSeleccionado) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente",
        variant: "destructive",
      })
      return
    }

    if (!fechaPedido) {
      toast({
        title: "Error",
        description: "Debe seleccionar una fecha de pedido",
        variant: "destructive",
      })
      return
    }

    if (productosSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      // Preparar datos en el formato correcto para la base de datos
      const nuevoPedido = {
        cliente: clienteSeleccionado,
        cliente_id: clienteSeleccionado.cliente_id,
        fecha_pedido: new Date(fechaPedido).toISOString(),
        productos: productosSeleccionados.map((p) => ({
          articulo_numero: p.articulo_numero,
          cantidad: p.cantidad,
          id: 0, // Se asignará automáticamente
          pedido_id: 0, // Se asignará automáticamente
          created_at: new Date().toISOString(),
          producto: p,
        })),
        incluido_en_reporte: false,
        fecha_inclusion_reporte: undefined,
        reporte_id: undefined,
      }

      console.log("Sending pedido data:", nuevoPedido)

      const createdPedido = await Database.createPedido(nuevoPedido)

      if (createdPedido) {
        toast({
          title: "Pedido creado",
          description: "El pedido se ha registrado exitosamente",
        })
        router.push("/pedidos")
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear el pedido. Revise los datos e intente nuevamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating pedido:", error)
      toast({
        title: "Error",
        description: `Error al crear el pedido: ${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const agregarProducto = (producto: Producto) => {
    const yaExiste = productosSeleccionados.find((p) => p.articulo_numero === producto.articulo_numero)

    if (yaExiste) {
      toast({
        title: "Producto ya agregado",
        description: "Este producto ya está en el pedido",
        variant: "destructive",
      })
      return
    }

    const productoConCantidad: ProductoPedido = {
      ...producto,
      cantidad: 1,
    }

    setProductosSeleccionados([...productosSeleccionados, productoConCantidad])
    setBusquedaProducto("")
  }

  const actualizarCantidad = (articuloNumero: number, cantidad: number) => {
    if (cantidad <= 0) {
      eliminarProducto(articuloNumero)
      return
    }

    setProductosSeleccionados((prev) =>
      prev.map((p) => (p.articulo_numero === articuloNumero ? { ...p, cantidad } : p)),
    )
  }

  const eliminarProducto = (articuloNumero: number) => {
    setProductosSeleccionados((prev) => prev.filter((p) => p.articulo_numero !== articuloNumero))
  }

  const productosFiltrados = productos.filter(
    (producto) =>
      producto.descripcion.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
      producto.producto_codigo.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
      producto.articulo_numero.toString().includes(busquedaProducto),
  )

  // Filtrar clientes basado en la búsqueda - CORREGIDO para manejar tipos correctamente
  const clientesFiltrados = clientes.filter((cliente) => {
    const searchTerm = busquedaCliente.toLowerCase()
    return (
      cliente.nombre.toLowerCase().includes(searchTerm) ||
      cliente.cliente_codigo.toString().includes(searchTerm) ||
      cliente.cliente_id.toString().includes(searchTerm) ||
      (cliente.telefono && cliente.telefono.toLowerCase().includes(searchTerm)) ||
      (cliente.cuil && cliente.cuil.toLowerCase().includes(searchTerm))
    )
  })

  const seleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente)
    setBusquedaCliente(`#${cliente.cliente_codigo} - ${cliente.nombre}`)
    setMostrarListaClientes(false)
  }

  const handleClienteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBusquedaCliente(value)
    setMostrarListaClientes(true)

    // Si el input está vacío, limpiar la selección
    if (!value) {
      setClienteSeleccionado(null)
    }
  }

  const handleClienteInputFocus = () => {
    setMostrarListaClientes(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-3 py-2">
            <Link href="/pedidos">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Nuevo Pedido</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando datos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 py-2">
          <Link href="/pedidos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Nuevo Pedido</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Label htmlFor="cliente">Cliente *</Label>
                <div className="relative">
                  <Input
                    ref={clienteInputRef}
                    id="cliente"
                    placeholder="Buscar cliente por nombre o código..."
                    value={busquedaCliente}
                    onChange={handleClienteInputChange}
                    onFocus={handleClienteInputFocus}
                    className="pr-8"
                  />
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer"
                    onClick={() => setMostrarListaClientes(!mostrarListaClientes)}
                  />
                </div>

                {mostrarListaClientes && (
                  <div
                    ref={clienteListRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
                  >
                    {clientesFiltrados.length > 0 ? (
                      clientesFiltrados.map((cliente) => (
                        <div
                          key={cliente.cliente_id}
                          className={cn(
                            "px-3 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between",
                            clienteSeleccionado?.cliente_id === cliente.cliente_id && "bg-blue-50",
                          )}
                          onClick={() => seleccionarCliente(cliente)}
                        >
                          <div>
                            <p className="text-sm font-medium">
                              #{cliente.cliente_codigo} - {cliente.nombre}
                            </p>
                            <p className="text-xs text-gray-500">
                              {cliente.telefono && `Tel: ${cliente.telefono}`}
                              {cliente.telefono && cliente.cuil && " • "}
                              {cliente.cuil && `CUIL: ${cliente.cuil}`}
                            </p>
                          </div>
                          {clienteSeleccionado?.cliente_id === cliente.cliente_id && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No se encontraron clientes</div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="fecha_pedido">Fecha del Pedido *</Label>
                <Input
                  id="fecha_pedido"
                  type="date"
                  value={fechaPedido}
                  onChange={(e) => setFechaPedido(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agregar Productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar productos..."
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  className="pl-10"
                />
              </div>

              {busquedaProducto && (
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {productosFiltrados.slice(0, 5).map((producto) => (
                    <div
                      key={producto.articulo_numero}
                      className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => agregarProducto(producto)}
                    >
                      <p className="text-sm font-medium">
                        #{producto.articulo_numero} - {producto.descripcion}
                      </p>
                      <p className="text-xs text-gray-500">{producto.producto_codigo}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {productosSeleccionados.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Productos en el Pedido ({productosSeleccionados.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {productosSeleccionados.map((producto) => (
                  <div key={producto.articulo_numero} className="flex items-center gap-2 p-2 border rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        #{producto.articulo_numero} - {producto.descripcion}
                      </p>
                      <p className="text-xs text-gray-500">{producto.unidad_medida}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={producto.cantidad}
                        onChange={(e) => actualizarCantidad(producto.articulo_numero, Number(e.target.value))}
                        className="w-16 h-8 text-center"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarProducto(producto.articulo_numero)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Button type="submit" disabled={isSaving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Creando..." : "Crear Pedido"}
          </Button>
        </form>
      </div>
    </div>
  )
}
