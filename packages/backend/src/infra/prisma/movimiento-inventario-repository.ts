// Repositorio Prisma para Movimientos de Inventario
// Implementación concreta del patrón Repository

import { PrismaClient } from '@prisma/client'
import { MovimientoInventarioRepository } from '../../domain/repositories.js'
import { MovimientoInventario, TipoMovimiento } from '../../domain/entities.js'

export class PrismaMovimientoInventarioRepository
  implements MovimientoInventarioRepository
{
  constructor(private prisma: PrismaClient) {}

  async create(
    data: Omit<MovimientoInventario, 'id'>
  ): Promise<MovimientoInventario> {
    const movimiento = await this.prisma.movimientoInventario.create({
      data: {
        productoId: data.productoId,
        tipo: data.tipo as any,
        cantidad: data.cantidad,
        fecha: data.fecha,
        usuarioId: data.usuarioId,
        comentario: data.comentario,
        referencia: data.referencia,
      },
    })

    return this.toDomain(movimiento)
  }

  async findById(id: string): Promise<MovimientoInventario | null> {
    const movimiento = await this.prisma.movimientoInventario.findUnique({
      where: { id },
    })

    return movimiento ? this.toDomain(movimiento) : null
  }

  async findByProductoId(
    productoId: string,
    limit?: number
  ): Promise<MovimientoInventario[]> {
    const movimientos = await this.prisma.movimientoInventario.findMany({
      where: { productoId },
      orderBy: { fecha: 'desc' },
      take: limit,
    })

    return movimientos.map((m) => this.toDomain(m))
  }

  async findByDateRange(
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<MovimientoInventario[]> {
    const movimientos = await this.prisma.movimientoInventario.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      orderBy: { fecha: 'desc' },
    })

    return movimientos.map((m) => this.toDomain(m))
  }

  async findByTipo(
    tipo: TipoMovimiento,
    fechaInicio?: Date,
    fechaFin?: Date
  ): Promise<MovimientoInventario[]> {
    const where: any = { tipo: tipo as any }

    if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: fechaInicio,
        lte: fechaFin,
      }
    }

    const movimientos = await this.prisma.movimientoInventario.findMany({
      where,
      orderBy: { fecha: 'desc' },
    })

    return movimientos.map((m) => this.toDomain(m))
  }

  async findAll(filters?: {
    productoId?: string
    tipo?: TipoMovimiento
    fechaDesde?: Date
    fechaHasta?: Date
    usuarioId?: string
    page?: number
    limit?: number
  }): Promise<MovimientoInventario[]> {
    const where: any = {}

    if (filters?.productoId) {
      where.productoId = filters.productoId
    }

    if (filters?.tipo) {
      where.tipo = filters.tipo as any
    }

    if (filters?.usuarioId) {
      where.usuarioId = filters.usuarioId
    }

    if (filters?.fechaDesde && filters?.fechaHasta) {
      where.fecha = {
        gte: filters.fechaDesde,
        lte: filters.fechaHasta,
      }
    }

    const movimientos = await this.prisma.movimientoInventario.findMany({
      where,
      orderBy: { fecha: 'desc' },
      skip:
        filters?.page && filters?.limit
          ? (filters.page - 1) * filters.limit
          : undefined,
      take: filters?.limit,
    })

    return movimientos.map((m) => this.toDomain(m))
  }

  async obtenerResumenPorProducto(
    productoId: string,
    periodo: string
  ): Promise<any> {
    // Calcular fechas del período
    const [año, mes] = periodo.split('-').map(Number)
    const fechaInicio = new Date(año, mes - 1, 1)
    const fechaFin = new Date(año, mes, 0, 23, 59, 59)

    const movimientos = await this.prisma.movimientoInventario.findMany({
      where: {
        productoId,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
    })

    const entradas = movimientos.filter((m) => m.tipo === 'ENTRADA')
    const salidas = movimientos.filter((m) => m.tipo === 'SALIDA')

    return {
      periodo,
      productoId,
      totalEntradas: entradas.reduce((sum, m) => sum + m.cantidad, 0),
      totalSalidas: salidas.reduce((sum, m) => sum + m.cantidad, 0),
      totalMovimientos: movimientos.length,
      ultimoMovimiento:
        movimientos.length > 0
          ? movimientos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0]
              .fecha
          : null,
    }
  }

  private toDomain(prismaMovimiento: any): MovimientoInventario {
    return {
      id: prismaMovimiento.id,
      productoId: prismaMovimiento.productoId,
      tipo: prismaMovimiento.tipo as TipoMovimiento,
      cantidad: prismaMovimiento.cantidad,
      fecha: prismaMovimiento.fecha,
      usuarioId: prismaMovimiento.usuarioId,
      comentario: prismaMovimiento.comentario,
      referencia: prismaMovimiento.referencia,
    }
  }
}
