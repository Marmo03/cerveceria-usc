// Controlador de Inventario - API Facade
// Endpoints: POST /inventario/movimientos, GET /inventario/movimientos, GET /inventario/resumen

import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  PaginationSchema,
  validateZodSchema,
  successResponse,
  errorResponse,
} from '../types/api.js'

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

const inventarioRoutes: FastifyPluginAsync = async (fastify) => {
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
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              details: { type: 'array' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
          409: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
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

        // TODO: Usar caso de uso correspondiente
        // const resultado = await registrarMovimientoUC.execute({
        //   ...datosMovimiento,
        //   usuarioId
        // });

        // Mock response por ahora
        const mockResultado = {
          movimiento: {
            id: 'mov-123',
            productoId: datosMovimiento.productoId,
            tipo: datosMovimiento.tipo,
            cantidad: datosMovimiento.cantidad,
            fecha: new Date().toISOString(),
          },
          stockAnterior: 100,
          stockNuevo:
            datosMovimiento.tipo === 'ENTRADA'
              ? 100 + datosMovimiento.cantidad
              : 100 - datosMovimiento.cantidad,
        }

        return reply
          .status(201)
          .send(
            successResponse(mockResultado, 'Movimiento registrado exitosamente')
          )
      } catch (error) {
        request.log.error('Error registrando movimiento:', error)

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
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    productoId: { type: 'string' },
                    tipo: { type: 'string' },
                    cantidad: { type: 'number' },
                    fecha: { type: 'string', format: 'date-time' },
                    usuarioId: { type: 'string' },
                    comentario: { type: 'string' },
                    referencia: { type: 'string' },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  total: { type: 'number' },
                  pages: { type: 'number' },
                  hasNextPage: { type: 'boolean' },
                  hasPrevPage: { type: 'boolean' },
                },
              },
            },
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

        // TODO: Usar caso de uso para consultar movimientos
        // const resultado = await consultarMovimientosUC.execute(filtros);

        // Mock response
        const mockMovimientos = []
        const mockTotal = 0

        return {
          data: mockMovimientos,
          pagination: {
            page: filtros.page,
            limit: filtros.limit,
            total: mockTotal,
            pages: Math.ceil(mockTotal / filtros.limit),
            hasNextPage: filtros.page < Math.ceil(mockTotal / filtros.limit),
            hasPrevPage: filtros.page > 1,
          },
        }
      } catch (error) {
        request.log.error('Error consultando movimientos:', error)
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
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  totalProductos: { type: 'number' },
                  productosActivos: { type: 'number' },
                  productosStockBajo: { type: 'number' },
                  valorTotalInventario: { type: 'number' },
                  ultimosMovimientos: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        productoNombre: { type: 'string' },
                        tipo: { type: 'string' },
                        cantidad: { type: 'number' },
                        fecha: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // TODO: Usar caso de uso para obtener estadísticas
        // const resumen = await obtenerResumenInventarioUC.execute();

        // Mock response
        const mockResumen = {
          totalProductos: 25,
          productosActivos: 23,
          productosStockBajo: 3,
          valorTotalInventario: 45000.5,
          ultimosMovimientos: [
            {
              id: 'mov-1',
              productoNombre: 'Producto A',
              tipo: 'SALIDA',
              cantidad: 10,
              fecha: new Date().toISOString(),
            },
            {
              id: 'mov-2',
              productoNombre: 'Producto B',
              tipo: 'ENTRADA',
              cantidad: 50,
              fecha: new Date(Date.now() - 3600000).toISOString(),
            },
          ],
        }

        return successResponse(mockResumen)
      } catch (error) {
        request.log.error('Error obteniendo resumen:', error)
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
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  alertas: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        productoId: { type: 'string' },
                        sku: { type: 'string' },
                        nombre: { type: 'string' },
                        stockActual: { type: 'number' },
                        stockMinimo: { type: 'number' },
                        prioridad: {
                          type: 'string',
                          enum: ['ALTA', 'MEDIA', 'BAJA'],
                        },
                        diasSinStock: { type: 'number' },
                      },
                    },
                  },
                  resumen: {
                    type: 'object',
                    properties: {
                      totalAlertas: { type: 'number' },
                      alertasAlta: { type: 'number' },
                      alertasMedia: { type: 'number' },
                      alertasBaja: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // TODO: Usar caso de uso para obtener alertas
        // const alertas = await obtenerAlertasStockUC.execute();

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
            {
              productoId: 'prod-2',
              sku: 'SKU002',
              nombre: 'Producto B',
              stockActual: 8,
              stockMinimo: 15,
              prioridad: 'MEDIA' as const,
              diasSinStock: 7,
            },
          ],
          resumen: {
            totalAlertas: 2,
            alertasAlta: 1,
            alertasMedia: 1,
            alertasBaja: 0,
          },
        }

        return successResponse(mockAlertas)
      } catch (error) {
        request.log.error('Error obteniendo alertas:', error)
        return reply
          .status(500)
          .send(errorResponse('Error interno del servidor'))
      }
    }
  )
}

export default inventarioRoutes
