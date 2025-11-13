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
  isActive: z.coerce.boolean().optional(),
  stockBajo: z.coerce.boolean().optional(),
  proveedorId: z.string().optional(),
  busqueda: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
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

        // Construir filtros de Prisma
        const where: any = {}

        if (filtros.categoria) {
          where.categoria = filtros.categoria
        }

        if (filtros.isActive !== undefined) {
          where.isActive = filtros.isActive
        }

        if (filtros.proveedorId) {
          where.proveedorId = filtros.proveedorId
        }

        if (filtros.busqueda) {
          where.OR = [
            { sku: { contains: filtros.busqueda, mode: 'insensitive' } },
            { nombre: { contains: filtros.busqueda, mode: 'insensitive' } },
          ]
        }

        // El filtro de stock bajo se maneja después de obtener los datos
        // ya que requiere comparación con campo de la misma tabla

        // Calcular paginación
        const skip = (filtros.page - 1) * filtros.limit
        const take = filtros.limit

        // Obtener productos y total
        const [productosRaw, total] = await Promise.all([
          fastify.prisma.producto.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
              proveedor: {
                select: {
                  id: true,
                  nombre: true,
                  email: true,
                },
              },
              politicaAbastecimiento: {
                select: {
                  estrategia: true,
                  rop: true,
                  stockSeguridad: true,
                },
              },
            },
          }),
          fastify.prisma.producto.count({ where }),
        ])

        // Aplicar filtro de stock bajo si se requiere
        let productos = productosRaw
        if (filtros.stockBajo) {
          productos = productosRaw.filter((p) => p.stockActual <= p.stockMin)
        }

        return {
          productos,
          pagination: {
            page: filtros.page,
            limit: filtros.limit,
            total,
            pages: Math.ceil(total / filtros.limit),
          },
        }
      } catch (error: any) {
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

        const producto = await fastify.prisma.producto.findUnique({
          where: { id },
          include: {
            proveedor: {
              select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true,
              },
            },
            politicaAbastecimiento: true,
          },
        })

        if (!producto) {
          return reply.status(404).send({
            error: 'No encontrado',
            message: `Producto con ID ${id} no encontrado`,
          })
        }

        return producto
      } catch (error: any) {
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
      preHandler: [
        fastify.authenticate,
        fastify.requireRole(['ADMIN', 'OPERARIO']),
      ],
      schema: {
        tags: ['productos'],
        summary: 'Crear nuevo producto',
        description: 'Crea un nuevo producto en el sistema',
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
    },
    async (request, reply) => {
      try {
        const datosProducto = CrearProductoSchema.parse(request.body)

        // Verificar que el SKU no exista
        const existente = await fastify.prisma.producto.findUnique({
          where: { sku: datosProducto.sku },
        })

        if (existente) {
          return reply.status(409).send({
            error: 'Producto duplicado',
            message: `Ya existe un producto con el SKU: ${datosProducto.sku}`,
          })
        }

        // Crear el producto
        const producto = await fastify.prisma.producto.create({
          data: {
            sku: datosProducto.sku,
            nombre: datosProducto.nombre,
            categoria: datosProducto.categoria,
            unidad: datosProducto.unidad,
            costo: datosProducto.costo,
            stockActual: datosProducto.stockActual,
            stockMin: datosProducto.stockMin,
            leadTime: datosProducto.leadTime,
            proveedorId: datosProducto.proveedorId,
          },
        })

        request.log.info(
          { productoId: producto.id },
          'Producto creado exitosamente'
        )

        return reply.status(201).send({
          id: producto.id,
          sku: producto.sku,
          nombre: producto.nombre,
          categoria: producto.categoria,
          mensaje: 'Producto creado exitosamente',
        })
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({
            error: 'Datos inválidos',
            message: 'Los datos proporcionados no son válidos',
            details: error.issues,
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
      preHandler: [
        fastify.authenticate,
        fastify.requireRole(['ADMIN', 'OPERARIO']),
      ],
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
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const datosActualizacion = ActualizarProductoSchema.parse(request.body)

        // Verificar que el producto existe
        const productoExistente = await fastify.prisma.producto.findUnique({
          where: { id },
        })

        if (!productoExistente) {
          return reply.status(404).send({
            error: 'No encontrado',
            message: `Producto con ID ${id} no encontrado`,
          })
        }

        // Si se actualiza el SKU, verificar que no exista
        if (
          datosActualizacion.sku &&
          datosActualizacion.sku !== productoExistente.sku
        ) {
          const skuExistente = await fastify.prisma.producto.findUnique({
            where: { sku: datosActualizacion.sku },
          })

          if (skuExistente) {
            return reply.status(409).send({
              error: 'Conflicto',
              message: `Ya existe un producto con el SKU: ${datosActualizacion.sku}`,
            })
          }
        }

        // Actualizar producto
        const productoActualizado = await fastify.prisma.producto.update({
          where: { id },
          data: datosActualizacion,
        })

        request.log.info(
          { productoId: id },
          'Producto actualizado exitosamente'
        )

        return {
          id: productoActualizado.id,
          mensaje: 'Producto actualizado exitosamente',
        }
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({
            error: 'Datos inválidos',
            message: 'Los datos proporcionados no son válidos',
            details: error.issues,
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
      preHandler: [fastify.authenticate, fastify.requireRole(['ADMIN'])],
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
    },
    async (request, reply) => {
      try {
        const { id } = request.params

        // Verificar que el producto existe
        const producto = await fastify.prisma.producto.findUnique({
          where: { id },
        })

        if (!producto) {
          return reply.status(404).send({
            error: 'No encontrado',
            message: `Producto con ID ${id} no encontrado`,
          })
        }

        // Soft delete - desactivar el producto
        await fastify.prisma.producto.update({
          where: { id },
          data: { isActive: false },
        })

        request.log.info(
          { productoId: id },
          'Producto eliminado (desactivado) exitosamente'
        )

        return { mensaje: 'Producto eliminado exitosamente' }
      } catch (error: any) {
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
    },
    async (request, reply) => {
      try {
        const { id } = request.params

        // Buscar política de reabastecimiento
        const politica = await fastify.prisma.politicaAbastecimiento.findUnique(
          {
            where: { productoId: id },
            include: {
              producto: {
                select: {
                  sku: true,
                  nombre: true,
                },
              },
            },
          }
        )

        if (!politica) {
          return reply.status(404).send({
            error: 'No encontrado',
            message: 'No existe política de abastecimiento para este producto',
          })
        }

        return politica
      } catch (error: any) {
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
      preHandler: [
        fastify.authenticate,
        fastify.requireRole(['ADMIN', 'OPERARIO']),
      ],
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
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const datosPolitica = CrearPoliticaSchema.parse(request.body)

        // Verificar que el producto existe
        const producto = await fastify.prisma.producto.findUnique({
          where: { id },
        })

        if (!producto) {
          return reply.status(404).send({
            error: 'No encontrado',
            message: `Producto con ID ${id} no encontrado`,
          })
        }

        // Verificar que no exista una política ya
        const politicaExistente =
          await fastify.prisma.politicaAbastecimiento.findUnique({
            where: { productoId: id },
          })

        if (politicaExistente) {
          return reply.status(409).send({
            error: 'Política existente',
            message:
              'Ya existe una política de abastecimiento para este producto',
          })
        }

        // Crear política
        const politica = await fastify.prisma.politicaAbastecimiento.create({
          data: {
            productoId: id,
            estrategia: datosPolitica.estrategia,
            rop: datosPolitica.rop,
            stockSeguridad: datosPolitica.stockSeguridad,
            parametrosJSON: datosPolitica.parametrosJSON
              ? JSON.stringify(datosPolitica.parametrosJSON)
              : null,
          },
        })

        request.log.info(
          { productoId: id, politicaId: politica.id },
          'Política creada exitosamente'
        )

        return reply.status(201).send({
          id: politica.id,
          mensaje: 'Política de abastecimiento creada exitosamente',
        })
      } catch (error: any) {
        if (error.name === 'ZodError') {
          return reply.status(400).send({
            error: 'Datos inválidos',
            message: 'Los datos proporcionados no son válidos',
            details: error.issues,
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
