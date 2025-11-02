"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2, Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Database } from "@/lib/database"
import type { Pedido, Cliente, Producto } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PedidoProducto {
  producto_id: number
  articulo_numero: number | null
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

  const [clienteId, setClienteId] = useState<number>(0)
  const [fechaPedido, setFechaPedido] = useState("")
  const [pedidoProductos, setPedidoProductos] = useState<PedidoProducto[]>([])
  const [hasNullProducts, setHasNullProducts] = useState(false)

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

      setClienteId(pedidoData.cliente_id)
      setClienteSearch(pedidoData.cliente?.nombre || "")
      setFechaPedido(pedidoData.fecha_pedido.split("T")[0])

      const validProducts = (pedidoData.productos || []).filter((pp) => pp.producto_id != null)
      const nullProductsCount = (pedidoData.productos || []).length - validProducts.length

      if (nullProductsCount > 0) {
        setHasNullProducts(true)
        console.log(`[v0] ⚠️ Encontrados ${nullProductsCount} productos con producto_id null - fueron filtrados`)
      }

      setPedidoProductos(
        validProducts.map((pp) => ({
          producto_id: pp.producto_id,
          articulo_numero: pp.articulo_numero,
          cantidad: pp.cantidad,
          producto: pp.producto,
        })),
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
    const exists = pedidoProductos.find((pp) => pp.producto_id === producto.producto_id)
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
        producto_id: producto.producto_id,
        articulo_numero: producto.articulo_numero,
        cantidad: 1,
        producto: producto,
      },
    ])
    setProductoSearch("")
    setShowProductoDropdown(false)
  }

  const actualizarCantidad = (productoId: number, cantidad: number) => {
    if (cantidad < 0) {
      return
    }

    setPedidoProductos(
      pedidoProductos.map((pp) => (pp.producto_id === productoId ? { ...pp, cantidad: cantidad } : pp)),
    )
  }

  const eliminarProducto = (productoId: number) => {
    setPedidoProductos(pedidoProductos.filter((pp) => pp.producto_id !== productoId))
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
          producto_id: pp.producto_id,
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
      <div className="min-h-screen bg-gray-50 p-4 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto w-full">
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
    <div className="min-h-screen bg-gray-50 p-4 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-3 py-2 mb-6">
          <Link href="/pedidos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl md:text-2xl font-bold">Editar Pedido #{params.id}</h1>
        </div>

        {hasNullProducts && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Este pedido tenía productos inválidos (sin producto_id) que fueron filtrados automáticamente. Para limpiar
              estos datos permanentemente, ejecuta el <strong>Script 4: Limpiar Productos Null</strong> en{" "}
              <Link href="/setup" className="underline font-medium">
                la página de setup
              </Link>
              .
            </AlertDescription>
          </Alert>
        )}

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
                <Label htmlFor="producto-search">Agregar Producto</Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="producto-search"
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
                            key={producto.producto_id}
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

              {pedidoProductos.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium">Productos seleccionados:</h4>
                  {pedidoProductos.map((pp) => (
                    <div
                      key={pp.producto_id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{pp.producto?.descripcion || "Descripción no disponible"}</div>
                        <div className="text-sm text-gray-500">
                          Art: {pp.articulo_numero || "N/A"} • Código: {pp.producto?.producto_codigo || "Sin código"}
                        </div>
                        <div className="text-xs text-gray-400">
                          Proveedor: {pp.producto?.proveedor?.proveedor_nombre || "Sin proveedor"} • Código Proveedor:{" "}
                          {pp.producto?.producto_codigo || "Sin código proveedor"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={pp.cantidad}
                          onChange={(e) => actualizarCantidad(pp.producto_id, Number.parseInt(e.target.value) || 0)}
                          className="w-20"
                          aria-label={`Cantidad de ${pp.producto?.descripcion || "producto"}`}
                        />
                        <span className="text-sm text-gray-500 min-w-[60px]">
                          {pp.producto?.categoria?.unidad || "unidad"}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => eliminarProducto(pp.producto_id)}
                          className="text-red-600 hover:text-red-700"
                          aria-label={`Eliminar ${pp.producto?.descripcion || "producto"}`}
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
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay productos en este pedido. Usa el buscador arriba para agregar productos.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" disabled={isSaving} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
            <Link href="/pedidos" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full bg-transparent">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
