import type { Producto, Proveedor } from "./types"

export interface ExcelRow {
  [key: string]: any
}

export interface ParseResult {
  productos: Producto[]
  errores: string[]
}

export async function parseExcelToProductos(rows: ExcelRow[], proveedores: Proveedor[]): Promise<ParseResult> {
  const productos: Producto[] = []
  const errores: string[] = []

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]

    try {
      // Mapeo de campos del Excel (case-insensitive)
      const articuloNumero = getFieldValue(row, [
        "Nº Artículo",
        "Art.",
        "Articulo",
        "articulo_numero",
        "nº articulo",
        "art",
        "articulo",
        "numero articulo",
        "numero_articulo",
      ])

      const descripcion = getFieldValue(row, [
        "Desc",
        "Descripcion",
        "Descripciom",
        "Descripción",
        "descripcion",
        "desc",
        "description",
        "producto",
        "nombre",
      ])

      const productoCodigo = getFieldValue(row, [
        "Cod",
        "Codigo",
        "Código",
        "producto_codigo",
        "codigo_producto",
        "cod",
        "codigo",
        "code",
        "sku",
      ])

      const proveedorValue = getFieldValue(row, [
        "Proveedor",
        "proveedor",
        "Proveedor_ID",
        "proveedor_id",
        "ProveedorID",
        "Supplier",
        "supplier",
      ])

      // Validaciones obligatorias
      if (!articuloNumero && articuloNumero !== 0) {
        errores.push(`Fila ${index + 2}: Falta número de artículo`)
        continue
      }

      if (!descripcion) {
        errores.push(`Fila ${index + 2}: Falta descripción del producto`)
        continue
      }

      // Convertir número de artículo
      let numeroArticulo: number
      if (typeof articuloNumero === "number") {
        numeroArticulo = articuloNumero
      } else {
        const parsed = Number.parseInt(articuloNumero.toString())
        if (isNaN(parsed)) {
          errores.push(`Fila ${index + 2}: Número de artículo inválido: ${articuloNumero}`)
          continue
        }
        numeroArticulo = parsed
      }

      // Determinar proveedor
      let proveedor: Proveedor = {
        proveedor_id: 1,
        proveedor_nombre: "Proveedor General",
      }

      if (proveedorValue) {
        // Buscar proveedor por ID
        const proveedorId = Number.parseInt(proveedorValue.toString())
        if (!isNaN(proveedorId)) {
          const proveedorEncontrado = proveedores.find((p) => p.proveedor_id === proveedorId)
          if (proveedorEncontrado) {
            proveedor = proveedorEncontrado
          } else {
            errores.push(
              `Fila ${index + 2}: Proveedor con ID ${proveedorId} no encontrado. Se asignará "Proveedor General"`,
            )
          }
        } else {
          // Buscar proveedor por nombre
          const proveedorEncontrado = proveedores.find(
            (p) => p.proveedor_nombre.toLowerCase() === proveedorValue.toString().toLowerCase(),
          )
          if (proveedorEncontrado) {
            proveedor = proveedorEncontrado
          } else {
            errores.push(
              `Fila ${index + 2}: Proveedor "${proveedorValue}" no encontrado. Se asignará "Proveedor General"`,
            )
          }
        }
      }

      // Determinar unidad de medida basada en la descripción
      let unidadMedida = "unidad"
      const descripcionStr = descripcion.toString().toLowerCase()
      if (descripcionStr.includes("cable")) {
        unidadMedida = "metros"
      }

      // Crear producto
      const producto: Producto = {
        articulo_numero: numeroArticulo,
        producto_codigo: productoCodigo ? productoCodigo.toString().trim() : "",
        descripcion: descripcion.toString().trim(),
        unidad_medida: unidadMedida,
        proveedor: proveedor,
      }

      productos.push(producto)
    } catch (error) {
      errores.push(
        `Fila ${index + 2}: Error procesando datos - ${error instanceof Error ? error.message : "Error desconocido"}`,
      )
    }
  }

  return { productos, errores }
}

function getFieldValue(row: ExcelRow, possibleKeys: string[]): any {
  // Buscar coincidencia exacta primero
  for (const key of possibleKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key]
    }
  }

  // Buscar coincidencia case-insensitive
  const rowKeys = Object.keys(row)
  for (const possibleKey of possibleKeys) {
    const matchingKey = rowKeys.find((key) => key.toLowerCase().trim() === possibleKey.toLowerCase().trim())
    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null && row[matchingKey] !== "") {
      return row[matchingKey]
    }
  }

  // Buscar coincidencia parcial (contiene)
  for (const possibleKey of possibleKeys) {
    const matchingKey = rowKeys.find(
      (key) =>
        key.toLowerCase().includes(possibleKey.toLowerCase()) || possibleKey.toLowerCase().includes(key.toLowerCase()),
    )
    if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== null && row[matchingKey] !== "") {
      return row[matchingKey]
    }
  }

  return null
}
