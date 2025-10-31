import { PrismaClient } from '@prisma/client'
import type {
  CreateTransportistaInput,
  UpdateTransportistaInput,
  CreateEnvioInput,
  UpdateEnvioInput,
  CreateRutaEnvioInput,
  UpdateRutaEnvioInput,
  CreateEstadoEnvioInput,
  CreateProductoEnvioInput,
  UpdateProductoEnvioInput,
  ListEnviosQuery,
  ListTransportistasQuery,
} from '../schemas/logistics.js'

export class LogisticsRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== TRANSPORTISTAS =====

  async createTransportista(data: CreateTransportistaInput) {
    return this.prisma.transportista.create({
      data,
    })
  }

  async getTransportistaById(id: string) {
    return this.prisma.transportista.findUnique({
      where: { id },
      include: {
        envios: {
          select: {
            id: true,
            numeroGuia: true,
            estado: true,
            fechaEnvio: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  async listTransportistas(query: ListTransportistasQuery) {
    const { page = 1, limit = 10, tipoServicio, isActive, search } = query

    const where: any = {}

    if (tipoServicio) {
      where.tipoServicio = tipoServicio
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefono: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      this.prisma.transportista.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { envios: true },
          },
        },
      }),
      this.prisma.transportista.count({ where }),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async updateTransportista(id: string, data: UpdateTransportistaInput) {
    return this.prisma.transportista.update({
      where: { id },
      data,
    })
  }

  async deleteTransportista(id: string) {
    return this.prisma.transportista.update({
      where: { id },
      data: { isActive: false },
    })
  }

  // ===== ENVÍOS =====

  async createEnvio(data: CreateEnvioInput) {
    const { productos, ...envioData } = data

    return this.prisma.envio.create({
      data: {
        ...envioData,
        fechaEstimada: data.fechaEstimada
          ? new Date(data.fechaEstimada)
          : undefined,
        fechaEnvio: data.fechaEnvio ? new Date(data.fechaEnvio) : undefined,
        productosEnvio: {
          create: productos.map((p) => ({
            productoId: p.productoId,
            cantidad: p.cantidad,
            observaciones: p.observaciones,
          })),
        },
        estadosEnvio: {
          create: {
            estado: 'PENDIENTE',
            descripcion: 'Envío creado',
          },
        },
      },
      include: {
        transportista: true,
        productosEnvio: {
          include: {
            producto: {
              select: {
                id: true,
                sku: true,
                nombre: true,
                unidad: true,
              },
            },
          },
        },
        rutasEnvio: true,
        estadosEnvio: {
          orderBy: { fecha: 'desc' },
        },
      },
    })
  }

  async getEnvioById(id: string) {
    return this.prisma.envio.findUnique({
      where: { id },
      include: {
        transportista: true,
        solicitudCompra: {
          include: {
            producto: {
              select: {
                id: true,
                sku: true,
                nombre: true,
              },
            },
            creador: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        productosEnvio: {
          include: {
            producto: {
              select: {
                id: true,
                sku: true,
                nombre: true,
                categoria: true,
                unidad: true,
                costo: true,
              },
            },
          },
        },
        rutasEnvio: {
          orderBy: { secuencia: 'asc' },
        },
        estadosEnvio: {
          orderBy: { fecha: 'desc' },
        },
      },
    })
  }

  async getEnvioByNumeroGuia(numeroGuia: string) {
    return this.prisma.envio.findUnique({
      where: { numeroGuia },
      include: {
        transportista: true,
        productosEnvio: {
          include: {
            producto: true,
          },
        },
        rutasEnvio: {
          orderBy: { secuencia: 'asc' },
        },
        estadosEnvio: {
          orderBy: { fecha: 'desc' },
        },
      },
    })
  }

  async listEnvios(query: ListEnviosQuery) {
    const {
      page = 1,
      limit = 10,
      estado,
      prioridad,
      transportistaId,
      fechaInicio,
      fechaFin,
      search,
    } = query

    const where: any = {}

    if (estado) {
      where.estado = estado
    }

    if (prioridad) {
      where.prioridad = prioridad
    }

    if (transportistaId) {
      where.transportistaId = transportistaId
    }

    if (fechaInicio || fechaFin) {
      where.fechaEnvio = {}
      if (fechaInicio) {
        where.fechaEnvio.gte = new Date(fechaInicio)
      }
      if (fechaFin) {
        where.fechaEnvio.lte = new Date(fechaFin)
      }
    }

    if (search) {
      where.OR = [
        { numeroGuia: { contains: search, mode: 'insensitive' } },
        { origen: { contains: search, mode: 'insensitive' } },
        { destino: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      this.prisma.envio.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          transportista: {
            select: {
              id: true,
              nombre: true,
              tipoServicio: true,
            },
          },
          _count: {
            select: {
              productosEnvio: true,
              rutasEnvio: true,
              estadosEnvio: true,
            },
          },
        },
      }),
      this.prisma.envio.count({ where }),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async updateEnvio(id: string, data: UpdateEnvioInput) {
    const updateData: any = { ...data }

    if (data.fechaEstimada) {
      updateData.fechaEstimada = new Date(data.fechaEstimada)
    }
    if (data.fechaEnvio) {
      updateData.fechaEnvio = new Date(data.fechaEnvio)
    }
    if (data.fechaEntrega) {
      updateData.fechaEntrega = new Date(data.fechaEntrega)
    }

    return this.prisma.envio.update({
      where: { id },
      data: updateData,
      include: {
        transportista: true,
        productosEnvio: {
          include: {
            producto: true,
          },
        },
        rutasEnvio: true,
        estadosEnvio: {
          orderBy: { fecha: 'desc' },
        },
      },
    })
  }

  async deleteEnvio(id: string) {
    return this.prisma.envio.delete({
      where: { id },
    })
  }

  // ===== RUTAS DE ENVÍO =====

  async createRutaEnvio(data: CreateRutaEnvioInput) {
    return this.prisma.rutaEnvio.create({
      data: {
        ...data,
        fechaLlegada: data.fechaLlegada
          ? new Date(data.fechaLlegada)
          : undefined,
        fechaSalida: data.fechaSalida ? new Date(data.fechaSalida) : undefined,
      },
    })
  }

  async listRutasEnvio(envioId: string) {
    return this.prisma.rutaEnvio.findMany({
      where: { envioId },
      orderBy: { secuencia: 'asc' },
    })
  }

  async updateRutaEnvio(id: string, data: UpdateRutaEnvioInput) {
    const updateData: any = { ...data }

    if (data.fechaLlegada) {
      updateData.fechaLlegada = new Date(data.fechaLlegada)
    }
    if (data.fechaSalida) {
      updateData.fechaSalida = new Date(data.fechaSalida)
    }

    return this.prisma.rutaEnvio.update({
      where: { id },
      data: updateData,
    })
  }

  async deleteRutaEnvio(id: string) {
    return this.prisma.rutaEnvio.delete({
      where: { id },
    })
  }

  // ===== ESTADOS DE ENVÍO =====

  async createEstadoEnvio(data: CreateEstadoEnvioInput) {
    // Crear el estado y actualizar el estado del envío
    const [estadoEnvio, _] = await Promise.all([
      this.prisma.estadoEnvio.create({
        data: {
          ...data,
          fecha: data.fecha ? new Date(data.fecha) : new Date(),
        },
      }),
      this.prisma.envio.update({
        where: { id: data.envioId },
        data: { estado: data.estado },
      }),
    ])

    return estadoEnvio
  }

  async listEstadosEnvio(envioId: string) {
    return this.prisma.estadoEnvio.findMany({
      where: { envioId },
      orderBy: { fecha: 'desc' },
    })
  }

  // ===== PRODUCTOS EN ENVÍO =====

  async createProductoEnvio(data: CreateProductoEnvioInput) {
    return this.prisma.productoEnvio.create({
      data,
      include: {
        producto: {
          select: {
            id: true,
            sku: true,
            nombre: true,
            unidad: true,
          },
        },
      },
    })
  }

  async listProductosEnvio(envioId: string) {
    return this.prisma.productoEnvio.findMany({
      where: { envioId },
      include: {
        producto: {
          select: {
            id: true,
            sku: true,
            nombre: true,
            categoria: true,
            unidad: true,
            costo: true,
          },
        },
      },
    })
  }

  async updateProductoEnvio(id: string, data: UpdateProductoEnvioInput) {
    return this.prisma.productoEnvio.update({
      where: { id },
      data,
      include: {
        producto: true,
      },
    })
  }

  async deleteProductoEnvio(id: string) {
    return this.prisma.productoEnvio.delete({
      where: { id },
    })
  }

  // ===== ESTADÍSTICAS =====

  async getEnviosStats() {
    const [total, pendientes, enTransito, entregados, cancelados, costoTotal] =
      await Promise.all([
        this.prisma.envio.count(),
        this.prisma.envio.count({ where: { estado: 'PENDIENTE' } }),
        this.prisma.envio.count({ where: { estado: 'EN_TRANSITO' } }),
        this.prisma.envio.count({ where: { estado: 'ENTREGADO' } }),
        this.prisma.envio.count({ where: { estado: 'CANCELADO' } }),
        this.prisma.envio.aggregate({
          _sum: { costoEnvio: true },
        }),
      ])

    return {
      total,
      porEstado: {
        pendientes,
        enTransito,
        entregados,
        cancelados,
      },
      costoTotal: costoTotal._sum.costoEnvio || 0,
    }
  }

  async getTransportistasStats() {
    const transportistas = await this.prisma.transportista.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { envios: true },
        },
        envios: {
          select: {
            costoEnvio: true,
            estado: true,
          },
        },
      },
    })

    return transportistas.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      tipoServicio: t.tipoServicio,
      totalEnvios: t._count.envios,
      costoTotal: t.envios.reduce((sum, e) => sum + e.costoEnvio, 0),
      enviosEntregados: t.envios.filter((e) => e.estado === 'ENTREGADO').length,
    }))
  }
}
