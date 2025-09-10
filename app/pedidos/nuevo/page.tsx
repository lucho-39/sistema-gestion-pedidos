"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/lib/database"
import type { Cliente, Producto } from "@/lib/types"

interface ProductoPedido extends Producto {
  cantidad: number
}

export default function NuevoPedidoPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null)
  const [busquedaCliente, setBusquedaCliente] = useState("")
  const [mostrarListaClientes, setMostrarListaClientes] = useState(false)
  const [fechaPedido, setFechaPedido] = useState(new Date().toISOString().split("T")[0])
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoPedido[]>([])
  const [busquedaProducto, setBusquedaProducto] = useState("")
  const [mostrarListaProductos, setMostrarListaProductos] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [clientesData, productosData] = await Promise.all([Database.getClientes(), Database.getProductos()])

      setClientes(clientesData)
      setProductos(productosData)
    } catch (error) {
      console.error("Error cargando datos:", error)
      toast({
        title: "Error",
        description: "Error al cargar los datos. Verifica la conexión a la base de datos.",
        variant: "destructive",
      })
    }
  }

  // Filtrar clientes
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

  // Filtrar productos
  const productosFiltrados = productos.filter((producto) => {
    const searchTerm = busquedaProducto.toLowerCase()
    return (
      producto.descripcion.toLowerCase().includes(searchTerm) ||
      producto.articulo_numero.toString().includes(searchTerm) ||
      (producto.producto_codigo && producto.producto_codigo.toLowerCase().includes(searchTerm)) ||
      (producto.proveedor && producto.proveedor.proveedor_nombre.toLowerCase().includes(searchTerm))
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

    // Si el campo se vacía, limpiar la selección
    if (!value) {
      setClienteSeleccionado(null)
    }

    setMostrarListaClientes(true)
  }

  const handleClienteInputFocus = () => {
    setMostrarListaClientes(true)
  }

  const agregarProducto = (producto: Producto) => {
    const yaExiste = productosSeleccionados.find((p) => p.articulo_numero === producto.articulo_numero)

    if (yaExiste) {
      toast({
        title: "Producto ya agregado",
        description: "Este producto ya está en el pedido. Puedes modificar la cantidad.",
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
    setMostrarListaProductos(false)

    toast({
      title: "Producto agregado",
      description: `${producto.descripcion} agregado al pedido`,
    })
  }

  const actualizarCantidad = (articuloNumero: number, cantidad: number) => {
    if (cantidad <= 0) {
      eliminarProducto(articuloNumero)
      return
    }

    setProductosSeleccionados(
      productosSeleccionados.map((p) => (p.articulo_numero === articuloNumero ? { ...p, cantidad } : p)),
    )
  }

  const eliminarProducto = (articuloNumero: number) => {
    setProductosSeleccionados(productosSeleccionados.filter((p) => p.articulo_numero !== articuloNumero))
  }

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

    if (productosSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto al pedido",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("Submitting pedido...")
      console.log("Cliente seleccionado:", clienteSeleccionado)
      console.log("Productos seleccionados:", productosSeleccionados)

      const nuevoPedido = {
        cliente: clienteSeleccionado,
        cliente_id: clienteSeleccionado.cliente_id,
        fecha_pedido: new Date(fechaPedido).toISOString(),
        productos: productosSeleccionados.map((p) => ({
          articulo_numero: p.articulo_numero,
          cantidad: p.cantidad,
        })),
      }

      console.log("Pedido data to send:", nuevoPedido)

      const pedidoCreado = await Database.createPedido(nuevoPedido)

      if (pedidoCreado) {
        toast({
          title: "Pedido creado",
          description: `Pedido #${pedidoCreado.pedido_id} creado exitosamente`,
        })

        router.push("/pedidos")
      } else {
        throw new Error("No se pudo crear el pedido")
      }
    } catch (error) {
      console.error("Error creating pedido:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el pedido",
        variant: "destructive",
      })
    }

    setIsLoading(false)
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
          {/* Selector de Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <div className="flex">
                  <Input
                    type="text"
                    placeholder="Buscar cliente por nombre o código..."
                    value={busquedaCliente}
                    onChange={handleClienteInputChange}
                    onFocus={handleClienteInputFocus}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-2 bg-transparent"
                    onClick={() => setMostrarListaClientes(!mostrarListaClientes)}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                {mostrarListaClientes && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {clientesFiltrados.length > 0 ? (
                      clientesFiltrados.map((cliente) => (
                        <div
                          key={cliente.cliente_id}
                          className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${
                            clienteSeleccionado?.cliente_id === cliente.cliente_id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => seleccionarCliente(cliente)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">
                                #{cliente.cliente_codigo} - {cliente.nombre}
                              </p>
                              <p className="text-xs text-gray-600">
                                Tel: {cliente.telefono || "N/A"} • CUIL: {cliente.cuil || "N/A"}
                              </p>
                            </div>
                            {clienteSeleccionado?.cliente_id === cliente.cliente_id && (
                              <span className="text-blue-600 text-sm">✓</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500 text-sm">No se encontraron clientes</div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fecha del Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fecha del Pedido *</CardTitle>
            </CardHeader>
            <CardContent>
              <Input type="date" value={fechaPedido} onChange={(e) => setFechaPedido(e.target.value)} required />
            </CardContent>
          </Card>

          {/* Productos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Productos *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Buscador de productos */}
              <div className="relative">
                <div className="flex">
                  <Input
                    type="text"
                    placeholder="Buscar producto por descripción o código..."
                    value={busquedaProducto}
                    onChange={(e) => {
                      setBusquedaProducto(e.target.value)
                      setMostrarListaProductos(true)
                    }}
                    onFocus={() => setMostrarListaProductos(true)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-2 bg-transparent"
                    onClick={() => setMostrarListaProductos(!mostrarListaProductos)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {mostrarListaProductos && busquedaProducto && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {productosFiltrados.length > 0 ? (
                      productosFiltrados.slice(0, 10).map((producto) => (
                        <div
                          key={producto.articulo_numero}
                          className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                          onClick={() => agregarProducto(producto)}
                        >
                          <p className="font-medium text-sm">
                            #{producto.articulo_numero} - {producto.descripcion}
                          </p>
                          <p className="text-xs text-gray-600">
                            Código: {producto.producto_codigo || "N/A"} • {producto.unidad_medida}
                          </p>
                          <p className="text-xs text-indigo-600">
                            Proveedor: {producto.proveedor?.proveedor_nombre || "N/A"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500 text-sm">No se encontraron productos</div>
                    )}
                  </div>
                )}
              </div>

              {/* Lista de productos seleccionados */}
              {productosSeleccionados.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Productos seleccionados:</Label>
                  {productosSeleccionados.map((producto) => (
                    <div key={producto.articulo_numero} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          #{producto.articulo_numero} - {producto.descripcion}
                        </p>
                        <p className="text-xs text-gray-600">{producto.unidad_medida}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={producto.cantidad}
                          onChange={(e) =>
                            actualizarCantidad(producto.articulo_numero, Number.parseInt(e.target.value))
                          }
                          className="w-16 h-8 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarProducto(producto.articulo_numero)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botón de envío */}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creando pedido..." : "Crear Pedido"}
          </Button>
        </form>
      </div>
    </div>
  )
}
