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
import { randomUUID } from 'crypto'
import { importarProductos } from './importador.js'

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

        // Construir query SQL con filtros dinámicos
        let queryConditions: string[] = []
        let queryParams: any[] = []
        let paramCount = 0

        if (filtros.categoria) {
          paramCount++
          queryConditions.push(`p.categoria = $${paramCount}`)
          queryParams.push(filtros.categoria)
        }

        if (filtros.isActive !== undefined) {
          paramCount++
          queryConditions.push(`p."isActive" = $${paramCount}`)
          queryParams.push(filtros.isActive)
        }

        if (filtros.proveedorId) {
          paramCount++
          queryConditions.push(`p."proveedorId" = $${paramCount}`)
          queryParams.push(filtros.proveedorId)
        }

        if (filtros.busqueda) {
          paramCount++
          queryConditions.push(`(p.sku ILIKE $${paramCount} OR p.nombre ILIKE $${paramCount})`)
          queryParams.push(`%${filtros.busqueda}%`)
        }

        if (filtros.stockBajo) {
          queryConditions.push(`p."stockActual" <= p."stockMin"`)
        }

        const whereClause = queryConditions.length > 0 
          ? `WHERE ${queryConditions.join(' AND ')}` 
          : ''

        // Calcular paginación
        const offset = (filtros.page - 1) * filtros.limit

        // Query para obtener productos con joins
        const productosQuery = `
          SELECT 
            p.*,
            json_build_object(
              'id', pr.id,
              'nombre', pr.nombre,
              'email', pr.email
            ) as proveedor,
            json_build_object(
              'estrategia', pa.estrategia,
              'rop', pa.rop,
              'stockSeguridad', pa."stockSeguridad"
            ) as "politicaAbastecimiento"
          FROM productos p
          LEFT JOIN proveedores pr ON p."proveedorId" = pr.id
          LEFT JOIN politicas_abastecimiento pa ON p.id = pa."productoId"
          ${whereClause}
          ORDER BY p."createdAt" DESC
          LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `
        
        queryParams.push(filtros.limit, offset)

        // Query para contar total
        const countQuery = `
          SELECT COUNT(*) as total
          FROM productos p
          ${whereClause}
        `

        // Ejecutar ambas queries
        const [productosResult, countResult] = await Promise.all([
          fastify.db.query(productosQuery, queryParams),
          fastify.db.query(countQuery, queryParams.slice(0, paramCount))
        ])

        const productos = productosResult.rows.map((row: any) => ({
          ...row,
          costo: parseFloat(row.costo),
          proveedor: row.proveedor.id ? row.proveedor : null,
          politicaAbastecimiento: row.politicaAbastecimiento.estrategia 
            ? row.politicaAbastecimiento 
            : null
        }))

        const total = parseInt(countResult.rows[0].total)

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

        const result = await fastify.db.query(`
          SELECT 
            p.*,
            json_build_object(
              'id', pr.id,
              'nombre', pr.nombre,
              'email', pr.email,
              'telefono', pr.telefono
            ) as proveedor,
            pa.id as "politica_id",
            pa.estrategia as "politica_estrategia",
            pa.rop as "politica_rop",
            pa."stockSeguridad" as "politica_stockSeguridad",
            pa."parametrosJSON" as "politica_parametrosJSON",
            pa."createdAt" as "politica_createdAt",
            pa."updatedAt" as "politica_updatedAt"
          FROM productos p
          LEFT JOIN proveedores pr ON p."proveedorId" = pr.id
          LEFT JOIN politicas_abastecimiento pa ON p.id = pa."productoId"
          WHERE p.id = $1
        `, [id])

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'No encontrado',
            message: `Producto con ID ${id} no encontrado`,
          })
        }

        const row = result.rows[0]
        const producto = {
          id: row.id,
          sku: row.sku,
          nombre: row.nombre,
          categoria: row.categoria,
          unidad: row.unidad,
          proveedorId: row.proveedorId,
          stockActual: row.stockActual,
          stockMin: row.stockMin,
          leadTime: row.leadTime,
          costo: parseFloat(row.costo),
          isActive: row.isActive,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          proveedor: row.proveedor.id ? row.proveedor : null,
          politicaAbastecimiento: row.politica_id ? {
            id: row.politica_id,
            productoId: id,
            estrategia: row.politica_estrategia,
            rop: row.politica_rop,
            stockSeguridad: row.politica_stockSeguridad,
            parametrosJSON: row.politica_parametrosJSON ? JSON.parse(row.politica_parametrosJSON) : null,
            createdAt: row.politica_createdAt,
            updatedAt: row.politica_updatedAt,
          } : null
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
        const existenteResult = await fastify.db.query(
          'SELECT id FROM productos WHERE sku = $1',
          [datosProducto.sku]
        )

        if (existenteResult.rows.length > 0) {
          return reply.status(409).send({
            error: 'Producto duplicado',
            message: `Ya existe un producto con el SKU: ${datosProducto.sku}`,
          })
        }

        // Crear el producto
        const id = randomUUID()
        const now = new Date()
        
        const result = await fastify.db.query(`
          INSERT INTO productos (
            id, sku, nombre, categoria, unidad, costo,
            "stockActual", "stockMin", "leadTime", "proveedorId",
            "isActive", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `, [
          id,
          datosProducto.sku,
          datosProducto.nombre,
          datosProducto.categoria,
          datosProducto.unidad,
          datosProducto.costo,
          datosProducto.stockActual,
          datosProducto.stockMin,
          datosProducto.leadTime,
          datosProducto.proveedorId || null,
          true,
          now,
          now
        ])

        const producto = result.rows[0]

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

        // Log detallado del error
        console.error('❌ Error creando producto:', error)
        console.error('Error name:', error.name)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
        request.log.error(error)
        return reply.status(500).send({
          error: 'Error interno del servidor',
          message: 'No se pudo crear el producto',
          details: error.message, // Agregar mensaje de error en respuesta
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
        const productoExistenteResult = await fastify.db.query(
          'SELECT * FROM productos WHERE id = $1',
          [id]
        )

        if (productoExistenteResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'No encontrado',
            message: `Producto con ID ${id} no encontrado`,
          })
        }

        const productoExistente = productoExistenteResult.rows[0]

        // Si se actualiza el SKU, verificar que no exista
        if (
          datosActualizacion.sku &&
          datosActualizacion.sku !== productoExistente.sku
        ) {
          const skuExistenteResult = await fastify.db.query(
            'SELECT id FROM productos WHERE sku = $1',
            [datosActualizacion.sku]
          )

          if (skuExistenteResult.rows.length > 0) {
            return reply.status(409).send({
              error: 'Conflicto',
              message: `Ya existe un producto con el SKU: ${datosActualizacion.sku}`,
            })
          }
        }

        // Construir query de actualización dinámica
        const updateFields: string[] = []
        const updateValues: any[] = []
        let paramCount = 0

        if (datosActualizacion.sku !== undefined) {
          paramCount++
          updateFields.push(`sku = $${paramCount}`)
          updateValues.push(datosActualizacion.sku)
        }
        if (datosActualizacion.nombre !== undefined) {
          paramCount++
          updateFields.push(`nombre = $${paramCount}`)
          updateValues.push(datosActualizacion.nombre)
        }
        if (datosActualizacion.categoria !== undefined) {
          paramCount++
          updateFields.push(`categoria = $${paramCount}`)
          updateValues.push(datosActualizacion.categoria)
        }
        if (datosActualizacion.unidad !== undefined) {
          paramCount++
          updateFields.push(`unidad = $${paramCount}`)
          updateValues.push(datosActualizacion.unidad)
        }
        if (datosActualizacion.costo !== undefined) {
          paramCount++
          updateFields.push(`costo = $${paramCount}`)
          updateValues.push(datosActualizacion.costo)
        }
        if (datosActualizacion.stockActual !== undefined) {
          paramCount++
          updateFields.push(`"stockActual" = $${paramCount}`)
          updateValues.push(datosActualizacion.stockActual)
        }
        if (datosActualizacion.stockMin !== undefined) {
          paramCount++
          updateFields.push(`"stockMin" = $${paramCount}`)
          updateValues.push(datosActualizacion.stockMin)
        }
        if (datosActualizacion.leadTime !== undefined) {
          paramCount++
          updateFields.push(`"leadTime" = $${paramCount}`)
          updateValues.push(datosActualizacion.leadTime)
        }
        if (datosActualizacion.proveedorId !== undefined) {
          paramCount++
          updateFields.push(`"proveedorId" = $${paramCount}`)
          updateValues.push(datosActualizacion.proveedorId)
        }

        // Siempre actualizar updatedAt
        paramCount++
        updateFields.push(`"updatedAt" = $${paramCount}`)
        updateValues.push(new Date())

        // Agregar el ID al final
        paramCount++
        updateValues.push(id)

        const updateQuery = `
          UPDATE productos
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING id
        `

        await fastify.db.query(updateQuery, updateValues)

        request.log.info(
          { productoId: id },
          'Producto actualizado exitosamente'
        )

        return {
          id: id,
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
        const productoResult = await fastify.db.query(
          'SELECT id FROM productos WHERE id = $1',
          [id]
        )

        if (productoResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'No encontrado',
            message: `Producto con ID ${id} no encontrado`,
          })
        }

        // Soft delete - desactivar el producto
        await fastify.db.query(`
          UPDATE productos 
          SET "isActive" = false, "updatedAt" = $1
          WHERE id = $2
        `, [new Date(), id])

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
        const result = await fastify.db.query(`
          SELECT 
            pa.*,
            json_build_object(
              'sku', p.sku,
              'nombre', p.nombre
            ) as producto
          FROM politicas_abastecimiento pa
          INNER JOIN productos p ON pa."productoId" = p.id
          WHERE pa."productoId" = $1
        `, [id])

        if (result.rows.length === 0) {
          return reply.status(404).send({
            error: 'No encontrado',
            message: 'No existe política de abastecimiento para este producto',
          })
        }

        const row = result.rows[0]
        const politica = {
          id: row.id,
          productoId: row.productoId,
          estrategia: row.estrategia,
          rop: row.rop,
          stockSeguridad: row.stockSeguridad,
          parametrosJSON: row.parametrosJSON ? JSON.parse(row.parametrosJSON) : null,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          producto: row.producto
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
        const productoResult = await fastify.db.query(
          'SELECT id FROM productos WHERE id = $1',
          [id]
        )

        if (productoResult.rows.length === 0) {
          return reply.status(404).send({
            error: 'No encontrado',
            message: `Producto con ID ${id} no encontrado`,
          })
        }

        // Verificar que no exista una política ya
        const politicaExistenteResult = await fastify.db.query(
          'SELECT id FROM politicas_abastecimiento WHERE "productoId" = $1',
          [id]
        )

        if (politicaExistenteResult.rows.length > 0) {
          return reply.status(409).send({
            error: 'Política existente',
            message:
              'Ya existe una política de abastecimiento para este producto',
          })
        }

        // Crear política
        const politicaId = randomUUID()
        const now = new Date()
        
        const result = await fastify.db.query(`
          INSERT INTO politicas_abastecimiento (
            id, "productoId", estrategia, rop, "stockSeguridad",
            "parametrosJSON", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [
          politicaId,
          id,
          datosPolitica.estrategia,
          datosPolitica.rop,
          datosPolitica.stockSeguridad,
          datosPolitica.parametrosJSON ? JSON.stringify(datosPolitica.parametrosJSON) : null,
          now,
          now
        ])

        request.log.info(
          { productoId: id, politicaId: politicaId },
          'Política creada exitosamente'
        )

        return reply.status(201).send({
          id: politicaId,
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

  // Ruta para importar productos desde archivo
  fastify.post(
    '/importar',
    {
      onRequest: [fastify.authenticate, fastify.requireRole(['ADMIN'])],
      schema: {
        description: 'Importar productos desde archivo Excel o CSV',
        tags: ['productos'],
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
    importarProductos
  )
}

export default productosRoutes
