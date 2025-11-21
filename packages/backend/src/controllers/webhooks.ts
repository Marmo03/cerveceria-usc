// Controlador de Webhooks para n8n
// Endpoints específicos para automatizaciones RPA

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

// Tipos para respuestas
interface ProductoAlerta {
  id: string
  sku: string
  nombre: string
  stockActual: number
  stockMin: number
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
  diasSinStock?: number
  cantidadSugerida: number
  estrategia: string
  costo: number
}

interface AlertaStockResponse {
  success: boolean
  timestamp: string
  totalProductos: number
  productosConAlerta: number
  alertas: {
    alta: ProductoAlerta[]
    media: ProductoAlerta[]
    baja: ProductoAlerta[]
  }
  resumen: {
    totalAlta: number
    totalMedia: number
    totalBaja: number
  }
}

interface CrearSolicitudRequest {
  productoId: string
  cantidad: number
  prioridad?: 'ALTA' | 'MEDIA' | 'BAJA'
  observaciones?: string
}

export default async function webhooksRoutes(fastify: FastifyInstance) {
  // WEBHOOK 1: Obtener productos con stock bajo para alertas
  // =============================================================================
  fastify.post<{ Reply: AlertaStockResponse }>(
    '/webhooks/stock-alerts',
    {
      schema: {
        description: 'Obtiene productos con stock bajo o crítico para n8n',
        tags: ['Webhooks', 'Automatización'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              timestamp: { type: 'string' },
              totalProductos: { type: 'number' },
              productosConAlerta: { type: 'number' },
              alertas: {
                type: 'object',
                properties: {
                  alta: { type: 'array' },
                  media: { type: 'array' },
                  baja: { type: 'array' },
                },
              },
              resumen: {
                type: 'object',
                properties: {
                  totalAlta: { type: 'number' },
                  totalMedia: { type: 'number' },
                  totalBaja: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        fastify.log.info('📊 [WEBHOOK] Consultando productos con stock bajo...')

        // Consultar productos con stock bajo o crítico
        const productosResult = await fastify.db.query(`
          SELECT 
            p.id,
            p.sku,
            p.nombre,
            p."stockActual",
            p."stockMin",
            p.costo,
            p."leadTime",
            COALESCE(pa.estrategia, 'MANUAL') as estrategia,
            COALESCE(pa.rop, p."stockMin") as rop,
            COALESCE(pa."stockSeguridad", 0) as "stockSeguridad"
          FROM productos p
          LEFT JOIN politicas_abastecimiento pa ON p.id = pa."productoId"
          WHERE p."isActive" = true 
            AND p."stockActual" <= p."stockMin"
          ORDER BY p."stockActual" ASC
        `)

        const productos = productosResult.rows

        // Clasificar por prioridad y calcular cantidad sugerida
        const alertas = {
          alta: [] as ProductoAlerta[],
          media: [] as ProductoAlerta[],
          baja: [] as ProductoAlerta[],
        }

        for (const producto of productos) {
          // Determinar prioridad
          let prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
          if (producto.stockActual <= 0) {
            prioridad = 'ALTA'
          } else if (producto.stockActual <= producto.stockMin * 0.3) {
            prioridad = 'ALTA'
          } else if (producto.stockActual <= producto.stockMin * 0.7) {
            prioridad = 'MEDIA'
          } else {
            prioridad = 'BAJA'
          }

          // Calcular cantidad sugerida (simple: 2x el stock mínimo - stock actual)
          const cantidadSugerida = Math.max(
            producto.stockMin * 2 - producto.stockActual,
            producto.stockMin
          )

          // Estimar días sin stock (basado en leadTime si está bajo)
          let diasSinStock: number | undefined
          if (producto.stockActual <= producto.stockMin * 0.5 && producto.leadTime > 0) {
            diasSinStock = Math.floor(producto.stockActual / (producto.stockMin / 30))
          }

          const alerta: ProductoAlerta = {
            id: producto.id,
            sku: producto.sku,
            nombre: producto.nombre,
            stockActual: producto.stockActual,
            stockMin: producto.stockMin,
            prioridad,
            diasSinStock,
            cantidadSugerida,
            estrategia: producto.estrategia,
            costo: producto.costo,
          }

          if (prioridad === 'ALTA') {
            alertas.alta.push(alerta)
          } else if (prioridad === 'MEDIA') {
            alertas.media.push(alerta)
          } else {
            alertas.baja.push(alerta)
          }
        }

        // Contar total de productos activos
        const totalResult = await fastify.db.query(
          `SELECT COUNT(*) as total FROM productos WHERE "isActive" = true`
        )
        const totalProductos = Number(totalResult.rows[0].total)

        const response: AlertaStockResponse = {
          success: true,
          timestamp: new Date().toISOString(),
          totalProductos,
          productosConAlerta: productos.length,
          alertas,
          resumen: {
            totalAlta: alertas.alta.length,
            totalMedia: alertas.media.length,
            totalBaja: alertas.baja.length,
          },
        }

        fastify.log.info(
          `✅ [WEBHOOK] ${response.productosConAlerta} productos con alertas (Alta: ${response.resumen.totalAlta}, Media: ${response.resumen.totalMedia}, Baja: ${response.resumen.totalBaja})`
        )

        return reply.send(response)
      } catch (error) {
        fastify.log.error('❌ [WEBHOOK] Error al generar alertas:', error)
        return reply.status(500).send({
          success: false,
          message: 'Error al generar alertas de stock',
        })
      }
    }
  )

  // =============================================================================
  // WEBHOOK 2: Crear solicitud de compra automática
  // =============================================================================
  fastify.post<{ Body: CrearSolicitudRequest }>(
    '/webhooks/crear-solicitud',
    {
      schema: {
        description: 'Crea una solicitud de compra automática desde n8n',
        tags: ['Webhooks', 'Automatización'],
        body: {
          type: 'object',
          required: ['productoId', 'cantidad'],
          properties: {
            productoId: { type: 'string' },
            cantidad: { type: 'number', minimum: 1 },
            prioridad: {
              type: 'string',
              enum: ['ALTA', 'MEDIA', 'BAJA'],
              default: 'ALTA',
            },
            observaciones: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              solicitudId: { type: 'string' },
              producto: { type: 'string' },
              cantidad: { type: 'number' },
              estado: { type: 'string' },
              mensaje: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { productoId, cantidad, prioridad = 'ALTA', observaciones } = request.body

        fastify.log.info(
          `📝 [WEBHOOK] Creando solicitud automática para producto ${productoId}`
        )

        // Verificar que el producto existe
        const productoResult = await fastify.db.query(
          `SELECT id, nombre, "stockActual" FROM productos WHERE id = $1`,
          [productoId]
        )
        
        if (productoResult.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            message: 'Producto no encontrado',
          })
        }
        
        const producto = productoResult.rows[0]

        // Obtener usuario del sistema (para solicitudes automáticas)
        const usuarioSistemaResult = await fastify.db.query(
          `SELECT id FROM users WHERE email = 'sistema@cerveceria-usc.edu.co' LIMIT 1`
        )

        let creadorId: string
        if (usuarioSistemaResult.rows.length === 0) {
          // Crear usuario del sistema si no existe
          const { randomUUID } = await import('crypto')
          const nuevoUsuarioId = randomUUID()
          const nuevoUsuarioResult = await fastify.db.query(
            `INSERT INTO users (id, email, password, "firstName", "lastName", "roleId", "isActive", "createdAt", "updatedAt")
             VALUES ($1, 'sistema@cerveceria-usc.edu.co', '$2b$10$dummy', 'Sistema', 'Automatizado',
               (SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1), true, NOW(), NOW())
             RETURNING id`,
            [nuevoUsuarioId]
          )
          creadorId = nuevoUsuarioResult.rows[0].id
        } else {
          creadorId = usuarioSistemaResult.rows[0].id
        }

        // Crear la solicitud
        const { randomUUID } = await import('crypto')
        const solicitudId = randomUUID()
        const solicitudResult = await fastify.db.query(
          `INSERT INTO solicitudes_compra (
            id, "productoId", cantidad, estado, "creadorId", 
            "historialJSON", "fechaCreacion", "fechaActualizacion"
          )
          VALUES ($1, $2, $3, 'PENDIENTE', $4, $5, NOW(), NOW())
          RETURNING id, estado`,
          [
            solicitudId,
            productoId,
            cantidad,
            creadorId,
            JSON.stringify([{
              fecha: new Date().toISOString(),
              accion: 'CREADA_AUTO',
              usuarioId: creadorId,
              tipo: 'AUTOMATICA_WEBHOOK',
              prioridad: prioridad,
              comentario: observaciones ||
                `Solicitud automática generada por RPA - Stock bajo detectado (${producto.stockActual} unidades)`,
            }]),
          ]
        )

        const solicitud = solicitudResult.rows[0]

        fastify.log.info(
          `✅ [WEBHOOK] Solicitud ${solicitud.id} creada exitosamente`
        )

        return reply.send({
          success: true,
          solicitudId: solicitud.id,
          producto: producto.nombre,
          cantidad,
          estado: solicitud.estado,
          mensaje: 'Solicitud de compra creada automáticamente',
        })
      } catch (error) {
        fastify.log.error('❌ [WEBHOOK] Error al crear solicitud:', error)
        return reply.status(500).send({
          success: false,
          message: 'Error al crear solicitud de compra',
        })
      }
    }
  )

  // =============================================================================
  // WEBHOOK 3: Generar reporte diario de reabastecimiento
  // =============================================================================
  fastify.post(
    '/webhooks/reporte-diario',
    {
      schema: {
        description: 'Genera reporte completo de reabastecimiento para n8n',
        tags: ['Webhooks', 'Automatización'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              fecha: { type: 'string' },
              totalProductos: { type: 'number' },
              productosReabastecimiento: { type: 'number' },
              detalles: { type: 'array' },
              resumen: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        fastify.log.info('📊 [WEBHOOK] Generando reporte diario de reabastecimiento...')

        // Consultar productos con stock bajo
        const productosResult = await fastify.db.query(`
          SELECT 
            p.id,
            p.sku,
            p.nombre,
            p."stockActual",
            p."stockMin",
            p.costo,
            p."leadTime",
            COALESCE(pa.estrategia, 'MANUAL') as estrategia,
            COALESCE(pa.rop, p."stockMin") as rop
          FROM productos p
          LEFT JOIN politicas_abastecimiento pa ON p.id = pa."productoId"
          WHERE p."isActive" = true 
            AND p."stockActual" <= p."stockMin"
          ORDER BY p."stockActual" ASC
        `)

        const productos = productosResult.rows

        // Obtener totales generales
        const totalProductosResult = await fastify.db.query(
          `SELECT COUNT(*) as total FROM productos WHERE "isActive" = true`
        )
        const totalProductos = Number(totalProductosResult.rows[0].total)

        // Calcular estadísticas y crear detalles
        let valorTotalReabastecimiento = 0
        let productosPrioridadAlta = 0
        let productosPrioridadMedia = 0
        let productosPrioridadBaja = 0

        const detalles = productos.map((producto) => {
          // Determinar prioridad
          let prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
          if (producto.stockActual <= 0 || producto.stockActual <= producto.stockMin * 0.3) {
            prioridad = 'ALTA'
            productosPrioridadAlta++
          } else if (producto.stockActual <= producto.stockMin * 0.7) {
            prioridad = 'MEDIA'
            productosPrioridadMedia++
          } else {
            prioridad = 'BAJA'
            productosPrioridadBaja++
          }

          // Calcular cantidad sugerida
          const cantidadSugerida = Math.max(
            producto.stockMin * 2 - producto.stockActual,
            producto.stockMin
          )

          // Estimar días sin stock
          let diasSinStock: number | undefined
          if (producto.stockActual <= producto.stockMin * 0.5 && producto.leadTime > 0) {
            diasSinStock = Math.floor(producto.stockActual / (producto.stockMin / 30))
          }

          const costoEstimado = producto.costo * cantidadSugerida
          valorTotalReabastecimiento += costoEstimado

          return {
            producto: {
              id: producto.id,
              sku: producto.sku,
              nombre: producto.nombre,
              stockActual: producto.stockActual,
              stockMin: producto.stockMin,
              costo: producto.costo,
            },
            sugerencia: {
              cantidadSugerida,
              rop: producto.rop,
              estrategia: producto.estrategia,
              costoEstimado,
            },
            prioridad,
            diasSinStock,
          }
        })

        const response = {
          success: true,
          fecha: new Date().toISOString(),
          totalProductos,
          productosReabastecimiento: productos.length,
          detalles,
          resumen: {
            productosPrioridadAlta,
            productosPrioridadMedia,
            productosPrioridadBaja,
            valorTotalEstimado: valorTotalReabastecimiento,
            porcentajeProductosConAlerta: (
              (productos.length / totalProductos) *
              100
            ).toFixed(2),
          },
        }

        fastify.log.info(
          `✅ [WEBHOOK] Reporte generado: ${response.productosReabastecimiento} productos requieren reabastecimiento`
        )

        return reply.send(response)
      } catch (error) {
        fastify.log.error('❌ [WEBHOOK] Error al generar reporte:', error)
        return reply.status(500).send({
          success: false,
          message: 'Error al generar reporte diario',
        })
      }
    }
  )

  // =============================================================================
  // WEBHOOK 4: Health check para n8n
  // WEBHOOK 4: Verificar si existe solicitud PENDIENTE para un producto
  // =============================================================================
  fastify.get<{
    Querystring: { productoId: string }
  }>(
    '/webhooks/verificar-solicitud',
    {
      schema: {
        description: 'Verifica si existe una solicitud PENDIENTE para un producto (sin autenticación)',
        tags: ['Webhooks', 'Automatización'],
        querystring: {
          type: 'object',
          required: ['productoId'],
          properties: {
            productoId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              existe: { type: 'boolean' },
              solicitudId: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { productoId } = request.query

        const result = await fastify.db.query(
          `SELECT id FROM solicitudes_compra 
           WHERE "productoId" = $1 AND estado = 'PENDIENTE' 
           LIMIT 1`,
          [productoId]
        )

        if (result.rows.length > 0) {
          return reply.send({
            existe: true,
            solicitudId: result.rows[0].id,
          })
        }

        return reply.send({
          existe: false,
          solicitudId: null,
        })
      } catch (error: any) {
        fastify.log.error(`❌ [WEBHOOK] Error verificando solicitud: ${error.message}`)
        return reply.status(500).send({
          existe: false,
          error: error.message,
        })
      }
    }
  )

  // =============================================================================
  fastify.get(
    '/webhooks/health',
    {
      schema: {
        description: 'Verifica que el servicio de webhooks esté disponible',
        tags: ['Webhooks'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      return reply.send({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      })
    }
  )

  fastify.log.info('🔗 Webhooks para n8n registrados exitosamente')
}
