import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

// Schema de validación para crear solicitud
const crearSolicitudSchema = z.object({
  productoId: z.string().uuid(),
  cantidad: z.number().int().positive(),
  justificacion: z.string().optional(),
  urgente: z.boolean().optional().default(false),
})

// Schema de validación para rechazar solicitud
const rechazarSolicitudSchema = z.object({
  comentario: z.string().min(1, 'El comentario es requerido'),
})

// Schema de validación para actualizar cantidad
const actualizarCantidadSchema = z.object({
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
})

type CrearSolicitudBody = z.infer<typeof crearSolicitudSchema>
type RechazarSolicitudBody = z.infer<typeof rechazarSolicitudSchema>
type ActualizarCantidadBody = z.infer<typeof actualizarCantidadSchema>

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
        const productoResult = await fastify.db.query(
          'SELECT id, sku, nombre, costo FROM productos WHERE id = $1',
          [data.productoId]
        )

        if (productoResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'Producto no encontrado',
          })
        }

        const producto = productoResult.rows[0]

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

        // Crear la solicitud
        const { randomUUID } = await import('crypto')
        const solicitudId = randomUUID()
        const now = new Date()

        const solicitudResult = await fastify.db.query(`
          INSERT INTO solicitudes_compra (
            id, "productoId", cantidad, estado, "creadorId", "historialJSON", "fechaCreacion"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, "productoId", cantidad, estado, "creadorId", "fechaCreacion", "historialJSON"
        `, [
          solicitudId,
          data.productoId,
          data.cantidad,
          'PENDIENTE',
          userId,
          JSON.stringify(historial),
          now
        ])

        // Obtener datos del creador
        const creadorResult = await fastify.db.query(
          'SELECT id, "firstName", "lastName", email FROM users WHERE id = $1',
          [userId]
        )

        const solicitud = {
          ...solicitudResult.rows[0],
          producto,
          creador: creadorResult.rows[0],
        }

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

        // Construir WHERE dinámico
        const conditions: string[] = []
        const values: any[] = []
        let paramCount = 0

        if (estado) {
          paramCount++
          conditions.push(`sc.estado = $${paramCount}`)
          values.push(estado)
        }

        if (productoId) {
          paramCount++
          conditions.push(`sc."productoId" = $${paramCount}`)
          values.push(productoId)
        }

        const whereClause = conditions.length > 0 
          ? `WHERE ${conditions.join(' AND ')}` 
          : ''

        const solicitudesResult = await fastify.db.query(`
          SELECT 
            sc.id, sc."productoId", sc.cantidad, sc.estado, sc."creadorId", 
            sc."aprobadorActualId", sc."fechaCreacion", sc."historialJSON",
            json_build_object(
              'id', p.id,
              'sku', p.sku,
              'nombre', p.nombre,
              'unidad', p.unidad,
              'costo', p.costo
            ) as producto,
            json_build_object(
              'id', c.id,
              'firstName', c."firstName",
              'lastName', c."lastName",
              'email', c.email
            ) as creador,
            CASE 
              WHEN sc."aprobadorActualId" IS NOT NULL THEN
                json_build_object(
                  'id', a.id,
                  'firstName', a."firstName",
                  'lastName', a."lastName",
                  'email', a.email
                )
              ELSE NULL
            END as "aprobadorActual"
          FROM solicitudes_compra sc
          INNER JOIN productos p ON sc."productoId" = p.id
          INNER JOIN users c ON sc."creadorId" = c.id
          LEFT JOIN users a ON sc."aprobadorActualId" = a.id
          ${whereClause}
          ORDER BY sc."fechaCreacion" DESC
        `, values)

        // Parsear historialJSON y agregar campo urgente
        const solicitudesConDatos = solicitudesResult.rows.map((s: any) => {
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

        const solicitudResult = await fastify.db.query(`
          SELECT 
            sc.id, sc."productoId", sc.cantidad, sc.estado, sc."creadorId", 
            sc."aprobadorActualId", sc."fechaCreacion", sc."historialJSON",
            json_build_object(
              'id', p.id,
              'sku', p.sku,
              'nombre', p.nombre,
              'descripcion', p.descripcion,
              'unidad', p.unidad,
              'costo', p.costo,
              'stockActual', p."stockActual",
              'stockMin', p."stockMin"
            ) as producto,
            json_build_object(
              'id', c.id,
              'firstName', c."firstName",
              'lastName', c."lastName",
              'email', c.email
            ) as creador,
            CASE 
              WHEN sc."aprobadorActualId" IS NOT NULL THEN
                json_build_object(
                  'id', a.id,
                  'firstName', a."firstName",
                  'lastName', a."lastName",
                  'email', a.email
                )
              ELSE NULL
            END as "aprobadorActual"
          FROM solicitudes_compra sc
          INNER JOIN productos p ON sc."productoId" = p.id
          INNER JOIN users c ON sc."creadorId" = c.id
          LEFT JOIN users a ON sc."aprobadorActualId" = a.id
          WHERE sc.id = $1
        `, [id])

        if (solicitudResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'Solicitud no encontrada',
          })
        }

        // Obtener aprobaciones si existen
        const aprobacionesResult = await fastify.db.query(`
          SELECT 
            ap.id, ap."solicitudCompraId", ap."aprobadorId", ap.decision, 
            ap.comentario, ap."fechaDecision",
            json_build_object(
              'id', u.id,
              'firstName', u."firstName",
              'lastName', u."lastName",
              'email', u.email
            ) as aprobador
          FROM aprobaciones_solicitud ap
          INNER JOIN users u ON ap."aprobadorId" = u.id
          WHERE ap."solicitudCompraId" = $1
          ORDER BY ap."fechaDecision" DESC
        `, [id])

        const solicitud = {
          ...solicitudResult.rows[0],
          aprobaciones: aprobacionesResult.rows,
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
        
        // Verificar que el usuario está autenticado
        if (!request.currentUser || !request.currentUser.userId) {
          return reply.status(401).send({
            error: 'Usuario no autenticado',
          })
        }
        
        const userId = request.currentUser.userId

        const solicitudResult = await fastify.db.query(
          'SELECT id, estado, "historialJSON" FROM solicitudes_compra WHERE id = $1',
          [id]
        )

        if (solicitudResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'Solicitud no encontrada',
          })
        }

        const solicitud = solicitudResult.rows[0]

        // Solo no permitir aprobar si ya fue aprobada o rechazada
        if (solicitud.estado === 'APROBADA' || solicitud.estado === 'RECHAZADA') {
          return reply.status(400).send({
            error: `La solicitud no puede ser aprobada porque ya fue ${solicitud.estado.toLowerCase()}`,
          })
        }

        const historial = JSON.parse(solicitud.historialJSON || '[]')
        historial.push({
          fecha: new Date().toISOString(),
          accion: 'APROBADA',
          usuarioId: userId,
          comentario: 'Solicitud aprobada',
        })

        await fastify.db.query(`
          UPDATE solicitudes_compra 
          SET estado = $1, "aprobadorActualId" = $2, "historialJSON" = $3
          WHERE id = $4
        `, ['APROBADA', userId, JSON.stringify(historial), id])

        // Obtener solicitud actualizada con relaciones
        const solicitudAprobadaResult = await fastify.db.query(`
          SELECT 
            sc.id, sc."productoId", sc.cantidad, sc.estado, sc."creadorId", 
            sc."aprobadorActualId", sc."fechaCreacion", sc."historialJSON",
            json_build_object(
              'id', p.id,
              'sku', p.sku,
              'nombre', p.nombre,
              'unidad', p.unidad,
              'costo', p.costo
            ) as producto,
            json_build_object(
              'id', c.id,
              'firstName', c."firstName",
              'lastName', c."lastName",
              'email', c.email
            ) as creador
          FROM solicitudes_compra sc
          INNER JOIN productos p ON sc."productoId" = p.id
          INNER JOIN users c ON sc."creadorId" = c.id
          WHERE sc.id = $1
        `, [id])

        reply.send(solicitudAprobadaResult.rows[0])
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
        
        if (!request.currentUser || !request.currentUser.userId) {
          return reply.status(401).send({
            error: 'Usuario no autenticado',
          })
        }
        
        const userId = request.currentUser.userId

        const solicitudResult = await fastify.db.query(
          'SELECT id, estado, "historialJSON" FROM solicitudes_compra WHERE id = $1',
          [id]
        )

        if (solicitudResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'Solicitud no encontrada',
          })
        }

        const solicitud = solicitudResult.rows[0]

        // Solo no permitir rechazar si ya fue aprobada o rechazada
        if (solicitud.estado === 'APROBADA' || solicitud.estado === 'RECHAZADA') {
          return reply.status(400).send({
            error: `La solicitud no puede ser rechazada porque ya fue ${solicitud.estado.toLowerCase()}`,
          })
        }

        const historial = JSON.parse(solicitud.historialJSON || '[]')
        historial.push({
          fecha: new Date().toISOString(),
          accion: 'RECHAZADA',
          usuarioId: userId,
          comentario: data.comentario,
        })

        await fastify.db.query(`
          UPDATE solicitudes_compra 
          SET estado = $1, "aprobadorActualId" = $2, "historialJSON" = $3
          WHERE id = $4
        `, ['RECHAZADA', userId, JSON.stringify(historial), id])

        // Obtener solicitud actualizada con relaciones
        const solicitudRechazadaResult = await fastify.db.query(`
          SELECT 
            sc.id, sc."productoId", sc.cantidad, sc.estado, sc."creadorId", 
            sc."aprobadorActualId", sc."fechaCreacion", sc."historialJSON",
            json_build_object(
              'id', p.id,
              'sku', p.sku,
              'nombre', p.nombre,
              'unidad', p.unidad,
              'costo', p.costo
            ) as producto,
            json_build_object(
              'id', c.id,
              'firstName', c."firstName",
              'lastName', c."lastName",
              'email', c.email
            ) as creador
          FROM solicitudes_compra sc
          INNER JOIN productos p ON sc."productoId" = p.id
          INNER JOIN users c ON sc."creadorId" = c.id
          WHERE sc.id = $1
        `, [id])

        reply.send(solicitudRechazadaResult.rows[0])
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

  // PATCH /:id/cantidad - Actualizar cantidad de solicitud pendiente
  fastify.patch<{
    Params: { id: string }
    Body: ActualizarCantidadBody
  }>(
    '/:id/cantidad',
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireRole(['ADMIN', 'APROBADOR']),
      ],
      schema: {
        tags: ['Solicitudes'],
        summary: 'Actualizar cantidad de solicitud pendiente',
        description: 'Permite a ADMIN o APROBADOR modificar la cantidad de una solicitud pendiente',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['cantidad'],
          properties: {
            cantidad: { type: 'integer', minimum: 1 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const data = actualizarCantidadSchema.parse(request.body)
        
        if (!request.currentUser || !request.currentUser.userId) {
          return reply.status(401).send({
            error: 'Usuario no autenticado',
          })
        }
        
        const userId = request.currentUser.userId

        // Verificar que la solicitud existe y está aprobada
        const solicitudResult = await fastify.db.query(
          'SELECT id, estado, cantidad, "historialJSON" FROM solicitudes_compra WHERE id = $1',
          [id]
        )

        if (solicitudResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'Solicitud no encontrada',
          })
        }

        const solicitud = solicitudResult.rows[0]

        // Solo permitir editar si está pendiente
        if (solicitud.estado !== 'PENDIENTE') {
          return reply.status(400).send({
            error: 'Solo se puede modificar la cantidad de solicitudes pendientes',
          })
        }

        const cantidadAnterior = solicitud.cantidad

        // Actualizar historial
        const historial = JSON.parse(solicitud.historialJSON || '[]')
        historial.push({
          fecha: new Date().toISOString(),
          accion: 'CANTIDAD_MODIFICADA',
          usuarioId: userId,
          comentario: `Cantidad modificada de ${cantidadAnterior} a ${data.cantidad}`,
          cantidadAnterior,
          cantidadNueva: data.cantidad,
        })

        // Actualizar cantidad
        await fastify.db.query(`
          UPDATE solicitudes_compra 
          SET cantidad = $1, "historialJSON" = $2
          WHERE id = $3
        `, [data.cantidad, JSON.stringify(historial), id])

        // Obtener solicitud actualizada con relaciones
        const solicitudActualizadaResult = await fastify.db.query(`
          SELECT 
            sc.id, sc."productoId", sc.cantidad, sc.estado, sc."creadorId", 
            sc."aprobadorActualId", sc."fechaCreacion", sc."historialJSON",
            json_build_object(
              'id', p.id,
              'sku', p.sku,
              'nombre', p.nombre,
              'unidad', p.unidad,
              'costo', p.costo
            ) as producto,
            json_build_object(
              'id', c.id,
              'firstName', c."firstName",
              'lastName', c."lastName",
              'email', c.email
            ) as creador
          FROM solicitudes_compra sc
          INNER JOIN productos p ON sc."productoId" = p.id
          INNER JOIN users c ON sc."creadorId" = c.id
          WHERE sc.id = $1
        `, [id])

        reply.send(solicitudActualizadaResult.rows[0])
      } catch (error: any) {
        request.log.error(error)
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Datos inválidos',
            details: error.errors,
          })
        }
        reply.status(500).send({
          error: 'Error al actualizar la cantidad',
          message: error.message,
        })
      }
    }
  )
}

export default solicitudesRoutes
