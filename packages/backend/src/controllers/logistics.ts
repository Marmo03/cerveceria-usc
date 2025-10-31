import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { LogisticsService } from '../services/logistics.js'
import { LogisticsRepository } from '../repositories/logistics.js'
import {
  createTransportistaSchema,
  updateTransportistaSchema,
  createEnvioSchema,
  updateEnvioSchema,
  createRutaEnvioSchema,
  updateRutaEnvioSchema,
  createEstadoEnvioSchema,
  createProductoEnvioSchema,
  updateProductoEnvioSchema,
  listEnviosQuerySchema,
  listTransportistasQuerySchema,
  type CreateTransportistaInput,
  type UpdateTransportistaInput,
  type CreateEnvioInput,
  type UpdateEnvioInput,
  type CreateRutaEnvioInput,
  type UpdateRutaEnvioInput,
  type CreateEstadoEnvioInput,
  type CreateProductoEnvioInput,
  type UpdateProductoEnvioInput,
} from '../schemas/logistics.js'

const logisticsRoutes: FastifyPluginAsync = async (server) => {
  const repository = new LogisticsRepository(server.prisma)
  const service = new LogisticsService(repository)

  // ===== RUTAS DE TRANSPORTISTAS =====

  // POST /api/logistics/transportistas - Crear transportista
  server.post<{ Body: CreateTransportistaInput }>(
    '/transportistas',
    {
      schema: {
        tags: ['logistics'],
        description: 'Crear un nuevo transportista',
        summary: 'Crear transportista',
      },
    },
    async (request, reply) => {
      try {
        const validatedData = createTransportistaSchema.parse(request.body)
        const transportista = await service.createTransportista(validatedData)
        return reply.status(201).send({
          success: true,
          data: transportista,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // GET /api/logistics/transportistas - Listar transportistas
  server.get(
    '/transportistas',
    {
      schema: {
        tags: ['logistics'],
        description: 'Listar todos los transportistas',
      },
    },
    async (request, reply) => {
      try {
        const query = listTransportistasQuerySchema.parse(request.query)
        const result = await service.listTransportistas(query)
        return reply.send({
          success: true,
          ...result,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // GET /api/logistics/transportistas/:id - Obtener transportista por ID
  server.get<{ Params: { id: string } }>(
    '/transportistas/:id',
    {
      schema: {
        tags: ['logistics'],
        description: 'Obtener un transportista por ID',
      },
    },
    async (request, reply) => {
      try {
        const transportista = await service.getTransportistaById(
          request.params.id
        )
        return reply.send({
          success: true,
          data: transportista,
        })
      } catch (error: any) {
        return reply.status(404).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // PATCH /api/logistics/transportistas/:id - Actualizar transportista
  server.patch<{ Params: { id: string }; Body: UpdateTransportistaInput }>(
    '/transportistas/:id',
    {
      schema: {
        tags: ['logistics'],
        description: 'Actualizar un transportista',
        summary: 'Actualizar transportista',
      },
    },
    async (request, reply) => {
      try {
        const validatedData = updateTransportistaSchema.parse(request.body)
        const transportista = await service.updateTransportista(
          request.params.id,
          validatedData
        )
        return reply.send({
          success: true,
          data: transportista,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // DELETE /api/logistics/transportistas/:id - Desactivar transportista
  server.delete<{ Params: { id: string } }>(
    '/transportistas/:id',
    {
      schema: {
        tags: ['logistics'],
        description: 'Desactivar un transportista',
        summary: 'Desactivar transportista',
      },
    },
    async (request, reply) => {
      try {
        const transportista = await service.deleteTransportista(
          request.params.id
        )
        return reply.send({
          success: true,
          data: transportista,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // ===== RUTAS DE ENVÍOS =====

  // POST /api/logistics/envios - Crear envío
  server.post<{ Body: CreateEnvioInput }>(
    '/envios',
    {
      schema: {
        tags: ['logistics'],
        description: 'Crear un nuevo envío',
        summary: 'Crear envío',
      },
    },
    async (request, reply) => {
      try {
        const validatedData = createEnvioSchema.parse(request.body)
        const envio = await service.createEnvio(validatedData)
        return reply.status(201).send({
          success: true,
          data: envio,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // GET /api/logistics/envios - Listar envíos
  server.get(
    '/envios',
    {
      schema: {
        tags: ['logistics'],
        description: 'Listar todos los envíos',
        summary: 'Listar envíos',
      },
    },
    async (request, reply) => {
      try {
        const query = listEnviosQuerySchema.parse(request.query)
        const result = await service.listEnvios(query)
        return reply.send({
          success: true,
          ...result,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // GET /api/logistics/envios/:id - Obtener envío por ID
  server.get<{ Params: { id: string } }>(
    '/envios/:id',
    {
      schema: {
        tags: ['logistics'],
        description: 'Obtener un envío por ID',
        summary: 'Obtener envío',
      },
    },
    async (request, reply) => {
      try {
        const envio = await service.getEnvioById(request.params.id)
        return reply.send({
          success: true,
          data: envio,
        })
      } catch (error: any) {
        return reply.status(404).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // GET /api/logistics/envios/tracking/:numeroGuia - Rastrear envío por número de guía
  server.get<{ Params: { numeroGuia: string } }>(
    '/envios/tracking/:numeroGuia',
    {
      schema: {
        tags: ['logistics'],
        description: 'Rastrear un envío por número de guía',
        summary: 'Tracking de envío',
      },
    },
    async (request, reply) => {
      try {
        const envio = await service.getEnvioByNumeroGuia(
          request.params.numeroGuia
        )
        return reply.send({
          success: true,
          data: envio,
        })
      } catch (error: any) {
        return reply.status(404).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // PATCH /api/logistics/envios/:id - Actualizar envío
  server.patch<{ Params: { id: string }; Body: UpdateEnvioInput }>(
    '/envios/:id',
    {
      schema: {
        tags: ['logistics'],
        description: 'Actualizar un envío',
        summary: 'Actualizar envío',
      },
    },
    async (request, reply) => {
      try {
        const validatedData = updateEnvioSchema.parse(request.body)
        const envio = await service.updateEnvio(
          request.params.id,
          validatedData
        )
        return reply.send({
          success: true,
          data: envio,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // POST /api/logistics/envios/:id/cancelar - Cancelar envío
  server.post<{ Params: { id: string }; Body: { descripcion?: string } }>(
    '/envios/:id/cancelar',
    {
      schema: {
        tags: ['logistics'],
        description: 'Cancelar un envío',
        summary: 'Cancelar envío',
      },
    },
    async (request, reply) => {
      try {
        const envio = await service.cancelarEnvio(
          request.params.id,
          request.body.descripcion
        )
        return reply.send({
          success: true,
          data: envio,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // DELETE /api/logistics/envios/:id - Eliminar envío
  server.delete<{ Params: { id: string } }>(
    '/envios/:id',
    {
      schema: {
        tags: ['logistics'],
        description: 'Eliminar un envío',
        summary: 'Eliminar envío',
      },
    },
    async (request, reply) => {
      try {
        await service.deleteEnvio(request.params.id)
        return reply.send({
          success: true,
          message: 'Envío eliminado correctamente',
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // ===== RUTAS DE TRACKING (Estados de Envío) =====

  // POST /api/logistics/envios/:envioId/estados - Crear estado de envío
  server.post<{
    Params: { envioId: string }
    Body: Omit<CreateEstadoEnvioInput, 'envioId'>
  }>(
    '/envios/:envioId/estados',
    {
      schema: {
        tags: ['logistics'],
        description: 'Registrar un nuevo estado del envío (tracking)',
        summary: 'Agregar estado',
      },
    },
    async (request, reply) => {
      try {
        const estadoEnvio = await service.createEstadoEnvio({
          envioId: request.params.envioId,
          ...request.body,
        })
        return reply.status(201).send({
          success: true,
          data: estadoEnvio,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // GET /api/logistics/envios/:envioId/estados - Listar estados de un envío
  server.get<{ Params: { envioId: string } }>(
    '/envios/:envioId/estados',
    {
      schema: {
        tags: ['logistics'],
        description: 'Obtener historial de estados de un envío',
        summary: 'Historial de estados',
      },
    },
    async (request, reply) => {
      try {
        const estados = await service.listEstadosEnvio(request.params.envioId)
        return reply.send({
          success: true,
          data: estados,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // ===== RUTAS DE RUTAS DE ENVÍO =====

  // POST /api/logistics/envios/:envioId/rutas - Crear ruta de envío
  server.post<{
    Params: { envioId: string }
    Body: Omit<CreateRutaEnvioInput, 'envioId'>
  }>(
    '/envios/:envioId/rutas',
    {
      schema: {
        tags: ['logistics'],
        description: 'Agregar una ruta al envío',
        summary: 'Agregar ruta',
      },
    },
    async (request, reply) => {
      try {
        const ruta = await service.createRutaEnvio({
          envioId: request.params.envioId,
          ...request.body,
        })
        return reply.status(201).send({
          success: true,
          data: ruta,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // GET /api/logistics/envios/:envioId/rutas - Listar rutas de un envío
  server.get<{ Params: { envioId: string } }>(
    '/envios/:envioId/rutas',
    {
      schema: {
        tags: ['logistics'],
        description: 'Obtener rutas de un envío',
        summary: 'Listar rutas',
      },
    },
    async (request, reply) => {
      try {
        const rutas = await service.listRutasEnvio(request.params.envioId)
        return reply.send({
          success: true,
          data: rutas,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // PATCH /api/logistics/rutas/:id - Actualizar ruta
  server.patch<{ Params: { id: string }; Body: UpdateRutaEnvioInput }>(
    '/rutas/:id',
    {
      schema: {
        tags: ['logistics'],
        description: 'Actualizar una ruta',
        summary: 'Actualizar ruta',
      },
    },
    async (request, reply) => {
      try {
        const ruta = await service.updateRutaEnvio(
          request.params.id,
          request.body
        )
        return reply.send({
          success: true,
          data: ruta,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // DELETE /api/logistics/rutas/:id - Eliminar ruta
  server.delete<{ Params: { id: string } }>(
    '/rutas/:id',
    {
      schema: {
        tags: ['logistics'],
        description: 'Eliminar una ruta',
        summary: 'Eliminar ruta',
      },
    },
    async (request, reply) => {
      try {
        await service.deleteRutaEnvio(request.params.id)
        return reply.send({
          success: true,
          message: 'Ruta eliminada correctamente',
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // ===== RUTAS DE PRODUCTOS EN ENVÍO =====

  // GET /api/logistics/envios/:envioId/productos - Listar productos de un envío
  server.get<{ Params: { envioId: string } }>(
    '/envios/:envioId/productos',
    {
      schema: {
        tags: ['logistics'],
        description: 'Obtener productos de un envío',
        summary: 'Productos del envío',
      },
    },
    async (request, reply) => {
      try {
        const productos = await service.listProductosEnvio(
          request.params.envioId
        )
        return reply.send({
          success: true,
          data: productos,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // ===== ESTADÍSTICAS =====

  // GET /api/logistics/stats/envios - Estadísticas de envíos
  server.get(
    '/stats/envios',
    {
      schema: {
        tags: ['logistics'],
        description: 'Obtener estadísticas de envíos',
      },
    },
    async (request, reply) => {
      try {
        const stats = await service.getEnviosStats()
        return reply.send({
          success: true,
          data: stats,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // GET /api/logistics/stats/transportistas - Estadísticas de transportistas
  server.get(
    '/stats/transportistas',
    {
      schema: {
        tags: ['logistics'],
        description: 'Obtener estadísticas de transportistas',
      },
    },
    async (request, reply) => {
      try {
        const stats = await service.getTransportistasStats()
        return reply.send({
          success: true,
          data: stats,
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )
}

export default logisticsRoutes
