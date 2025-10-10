"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database } from "@/lib/database"
import { parseExcelToClientes } from "@/lib/excel-client-parser"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowLeft, Download } from "lucide-react"
import * as XLSX from "xlsx"

export default function ImportarClientesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parseResult, setParseResult] = useState<{
    clientes: any[]
    errores: string[]
  } | null>(null)
  const [duplicados, setDuplicados] = useState<Set<number>>(new Set())

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setParseResult(null)
      setDuplicados(new Set())
    }
  }

  const handleProcesarArchivo = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo Excel",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Leer el archivo Excel
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(worksheet)

      console.log("Excel rows parsed:", rows)

      // Parsear a clientes
      const result = await parseExcelToClientes(rows)

      // Verificar duplicados en la base de datos
      const clientesExistentes = await Database.getClientes()
      const codigosExistentes = new Set(clientesExistentes.map((c) => c.cliente_codigo))
      const duplicadosEncontrados = new Set<number>()

      result.clientes.forEach((cliente) => {
        if (codigosExistentes.has(cliente.cliente_codigo)) {
          duplicadosEncontrados.add(cliente.cliente_codigo)
          result.errores.push(
            `Cliente código ${cliente.cliente_codigo} (${cliente.nombre}) ya existe en la base de datos`,
          )
        }
      })

      setDuplicados(duplicadosEncontrados)
      setParseResult(result)

      if (result.errores.length > 0) {
        toast({
          title: "Advertencia",
          description: `Se encontraron ${result.errores.length} errores al procesar el archivo`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Éxito",
          description: `Se procesaron ${result.clientes.length} clientes correctamente`,
        })
      }
    } catch (error) {
      console.error("Error al procesar archivo:", error)
      toast({
        title: "Error",
        description: "Error al leer el archivo Excel",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImportar = async () => {
    if (!parseResult || parseResult.clientes.length === 0) {
      toast({
        title: "Error",
        description: "No hay clientes para importar",
        variant: "destructive",
      })
      return
    }

    // Filtrar clientes duplicados
    const clientesParaImportar = parseResult.clientes.filter((c) => !duplicados.has(c.cliente_codigo))

    if (clientesParaImportar.length === 0) {
      toast({
        title: "Error",
        description: "Todos los clientes ya existen en la base de datos",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      let importados = 0
      let errores = 0
      const erroresDetallados: string[] = []

      for (const cliente of clientesParaImportar) {
        try {
          const resultado = await Database.createCliente(cliente)
          if (resultado) {
            importados++
            console.log(`✓ Cliente ${cliente.cliente_codigo} importado`)
          } else {
            errores++
            erroresDetallados.push(`Error al importar cliente ${cliente.cliente_codigo} - ${cliente.nombre}`)
            console.error(`✗ Error al importar cliente ${cliente.cliente_codigo}`)
          }
        } catch (error) {
          errores++
          const errorMsg = error instanceof Error ? error.message : "Error desconocido"
          erroresDetallados.push(`Cliente ${cliente.cliente_codigo}: ${errorMsg}`)
          console.error(`✗ Exception al importar cliente ${cliente.cliente_codigo}:`, error)
        }
      }

      console.log(`\n=== RESUMEN DE IMPORTACIÓN ===`)
      console.log(`Total procesados: ${clientesParaImportar.length}`)
      console.log(`Importados: ${importados}`)
      console.log(`Errores: ${errores}`)
      console.log(`Duplicados omitidos: ${duplicados.size}`)

      if (erroresDetallados.length > 0) {
        console.log(`\nErrores detallados:`)
        erroresDetallados.forEach((err) => console.log(`- ${err}`))
      }

      toast({
        title: "Importación completada",
        description: `${importados} clientes importados, ${errores} errores, ${duplicados.size} duplicados omitidos`,
      })

      if (importados > 0) {
        setTimeout(() => {
          router.push("/clientes")
        }, 2000)
      }
    } catch (error) {
      console.error("Error al importar clientes:", error)
      toast({
        title: "Error",
        description: "Error al importar clientes a la base de datos",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        "ID Cliente": 1001,
        Denominacion: "Empresa Ejemplo S.A.",
        Domicilio: "Calle Principal 123",
        Localidad: "Buenos Aires",
        Telefono: "011-1234-5678",
        CUIT: "20-12345678-9",
      },
      {
        "ID Cliente": 1002,
        Denominacion: "Comercio Local",
        Domicilio: "Av. Libertador 456",
        Localidad: "Rosario",
        Telefono: "0341-987-6543",
        CUIT: "27-98765432-1",
      },
    ])

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Clientes")
    XLSX.writeFile(wb, "plantilla_clientes.xlsx")

    toast({
      title: "Plantilla descargada",
      description: "Se ha descargado la plantilla de ejemplo",
    })
  }

  const clientesValidos = parseResult ? parseResult.clientes.filter((c) => !duplicados.has(c.cliente_codigo)) : []

  return (
    <div className="w-full max-w-full min-h-screen overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">Importar Clientes</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 truncate">
              Importa múltiples clientes desde un archivo Excel
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/clientes")} className="h-11 whitespace-nowrap">
            <ArrowLeft className="w-4 h-4 mr-2 flex-shrink-0" />
            Volver
          </Button>
        </div>

        {/* Instrucciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">Formato del Archivo</span>
            </CardTitle>
            <CardDescription>El archivo Excel debe contener las siguientes columnas:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="font-medium text-sm">Columnas requeridas:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>ID Cliente (número único)</li>
                  <li>Denominación (texto)</li>
                </ul>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">Columnas opcionales:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Domicilio (texto)</li>
                  <li>Localidad (texto)</li>
                  <li>Teléfono (texto)</li>
                  <li>CUIT (texto)</li>
                </ul>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> El sistema detectará automáticamente clientes duplicados (mismo ID Cliente)
                y los omitirá durante la importación.
              </AlertDescription>
            </Alert>

            <Button variant="outline" onClick={downloadTemplate} className="w-full h-11 bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Descargar Plantilla de Ejemplo
            </Button>
          </CardContent>
        </Card>

        {/* Subir archivo */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Archivo</CardTitle>
            <CardDescription>Sube un archivo Excel (.xlsx, .xls) con los clientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="hidden" id="file-upload" />
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer h-11 bg-transparent" asChild>
                  <span>Seleccionar Archivo</span>
                </Button>
              </label>
              {file && (
                <p className="mt-4 text-sm text-muted-foreground truncate">
                  Archivo seleccionado: <span className="font-medium">{file.name}</span>
                </p>
              )}
            </div>

            <Button onClick={handleProcesarArchivo} disabled={!file || isProcessing} className="w-full h-11">
              {isProcessing ? "Procesando..." : "Procesar Archivo"}
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        {parseResult && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados del Procesamiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-medium">{clientesValidos.length}</span> clientes válidos
                  </AlertDescription>
                </Alert>
                {duplicados.size > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <span className="font-medium">{duplicados.size}</span> duplicados
                    </AlertDescription>
                  </Alert>
                )}
                {parseResult.errores.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <span className="font-medium">{parseResult.errores.length}</span> errores
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {parseResult.errores.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">Errores y duplicados:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1 bg-muted p-3 rounded-md">
                    {parseResult.errores.map((error, index) => (
                      <p key={index} className="text-sm text-destructive">
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {clientesValidos.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">Vista previa (primeros 5 clientes a importar - sin duplicados):</p>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {clientesValidos.slice(0, 5).map((cliente, index) => (
                      <div key={index} className="bg-muted p-3 rounded-md space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Código:</span> {cliente.cliente_codigo}
                        </p>
                        <p className="text-sm truncate">
                          <span className="font-medium">Nombre:</span> {cliente.nombre}
                        </p>
                        <p className="text-sm truncate">
                          <span className="font-medium">Domicilio:</span> {cliente.domicilio}
                        </p>
                        <p className="text-sm truncate">
                          <span className="font-medium">Teléfono:</span> {cliente.telefono}
                        </p>
                        {cliente.cuil && (
                          <p className="text-sm">
                            <span className="font-medium">CUIT:</span> {cliente.cuil}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleImportar}
                disabled={clientesValidos.length === 0 || isProcessing}
                className="w-full h-11"
              >
                {isProcessing
                  ? "Importando..."
                  : `Importar ${clientesValidos.length} Clientes (omitir ${duplicados.size} duplicados)`}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
