// Controlador de Inventario Actualizado - Con dependencias reales
// Usa casos de uso reales del contenedor de dependencias

import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  PaginationSchema,
  validateZodSchema,
  successResponse,
  errorResponse,
} from '../types/api.js'
import { getDIContainer } from '../config/container.js'
import { TipoMovimiento } from '../domain/entities.js'

// Schemas de validación
const RegistrarMovimientoSchema = z.object({
  productoId: z.string().uuid('ID de producto debe ser un UUID válido'),
  tipo: z.enum(['ENTRADA', 'SALIDA'], {
    errorMap: () => ({ message: 'Tipo debe ser ENTRADA o SALIDA' }),
  }),
  cantidad: z
    .number()
    .int()
    .positive('La cantidad debe ser un número positivo'),
  comentario: z.string().optional(),
  referencia: z.string().optional(),
})

const FiltrosMovimientoSchema = z
  .object({
    productoId: z.string().uuid().optional(),
    tipo: z.enum(['ENTRADA', 'SALIDA']).optional(),
    fechaDesde: z.string().datetime().optional(),
    fechaHasta: z.string().datetime().optional(),
  })
  .merge(PaginationSchema)

// Tipos TypeScript
type RegistrarMovimientoBody = z.infer<typeof RegistrarMovimientoSchema>
type FiltrosMovimientoQuery = z.infer<typeof FiltrosMovimientoSchema>

const inventarioRoutesV2: FastifyPluginAsync = async (fastify) => {
  // Obtener contenedor de dependencias
  const container = getDIContainer()

  // POST /inventario/movimientos - Registrar movimiento de inventario
  fastify.post<{
    Body: RegistrarMovimientoBody
  }>(
    '/movimientos',
    {
      schema: {
        tags: ['inventario'],
        summary: 'Registrar movimiento de inventario',
        description:
          'Registra una entrada o salida de inventario para un producto',
        body: {
          type: 'object',
          properties: {
            productoId: { type: 'string', format: 'uuid' },
            tipo: { type: 'string', enum: ['ENTRADA', 'SALIDA'] },
            cantidad: { type: 'number', minimum: 1 },
            comentario: { type: 'string' },
            referencia: { type: 'string' },
          },
          required: ['productoId', 'tipo', 'cantidad'],
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  movimiento: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      productoId: { type: 'string' },
                      tipo: { type: 'string' },
                      cantidad: { type: 'number' },
                      fecha: { type: 'string', format: 'date-time' },
                    },
                  },
                  stockAnterior: { type: 'number' },
                  stockNuevo: { type: 'number' },
                },
              },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Validar datos de entrada
        const datosMovimiento = validateZodSchema(
          RegistrarMovimientoSchema,
          request.body
        )

        // TODO: Obtener usuario del contexto de autenticación
        const usuarioId = 'mock-user-id' // request.user?.id

        // Usar el caso de uso apropiado según el tipo
        let resultado

        if (datosMovimiento.tipo === 'ENTRADA') {
          resultado = await container.registrarEntradaInventarioUC.execute({
            ...datosMovimiento,
            tipo: TipoMovimiento.ENTRADA,
            usuarioId,
          })
        } else {
          resultado = await container.registrarSalidaInventarioUC.execute({
            ...datosMovimiento,
            tipo: TipoMovimiento.SALIDA,
            usuarioId,
          })
        }

        return reply
          .status(201)
          .send(
            successResponse(resultado, 'Movimiento registrado exitosamente')
          )
      } catch (error) {
        fastify.log.error('Error registrando movimiento:', error)

        // Manejar errores específicos
        if (error instanceof Error) {
          if (error.message.includes('Stock insuficiente')) {
            return reply
              .status(409)
              .send(
                errorResponse('Stock insuficiente', [
                  { message: error.message },
                ])
              )
          }

          if (error.message.includes('no encontrado')) {
            return reply
              .status(404)
              .send(errorResponse('Producto no encontrado'))
          }
        }

        return reply
          .status(500)
          .send(errorResponse('Error interno del servidor'))
      }
    }
  )

  // GET /inventario/movimientos - Listar movimientos con filtros
  fastify.get<{
    Querystring: FiltrosMovimientoQuery
  }>(
    '/movimientos',
    {
      schema: {
        tags: ['inventario'],
        summary: 'Listar movimientos de inventario',
        description: 'Obtiene lista de movimientos con filtros opcionales',
        querystring: {
          type: 'object',
          properties: {
            productoId: { type: 'string', format: 'uuid' },
            tipo: { type: 'string', enum: ['ENTRADA', 'SALIDA'] },
            fechaDesde: { type: 'string', format: 'date-time' },
            fechaHasta: { type: 'string', format: 'date-time' },
            page: { type: 'number', minimum: 1, default: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const filtros = validateZodSchema(
          FiltrosMovimientoSchema,
          request.query
        )

        // Convertir fechas si están presentes
        const filtrosRepo: any = { ...filtros }
        if (filtros.fechaDesde) {
          filtrosRepo.fechaDesde = new Date(filtros.fechaDesde)
        }
        if (filtros.fechaHasta) {
          filtrosRepo.fechaHasta = new Date(filtros.fechaHasta)
        }
        if (filtros.tipo) {
          filtrosRepo.tipo =
            filtros.tipo === 'ENTRADA'
              ? TipoMovimiento.ENTRADA
              : TipoMovimiento.SALIDA
        }

        // Usar repositorio directamente para consulta
        const movimientos =
          await container.movimientoInventarioRepo.findAll(filtrosRepo)

        return {
          data: movimientos,
          pagination: {
            page: filtros.page || 1,
            limit: filtros.limit || 20,
            total: movimientos.length, // TODO: implementar count real
            pages: Math.ceil(movimientos.length / (filtros.limit || 20)),
            hasNextPage: false, // TODO: calcular correctamente
            hasPrevPage: (filtros.page || 1) > 1,
          },
        }
      } catch (error) {
        fastify.log.error('Error consultando movimientos:', error)
        return reply
          .status(500)
          .send(errorResponse('Error interno del servidor'))
      }
    }
  )

  // GET /inventario/resumen - Obtener resumen de inventario
  fastify.get(
    '/resumen',
    {
      schema: {
        tags: ['inventario'],
        summary: 'Obtener resumen de inventario',
        description: 'Estadísticas generales del inventario actual',
      },
    },
    async (request, reply) => {
      try {
        // TODO: Implementar casos de uso de resumen cuando estén listos
        // const resumen = await container.obtenerResumenInventarioUC.execute();

        // Mock response mejorado
        const mockResumen = {
          totalProductos: 25,
          productosActivos: 23,
          productosStockBajo: 3,
          valorTotalInventario: 45000.5,
          ultimosMovimientos: await container.movimientoInventarioRepo.findAll({
            limit: 5,
          }),
        }

        return successResponse(mockResumen)
      } catch (error) {
        fastify.log.error('Error obteniendo resumen:', error)
        return reply
          .status(500)
          .send(errorResponse('Error interno del servidor'))
      }
    }
  )

  // GET /inventario/alertas - Obtener alertas de stock
  fastify.get(
    '/alertas',
    {
      schema: {
        tags: ['inventario'],
        summary: 'Obtener alertas de stock bajo',
        description: 'Lista de productos que requieren atención por stock bajo',
      },
    },
    async (request, reply) => {
      try {
        // TODO: Implementar caso de uso de alertas cuando esté listo
        // const alertas = await container.obtenerAlertasStockUC.execute();

        // Mock response
        const mockAlertas = {
          alertas: [
            {
              productoId: 'prod-1',
              sku: 'SKU001',
              nombre: 'Producto A',
              stockActual: 2,
              stockMinimo: 10,
              prioridad: 'ALTA' as const,
              diasSinStock: 3,
            },
          ],
          resumen: {
            totalAlertas: 1,
            alertasAlta: 1,
            alertasMedia: 0,
            alertasBaja: 0,
          },
        }

        return successResponse(mockAlertas)
      } catch (error) {
        fastify.log.error('Error obteniendo alertas:', error)
        return reply
          .status(500)
          .send(errorResponse('Error interno del servidor'))
      }
    }
  )
}

export default inventarioRoutesV2
