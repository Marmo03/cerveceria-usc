import { FastifyPluginAsync } from 'fastify'
import axios from 'axios'
import {
  createTransportistaSchema,
  updateTransportistaSchema,
  createEnvioSchema,
  listTransportistasQuerySchema,
  type CreateTransportistaInput,
  type UpdateTransportistaInput,
  type CreateEnvioInput,
} from '../schemas/logistics.js'

const logisticsRoutes: FastifyPluginAsync = async (server) => {
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
        const { randomUUID } = await import('crypto')
        const id = randomUUID()

        const result = await server.db.query(`
          INSERT INTO transportistas (
            id, nombre, "tipoServicio", direccion, telefono, email, 
            "costoBase", "isActive", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `, [
          id,
          validatedData.nombre,
          validatedData.tipoServicio,
          validatedData.direccion || null,
          validatedData.telefono || null,
          validatedData.email || null,
          validatedData.costoBase || 0,
          true,
          new Date(),
          new Date()
        ])

        return reply.status(201).send({
          success: true,
          data: result.rows[0],
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
        const { page = 1, limit = 10, tipoServicio, isActive, search } = query

        const conditions: string[] = []
        const values: any[] = []
        let paramCount = 0

        if (tipoServicio) {
          paramCount++
          conditions.push(`"tipoServicio" = $${paramCount}`)
          values.push(tipoServicio)
        }

        if (isActive !== undefined) {
          paramCount++
          conditions.push(`"isActive" = $${paramCount}`)
          values.push(isActive)
        }

        if (search) {
          paramCount++
          conditions.push(`(nombre ILIKE $${paramCount} OR email ILIKE $${paramCount} OR telefono ILIKE $${paramCount})`)
          values.push(`%${search}%`)
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

        // Count total
        const countResult = await server.db.query(
          `SELECT COUNT(*) as total FROM transportistas ${whereClause}`,
          values
        )
        const total = Number(countResult.rows[0]?.total || 0)

        // Get data with pagination
        const dataResult = await server.db.query(`
          SELECT t.*, 
            (SELECT COUNT(*) FROM envios WHERE "transportistaId" = t.id) as envios_count
          FROM transportistas t
          ${whereClause}
          ORDER BY t."createdAt" DESC
          LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `, [...values, limit, (page - 1) * limit])

        return reply.send({
          success: true,
          data: dataResult.rows,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
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
        const result = await server.db.query(`
          SELECT t.*, 
            (SELECT COUNT(*) FROM envios WHERE "transportistaId" = t.id) as envios_count,
            (SELECT json_agg(json_build_object(
              'id', e.id,
              'numeroGuia', e."numeroGuia",
              'estado', e.estado,
              'fechaEnvio', e."fechaEnvio"
            )) FROM (
              SELECT * FROM envios WHERE "transportistaId" = t.id ORDER BY "createdAt" DESC LIMIT 10
            ) e) as envios
          FROM transportistas t
          WHERE t.id = $1
        `, [request.params.id])

        if (result.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Transportista no encontrado',
          })
        }

        return reply.send({
          success: true,
          data: result.rows[0],
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
        
        const updates: string[] = []
        const values: any[] = []
        let paramCount = 0

        if (validatedData.nombre !== undefined) {
          paramCount++
          updates.push(`nombre = $${paramCount}`)
          values.push(validatedData.nombre)
        }
        if (validatedData.tipoServicio !== undefined) {
          paramCount++
          updates.push(`"tipoServicio" = $${paramCount}`)
          values.push(validatedData.tipoServicio)
        }
        if (validatedData.direccion !== undefined) {
          paramCount++
          updates.push(`direccion = $${paramCount}`)
          values.push(validatedData.direccion)
        }
        if (validatedData.telefono !== undefined) {
          paramCount++
          updates.push(`telefono = $${paramCount}`)
          values.push(validatedData.telefono)
        }
        if (validatedData.email !== undefined) {
          paramCount++
          updates.push(`email = $${paramCount}`)
          values.push(validatedData.email)
        }
        if (validatedData.costoBase !== undefined) {
          paramCount++
          updates.push(`"costoBase" = $${paramCount}`)
          values.push(validatedData.costoBase)
        }

        paramCount++
        updates.push(`"updatedAt" = $${paramCount}`)
        values.push(new Date())

        values.push(request.params.id)

        const result = await server.db.query(`
          UPDATE transportistas 
          SET ${updates.join(', ')}
          WHERE id = $${paramCount + 1}
          RETURNING *
        `, values)

        if (result.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Transportista no encontrado',
          })
        }

        return reply.send({
          success: true,
          data: result.rows[0],
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
        const result = await server.db.query(`
          UPDATE transportistas 
          SET "isActive" = false, "updatedAt" = $1
          WHERE id = $2
          RETURNING *
        `, [new Date(), request.params.id])

        if (result.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Transportista no encontrado',
          })
        }

        return reply.send({
          success: true,
          data: result.rows[0],
        })
      } catch (error: any) {
        return reply.status(400).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // ===== RUTAS DE ENVÍOS (IMPLEMENTACIÓN SIMPLIFICADA) =====

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
        const { randomUUID } = await import('crypto')
        const id = randomUUID()

        const result = await server.db.query(`
          INSERT INTO envios (
            id, "numeroGuia", "transportistaId", "direccionDestino", 
            "direccionOrigen", estado, "fechaEnvio", "costoEnvio", 
            "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `, [
          id,
          validatedData.numeroGuia,
          validatedData.transportistaId,
          validatedData.direccionDestino,
          validatedData.direccionOrigen || null,
          'PENDIENTE',
          validatedData.fechaEnvio || new Date(),
          validatedData.costoEnvio || 0,
          new Date(),
          new Date()
        ])

        return reply.status(201).send({
          success: true,
          data: result.rows[0],
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
        const result = await server.db.query(`
          SELECT e.*, 
            json_build_object('id', t.id, 'nombre', t.nombre) as transportista
          FROM envios e
          LEFT JOIN transportistas t ON e."transportistaId" = t.id
          ORDER BY e."createdAt" DESC
          LIMIT 100
        `)

        return reply.send({
          success: true,
          data: result.rows,
          total: result.rows.length,
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
        const result = await server.db.query(`
          SELECT e.*, 
            json_build_object('id', t.id, 'nombre', t.nombre, 'telefono', t.telefono) as transportista
          FROM envios e
          LEFT JOIN transportistas t ON e."transportistaId" = t.id
          WHERE e.id = $1
        `, [request.params.id])

        if (result.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Envío no encontrado',
          })
        }

        return reply.send({
          success: true,
          data: result.rows[0],
        })
      } catch (error: any) {
        return reply.status(404).send({
          success: false,
          error: error.message,
        })
      }
    }
  )

  // GET /api/logistics/envios/tracking/:numeroGuia - Tracking
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
      const result = await server.db.query(
        'SELECT * FROM envios WHERE "numeroGuia" = $1',
        [request.params.numeroGuia]
      )
      return reply.send({ success: true, data: result.rows[0] || null })
    }
  )

  // Endpoints restantes simplificados (para evitar errores 404)
  server.patch('/envios/:id', async (request, reply) => {
    return reply.send({ success: true, message: 'Función en desarrollo' })
  })

  server.post('/envios/:id/cancelar', async (request, reply) => {
    return reply.send({ success: true, message: 'Función en desarrollo' })
  })

  server.post('/envios/:id/rutas', async (request, reply) => {
    return reply.send({ success: true, message: 'Función en desarrollo' })
  })

  server.get('/envios/:id/rutas', async (request, reply) => {
    return reply.send({ success: true, data: [] })
  })

  server.post('/envios/:id/estados', async (request, reply) => {
    return reply.send({ success: true, message: 'Función en desarrollo' })
  })

  server.get('/envios/:id/estados', async (request, reply) => {
    return reply.send({ success: true, data: [] })
  })

  server.post('/envios/:id/productos', async (request, reply) => {
    return reply.send({ success: true, message: 'Función en desarrollo' })
  })

  server.get('/envios/:id/productos', async (request, reply) => {
    return reply.send({ success: true, data: [] })
  })

  server.get('/stats', async (request, reply) => {
    const enviosTotal = await server.db.query('SELECT COUNT(*) FROM envios')
    const transportistasTotal = await server.db.query('SELECT COUNT(*) FROM transportistas WHERE "isActive" = true')
    
    return reply.send({
      success: true,
      data: {
        enviosTotal: Number(enviosTotal.rows[0]?.count || 0),
        transportistasActivos: Number(transportistasTotal.rows[0]?.count || 0),
      },
    })
  })

  // ===== PROXY PARA SERVIENTREGA API (evita CORS) =====

  // Proxy genérico para Servientrega
  server.get('/servientrega-proxy/*', async (request, reply) => {
    try {
      const path = (request.params as any)['*']
      const queryString = new URLSearchParams(request.query as any).toString()
      const url = `https://mobile.servientrega.com/ApiIngresoCLientes/api/${path}${queryString ? '?' + queryString : ''}`
      
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        httpsAgent: new (await import('https')).Agent({
          rejectUnauthorized: false
        })
      })
      
      return reply.send(response.data)
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message
      })
    }
  })

  // POST /api/logistics/geocodificar - Geocodificar dirección (Nominatim/OpenStreetMap)
  server.post<{
    Body: {
      direccion: string
      ciudad?: string
    }
  }>(
    '/geocodificar',
    {
      schema: {
        tags: ['logistics'],
        description: 'Convertir dirección a coordenadas',
        body: {
          type: 'object',
          required: ['direccion'],
          properties: {
            direccion: { type: 'string' },
            ciudad: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { geocodificarDireccion } = await import('../services/servientrega.js')
        
        const resultado = await geocodificarDireccion(request.body.direccion, request.body.ciudad)
        
        if (!resultado) {
          return reply.status(404).send({
            success: false,
            error: 'No se pudo geocodificar la dirección'
          })
        }
        
        return reply.send({
          success: true,
          data: resultado
        })
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: error.message
        })
      }
    }
  )
}

export default logisticsRoutes
