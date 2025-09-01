"use client"

import { Database } from "./database"
import type { Producto, Cliente, Pedido, ReporteSemanal, Proveedor } from "./types"

// Adaptador que mantiene la misma interfaz pero usa Supabase
export class LocalStorage {
  // PRODUCTOS
  static async getProductos(): Promise<Producto[]> {
    try {
      return await Database.getProductos()
    } catch (error) {
      console.error("Error getting productos:", error)
      return []
    }
  }

  static async setProductos(productos: Producto[]): Promise<void> {
    // Esta función ya no es necesaria con la base de datos
    // Los productos se guardan individualmente
    console.warn("setProductos is deprecated, use Database.createProducto instead")
  }

  static async createProducto(producto: Producto): Promise<Producto | null> {
    return await Database.createProducto(producto)
  }

  static async updateProducto(articulo_numero: number, updates: Partial<Producto>): Promise<boolean> {
    return await Database.updateProducto(articulo_numero, updates)
  }

  static async deleteProducto(articulo_numero: number): Promise<boolean> {
    return await Database.deleteProducto(articulo_numero)
  }

  static async createProductos(productos: Producto[]): Promise<Producto[]> {
    return await Database.createProductos(productos)
  }

  // CLIENTES
  static async getClientes(): Promise<Cliente[]> {
    try {
      return await Database.getClientes()
    } catch (error) {
      console.error("Error getting clientes:", error)
      return []
    }
  }

  static async setClientes(clientes: Cliente[]): Promise<void> {
    console.warn("setClientes is deprecated, use Database.createCliente instead")
  }

  static async createCliente(cliente: Omit<Cliente, "cliente_id">): Promise<Cliente | null> {
    return await Database.createCliente(cliente)
  }

  static async updateCliente(cliente_id: number, updates: Partial<Cliente>): Promise<boolean> {
    return await Database.updateCliente(cliente_id, updates)
  }

  static async deleteCliente(cliente_id: number): Promise<boolean> {
    return await Database.deleteCliente(cliente_id)
  }

  // PEDIDOS
  static async getPedidos(): Promise<Pedido[]> {
    try {
      return await Database.getPedidos()
    } catch (error) {
      console.error("Error getting pedidos:", error)
      return []
    }
  }

  static async setPedidos(pedidos: Pedido[]): Promise<void> {
    console.warn("setPedidos is deprecated, use Database.createPedido instead")
  }

  static async createPedido(pedido: Omit<Pedido, "pedido_id" | "fecha_creacion">): Promise<Pedido | null> {
    return await Database.createPedido(pedido)
  }

  static async updatePedido(pedido_id: number, updates: Partial<Pedido>): Promise<boolean> {
    return await Database.updatePedido(pedido_id, updates)
  }

  static async deletePedido(pedido_id: number): Promise<boolean> {
    return await Database.deletePedido(pedido_id)
  }

  // PROVEEDORES
  static async getProveedores(): Promise<Proveedor[]> {
    try {
      return await Database.getProveedores()
    } catch (error) {
      console.error("Error getting proveedores:", error)
      return []
    }
  }

  static async setProveedores(proveedores: Proveedor[]): Promise<void> {
    console.warn("setProveedores is deprecated, use Database.createProveedor instead")
  }

  static async createProveedor(proveedor: Proveedor): Promise<Proveedor | null> {
    return await Database.createProveedor(proveedor)
  }

  static async updateProveedor(proveedor_id: number, updates: Partial<Proveedor>): Promise<boolean> {
    return await Database.updateProveedor(proveedor_id, updates)
  }

  static async deleteProveedor(proveedor_id: number): Promise<boolean> {
    return await Database.deleteProveedor(proveedor_id)
  }

  // REPORTES
  static async getReportes(): Promise<ReporteSemanal[]> {
    try {
      return await Database.getReportes()
    } catch (error) {
      console.error("Error getting reportes:", error)
      return []
    }
  }

  static async setReportes(reportes: ReporteSemanal[]): Promise<void> {
    console.warn("setReportes is deprecated, use Database.saveReporte instead")
  }

  static async saveReporte(tipo: string, reporte: any): Promise<boolean> {
    return await Database.saveReporte(tipo, reporte)
  }

  static async updateReporte(tipo: string, reporte: any): Promise<boolean> {
    return await Database.updateReporte(tipo, reporte)
  }

  // UTILIDADES (mantenidas para compatibilidad)
  static getNextId(type: "producto" | "cliente" | "pedido"): number {
    console.warn("getNextId is deprecated, database handles auto-increment")
    return 1
  }

  static migrarPedidosExistentes(): void {
    console.warn("migrarPedidosExistentes is no longer needed with database")
  }
}
