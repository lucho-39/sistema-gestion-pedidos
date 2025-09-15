"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Database } from "@/lib/database"
import type { Pedido, Cliente, Producto } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface PedidoProducto {
  articulo_numero: number
  cantidad: number
  producto?: Producto
}

export default function EditarPedidoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [clienteId, setClienteId] = useState<number>(0)
  const [fechaPedido, setFechaPedido] = useState("")
  const [pedidoProductos, setPedidoProductos] = useState<PedidoProducto[]>([])

  // Search states
  const [clienteSearch, setClienteSearch] = useState("")
  const [productoSearch, setProductoSearch] = useState("")
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [showProductoDropdown, setShowProductoDropdown] = useState(false)

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      setIsLoading(true)

      const [pedidoData, clientesData, productosData] = await Promise.all([
        Database.getPedidoById(Number.parseInt(params.id)),
        Database.getClientes(),
        Database.getProductos(),
      ])

      if (!pedidoData) {
        toast({
          title: "Error",
          description: "Pedido no encontrado",
          variant: "destructive",
        })
        router.push("/pedidos")
        return
      }

      setPedido(pedidoData)
      setClientes(clientesData)
      setProductos(productosData)

      // Set form data
      setClienteId(pedidoData.cliente_id)
      setClienteSearch(pedidoData.cliente?.nombre || "")
      setFechaPedido(pedidoData.fecha_pedido.split("T")[0])
      setPedidoProductos(
        pedidoData.productos?.map((pp) => ({
          articulo_numero: pp.articulo_numero,
          cantidad: pp.cantidad,
          producto: pp.producto,
        })) || [],
      )
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

  const filteredClientes = clientes.filter(
    (cliente) =>
      (cliente.nombre || "").toLowerCase().includes(clienteSearch.toLowerCase()) ||
      (cliente.cliente_codigo || "").toString().includes(clienteSearch),
  )

  const filteredProductos = productos.filter(
    (producto) =>
      (producto.descripcion || "").toLowerCase().includes(productoSearch.toLowerCase()) ||
      (producto.articulo_numero || "").toString().includes(productoSearch) ||
      (producto.producto_codigo || "").toLowerCase().includes(productoSearch.toLowerCase()),
  )

  const selectCliente = (cliente: Cliente) => {
    setClienteId(cliente.cliente_id)
    setClienteSearch(cliente.nombre)
    setShowClienteDropdown(false)
  }

  const agregarProducto = (producto: Producto) => {
    const exists = pedidoProductos.find((pp) => pp.articulo_numero === producto.articulo_numero)
    if (exists) {
      toast({
        title: "Producto ya agregado",
        description: "Este producto ya está en el pedido",
        variant: "destructive",
      })
      return
    }

    setPedidoProductos([
      ...pedidoProductos,
      {
        articulo_numero: producto.articulo_numero,
        cantidad: 1,
        producto: producto,
      },
    ])
    setProductoSearch("")
    setShowProductoDropdown(false)
  }

  const actualizarCantidad = (articuloNumero: number, cantidad: number) => {
    if (cantidad < 0) {
      return // No permitir cantidades negativas
    }

    setPedidoProductos(
      pedidoProductos.map((pp) => (pp.articulo_numero === articuloNumero ? { ...pp, cantidad: cantidad } : pp)),
    )
  }

  const eliminarProducto = (articuloNumero: number) => {
    setPedidoProductos(pedidoProductos.filter((pp) => pp.articulo_numero !== articuloNumero))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!clienteId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente",
        variant: "destructive",
      })
      return
    }

    // Validar que al menos un producto tenga cantidad > 0
    const productosConCantidad = pedidoProductos.filter((pp) => pp.cantidad > 0)
    if (productosConCantidad.length === 0) {
      toast({
        title: "Error",
        description: "Debe tener al menos un producto con cantidad mayor a 0",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      const success = await Database.updatePedido(Number.parseInt(params.id), {
        cliente_id: clienteId,
        fecha_pedido: fechaPedido,
        productos: pedidoProductos.map((pp) => ({
          articulo_numero: pp.articulo_numero,
          cantidad: pp.cantidad,
        })),
      })

      if (success) {
        toast({
          title: "Éxito",
          description: "Pedido actualizado correctamente",
        })
        router.push("/pedidos")
      } else {
        throw new Error("Failed to update")
      }
    } catch (error) {
      console.error("Error updating pedido:", error)
      toast({
        title: "Error",
        description: "Error al actualizar el pedido",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 py-2 mb-6">
            <Link href="/pedidos">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Editar Pedido</h1>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Cargando pedido...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 py-2 mb-6">
          <Link href="/pedidos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Editar Pedido #{params.id}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente *</Label>
                <div className="relative">
                  <Input
                    id="cliente"
                    placeholder="Buscar cliente por nombre o código..."
                    value={clienteSearch}
                    onChange={(e) => {
                      setClienteSearch(e.target.value)
                      setShowClienteDropdown(true)
                    }}
                    onFocus={() => setShowClienteDropdown(true)}
                  />
                  {showClienteDropdown && clienteSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredClientes.length > 0 ? (
                        filteredClientes.map((cliente) => (
                          <div
                            key={cliente.cliente_id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectCliente(cliente)}
                          >
                            <div className="font-medium">{cliente.nombre}</div>
                            <div className="text-sm text-gray-500">
                              Código: {cliente.cliente_codigo} • CUIL: {cliente.CUIL}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">No se encontraron clientes</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha del Pedido *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fechaPedido}
                  onChange={(e) => setFechaPedido(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos en el Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Agregar Producto</Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar producto por descripción, artículo o código..."
                      value={productoSearch}
                      onChange={(e) => {
                        setProductoSearch(e.target.value)
                        setShowProductoDropdown(true)
                      }}
                      onFocus={() => setShowProductoDropdown(true)}
                      className="pl-10"
                    />
                  </div>
                  {showProductoDropdown && productoSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredProductos.length > 0 ? (
                        filteredProductos.map((producto) => (
                          <div
                            key={producto.articulo_numero}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => agregarProducto(producto)}
                          >
                            <div className="font-medium">{producto.descripcion}</div>
                            <div className="text-sm text-gray-500">
                              Art: {producto.articulo_numero} • Código: {producto.producto_codigo} •{" "}
                              {producto.unidad_medida}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">No se encontraron productos</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {pedidoProductos.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Productos seleccionados:</h4>
                  {pedidoProductos.map((pp) => (
                    <div key={pp.articulo_numero} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{pp.producto?.descripcion || "N/A"}</div>
                        <div className="text-sm text-gray-500">
                          Art: {pp.articulo_numero} • Código: {pp.producto?.producto_codigo || "N/A"} •{" "}
                          {pp.producto?.unidad_medida || "unidad"}
                        </div>
                        <div className="text-xs text-gray-400">
                          Proveedor: {pp.producto?.proveedor?.proveedor_nombre || "N/A"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={pp.cantidad}
                          onChange={(e) => actualizarCantidad(pp.articulo_numero, Number.parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <span className="text-sm text-gray-500 min-w-[60px]">
                          {pp.producto?.unidad_medida || "unidad"}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => eliminarProducto(pp.articulo_numero)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <span>Total productos:</span>
                      <span>{pedidoProductos.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total unidades:</span>
                      <span>{pedidoProductos.reduce((sum, pp) => sum + pp.cantidad, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Productos con cantidad &gt; 0:</span>
                      <span>{pedidoProductos.filter((pp) => pp.cantidad > 0).length}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSaving} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
            <Link href="/pedidos">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
