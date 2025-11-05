import type { Producto, Proveedor, Categoria, Imagen } from "./types"

interface ExcelRow {
  [key: string]: any
}

interface ParseResult {
  productos: Producto[]
  errores: string[]
}

export async function parseExcelToProductos(
  rows: ExcelRow[],
  proveedores: Proveedor[],
  categorias: Categoria[],
  imagenes: Imagen[],
): Promise<ParseResult> {
  const productos: Producto[] = []
  const errores: string[] = []

  console.log("Starting parseExcelToProductos with:", {
    rowsCount: rows.length,
    proveedoresCount: proveedores.length,
    categoriasCount: categorias.length,
    imagenesCount: imagenes.length,
  })

  if (proveedores.length === 0) {
    errores.push(
      "No hay proveedores disponibles en el sistema. Debe crear al menos un proveedor antes de importar productos.",
    )
    return { productos: [], errores }
  }

  if (categorias.length === 0) {
    errores.push(
      "No hay categorías disponibles en el sistema. Debe crear al menos una categoría antes de importar productos.",
    )
    return { productos: [], errores }
  }

  if (imagenes.length === 0) {
    errores.push(
      "No hay imágenes disponibles en el sistema. Debe ejecutar el Script 5 en /setup para crear una imagen por defecto.",
    )
    return { productos: [], errores }
  }

  const proveedorGeneral =
    proveedores.find((p) => p.proveedor_nombre.toLowerCase().includes("general")) || proveedores[0]

  const categoriaGeneral = categorias.find((c) => c.nombre.toLowerCase().includes("general")) || categorias[0]

  const imagenGeneral =
    imagenes.find(
      (i) => i.txt_alt?.toLowerCase().includes("defecto") || i.txt_alt?.toLowerCase().includes("default"),
    ) || imagenes[0]

  console.log("Using default provider:", proveedorGeneral)
  console.log("Using default categoria:", categoriaGeneral)
  console.log("Using default imagen:", imagenGeneral)

  const columnMappings = {
    articulo_numero: ["nº artículo", "no artículo", "art.", "articulo", "numero articulo", "art", "número artículo"],
    descripcion: ["desc", "descripcion", "descripciom", "description", "producto", "nombre"],
    codigo: ["cod", "codigo", "código", "code", "producto_codigo"],
    proveedor: ["proveedor", "provider", "prov", "proveedor_id", "supplier"],
  }

  rows.forEach((row, index) => {
    try {
      console.log(`Processing row ${index + 1}:`, row)

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

      let unidadMedida = "unidad"
      if (descripcion.toLowerCase().includes("cable")) {
        unidadMedida = "metros"
      } else if (descripcion.toLowerCase().includes("litro")) {
        unidadMedida = "litros"
      } else if (descripcion.toLowerCase().includes("kilo") || descripcion.toLowerCase().includes("kg")) {
        unidadMedida = "kilogramos"
      }

      let proveedor: Proveedor = proveedorGeneral
      for (const key of Object.keys(row)) {
        const keyLower = key.toLowerCase().trim()
        if (columnMappings.proveedor.some((mapping) => keyLower.includes(mapping))) {
          const value = row[key]
          if (value !== null && value !== undefined && value !== "") {
            const proveedorValue = String(value).trim()

            const proveedorId = Number(proveedorValue)
            if (!isNaN(proveedorId)) {
              const foundById = proveedores.find((p) => p.proveedor_id === proveedorId)
              if (foundById) {
                proveedor = foundById
                break
              }
            }

            const foundByName = proveedores.find((p) =>
              p.proveedor_nombre.toLowerCase().includes(proveedorValue.toLowerCase()),
            )
            if (foundByName) {
              proveedor = foundByName
              break
            }
          }
        }
      }

      const producto: Producto = {
        articulo_numero: articuloNumero,
        producto_codigo: productoCodigo,
        descripcion: descripcion,
        unidad_medida: unidadMedida,
        proveedor_id: proveedor.proveedor_id,
        categoria_id: categoriaGeneral.id,
        img_id: imagenGeneral.id,
        proveedor: proveedor,
        img: imagenGeneral,
      }

      if (!producto.proveedor_id || producto.proveedor_id <= 0) {
        errores.push(`Fila ${index + 2}: Error interno - proveedor_id inválido`)
        return
      }

      if (!producto.categoria_id || producto.categoria_id <= 0) {
        errores.push(`Fila ${index + 2}: Error interno - categoria_id inválido`)
        return
      }

      if (!producto.img_id || producto.img_id <= 0) {
        errores.push(`Fila ${index + 2}: Error interno - img_id inválido`)
        return
      }

      productos.push(producto)
      console.log(`Successfully processed product:`, producto)
    } catch (error) {
      console.error(`Error processing row ${index + 1}:`, error)
      errores.push(
        `Fila ${index + 2}: Error al procesar - ${error instanceof Error ? error.message : "Error desconocido"}`,
      )
    }
  })

  console.log(`Parsing completed: ${productos.length} products, ${errores.length} errors`)
  return { productos, errores }
}
