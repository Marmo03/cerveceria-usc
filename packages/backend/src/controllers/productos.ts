/**
 * Controlador de Productos
 *
 * Proporciona endpoints REST para la gestión completa del catálogo de productos.
 * Implementa el patrón API Facade, exponiendo los casos de uso del dominio a través de HTTP.
 *
 * Arquitectura:
 * - Controller (HTTP Layer) → Use Cases (Application Layer) → Repository (Infrastructure Layer)
 * - Validación con Zod para request/response
 * - Manejo de errores centralizado
 *
 * Endpoints disponibles:
 * - GET    /productos              → Listar productos con filtros y paginación
 * - GET    /productos/:id          → Obtener detalle de producto por ID
 * - POST   /productos              → Crear nuevo producto
 * - PUT    /productos/:id          → Actualizar producto existente
 * - DELETE /productos/:id          → Eliminar producto (soft delete)
 * - GET    /productos/:id/politica → Obtener política de reabastecimiento
 * - POST   /productos/:id/politica → Configurar política de reabastecimiento
 *
 * Filtros soportados:
 * - categoria: Filtrar por categoría
 * - isActive: Solo productos activos/inactivos
 * - stockBajo: Productos con stock bajo
 * - proveedorId: Productos de un proveedor específico
 * - busqueda: Búsqueda por SKU o nombre
 * - page/limit: Paginación
 *
 * Estrategias de reabastecimiento soportadas:
 * - EOQ (Economic Order Quantity)
 * - MANUAL (Reorden manual)
 * - JIT (Just-in-Time) [futuro]
 * - FIXED_QUANTITY (Cantidad fija) [futuro]
 *
 * @module controllers/productos
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

// Schemas de validación con Zod
const CrearProductoSchema = z.object({
  sku: z.string().min(1).max(50),
  nombre: z.string().min(1).max(200),
  categoria: z.string().min(1).max(100),
  unidad: z.string().min(1).max(20),
  costo: z.number().positive(),
  stockActual: z.number().int().min(0).default(0),
  stockMin: z.number().int().min(0).default(0),
  leadTime: z.number().int().min(1).default(7),
  proveedorId: z.string().optional(),
})

const ActualizarProductoSchema = CrearProductoSchema.partial()

const FiltrosProductoSchema = z.object({
  categoria: z.string().optional(),
  isActive: z.boolean().optional(),
  stockBajo: z.boolean().optional(),
  proveedorId: z.string().optional(),
  busqueda: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

const CrearPoliticaSchema = z.object({
  estrategia: z.enum(['EOQ', 'MANUAL']),
  rop: z.number().int().min(0),
  stockSeguridad: z.number().int().min(0),
  parametrosJSON: z.record(z.any()).optional(),
})

// Tipos para TypeScript
type CrearProductoBody = z.infer<typeof CrearProductoSchema>
type ActualizarProductoBody = z.infer<typeof ActualizarProductoSchema>
type FiltrosProductoQuery = z.infer<typeof FiltrosProductoSchema>
type CrearPoliticaBody = z.infer<typeof CrearPoliticaSchema>

interface ProductoParams {
  id: string
}

const productosRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /productos - Listar productos con filtros
  fastify.get<{
    Querystring: FiltrosProductoQuery
  }>(
    '/',
    {
      schema: {
        tags: ['productos'],
        summary: 'Listar productos',
        description: 'Obtiene lista de productos con filtros opcionales',
        querystring: FiltrosProductoSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              productos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    sku: { type: 'string' },
                    nombre: { type: 'string' },
                    categoria: { type: 'string' },
                    unidad: { type: 'string' },
                    costo: { type: 'number' },
                    stockActual: { type: 'number' },
                    stockMin: { type: 'number' },
                    leadTime: { type: 'number' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
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
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const filtros = FiltrosProductoSchema.parse(request.query)

        // TODO: Inyectar casos de uso correctamente
        // const productos = await obtenerProductosUC.execute(filtros);

        // Por ahora, respuesta mock
        const productos = []
        const total = 0

        return {
          productos,
          pagination: {
            page: filtros.page,
            limit: filtros.limit,
            total,
            pages: Math.ceil(total / filtros.limit),
          },
        }
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          error: 'Error interno del servidor',
          message: 'No se pudieron obtener los productos',
        })
      }
    }
  )

  // GET /productos/:id - Obtener producto por ID
  fastify.get<{
    Params: ProductoParams
  }>(
    '/:id',
    {
      schema: {
        tags: ['productos'],
        summary: 'Obtener producto por ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              sku: { type: 'string' },
              nombre: { type: 'string' },
              categoria: { type: 'string' },
              unidad: { type: 'string' },
              costo: { type: 'number' },
              stockActual: { type: 'number' },
              stockMin: { type: 'number' },
              leadTime: { type: 'number' },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params

        // TODO: Usar caso de uso
        // const producto = await obtenerProductoPorIdUC.execute(id);

        // Mock response
        return reply.status(404).send({
          error: 'No encontrado',
          message: `Producto con ID ${id} no encontrado`,
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          error: 'Error interno del servidor',
          message: 'No se pudo obtener el producto',
        })
      }
    }
  )

  // POST /productos - Crear nuevo producto
  fastify.post<{
    Body: CrearProductoBody
  }>(
    '/',
    {
      schema: {
        tags: ['productos'],
        summary: 'Crear nuevo producto',
        description: 'Crea un nuevo producto en el sistema',
        body: CrearProductoSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              sku: { type: 'string' },
              nombre: { type: 'string' },
              categoria: { type: 'string' },
              mensaje: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'array' },
            },
          },
          409: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: [
        fastify.authenticate,
        fastify.authorize(['ADMIN', 'OPERARIO']),
      ],
    },
    async (request, reply) => {
      try {
        const datosProducto = CrearProductoSchema.parse(request.body)

        // TODO: Usar caso de uso
        // const producto = await crearProductoUC.execute({
        //   ...datosProducto,
        //   usuarioId: request.user.id
        // });

        return reply.status(201).send({
          id: 'mock-id',
          sku: datosProducto.sku,
          nombre: datosProducto.nombre,
          categoria: datosProducto.categoria,
          mensaje: 'Producto creado exitosamente',
        })
      } catch (error) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({
            error: 'Datos inválidos',
            message: 'Los datos proporcionados no son válidos',
            details: error.issues,
          })
        }

        // TODO: Manejar errores específicos de dominio
        if (error.code === 'DUPLICATE') {
          return reply.status(409).send({
            error: 'Producto duplicado',
            message: error.message,
          })
        }

        request.log.error(error)
        return reply.status(500).send({
          error: 'Error interno del servidor',
          message: 'No se pudo crear el producto',
        })
      }
    }
  )

  // PUT /productos/:id - Actualizar producto
  fastify.put<{
    Params: ProductoParams
    Body: ActualizarProductoBody
  }>(
    '/:id',
    {
      schema: {
        tags: ['productos'],
        summary: 'Actualizar producto',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: ActualizarProductoSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              mensaje: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: [
        fastify.authenticate,
        fastify.authorize(['ADMIN', 'OPERARIO']),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const datosActualizacion = ActualizarProductoSchema.parse(request.body)

        // TODO: Usar caso de uso
        // const producto = await actualizarProductoUC.execute(id, datosActualizacion);

        return {
          id,
          mensaje: 'Producto actualizado exitosamente',
        }
      } catch (error) {
        if (error.code === 'NOT_FOUND') {
          return reply.status(404).send({
            error: 'No encontrado',
            message: error.message,
          })
        }

        request.log.error(error)
        return reply.status(500).send({
          error: 'Error interno del servidor',
          message: 'No se pudo actualizar el producto',
        })
      }
    }
  )

  // DELETE /productos/:id - Eliminar (desactivar) producto
  fastify.delete<{
    Params: ProductoParams
  }>(
    '/:id',
    {
      schema: {
        tags: ['productos'],
        summary: 'Eliminar producto',
        description: 'Desactiva un producto (soft delete)',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              mensaje: { type: 'string' },
            },
          },
        },
      },
      preHandler: [fastify.authenticate, fastify.authorize(['ADMIN'])],
    },
    async (request, reply) => {
      try {
        const { id } = request.params

        // TODO: Usar caso de uso
        // await eliminarProductoUC.execute(id);

        return { mensaje: 'Producto eliminado exitosamente' }
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          error: 'Error interno del servidor',
          message: 'No se pudo eliminar el producto',
        })
      }
    }
  )

  // GET /productos/:id/politica - Obtener política de abastecimiento
  fastify.get<{
    Params: ProductoParams
  }>(
    '/:id/politica',
    {
      schema: {
        tags: ['productos'],
        summary: 'Obtener política de abastecimiento del producto',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              productoId: { type: 'string' },
              estrategia: { type: 'string', enum: ['EOQ', 'MANUAL'] },
              rop: { type: 'number' },
              stockSeguridad: { type: 'number' },
              parametrosJSON: { type: 'object' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params

        // TODO: Usar caso de uso
        // const politica = await obtenerPoliticaUC.execute(id);

        return reply.status(404).send({
          error: 'No encontrado',
          message: 'No existe política de abastecimiento para este producto',
        })
      } catch (error) {
        request.log.error(error)
        return reply.status(500).send({
          error: 'Error interno del servidor',
          message: 'No se pudo obtener la política',
        })
      }
    }
  )

  // POST /productos/:id/politica - Crear política de abastecimiento
  fastify.post<{
    Params: ProductoParams
    Body: CrearPoliticaBody
  }>(
    '/:id/politica',
    {
      schema: {
        tags: ['productos'],
        summary: 'Crear política de abastecimiento',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: CrearPoliticaSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              mensaje: { type: 'string' },
            },
          },
          409: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      preHandler: [
        fastify.authenticate,
        fastify.authorize(['ADMIN', 'ANALISTA']),
      ],
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const datosPolitica = CrearPoliticaSchema.parse(request.body)

        // TODO: Usar caso de uso
        // const politica = await crearPoliticaUC.execute({
        //   productoId: id,
        //   ...datosPolitica
        // });

        return reply.status(201).send({
          id: 'mock-politica-id',
          mensaje: 'Política de abastecimiento creada exitosamente',
        })
      } catch (error) {
        if (error.code === 'DUPLICATE') {
          return reply.status(409).send({
            error: 'Política existente',
            message:
              'Ya existe una política de abastecimiento para este producto',
          })
        }

        request.log.error(error)
        return reply.status(500).send({
          error: 'Error interno del servidor',
          message: 'No se pudo crear la política',
        })
      }
    }
  )
}

export default productosRoutes
