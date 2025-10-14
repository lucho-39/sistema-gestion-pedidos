"use client"

import Link from "next/link"
import { Package, Users, Truck, ShoppingCart, FileText, Upload, UserPlus } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Gestión</h1>
          <p className="text-gray-600">Administra productos, clientes, proveedores y pedidos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/productos">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Productos
                </CardTitle>
                <CardDescription>Gestiona el catálogo de productos</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/productos/importar">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-green-600" />
                  Importar Productos
                </CardTitle>
                <CardDescription>Importar productos desde Excel</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/clientes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Clientes
                </CardTitle>
                <CardDescription>Administra la base de clientes</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/clientes/importar">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-green-600" />
                  Importar Clientes
                </CardTitle>
                <CardDescription>Importar clientes desde Excel</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/proveedores">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-orange-600" />
                  Proveedores
                </CardTitle>
                <CardDescription>Gestiona proveedores</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/pedidos">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-red-600" />
                  Pedidos
                </CardTitle>
                <CardDescription>Administra pedidos de clientes</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reportes">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600" />
                  Reportes
                </CardTitle>
                <CardDescription>Genera reportes y estadísticas</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
