import type { Producto, Proveedor } from "./types"

interface ExcelRow {
  [key: string]: any
}

interface ParseResult {
  productos: Producto[]
  errores: string[]
}

export async function parseExcelToProductos(rows: ExcelRow[], proveedores: Proveedor[]): Promise<ParseResult> {
  const productos: Producto[] = []
  const errores: string[] = []

  console.log("Starting parseExcelToProductos with:", { rowsCount: rows.length, proveedoresCount: proveedores.length })

  if (proveedores.length === 0) {
    errores.push(
      "No hay proveedores disponibles en el sistema. Debe crear al menos un proveedor antes de importar productos.",
    )
    return { productos: [], errores }
  }

  // Buscar proveedor "General" o usar el primero disponible como fallback
  const proveedorGeneral =
    proveedores.find((p) => p.proveedor_nombre.toLowerCase().includes("general")) || proveedores[0]

  console.log("Using default provider as fallback:", proveedorGeneral)
  console.log(
    "Available providers:",
    proveedores.map((p) => `${p.proveedor_id} - ${p.proveedor_nombre}`),
  )

  // Mapear posibles nombres de columnas
  const columnMappings = {
    articulo_numero: ["nº artículo", "no artículo", "art.", "articulo", "numero articulo", "art", "número artículo"],
    descripcion: ["desc", "descripcion", "descripciom", "description", "producto", "nombre"],
    codigo: ["cod", "codigo", "código", "code", "producto_codigo"],
    proveedor: ["proveedor", "provider", "prov", "proveedor_id", "supplier", "prov id"],
  }

  rows.forEach((row, index) => {
    try {
      console.log(`\n=== Processing row ${index + 1} ===`)
      console.log("Row data:", row)

      // Buscar número de artículo
      let articuloNumero: number | null = null
      for (const key of Object.keys(row)) {
        const keyLower = key.toLowerCase().trim()
        if (columnMappings.articulo_numero.some((mapping) => keyLower.includes(mapping))) {
          const value = row[key]
          if (value !== null && value !== undefined && value !== "") {
            articuloNumero = Number(value)
            break
          }
        }
      }

      if (!articuloNumero || isNaN(articuloNumero)) {
        errores.push(`Fila ${index + 2}: Número de artículo faltante o inválido`)
        return
      }

      // Buscar descripción
      let descripcion = ""
      for (const key of Object.keys(row)) {
        const keyLower = key.toLowerCase().trim()
        if (columnMappings.descripcion.some((mapping) => keyLower.includes(mapping))) {
          const value = row[key]
          if (value !== null && value !== undefined && value !== "") {
            descripcion = String(value).trim()
            break
          }
        }
      }

      if (!descripcion) {
        errores.push(`Fila ${index + 2}: Descripción faltante`)
        return
      }

      // Buscar código de producto (opcional)
      let productoCodigo = ""
      for (const key of Object.keys(row)) {
        const keyLower = key.toLowerCase().trim()
        if (columnMappings.codigo.some((mapping) => keyLower.includes(mapping))) {
          const value = row[key]
          if (value !== null && value !== undefined && value !== "") {
            productoCodigo = String(value).trim()
            break
          }
        }
      }

      // Determinar unidad de medida
      let unidadMedida = "unidad"
      if (descripcion.toLowerCase().includes("cable")) {
        unidadMedida = "metros"
      } else if (descripcion.toLowerCase().includes("litro")) {
        unidadMedida = "litros"
      } else if (descripcion.toLowerCase().includes("kilo") || descripcion.toLowerCase().includes("kg")) {
        unidadMedida = "kilogramos"
      }

      // Buscar proveedor - MEJORADO
      let proveedor: Proveedor = proveedorGeneral // Default
      let proveedorEncontrado = false

      for (const key of Object.keys(row)) {
        const keyLower = key.toLowerCase().trim()
        if (columnMappings.proveedor.some((mapping) => keyLower.includes(mapping))) {
          const value = row[key]
          console.log(`Found provider column "${key}" with value:`, value, `(type: ${typeof value})`)

          if (value !== null && value !== undefined && value !== "") {
            const proveedorValue = String(value).trim()
            console.log(`Searching for provider: "${proveedorValue}"`)

            // Buscar por ID numérico PRIMERO (más preciso)
            const proveedorId = Number(proveedorValue)
            if (!isNaN(proveedorId) && proveedorId > 0) {
              console.log(`Searching by ID: ${proveedorId}`)
              const foundById = proveedores.find((p) => p.proveedor_id === proveedorId)
              if (foundById) {
                proveedor = foundById
                proveedorEncontrado = true
                console.log(`✓ Provider found by ID: ${foundById.proveedor_id} - ${foundById.proveedor_nombre}`)
                break
              } else {
                console.log(`✗ No provider found with ID: ${proveedorId}`)
              }
            }

            // Si no es numérico o no se encontró por ID, buscar por nombre
            if (!proveedorEncontrado) {
              console.log(`Searching by name: "${proveedorValue}"`)
              const foundByName = proveedores.find((p) =>
                p.proveedor_nombre.toLowerCase().includes(proveedorValue.toLowerCase()),
              )
              if (foundByName) {
                proveedor = foundByName
                proveedorEncontrado = true
                console.log(`✓ Provider found by name: ${foundByName.proveedor_id} - ${foundByName.proveedor_nombre}`)
                break
              } else {
                console.log(`✗ No provider found with name containing: "${proveedorValue}"`)
              }
            }
          }
        }
      }

      if (!proveedorEncontrado) {
        console.log(
          `⚠ No provider specified or found, using default: ${proveedor.proveedor_id} - ${proveedor.proveedor_nombre}`,
        )
      }

      // Crear producto
      const producto: Producto = {
        articulo_numero: articuloNumero,
        producto_codigo: productoCodigo,
        descripcion: descripcion,
        unidad_medida: unidadMedida,
        proveedor_id: proveedor.proveedor_id,
        proveedor: proveedor,
      }

      // Validación final
      if (!producto.proveedor_id || producto.proveedor_id <= 0) {
        errores.push(`Fila ${index + 2}: Error interno - proveedor_id inválido`)
        console.error(`Invalid product - proveedor_id is ${producto.proveedor_id}`)
        return
      }

      productos.push(producto)
      console.log(`✓ Successfully processed product:`, {
        articulo_numero: producto.articulo_numero,
        descripcion: producto.descripcion,
        proveedor_id: producto.proveedor_id,
        proveedor_nombre: producto.proveedor.proveedor_nombre,
      })
    } catch (error) {
      console.error(`Error processing row ${index + 1}:`, error)
      errores.push(
        `Fila ${index + 2}: Error al procesar - ${error instanceof Error ? error.message : "Error desconocido"}`,
      )
    }
  })

  console.log(`\n=== Parsing completed ===`)
  console.log(`Total products: ${productos.length}`)
  console.log(`Total errors: ${errores.length}`)

  // Mostrar resumen de proveedores asignados
  const proveedorCount = new Map<number, { nombre: string; count: number }>()
  productos.forEach((p) => {
    const current = proveedorCount.get(p.proveedor_id) || { nombre: p.proveedor.proveedor_nombre, count: 0 }
    proveedorCount.set(p.proveedor_id, { ...current, count: current.count + 1 })
  })

  console.log("\n=== Provider assignment summary ===")
  proveedorCount.forEach((data, id) => {
    console.log(`Provider ${id} (${data.nombre}): ${data.count} products`)
  })

  return { productos, errores }
}
