"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Database } from "@/lib/database"
import { parseExcelToProductos } from "@/lib/excel-parser"
import type { Producto } from "@/lib/types"

export default function ImportarProductosPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [importedProducts, setImportedProducts] = useState<Producto[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validar que sea un archivo Excel
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ]

      if (
        !validTypes.includes(selectedFile.type) &&
        !selectedFile.name.toLowerCase().endsWith(".xlsx") &&
        !selectedFile.name.toLowerCase().endsWith(".xls")
      ) {
        toast({
          title: "Archivo inválido",
          description: "Por favor selecciona un archivo Excel (.xlsx o .xls)",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
      setImportedProducts([])
      setParseErrors([])
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo Excel",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setParseErrors([])

    try {
      console.log("Starting import process...")

      // Cargar proveedores desde la base de datos
      const proveedores = await Database.getProveedores()
      console.log(`Loaded ${proveedores.length} proveedores`)

      if (proveedores.length === 0) {
        toast({
          title: "Error",
          description: "No se encontraron proveedores. Debe crear al menos un proveedor antes de importar productos.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Importar dinámicamente la librería xlsx
      const XLSX = await import("xlsx")

      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })

          // Tomar la primera hoja
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]

          // Convertir a JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

          if (jsonData.length < 2) {
            throw new Error("El archivo debe contener al menos una fila de encabezados y una fila de datos")
          }

          // La primera fila son los encabezados
          const headers = jsonData[0] as string[]
          const rows = jsonData.slice(1) as any[][]

          console.log("Headers found:", headers)
          console.log(`Data rows: ${rows.length}`)

          // Convertir filas a objetos
          const excelRows = rows
            .filter((row) => row.some((cell) => cell !== null && cell !== undefined && cell !== ""))
            .map((row, rowIndex) => {
              const obj: any = {}
              headers.forEach((header, index) => {
                if (header && row[index] !== undefined) {
                  obj[header.toString().trim()] = row[index]
                }
              })
              console.log(`Row ${rowIndex + 1}:`, obj)
              return obj
            })

          if (excelRows.length === 0) {
            throw new Error("No se encontraron filas de datos válidas en el archivo")
          }

          console.log(`Processing ${excelRows.length} rows...`)

          // Parsear productos usando la función actualizada (ahora asíncrona)
          const { productos, errores } = await parseExcelToProductos(excelRows, proveedores)

          console.log(`Parsing completed: ${productos.length} products, ${errores.length} errors`)

          setImportedProducts(productos)
          setParseErrors(errores)

          toast({
            title: "Archivo procesado",
            description: `Se encontraron ${productos.length} productos válidos en ${file.name}`,
          })

          if (errores.length > 0) {
            toast({
              title: "Advertencias encontradas",
              description: `${errores.length} filas tuvieron problemas de procesamiento`,
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Error procesando Excel:", error)
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Error al procesar el archivo Excel",
            variant: "destructive",
          })
          setParseErrors([error instanceof Error ? error.message : "Error desconocido"])
        }
        setIsLoading(false)
      }

      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Error al leer el archivo",
          variant: "destructive",
        })
        setIsLoading(false)
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error("Error importando:", error)
      toast({
        title: "Error",
        description: "Error al procesar el archivo. Intenta recargar la página.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleSaveProducts = async () => {
    if (importedProducts.length === 0) {
      toast({
        title: "Error",
        description: "No hay productos para importar",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("Starting save process...")
      console.log("Products to save:", importedProducts)

      // Validar que todos los productos tengan proveedor_id válido
      const invalidProducts = importedProducts.filter((p) => !p.proveedor_id || p.proveedor_id <= 0)
      if (invalidProducts.length > 0) {
        console.error("Invalid products found:", invalidProducts)
        toast({
          title: "Error de validación",
          description: `${invalidProducts.length} productos tienen proveedor_id inválido`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Obtener productos existentes
      const existingProducts = await Database.getProductos()
      console.log(`Found ${existingProducts.length} existing products`)

      // Verificar duplicados por número de artículo
      const existingNumbers = new Set(existingProducts.map((p) => p.articulo_numero))
      const duplicates = importedProducts.filter((p) => existingNumbers.has(p.articulo_numero))

      if (duplicates.length > 0) {
        const duplicateNumbers = duplicates.map((p) => p.articulo_numero).join(", ")
        toast({
          title: "Productos duplicados encontrados",
          description: `Los siguientes números de artículo ya existen: ${duplicateNumbers}. Se omitirán estos productos.`,
          variant: "destructive",
        })
      }

      // Filtrar productos no duplicados
      const newProducts = importedProducts.filter((p) => !existingNumbers.has(p.articulo_numero))

      if (newProducts.length === 0) {
        toast({
          title: "Sin productos nuevos",
          description: "Todos los productos del archivo ya existen en el sistema",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      console.log(`Saving ${newProducts.length} new products...`)

      // Preparar datos para inserción (sin campos de relación)
      const productosParaInsertar = newProducts.map((p) => ({
        articulo_numero: p.articulo_numero,
        producto_codigo: p.producto_codigo || "",
        descripcion: p.descripcion,
        unidad_medida: p.unidad_medida,
        proveedor_id: p.proveedor_id, // Asegurar que sea un número válido
      }))

      console.log("Data to insert:", productosParaInsertar)

      // Crear productos en la base de datos
      const createdProducts = await Database.createProductos(productosParaInsertar)
      console.log(`Created ${createdProducts.length} products`)

      if (createdProducts.length > 0) {
        toast({
          title: "Productos importados",
          description: `Se importaron ${createdProducts.length} productos nuevos exitosamente`,
        })

        setImportedProducts([])
        setFile(null)
        setParseErrors([])

        // Reset file input
        const fileInput = document.getElementById("excel-file") as HTMLInputElement
        if (fileInput) {
          fileInput.value = ""
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudieron importar los productos. Verifica la conexión a la base de datos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving products:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar los productos en la base de datos",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-3 py-2">
          <Link href="/productos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Importar Excel</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSpreadsheet className="h-5 w-5" />
              Subir archivo Excel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="excel-file">Seleccionar archivo (.xlsx, .xls)</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileChange}
                className="mt-1"
              />
            </div>

            {file && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Archivo seleccionado:</strong> {file.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">Tamaño: {(file.size / 1024).toFixed(1)} KB</p>
              </div>
            )}

            <Button onClick={handleImport} disabled={!file || isLoading} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? "Procesando..." : "Procesar Archivo"}
            </Button>
          </CardContent>
        </Card>

        {parseErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Errores encontrados:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {parseErrors.slice(0, 5).map((error, index) => (
                  <li key={index} className="text-xs">
                    {error}
                  </li>
                ))}
                {parseErrors.length > 5 && <li className="text-xs">... y {parseErrors.length - 5} errores más</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {importedProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Productos encontrados ({importedProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {importedProducts.map((producto, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                    <p className="font-medium">
                      #{producto.articulo_numero} - {producto.descripcion}
                    </p>
                    <p className="text-gray-600">Código: {producto.producto_codigo || "Sin código"}</p>
                    <p className="text-gray-600">Unidad: {producto.unidad_medida}</p>
                    <p className="text-indigo-600 text-xs font-medium">
                      Proveedor: {producto.proveedor.proveedor_id} - {producto.proveedor.proveedor_nombre}
                    </p>
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveProducts} disabled={isLoading} className="w-full">
                {isLoading ? "Guardando..." : `Importar ${importedProducts.length} Productos`}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Formato del archivo Excel</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-600 space-y-2">
            <p>
              <strong>Campos reconocidos (no distingue mayúsculas/minúsculas):</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>"Nº Artículo"</strong> o <strong>"Art."</strong> → Número de artículo (obligatorio)
              </li>
              <li>
                <strong>"Desc"</strong>, <strong>"Descripcion"</strong>, <strong>"Descripciom"</strong> → Descripción
                (obligatorio)
              </li>
              <li>
                <strong>"Cod"</strong>, <strong>"Codigo"</strong> → Código del producto (opcional)
              </li>
              <li>
                <strong>"Proveedor"</strong> → ID del proveedor (opcional, busca por ID o nombre)
              </li>
            </ul>
            <p>
              <strong>Reglas automáticas:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Productos con "CABLE" o "cable" en descripción → unidad en metros</li>
              <li>Si no se encuentra proveedor → se asigna el primer proveedor disponible</li>
              <li>Campos faltantes se completan con valores por defecto</li>
              <li>Otros campos del Excel se ignoran automáticamente</li>
            </ul>
            <p className="text-red-600 font-medium">
              <strong>Importante:</strong> Debe existir al menos un proveedor en el sistema antes de importar productos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
