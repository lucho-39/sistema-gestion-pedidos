import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthGate } from "@/components/auth-gate"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Punto Ferretero - Inventario y Pedidos",
  description: "Aplicación para gestionar productos, clientes, pedidos y reportes",
  generator: "v0.app",
}

// En Next 15 el viewport va en su propio export, no dentro de metadata.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthGate>{children}</AuthGate>
        <Toaster />
      </body>
    </html>
  )
}
