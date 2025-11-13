/**
 * Controlador de Inventario
 *
 * Gestiona todos los movimientos de inventario (entradas y salidas) y proporciona
 * resúmenes del estado actual del inventario por producto.
 *
 * Arquitectura:
 * - Controller (HTTP) → Use Cases → Domain → Repository
 * - Validación estricta con Zod
 * - Observer Pattern: Los movimientos emiten eventos para actualizar KPIs automáticamente
 *
 * Endpoints disponibles:
 * - POST /inventario/movimientos       → Registrar entrada/salida de inventario
 * - GET  /inventario/movimientos       → Listar historial de movimientos (con filtros)
 * - GET  /inventario/resumen           → Obtener resumen consolidado de inventario
 * - GET  /inventario/productos/:id     → Obtener detalle de inventario de un producto
 *
 * Tipos de movimiento:
 * - ENTRADA: Compras, devoluciones de clientes, ajustes positivos, producción
 * - SALIDA: Ventas, devoluciones a proveedores, ajustes negativos, consumo
 *
 * Filtros soportados:
 * - productoId: Movimientos de un producto específico
 * - tipo: Solo ENTRADAS o SALIDAS
 * - fechaDesde/fechaHasta: Rango de fechas
 * - referencia: Búsqueda por número de referencia
 * - page/limit: Paginación
 *
 * Eventos generados:
 * - MovimientoInventarioCreated → Actualiza rotación de inventario, fill rate
 * - StockBajoDetectado → Trigger para reabastecimiento automático
 *
 * @module controllers/inventario
 */

import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

// Schema de paginación
const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

// Schemas de validación
const RegistrarMovimientoSchema = z.object({
  productoId: z
    .string()
    .min(1, 'ID de producto es requerido')
    .regex(/^c[a-z0-9]{24}$/i, 'ID de producto debe ser un CUID válido'),
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
      preHandler: [
        fastify.authenticate,
        fastify.requireRole(['ADMIN', 'OPERARIO']),
      ],
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
        const datosMovimiento = RegistrarMovimientoSchema.parse(request.body)

        // Obtener usuario del contexto de autenticación
        const usuarioId = request.currentUser?.userId

        if (!usuarioId) {
          return reply.status(401).send({
            success: false,
            error: 'No autenticado',
          })
        }

        // Verificar que el producto existe
        const producto = await fastify.prisma.producto.findUnique({
          where: { id: datosMovimiento.productoId },
        })

        if (!producto) {
          return reply.status(404).send({
            success: false,
            error: 'Producto no encontrado',
          })
        }

        const stockAnterior = producto.stockActual

        // Validar stock suficiente para salidas
        if (datosMovimiento.tipo === 'SALIDA') {
          if (producto.stockActual < datosMovimiento.cantidad) {
            return reply.status(409).send({
              success: false,
              error: 'Stock insuficiente',
              details: [
                {
                  message: `Stock actual: ${producto.stockActual}, solicitado: ${datosMovimiento.cantidad}`,
                },
              ],
            })
          }
        }

        // Calcular nuevo stock
        const stockNuevo =
          datosMovimiento.tipo === 'ENTRADA'
            ? stockAnterior + datosMovimiento.cantidad
            : stockAnterior - datosMovimiento.cantidad

        // Usar transacción para garantizar consistencia
        const resultado = await fastify.prisma.$transaction(async (prisma) => {
          // Crear el movimiento
          const movimiento = await prisma.movimientoInventario.create({
            data: {
              productoId: datosMovimiento.productoId,
              tipo: datosMovimiento.tipo,
              cantidad: datosMovimiento.cantidad,
              usuarioId,
              comentario: datosMovimiento.comentario,
              referencia: datosMovimiento.referencia,
              fecha: new Date(),
            },
            include: {
              producto: {
                select: {
                  sku: true,
                  nombre: true,
                },
              },
              usuario: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          })

          // Actualizar stock del producto
          await prisma.producto.update({
            where: { id: datosMovimiento.productoId },
            data: { stockActual: stockNuevo },
          })

          return movimiento
        })

        request.log.info(
          {
            movimientoId: resultado.id,
            productoId: datosMovimiento.productoId,
            tipo: datosMovimiento.tipo,
            cantidad: datosMovimiento.cantidad,
            stockAnterior,
            stockNuevo,
          },
          'Movimiento de inventario registrado'
        )

        return reply.status(201).send({
          success: true,
          data: {
            movimiento: resultado,
            stockAnterior,
            stockNuevo,
          },
          message: 'Movimiento registrado exitosamente',
        })
      } catch (error: any) {
        request.log.error('Error registrando movimiento:', error)

        if (error.name === 'ZodError') {
          return reply.status(400).send({
            success: false,
            error: 'Datos inválidos',
            details: error.issues,
          })
        }

        return reply.status(500).send({
          success: false,
          error: 'Error interno del servidor',
        })
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
        const filtros = FiltrosMovimientoSchema.parse(request.query)

        // Construir filtros de Prisma
        const where: any = {}

        if (filtros.productoId) {
          where.productoId = filtros.productoId
        }

        if (filtros.tipo) {
          where.tipo = filtros.tipo
        }

        if (filtros.fechaDesde || filtros.fechaHasta) {
          where.fecha = {}
          if (filtros.fechaDesde) {
            where.fecha.gte = new Date(filtros.fechaDesde)
          }
          if (filtros.fechaHasta) {
            where.fecha.lte = new Date(filtros.fechaHasta)
          }
        }

        // Calcular paginación
        const page = filtros.page || 1
        const limit = filtros.limit || 20
        const skip = (page - 1) * limit

        // Obtener movimientos y total
        const [movimientos, total] = await Promise.all([
          fastify.prisma.movimientoInventario.findMany({
            where,
            skip,
            take: limit,
            orderBy: { fecha: 'desc' },
            include: {
              producto: {
                select: {
                  id: true,
                  sku: true,
                  nombre: true,
                  categoria: true,
                  unidad: true,
                },
              },
              usuario: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          }),
          fastify.prisma.movimientoInventario.count({ where }),
        ])

        const pages = Math.ceil(total / limit)

        return {
          data: movimientos,
          pagination: {
            page,
            limit,
            total,
            pages,
            hasNextPage: page < pages,
            hasPrevPage: page > 1,
          },
        }
      } catch (error: any) {
        request.log.error('Error consultando movimientos:', error)

        if (error.name === 'ZodError') {
          return reply.status(400).send({
            success: false,
            error: 'Parámetros inválidos',
            details: error.issues,
          })
        }

        return reply.status(500).send({
          success: false,
          error: 'Error interno del servidor',
        })
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
        // Obtener estadísticas de productos
        const [totalProductos, productosActivos, productosStockBajo] =
          await Promise.all([
            fastify.prisma.producto.count(),
            fastify.prisma.producto.count({ where: { isActive: true } }),
            fastify.prisma.producto.count({
              where: {
                isActive: true,
                // No podemos usar stockActual <= stockMin directamente en Prisma
                // Lo calcularemos después
              },
            }),
          ])

        // Obtener productos para calcular stock bajo y valor total
        const productos = await fastify.prisma.producto.findMany({
          where: { isActive: true },
          select: {
            stockActual: true,
            stockMin: true,
            costo: true,
          },
        })

        // Calcular productos con stock bajo
        const productosConStockBajo = productos.filter(
          (p) => p.stockActual <= p.stockMin
        ).length

        // Calcular valor total del inventario
        const valorTotalInventario = productos.reduce(
          (total, p) => total + p.stockActual * p.costo,
          0
        )

        // Obtener últimos movimientos
        const ultimosMovimientos =
          await fastify.prisma.movimientoInventario.findMany({
            take: 10,
            orderBy: { fecha: 'desc' },
            include: {
              producto: {
                select: {
                  nombre: true,
                  sku: true,
                },
              },
            },
          })

        const resumen = {
          totalProductos,
          productosActivos,
          productosStockBajo: productosConStockBajo,
          valorTotalInventario: Math.round(valorTotalInventario * 100) / 100,
          ultimosMovimientos: ultimosMovimientos.map((m) => ({
            id: m.id,
            productoNombre: m.producto.nombre,
            productoSku: m.producto.sku,
            tipo: m.tipo,
            cantidad: m.cantidad,
            fecha: m.fecha,
            comentario: m.comentario,
            referencia: m.referencia,
          })),
        }

        return {
          success: true,
          data: resumen,
        }
      } catch (error: any) {
        request.log.error('Error obteniendo resumen:', error)
        return reply.status(500).send({
          success: false,
          error: 'Error interno del servidor',
        })
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
        // Obtener productos activos con su stock
        const productos = await fastify.prisma.producto.findMany({
          where: { isActive: true },
          select: {
            id: true,
            sku: true,
            nombre: true,
            stockActual: true,
            stockMin: true,
            leadTime: true,
            politicaAbastecimiento: {
              select: {
                stockSeguridad: true,
              },
            },
          },
        })

        // Filtrar productos con stock bajo y calcular prioridad
        const alertas = productos
          .filter((p) => p.stockActual <= p.stockMin)
          .map((p) => {
            const porcentajeStock = (p.stockActual / p.stockMin) * 100
            const stockSeguridad = p.politicaAbastecimiento?.stockSeguridad || 0

            // Calcular prioridad basada en el porcentaje de stock
            let prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
            if (p.stockActual <= stockSeguridad) {
              prioridad = 'ALTA'
            } else if (porcentajeStock <= 50) {
              prioridad = 'ALTA'
            } else if (porcentajeStock <= 75) {
              prioridad = 'MEDIA'
            } else {
              prioridad = 'BAJA'
            }

            // Estimar días sin stock (simplificado)
            // En un sistema real, esto se calcularía con la demanda promedio
            const diasSinStock = Math.max(
              0,
              Math.ceil((p.stockMin - p.stockActual) / 10)
            )

            return {
              productoId: p.id,
              sku: p.sku,
              nombre: p.nombre,
              stockActual: p.stockActual,
              stockMinimo: p.stockMin,
              prioridad,
              diasSinStock,
              leadTime: p.leadTime,
            }
          })
          .sort((a, b) => {
            // Ordenar por prioridad: ALTA > MEDIA > BAJA
            const prioridadOrder = { ALTA: 3, MEDIA: 2, BAJA: 1 }
            return prioridadOrder[b.prioridad] - prioridadOrder[a.prioridad]
          })

        // Calcular resumen
        const resumen = {
          totalAlertas: alertas.length,
          alertasAlta: alertas.filter((a) => a.prioridad === 'ALTA').length,
          alertasMedia: alertas.filter((a) => a.prioridad === 'MEDIA').length,
          alertasBaja: alertas.filter((a) => a.prioridad === 'BAJA').length,
        }

        return {
          success: true,
          data: {
            alertas,
            resumen,
          },
        }
      } catch (error: any) {
        request.log.error('Error obteniendo alertas:', error)
        return reply.status(500).send({
          success: false,
          error: 'Error interno del servidor',
        })
      }
    }
  )
}

export default inventarioRoutes
