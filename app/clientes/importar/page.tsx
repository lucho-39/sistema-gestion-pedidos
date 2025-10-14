"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Upload, FileSpreadsheet, Check, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { parseClientesExcel, type ParsedCliente } from "@/lib/excel-parser-clientes"
import { Database } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

export default function ImportarClientesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedClientes, setParsedClientes] = useState<ParsedCliente[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [importStatus, setImportStatus] = useState<{
    success: number
    failed: number
    skipped: number
    errors: string[]
  } | null>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo Excel (.xlsx o .xls)",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
    setIsProcessing(true)
    setParsedClientes([])
    setImportStatus(null)

    try {
      const clientes = await parseClientesExcel(selectedFile)
      setParsedClientes(clientes)
      toast({
        title: "Archivo procesado",
        description: `Se encontraron ${clientes.length} clientes`,
      })
    } catch (error) {
      console.error("Error parsing Excel:", error)
      toast({
        title: "Error",
        description: "Error al procesar el archivo Excel",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (parsedClientes.length === 0) return

    setIsProcessing(true)
    let success = 0
    let failed = 0
    let skipped = 0
    const errors: string[] = []

    try {
      // Obtener clientes existentes para detectar duplicados
      const existingClientes = await Database.getClientes()
      const existingCodigos = new Set(existingClientes.map((c) => c.cliente_codigo))

      for (const cliente of parsedClientes) {
        try {
          // Verificar si ya existe
          if (existingCodigos.has(cliente.cliente_codigo)) {
            skipped++
            continue
          }

          const newCliente = await Database.createCliente({
            cliente_codigo: cliente.cliente_codigo,
            nombre: cliente.nombre,
            domicilio: cliente.domicilio,
            telefono: cliente.telefono,
            CUIL: cliente.CUIL,
          })

          if (newCliente) {
            success++
            existingCodigos.add(cliente.cliente_codigo)
          } else {
            failed++
            errors.push(`Cliente ${cliente.nombre}: Error al crear`)
          }
        } catch (error) {
          failed++
          errors.push(`Cliente ${cliente.nombre}: ${error instanceof Error ? error.message : "Error desconocido"}`)
        }
      }

      setImportStatus({ success, failed, skipped, errors })

      if (success > 0) {
        toast({
          title: "Importación completada",
          description: `${success} clientes importados exitosamente`,
        })
      }
    } catch (error) {
      console.error("Error importing clientes:", error)
      toast({
        title: "Error",
        description: "Error al importar clientes",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-3 py-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Importar Clientes desde Excel</h1>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Formato esperado:</strong> El archivo Excel debe contener las columnas: ID Cliente, Denominación,
            Domicilio, Localidad, Teléfono, CUIT
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Seleccionar archivo Excel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>

            {parsedClientes.length > 0 && !importStatus && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Clientes encontrados: <Badge variant="secondary">{parsedClientes.length}</Badge>
                  </p>
                  <Button onClick={handleImport} disabled={isProcessing} size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    {isProcessing ? "Importando..." : "Importar Clientes"}
                  </Button>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {parsedClientes.slice(0, 10).map((cliente, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              #{cliente.cliente_codigo} - {cliente.nombre}
                            </p>
                            <p className="text-xs text-gray-600">{cliente.domicilio}</p>
                            <div className="flex gap-3 text-xs text-gray-500">
                              <span>Tel: {cliente.telefono}</span>
                              <span>CUIT: {cliente.CUIL}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {parsedClientes.length > 10 && (
                    <p className="text-xs text-gray-500 text-center">... y {parsedClientes.length - 10} clientes más</p>
                  )}
                </div>
              </div>
            )}

            {importStatus && (
              <div className="space-y-3">
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>
                        <strong>Importación completada</strong>
                      </p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600">✓ Exitosos: {importStatus.success}</span>
                        <span className="text-yellow-600">⊘ Omitidos: {importStatus.skipped}</span>
                        <span className="text-red-600">✗ Fallidos: {importStatus.failed}</span>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                {importStatus.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <X className="h-4 w-4 text-red-600" />
                        Errores ({importStatus.errors.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importStatus.errors.map((error, idx) => (
                          <p key={idx} className="text-xs text-red-600">
                            {error}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Link href="/clientes" className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent">
                      Ver Clientes
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      setFile(null)
                      setParsedClientes([])
                      setImportStatus(null)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Importar Otro Archivo
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
