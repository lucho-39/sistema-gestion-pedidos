import type { Cliente } from "./types"

interface ExcelRow {
  [key: string]: any
}

interface ParseResult {
  clientes: Cliente[]
  errores: string[]
}

export async function parseExcelToClientes(rows: ExcelRow[]): Promise<ParseResult> {
  const clientes: Cliente[] = []
  const errores: string[] = []
  const codigosVistos = new Set<number>()

  console.log("Starting parseExcelToClientes with:", { rowsCount: rows.length })

  const columnMappings = {
    cliente_codigo: [
      "id cliente",
      "cliente id",
      "código cliente",
      "codigo cliente",
      "cliente_codigo",
      "id",
      "codigo",
      "código",
      "nro cliente",
      "numero cliente",
    ],
    nombre: ["denominacion", "denominación", "nombre", "razon social", "razón social", "cliente", "name"],
    domicilio: ["domicilio", "direccion", "dirección", "address", "calle"],
    localidad: ["localidad", "ciudad", "city", "location"],
    telefono: ["telefono", "teléfono", "tel", "phone", "celular"],
    cuil: ["cuit", "cuil", "cuit/cuil", "documento", "doc", "dni"],
  }

  rows.forEach((row, index) => {
    try {
      console.log(`\n=== Processing row ${index + 1} ===`)
      console.log("Row data:", row)

      // Buscar código de cliente
      let clienteCodigo: number | null = null
      for (const key of Object.keys(row)) {
        const keyLower = key.toLowerCase().trim()
        if (columnMappings.cliente_codigo.some((mapping) => keyLower.includes(mapping))) {
          const value = row[key]
          if (value !== null && value !== undefined && value !== "") {
            clienteCodigo = Number(value)
            break
          }
        }
      }

      if (!clienteCodigo || isNaN(clienteCodigo)) {
        errores.push(`Fila ${index + 2}: Código de cliente faltante o inválido`)
        return
      }

      // Verificar duplicados dentro del mismo archivo
      if (codigosVistos.has(clienteCodigo)) {
        errores.push(`Fila ${index + 2}: Código de cliente ${clienteCodigo} duplicado en el archivo`)
        return
      }
      codigosVistos.add(clienteCodigo)

      // Buscar nombre/denominación
      let nombre = ""
      for (const key of Object.keys(row)) {
        const keyLower = key.toLowerCase().trim()
        if (columnMappings.nombre.some((mapping) => keyLower.includes(mapping))) {
          const value = row[key]
          if (value !== null && value !== undefined && value !== "") {
            nombre = String(value).trim()
            break
          }
        }
      }

      if (!nombre) {
        errores.push(`Fila ${index + 2}: Nombre/Denominación faltante`)
        return
      }

      // Buscar domicilio
      let domicilio = ""
      for (const key of Object.keys(row)) {
        const keyLower = key.toLowerCase().trim()
        if (columnMappings.domicilio.some((mapping) => keyLower.includes(mapping))) {
          const value = row[key]
          if (value !== null && value !== undefined && value !== "") {
            domicilio = String(value).trim()
            break
          }
        }
      }

      // Buscar localidad (opcional)
      let localidad = ""
      for (const key of Object.keys(row)) {
        const keyLower = key.toLowerCase().trim()
        if (columnMappings.localidad.some((mapping) => keyLower.includes(mapping))) {
          const value = row[key]
          if (value !== null && value !== undefined && value !== "") {
            localidad = String(value).trim()
            break
          }
        }
      }

      // Concatenar localidad al domicilio si existe
      if (localidad) {
        domicilio = domicilio ? `${domicilio}, ${localidad}` : localidad
      }

      if (!domicilio) {
        domicilio = "Sin domicilio"
      }

      // Buscar teléfono
      let telefono = ""
      for (const key of Object.keys(row)) {
        const keyLower = key.toLowerCase().trim()
        if (columnMappings.telefono.some((mapping) => keyLower.includes(mapping))) {
          const value = row[key]
          if (value !== null && value !== undefined && value !== "") {
            telefono = String(value).trim()
            break
          }
        }
      }

      if (!telefono) {
        telefono = "Sin teléfono"
      }

      // Buscar CUIT/CUIL (opcional)
      let cuil = ""
      for (const key of Object.keys(row)) {
        const keyLower = key.toLowerCase().trim()
        if (columnMappings.cuil.some((mapping) => keyLower.includes(mapping))) {
          const value = row[key]
          if (value !== null && value !== undefined && value !== "") {
            cuil = String(value).trim()
            break
          }
        }
      }

      // Crear cliente
      const cliente: Omit<Cliente, "cliente_id" | "created_at" | "updated_at"> = {
        cliente_codigo: clienteCodigo,
        nombre: nombre,
        domicilio: domicilio,
        telefono: telefono,
        cuil: cuil || undefined,
      }

      clientes.push(cliente as Cliente)
      console.log(`✓ Successfully processed cliente:`, {
        cliente_codigo: cliente.cliente_codigo,
        nombre: cliente.nombre,
        domicilio: cliente.domicilio,
        telefono: cliente.telefono,
        cuil: cliente.cuil || "No especificado",
      })
    } catch (error) {
      console.error(`Error processing row ${index + 1}:`, error)
      errores.push(
        `Fila ${index + 2}: Error al procesar - ${error instanceof Error ? error.message : "Error desconocido"}`,
      )
    }
  })

  console.log(`\n=== Parsing completed ===`)
  console.log(`Total clientes: ${clientes.length}`)
  console.log(`Total errors: ${errores.length}`)
  console.log(`Códigos únicos en archivo: ${codigosVistos.size}`)

  return { clientes, errores }
}
