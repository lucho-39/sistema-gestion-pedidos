import * as XLSX from "xlsx"

// Valores que devuelve sheet_to_json para las columnas que usa este importador.
type ValorCelda = string | number | null

interface ClienteRow {
  [key: string]: ValorCelda | undefined
}

export interface ParsedCliente {
  cliente_codigo: number
  nombre: string
  domicilio: string
  telefono: string
  CUIL: string
  email: string
}

export async function parseClientesExcel(file: File): Promise<ParsedCliente[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows: ClienteRow[] = XLSX.utils.sheet_to_json(firstSheet)

        const clientes: ParsedCliente[] = []

        for (const row of rows) {
          // Buscar columnas de forma flexible (mayúsculas/minúsculas)
          const getColumnValue = (possibleNames: string[]): ValorCelda | undefined => {
            for (const name of possibleNames) {
              for (const key of Object.keys(row)) {
                if (key.toLowerCase().includes(name.toLowerCase())) {
                  return row[key]
                }
              }
            }
            return null
          }

          const clienteCodigo = getColumnValue(["id cliente", "cliente", "codigo", "id"])
          const denominacion = getColumnValue(["denominacion", "nombre", "razon social"])
          const domicilio = getColumnValue(["domicilio", "direccion", "calle"])
          const localidad = getColumnValue(["localidad", "ciudad", "location"])
          const telefono = getColumnValue(["telefono", "tel", "phone", "celular"])
          const cuit = getColumnValue(["cuit", "cuil", "dni"])
          const email = getColumnValue(["email", "e-mail", "correo", "mail"])

          if (!clienteCodigo || !denominacion) {
            continue // Skip rows without required fields
          }

          // Combinar domicilio y localidad
          let domicilioCompleto = domicilio?.toString() || ""
          if (localidad) {
            domicilioCompleto += domicilioCompleto ? `, ${localidad}` : String(localidad)
          }

          clientes.push({
            cliente_codigo: Number(clienteCodigo),
            nombre: denominacion?.toString() || "",
            domicilio: domicilioCompleto || "Sin especificar",
            telefono: telefono?.toString() || "Sin teléfono",
            CUIL: cuit?.toString() || "Sin CUIT",
            // trim: en el archivo hay emails con espacio al final
            email: email?.toString().trim() || "",
          })
        }

        resolve(clientes)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"))
    }

    reader.readAsBinaryString(file)
  })
}
