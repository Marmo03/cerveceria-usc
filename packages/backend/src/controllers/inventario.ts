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
import { importarMovimientos } from './importador.js'

// Schema de paginación
const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

// Schemas de validación
const RegistrarMovimientoSchema = z.object({
  productoId: z
    .string()
    .uuid('ID de producto debe ser un UUID válido'),
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

        // Usar transacción manual con pg para garantizar consistencia
        const client = await fastify.db.connect()
        
        try {
          await client.query('BEGIN')

          // Verificar que el producto existe y obtener stock actual
          const productoResult = await client.query(
            'SELECT id, sku, nombre, "stockActual", "stockMin", costo FROM productos WHERE id = $1',
            [datosMovimiento.productoId]
          )

          if (productoResult.rows.length === 0) {
            await client.query('ROLLBACK')
            return reply.status(404).send({
              success: false,
              error: 'Producto no encontrado',
            })
          }

          const producto = productoResult.rows[0]
          const stockAnterior = producto.stockActual

          // Validar stock suficiente para salidas
          if (datosMovimiento.tipo === 'SALIDA') {
            if (producto.stockActual < datosMovimiento.cantidad) {
              await client.query('ROLLBACK')
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

          // Crear el movimiento
          const { randomUUID } = await import('crypto')
          const movimientoId = randomUUID()
          const now = new Date()

          const movimientoResult = await client.query(`
            INSERT INTO movimientos_inventario (
              id, "productoId", tipo, cantidad, "usuarioId", comentario, referencia, fecha, "createdAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, "productoId", tipo, cantidad, "usuarioId", comentario, referencia, fecha
          `, [
            movimientoId,
            datosMovimiento.productoId,
            datosMovimiento.tipo,
            datosMovimiento.cantidad,
            usuarioId,
            datosMovimiento.comentario || null,
            datosMovimiento.referencia || null,
            now,
            now
          ])

          // Actualizar stock del producto
          await client.query(
            'UPDATE productos SET "stockActual" = $1, "updatedAt" = $2 WHERE id = $3',
            [stockNuevo, now, datosMovimiento.productoId]
          )

          // Obtener datos del usuario
          const usuarioResult = await client.query(
            'SELECT email, "firstName", "lastName" FROM users WHERE id = $1',
            [usuarioId]
          )

          await client.query('COMMIT')

          const resultado = {
            ...movimientoResult.rows[0],
            producto: {
              sku: producto.sku,
              nombre: producto.nombre,
            },
            usuario: usuarioResult.rows[0] || null,
            stockAnterior,
            stockNuevo
          }

          request.log.info(
            {
              movimientoId: resultado.id,
              productoId: datosMovimiento.productoId,
              tipo: datosMovimiento.tipo,
              cantidad: datosMovimiento.cantidad,
              stockAnterior: resultado.stockAnterior,
              stockNuevo: resultado.stockNuevo,
            },
            'Movimiento de inventario registrado'
          )

          // 🤖 AUTOMATIZACIÓN RPA con n8n: Detectar stock bajo y notificar
          // Verificar si el producto quedó en stock bajo después del movimiento
          if (stockNuevo <= producto.stockMin) {
            request.log.warn(
              {
                productoId: datosMovimiento.productoId,
                nombre: producto.nombre,
                stockNuevo,
                stockMin: producto.stockMin,
              },
              '⚠️ [RPA-n8n] Stock bajo detectado - Disparando webhook a n8n'
            )

            // Calcular cantidad sugerida (2x el stock mínimo menos el stock actual)
            const cantidadSugerida = Math.max(
              producto.stockMin * 2 - stockNuevo,
              producto.stockMin
            )

            // Determinar prioridad según qué tan bajo está el stock
            let prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
            if (stockNuevo <= 0 || stockNuevo <= producto.stockMin * 0.3) {
              prioridad = 'ALTA'
            } else if (stockNuevo <= producto.stockMin * 0.7) {
              prioridad = 'MEDIA'
            } else {
              prioridad = 'BAJA'
            }

            // Disparar webhook a n8n de forma asíncrona (no bloqueante)
            const n8nWebhookUrl = process.env.N8N_WEBHOOK_STOCK_BAJO || 'http://localhost:5678/webhook/stock-bajo'
            
            const payload = {
              evento: 'STOCK_BAJO_DETECTADO',
              timestamp: new Date().toISOString(),
              movimiento: {
                id: resultado.id,
                tipo: datosMovimiento.tipo,
                cantidad: datosMovimiento.cantidad,
                comentario: datosMovimiento.comentario,
                referencia: datosMovimiento.referencia,
              },
              producto: {
                id: datosMovimiento.productoId,
                sku: producto.sku,
                nombre: producto.nombre,
                stockAnterior,
                stockNuevo,
                stockMin: producto.stockMin,
              },
              sugerencia: {
                cantidadSugerida,
                prioridad,
                costoEstimado: cantidadSugerida * (producto.costo || 0),
              },
              callbackUrl: `${process.env.API_URL || 'http://localhost:3001'}/api/webhooks/crear-solicitud`,
            }

            // Llamar a n8n sin bloquear la respuesta
            fetch(n8nWebhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            })
              .then(async (response) => {
                if (response.ok) {
                  const data = await response.json()
                  request.log.info(
                    {
                      productoId: datosMovimiento.productoId,
                      n8nResponse: data,
                    },
                    '✅ [RPA-n8n] Webhook enviado exitosamente'
                  )
                } else {
                  request.log.error(
                    {
                      productoId: datosMovimiento.productoId,
                      status: response.status,
                      statusText: response.statusText,
                    },
                    '❌ [RPA-n8n] Error en respuesta del webhook'
                  )
                }
              })
              .catch((error) => {
                request.log.error(
                  {
                    productoId: datosMovimiento.productoId,
                    error: error.message,
                  },
                  '❌ [RPA-n8n] Error al llamar webhook de n8n'
                )
              })

            // Agregar información a la respuesta
            resultado.rpaNotificacion = {
              enviado: true,
              webhook: n8nWebhookUrl,
              prioridad,
              mensaje: `Notificación de stock bajo enviada a n8n (${prioridad} prioridad)`,
            }
          }

          return reply.status(201).send({
            success: true,
            data: {
              movimiento: resultado,
              stockAnterior: resultado.stockAnterior,
              stockNuevo: resultado.stockNuevo,
            },
            message: 'Movimiento registrado exitosamente',
          })
        } catch (error: any) {
          await client.query('ROLLBACK')
          throw error
        } finally {
          client.release()
        }
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

        // Construir WHERE dinámico
        const conditions: string[] = []
        const values: any[] = []
        let paramCount = 0

        if (filtros.productoId) {
          paramCount++
          conditions.push(`mi."productoId" = $${paramCount}`)
          values.push(filtros.productoId)
        }

        if (filtros.tipo) {
          paramCount++
          conditions.push(`mi.tipo = $${paramCount}`)
          values.push(filtros.tipo)
        }

        if (filtros.fechaDesde) {
          paramCount++
          conditions.push(`mi.fecha >= $${paramCount}`)
          values.push(new Date(filtros.fechaDesde))
        }

        if (filtros.fechaHasta) {
          paramCount++
          conditions.push(`mi.fecha <= $${paramCount}`)
          values.push(new Date(filtros.fechaHasta))
        }

        const whereClause = conditions.length > 0 
          ? `WHERE ${conditions.join(' AND ')}` 
          : ''

        // Calcular paginación
        const page = filtros.page || 1
        const limit = filtros.limit || 20
        const offset = (page - 1) * limit

        // Obtener total
        const countQuery = `SELECT COUNT(*) as total FROM movimientos_inventario mi ${whereClause}`
        const countResult = await fastify.db.query(countQuery, values)
        const total = parseInt(countResult.rows[0].total)

        // Obtener movimientos con JOIN
        paramCount++
        const limitParam = paramCount
        paramCount++
        const offsetParam = paramCount
        
        const movimientosQuery = `
          SELECT 
            mi.id, mi."productoId", mi.tipo, mi.cantidad, mi."usuarioId", 
            mi.comentario, mi.referencia, mi.fecha,
            json_build_object(
              'id', p.id,
              'sku', p.sku,
              'nombre', p.nombre,
              'categoria', p.categoria,
              'unidad', p.unidad
            ) as producto,
            json_build_object(
              'id', u.id,
              'email', u.email,
              'firstName', u."firstName",
              'lastName', u."lastName"
            ) as usuario
          FROM movimientos_inventario mi
          INNER JOIN productos p ON mi."productoId" = p.id
          LEFT JOIN users u ON mi."usuarioId" = u.id
          ${whereClause}
          ORDER BY mi.fecha DESC
          LIMIT $${limitParam} OFFSET $${offsetParam}
        `
        
        values.push(limit, offset)
        const movimientosResult = await fastify.db.query(movimientosQuery, values)

        const pages = Math.ceil(total / limit)

        return {
          data: movimientosResult.rows,
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
        // Obtener estadísticas de productos en paralelo
        const totalResult = await fastify.db.query('SELECT COUNT(*) as total FROM productos')
        const activosResult = await fastify.db.query('SELECT COUNT(*) as total FROM productos WHERE "isActive" = true')
        const stockBajoResult = await fastify.db.query(`
          SELECT COUNT(*) as total 
          FROM productos 
          WHERE "isActive" = true AND "stockActual" <= "stockMin"
        `)

        const totalProductos = parseInt(totalResult.rows[0].total)
        const productosActivos = parseInt(activosResult.rows[0].total)
        const productosStockBajo = parseInt(stockBajoResult.rows[0].total)

        // Calcular valor total del inventario
        const valorResult = await fastify.db.query(`
          SELECT COALESCE(SUM("stockActual" * costo), 0) as valor_total
          FROM productos
          WHERE "isActive" = true
        `)
        const valorTotalInventario = Math.round(parseFloat(valorResult.rows[0].valor_total) * 100) / 100

        // Obtener últimos movimientos
        const movimientosResult = await fastify.db.query(`
          SELECT 
            mi.id, mi.tipo, mi.cantidad, mi.fecha, mi.comentario, mi.referencia,
            p.nombre as producto_nombre,
            p.sku as producto_sku
          FROM movimientos_inventario mi
          INNER JOIN productos p ON mi."productoId" = p.id
          ORDER BY mi.fecha DESC
          LIMIT 10
        `)

        const resumen = {
          totalProductos,
          productosActivos,
          productosStockBajo,
          valorTotalInventario,
          ultimosMovimientos: movimientosResult.rows.map((m) => ({
            id: m.id,
            productoNombre: m.producto_nombre,
            productoSku: m.producto_sku,
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
        // Obtener productos activos con su stock y política
        const productosResult = await fastify.db.query(`
          SELECT 
            p.id, p.sku, p.nombre, p."stockActual", p."stockMin", p."leadTime",
            pa."stockSeguridad"
          FROM productos p
          LEFT JOIN politicas_abastecimiento pa ON p.id = pa."productoId"
          WHERE p."isActive" = true AND p."stockActual" <= p."stockMin"
        `)

        // Procesar alertas con prioridades
        const alertas = productosResult.rows
          .map((p) => {
            const porcentajeStock = (p.stockActual / p.stockMin) * 100
            const stockSeguridad = p.stockSeguridad || 0

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

  // Ruta para importar movimientos de inventario desde archivo
  fastify.post(
    '/importar-movimientos',
    {
      onRequest: [fastify.authenticate, fastify.requireRole(['ADMIN', 'OPERARIO'])],
      schema: {
        description: 'Importar movimientos de inventario desde archivo Excel o CSV',
        tags: ['inventario'],
        consumes: ['multipart/form-data'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              procesados: { type: 'number' },
              exitosos: { type: 'number' },
              errores: { type: 'number' },
              detalleErrores: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    linea: { type: 'number' },
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    importarMovimientos
  )
}

export default inventarioRoutes
