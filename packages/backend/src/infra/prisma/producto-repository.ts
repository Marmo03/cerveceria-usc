// Repositorio Prisma para Productos
// Implementación concreta del patrón Repository usando Prisma

import { PrismaClient } from '@prisma/client'
import { ProductoRepository } from '../../domain/repositories.js'
import { Producto } from '../../domain/entities.js'
import { NotFoundError, ConflictError } from '../../types/api.js'

export class PrismaProductoRepository implements ProductoRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Producto | null> {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        proveedor: true,
      },
    })

    return producto ? this.toDomain(producto) : null
  }

  async findBySku(sku: string): Promise<Producto | null> {
    const producto = await this.prisma.producto.findUnique({
      where: { sku },
      include: {
        proveedor: true,
      },
    })

    return producto ? this.toDomain(producto) : null
  }

  async findAll(filters?: {
    isActive?: boolean
    categoria?: string
    proveedorId?: string
    stockBajo?: boolean
    busqueda?: string
    page?: number
    limit?: number
  }): Promise<Producto[]> {
    const where: any = {}

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.categoria) {
      where.categoria = filters.categoria
    }

    if (filters?.proveedorId) {
      where.proveedorId = filters.proveedorId
    }

    if (filters?.stockBajo) {
      where.stockActual = {
        lte: this.prisma.producto.fields.stockMin,
      }
    }

    if (filters?.busqueda) {
      where.OR = [
        { nombre: { contains: filters.busqueda, mode: 'insensitive' } },
        { sku: { contains: filters.busqueda, mode: 'insensitive' } },
        { categoria: { contains: filters.busqueda, mode: 'insensitive' } },
      ]
    }

    const productos = await this.prisma.producto.findMany({
      where,
      include: {
        proveedor: true,
      },
      skip:
        filters?.page && filters?.limit
          ? (filters.page - 1) * filters.limit
          : undefined,
      take: filters?.limit,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return productos.map((p) => this.toDomain(p))
  }

  async findConStockBajo(): Promise<Producto[]> {
    const productos = await this.prisma.producto.findMany({
      where: {
        isActive: true,
        stockActual: {
          lte: this.prisma.producto.fields.stockMin,
        },
      },
      include: {
        proveedor: true,
      },
      orderBy: {
        stockActual: 'asc',
      },
    })

    return productos.map((p) => this.toDomain(p))
  }

  async create(
    data: Omit<Producto, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Producto> {
    try {
      const producto = await this.prisma.producto.create({
        data: {
          sku: data.sku,
          nombre: data.nombre,
          categoria: data.categoria,
          unidad: data.unidad,
          proveedorId: data.proveedorId,
          stockActual: data.stockActual,
          stockMin: data.stockMin,
          leadTime: data.leadTime,
          costo: data.costo,
          isActive: data.isActive,
        },
        include: {
          proveedor: true,
        },
      })

      return this.toDomain(producto)
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictError(`Ya existe un producto con SKU: ${data.sku}`)
      }
      throw error
    }
  }

  async update(id: string, data: Partial<Producto>): Promise<Producto> {
    try {
      const producto = await this.prisma.producto.update({
        where: { id },
        data: {
          sku: data.sku,
          nombre: data.nombre,
          categoria: data.categoria,
          unidad: data.unidad,
          proveedorId: data.proveedorId,
          stockActual: data.stockActual,
          stockMin: data.stockMin,
          leadTime: data.leadTime,
          costo: data.costo,
          isActive: data.isActive,
        },
        include: {
          proveedor: true,
        },
      })

      return this.toDomain(producto)
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Producto', id)
      }
      if (error.code === 'P2002') {
        throw new ConflictError(`Ya existe un producto con SKU: ${data.sku}`)
      }
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.producto.update({
        where: { id },
        data: { isActive: false },
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Producto', id)
      }
      throw error
    }
  }

  async actualizarStock(id: string, nuevoStock: number): Promise<Producto> {
    try {
      const producto = await this.prisma.producto.update({
        where: { id },
        data: { stockActual: nuevoStock },
        include: {
          proveedor: true,
        },
      })

      return this.toDomain(producto)
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError('Producto', id)
      }
      throw error
    }
  }

  async count(filters?: {
    isActive?: boolean
    categoria?: string
    stockBajo?: boolean
  }): Promise<number> {
    const where: any = {}

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters?.categoria) {
      where.categoria = filters.categoria
    }

    if (filters?.stockBajo) {
      where.stockActual = {
        lte: this.prisma.producto.fields.stockMin,
      }
    }

    return this.prisma.producto.count({ where })
  }

  private toDomain(prismaProducto: any): Producto {
    return {
      id: prismaProducto.id,
      sku: prismaProducto.sku,
      nombre: prismaProducto.nombre,
      categoria: prismaProducto.categoria,
      unidad: prismaProducto.unidad,
      proveedorId: prismaProducto.proveedorId,
      stockActual: prismaProducto.stockActual,
      stockMin: prismaProducto.stockMin,
      leadTime: prismaProducto.leadTime,
      costo: Number(prismaProducto.costo),
      isActive: prismaProducto.isActive,
      createdAt: prismaProducto.createdAt,
      updatedAt: prismaProducto.updatedAt,
    }
  }
}
