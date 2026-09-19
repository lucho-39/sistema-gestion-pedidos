import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { parseExcelToProductos } from "./excel-parser"
import type { Categoria, Imagen, Proveedor } from "./types"

const proveedores: Proveedor[] = [
  { proveedor_id: 300, proveedor_nombre: "Proveedor General" },
  { proveedor_id: 400, proveedor_nombre: "Cables del Sur" },
]

const categorias: Categoria[] = [
  { id: 1, nombre: "General", unidad: "unidad" },
  { id: 2, nombre: "Cables", unidad: "metro" },
  { id: 3, nombre: "Materiales", unidad: "kg" },
]

const imagenes: Imagen[] = [
  { id: 1, url_img: "/placeholder.svg", txt_alt: "Imagen de producto por defecto" },
  { id: 2, url_img: "/cable.png", txt_alt: "Foto de cable" },
]

const parse = (
  rows: Record<string, unknown>[],
  proveedoresArg: Proveedor[] = proveedores,
  categoriasArg: Categoria[] = categorias,
  imagenesArg: Imagen[] = imagenes,
) => parseExcelToProductos(rows, proveedoresArg, categoriasArg, imagenesArg)

describe("parseExcelToProductos", () => {
  beforeEach(() => {
    // El parser loguea cada fila; lo silenciamos para no ensuciar la salida del test.
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("categoría", () => {
    it("resuelve la categoría por nombre", async () => {
      const { productos, errores } = await parse([
        { "Nº Artículo": "3001", Descripción: "Cable de red", Categoría: "Cables" },
      ])

      expect(errores).toEqual([])
      expect(productos).toHaveLength(1)
      expect(productos[0].categoria_id).toBe(2)
      expect(productos[0].categoria?.unidad).toBe("metro")
    })

    it("resuelve la categoría por id", async () => {
      const { productos } = await parse([{ "Nº Artículo": "3002", Descripción: "Clavo", Categoría: "3" }])

      expect(productos[0].categoria_id).toBe(3)
      expect(productos[0].categoria?.unidad).toBe("kg")
    })

    it("ignora mayúsculas y espacios al matchear el nombre", async () => {
      const { productos } = await parse([
        { "Nº Artículo": "3003", Descripción: "Cable", Categoría: "  cables  " },
      ])

      expect(productos[0].categoria_id).toBe(2)
    })

    it("usa la categoría por defecto cuando el archivo no trae la columna", async () => {
      const { productos, errores } = await parse([{ "Nº Artículo": "3004", Descripción: "Sin categoría" }])

      expect(productos[0].categoria_id).toBe(1)
      expect(errores).toEqual([])
    })

    it("avisa y usa la default cuando el nombre no existe", async () => {
      const { productos, errores } = await parse([
        { "Nº Artículo": "3005", Descripción: "Cosa", Categoría: "NoExiste" },
      ])

      expect(productos[0].categoria_id).toBe(1)
      expect(errores).toHaveLength(1)
      expect(errores[0]).toContain("NoExiste")
      expect(errores[0]).toContain("Fila 2")
    })
  })

  describe("número de artículo", () => {
    it("rechaza un artículo más largo que la columna VARCHAR(10)", async () => {
      const { productos, errores } = await parse([
        { "Nº Artículo": "12345678901", Descripción: "Demasiado largo" },
      ])

      expect(productos).toEqual([])
      expect(errores[0]).toContain("supera los 10 caracteres")
    })

    it("acepta un artículo de exactamente 10 caracteres", async () => {
      const { productos, errores } = await parse([{ "Nº Artículo": "1234567890", Descripción: "Justo" }])

      expect(errores).toEqual([])
      expect(productos[0].articulo_numero).toBe("1234567890")
    })

    it("mantiene el artículo como texto, sin convertirlo a número", async () => {
      const { productos } = await parse([{ "Nº Artículo": "007", Descripción: "Con ceros a la izquierda" }])

      expect(productos[0].articulo_numero).toBe("007")
    })

    it("rechaza la fila sin número de artículo", async () => {
      const { productos, errores } = await parse([{ Descripción: "Sin artículo" }])

      expect(productos).toEqual([])
      expect(errores[0]).toContain("Número de artículo")
    })
  })

  describe("proveedor", () => {
    it("resuelve el proveedor por id", async () => {
      const { productos } = await parse([{ "Nº Artículo": "3006", Descripción: "Cable", Proveedor: "400" }])

      expect(productos[0].proveedor_id).toBe(400)
    })

    it("resuelve el proveedor por nombre", async () => {
      const { productos } = await parse([
        { "Nº Artículo": "3007", Descripción: "Cable", Proveedor: "Cables del Sur" },
      ])

      expect(productos[0].proveedor_id).toBe(400)
    })

    it("usa el proveedor por defecto cuando no hay columna", async () => {
      const { productos } = await parse([{ "Nº Artículo": "3008", Descripción: "Cable" }])

      expect(productos[0].proveedor_id).toBe(300)
    })
  })

  describe("imagen", () => {
    it("resuelve la imagen por id", async () => {
      const { productos, errores } = await parse([
        { "Nº Artículo": "3016", Descripción: "Cable", Img: "2" },
      ])

      expect(errores).toEqual([])
      expect(productos[0].img_id).toBe(2)
    })

    it("resuelve la imagen por nombre", async () => {
      const { productos } = await parse([
        { "Nº Artículo": "3017", Descripción: "Cable", Imagen: "Foto de cable" },
      ])

      expect(productos[0].img_id).toBe(2)
    })

    it("usa la imagen por defecto cuando el archivo no trae la columna", async () => {
      const { productos, errores } = await parse([{ "Nº Artículo": "3018", Descripción: "Cable" }])

      expect(productos[0].img_id).toBe(1)
      expect(errores).toEqual([])
    })

    it("avisa y usa la default cuando la imagen no existe", async () => {
      const { productos, errores } = await parse([
        { "Nº Artículo": "3019", Descripción: "Cable", Img: "NoExiste" },
      ])

      expect(productos[0].img_id).toBe(1)
      expect(errores.some((e) => e.includes("NoExiste"))).toBe(true)
    })
  })

  describe("filas inválidas y datos faltantes", () => {
    it("rechaza la fila sin descripción", async () => {
      const { productos, errores } = await parse([{ "Nº Artículo": "3009" }])

      expect(productos).toEqual([])
      expect(errores[0]).toContain("Descripción faltante")
    })

    it("procesa las filas válidas y reporta solo las inválidas", async () => {
      const { productos, errores } = await parse([
        { "Nº Artículo": "3010", Descripción: "Válida uno" },
        { "Nº Artículo": "3011" },
        { "Nº Artículo": "3012", Descripción: "Válida dos" },
      ])

      expect(productos.map((p) => p.articulo_numero)).toEqual(["3010", "3012"])
      expect(errores).toHaveLength(1)
      expect(errores[0]).toContain("Fila 3")
    })

    it("corta temprano si no hay proveedores", async () => {
      const { productos, errores } = await parse([{ "Nº Artículo": "3013", Descripción: "Cable" }], [])

      expect(productos).toEqual([])
      expect(errores[0]).toContain("No hay proveedores")
    })

    it("corta temprano si no hay categorías", async () => {
      const { productos, errores } = await parse(
        [{ "Nº Artículo": "3014", Descripción: "Cable" }],
        proveedores,
        [],
      )

      expect(productos).toEqual([])
      expect(errores[0]).toContain("No hay categorías")
    })

    it("corta temprano si no hay imágenes", async () => {
      const { productos, errores } = await parse(
        [{ "Nº Artículo": "3015", Descripción: "Cable" }],
        proveedores,
        categorias,
        [],
      )

      expect(productos).toEqual([])
      expect(errores[0]).toContain("No hay imágenes")
    })
  })
})
