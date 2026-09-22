import { describe, expect, it } from "vitest"
import { coincideBusqueda, mapaDeCategorias, normalizar, rubrosDe } from "./busqueda"
import type { Categoria, Producto } from "./types"

const categorias: Categoria[] = [
  { id: 1, nombre: "General", unidad: "unidad" },
  { id: 5, nombre: "Electricidad", unidad: "unidad" },
  { id: 6, nombre: "Herramientas", unidad: "unidad" },
  { id: 12, nombre: "Plomería", unidad: "litro" },
  { id: 21, nombre: "Gas", unidad: "unidad" },
]

const nombres = mapaDeCategorias(categorias)

const producto = (over: Partial<Producto>): Producto => ({
  producto_id: 1,
  descripcion: "Producto",
  categoria_id: 1,
  img_id: 1,
  proveedor_id: 1,
  ...over,
})

const buscar = (p: Producto, termino: string) => coincideBusqueda(p, normalizar(termino), nombres)

describe("busqueda por rubro", () => {
  it("encuentra el producto por un rubro que no nombra la descripcion", () => {
    const soplete = producto({
      descripcion: "SOPLETE GAS BUTANO",
      categoria_id: 6,
      categoria_ids: [6, 21],
    })

    expect(buscar(soplete, "gas")).toBe(true)
    expect(buscar(soplete, "herramientas")).toBe(true)
  })

  it("no lo encuentra por un rubro que no tiene", () => {
    const soplete = producto({ descripcion: "SOPLETE GAS BUTANO", categoria_id: 6, categoria_ids: [6, 21] })

    expect(buscar(soplete, "camping")).toBe(false)
  })

  it("busca ignorando las tildes", () => {
    const canilla = producto({ descripcion: "CANILLA ESFERICA", categoria_id: 12 })

    expect(buscar(canilla, "plomeria")).toBe(true)
    expect(buscar(canilla, "Plomería")).toBe(true)
  })

  it("sigue encontrando por descripcion, codigo y numero de articulo", () => {
    const p = producto({
      descripcion: "MARTILLO GALPONERO",
      producto_codigo: "98234",
      articulo_numero: "1044",
    })

    expect(buscar(p, "martillo")).toBe(true)
    expect(buscar(p, "98234")).toBe(true)
    expect(buscar(p, "1044")).toBe(true)
  })

  it("sin termino entran todos", () => {
    expect(buscar(producto({}), "")).toBe(true)
  })

  it("el filtro por proveedor sigue funcionando", () => {
    const lord = producto({
      descripcion: "MARTILLO",
      proveedor: { proveedor_id: 1200, proveedor_nombre: "LORD" },
    })
    const serra = producto({
      descripcion: "MARTILLO",
      proveedor: { proveedor_id: 1300, proveedor_nombre: "SERRA" },
    })

    expect(coincideBusqueda(lord, normalizar("martillo"), nombres, "LORD")).toBe(true)
    expect(coincideBusqueda(serra, normalizar("martillo"), nombres, "LORD")).toBe(false)
    // Sin filtro de proveedor, entra.
    expect(coincideBusqueda(lord, normalizar("martillo"), nombres)).toBe(true)
  })
})

describe("rubros del producto", () => {
  it("usa todos los rubros cuando hay varios", () => {
    expect(rubrosDe(producto({ categoria_id: 1, categoria_ids: [3, 4] }))).toEqual([3, 4])
  })

  it("cae al principal cuando no hay varios", () => {
    expect(rubrosDe(producto({ categoria_id: 7, categoria_ids: null }))).toEqual([7])
    expect(rubrosDe(producto({ categoria_id: 7 }))).toEqual([7])
    expect(rubrosDe(producto({ categoria_id: 7, categoria_ids: [] }))).toEqual([7])
  })
})
