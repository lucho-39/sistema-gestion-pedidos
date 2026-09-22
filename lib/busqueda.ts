import type { Categoria, Producto } from "./types"

/**
 * Minusculas y sin tildes. Sirve para que escribir "plomeria" encuentre
 * "Plomería" y "gas butano" encuentre "Gas Butano".
 */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

/** Mapa id -> nombre de rubro, para resolver los rubros de un producto. */
export function mapaDeCategorias(categorias: Categoria[]): Map<number, string> {
  return new Map(categorias.map((c) => [c.id, c.nombre]))
}

/**
 * Los rubros del producto. Si tiene varios se usan todos; si no, queda el
 * principal.
 */
export function rubrosDe(producto: Producto): number[] {
  const ids = producto.categoria_ids
  return Array.isArray(ids) && ids.length > 0 ? ids : [producto.categoria_id]
}

/**
 * Decide si un producto entra en la busqueda.
 *
 * Mira la descripcion, el codigo, el numero de articulo y TAMBIEN los rubros de
 * la categoria. Esto ultimo es lo que hace que buscar "gas" encuentre el soplete
 * y "camping" el mosqueton: los rubros son caminos de busqueda, no un casillero.
 */
export function coincideBusqueda(
  producto: Producto,
  termino: string,
  nombresCategoria: Map<number, string>,
  proveedor?: string,
): boolean {
  if (proveedor !== undefined) {
    const nombreProveedor = producto.proveedor?.proveedor_nombre || "Sin proveedor"
    if (nombreProveedor !== proveedor) return false
  }

  if (!termino) return true

  if (normalizar(producto.descripcion).includes(termino)) return true
  if (producto.producto_codigo && normalizar(producto.producto_codigo).includes(termino)) return true
  if (producto.articulo_numero && String(producto.articulo_numero).includes(termino)) return true

  return rubrosDe(producto).some((id) => {
    const nombre = nombresCategoria.get(id)
    return nombre ? normalizar(nombre).includes(termino) : false
  })
}
