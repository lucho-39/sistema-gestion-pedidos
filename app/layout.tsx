import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Gestión - Inventario y Pedidos",
  description: "Aplicación para gestionar productos, clientes, pedidos y reportes",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Navigation />
        <main className="min-h-screen bg-gray-50 pb-24 md:pb-0">{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
