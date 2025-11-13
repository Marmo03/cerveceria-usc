import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

// Schema de validación para crear solicitud
const crearSolicitudSchema = z.object({
  productoId: z.string().cuid(),
  cantidad: z.number().int().positive(),
  justificacion: z.string().optional(),
  urgente: z.boolean().optional().default(false),
})

// Schema de validación para rechazar solicitud
const rechazarSolicitudSchema = z.object({
  comentario: z.string().min(1, 'El comentario es requerido'),
})

type CrearSolicitudBody = z.infer<typeof crearSolicitudSchema>
type RechazarSolicitudBody = z.infer<typeof rechazarSolicitudSchema>

const solicitudesRoutes: FastifyPluginAsync = async (fastify) => {
  // POST / - Crear nueva solicitud
  fastify.post<{
    Body: CrearSolicitudBody
  }>(
    '/',
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireRole(['ADMIN', 'OPERARIO']),
      ],
      schema: {
        tags: ['Solicitudes'],
        summary: 'Crear nueva solicitud de compra',
        description: 'Crear una nueva solicitud de compra',
        body: {
          type: 'object',
          required: ['productoId', 'cantidad'],
          properties: {
            productoId: { type: 'string' },
            cantidad: { type: 'integer', minimum: 1 },
            justificacion: { type: 'string' },
            urgente: { type: 'boolean', default: false },
          },
        },
        response: {
          201: {
            type: 'object',
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const data = crearSolicitudSchema.parse(request.body)
        const userId = request.currentUser!.userId

        // Verificar que el producto existe
        const producto = await fastify.prisma.producto.findUnique({
          where: { id: data.productoId },
        })

        if (!producto) {
          return reply.status(404).send({
            error: 'Producto no encontrado',
          })
        }

        // Crear historial inicial
        const historial = [
          {
            fecha: new Date().toISOString(),
            accion: 'CREADA',
            usuarioId: userId,
            comentario: data.justificacion || 'Solicitud creada',
            urgente: data.urgente,
          },
        ]

        // Crear la solicitud (directamente en estado PENDIENTE)
        const solicitud = await fastify.prisma.solicitudCompra.create({
          data: {
            productoId: data.productoId,
            cantidad: data.cantidad,
            estado: 'PENDIENTE',
            creadorId: userId,
            historialJSON: JSON.stringify(historial),
          },
          include: {
            producto: true,
            creador: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        })

        reply.status(201).send(solicitud)
      } catch (error: any) {
        request.log.error(error)
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Datos inválidos',
            details: error.errors,
          })
        }
        reply.status(500).send({
          error: 'Error al crear la solicitud',
          message: error.message,
        })
      }
    }
  )

  // GET / - Listar solicitudes
  fastify.get<{
    Querystring: {
      estado?: string
      productoId?: string
    }
  }>(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Solicitudes'],
        summary: 'Listar solicitudes de compra',
        description: 'Obtener todas las solicitudes de compra',
        querystring: {
          type: 'object',
          properties: {
            estado: { type: 'string' },
            productoId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'array',
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { estado, productoId } = request.query

        const where: any = {}
        if (estado) where.estado = estado
        if (productoId) where.productoId = productoId

        const solicitudes = await fastify.prisma.solicitudCompra.findMany({
          where,
          include: {
            producto: {
              select: {
                id: true,
                sku: true,
                nombre: true,
                unidad: true,
                costo: true,
              },
            },
            creador: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            aprobadorActual: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            fechaCreacion: 'desc',
          },
        })

        // Parsear historialJSON y agregar campo urgente
        const solicitudesConDatos = solicitudes.map((s: any) => {
          let urgente = false
          try {
            const historial = JSON.parse(s.historialJSON || '[]')
            urgente = historial.some((h: any) => h.urgente === true)
          } catch (e) {
            // Ignorar errores de parsing
          }

          return {
            ...s,
            urgente,
            creadoPor: s.creador,
            creadoPorId: s.creadorId,
            createdAt: s.fechaCreacion,
          }
        })

        reply.send(solicitudesConDatos)
      } catch (error: any) {
        request.log.error(error)
        reply.status(500).send({
          error: 'Error al obtener las solicitudes',
          message: error.message,
        })
      }
    }
  )

  // GET /:id - Obtener solicitud por ID
  fastify.get<{
    Params: { id: string }
  }>(
    '/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Solicitudes'],
        summary: 'Obtener solicitud por ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params

        const solicitud = await fastify.prisma.solicitudCompra.findUnique({
          where: { id },
          include: {
            producto: true,
            creador: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            aprobadorActual: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            aprobaciones: {
              include: {
                aprobador: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        })

        if (!solicitud) {
          return reply.status(404).send({
            error: 'Solicitud no encontrada',
          })
        }

        reply.send(solicitud)
      } catch (error: any) {
        request.log.error(error)
        reply.status(500).send({
          error: 'Error al obtener la solicitud',
          message: error.message,
        })
      }
    }
  )

  // PATCH /:id/aprobar - Aprobar solicitud
  fastify.patch<{
    Params: { id: string }
  }>(
    '/:id/aprobar',
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireRole(['ADMIN', 'APROBADOR']),
      ],
      schema: {
        tags: ['Solicitudes'],
        summary: 'Aprobar solicitud',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const userId = request.currentUser!.userId

        const solicitud = await fastify.prisma.solicitudCompra.findUnique({
          where: { id },
        })

        if (!solicitud) {
          return reply.status(404).send({
            error: 'Solicitud no encontrada',
          })
        }

        if (
          solicitud.estado !== 'EN_APROBACION' &&
          solicitud.estado !== 'PENDIENTE'
        ) {
          return reply.status(400).send({
            error: 'La solicitud no puede ser aprobada en su estado actual',
          })
        }

        const historial = JSON.parse(solicitud.historialJSON || '[]')
        historial.push({
          fecha: new Date().toISOString(),
          accion: 'APROBADA',
          usuarioId: userId,
          comentario: 'Solicitud aprobada',
        })

        const solicitudAprobada = await fastify.prisma.solicitudCompra.update({
          where: { id },
          data: {
            estado: 'APROBADA',
            aprobadorActualId: userId,
            historialJSON: JSON.stringify(historial),
          },
          include: {
            producto: true,
            creador: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        })

        reply.send(solicitudAprobada)
      } catch (error: any) {
        request.log.error(error)
        reply.status(500).send({
          error: 'Error al aprobar la solicitud',
          message: error.message,
        })
      }
    }
  )

  // PATCH /:id/rechazar - Rechazar solicitud
  fastify.patch<{
    Params: { id: string }
    Body: RechazarSolicitudBody
  }>(
    '/:id/rechazar',
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireRole(['ADMIN', 'APROBADOR']),
      ],
      schema: {
        tags: ['Solicitudes'],
        summary: 'Rechazar solicitud',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['comentario'],
          properties: {
            comentario: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const data = rechazarSolicitudSchema.parse(request.body)
        const userId = request.currentUser!.userId

        const solicitud = await fastify.prisma.solicitudCompra.findUnique({
          where: { id },
        })

        if (!solicitud) {
          return reply.status(404).send({
            error: 'Solicitud no encontrada',
          })
        }

        if (
          solicitud.estado !== 'EN_APROBACION' &&
          solicitud.estado !== 'BORRADOR'
        ) {
          return reply.status(400).send({
            error: 'La solicitud no puede ser rechazada en su estado actual',
          })
        }

        const historial = JSON.parse(solicitud.historialJSON || '[]')
        historial.push({
          fecha: new Date().toISOString(),
          accion: 'RECHAZADA',
          usuarioId: userId,
          comentario: data.comentario,
        })

        const solicitudRechazada = await fastify.prisma.solicitudCompra.update({
          where: { id },
          data: {
            estado: 'RECHAZADA',
            aprobadorActualId: userId,
            historialJSON: JSON.stringify(historial),
          },
          include: {
            producto: true,
            creador: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        })

        reply.send(solicitudRechazada)
      } catch (error: any) {
        request.log.error(error)
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Datos inválidos',
            details: error.errors,
          })
        }
        reply.status(500).send({
          error: 'Error al rechazar la solicitud',
          message: error.message,
        })
      }
    }
  )
}

export default solicitudesRoutes
