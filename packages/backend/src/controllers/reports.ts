import { FastifyInstance } from 'fastify'
import { z } from 'zod'

// Schemas de validación
const PeriodoQuerySchema = z.object({
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  periodo: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
})

export default async function reportsRoutes(fastify: FastifyInstance) {
  // GET /api/reports/kpis - Obtener KPIs principales
  fastify.get(
    '/kpis',
    {
      schema: {
        tags: ['Reports'],
        summary: 'Obtener KPIs principales del sistema',
        querystring: {
          type: 'object',
          properties: {
            desde: { type: 'string', format: 'date' },
            hasta: { type: 'string', format: 'date' },
            periodo: { type: 'string', enum: ['7d', '30d', '90d', '1y'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  rotacionInventario: { type: 'number' },
                  stockoutRate: { type: 'number' },
                  costoInventario: { type: 'number' },
                  tiempoAprobacion: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const query = PeriodoQuerySchema.parse(request.query)

        // Calcular fechas del período
        const hasta = query.hasta || new Date()
        let desde = query.desde

        if (!desde && query.periodo) {
          const dias =
            query.periodo === '7d'
              ? 7
              : query.periodo === '30d'
                ? 30
                : query.periodo === '90d'
                  ? 90
                  : 365
          desde = new Date(hasta)
          desde.setDate(desde.getDate() - dias)
        }

        // Construir queries dinámicamente según si hay filtro de fecha
        const fechaCondition = desde ? 'WHERE fecha >= $1 AND fecha <= $2' : ''
        const fechaParams = desde ? [desde, hasta] : []

        // 1. Calcular Rotación de Inventario (Movimientos totales / Stock promedio)
        const movimientosQuery = desde
          ? `SELECT COALESCE(SUM(cantidad), 0) as total FROM movimientos_inventario WHERE fecha >= $1 AND fecha <= $2`
          : `SELECT COALESCE(SUM(cantidad), 0) as total FROM movimientos_inventario`
        
        const movimientosResult = await fastify.db.query(
          movimientosQuery,
          fechaParams
        )
        const totalMovimientos = Number(movimientosResult.rows[0]?.total || 0)

        const productosResult = await fastify.db.query(
          `SELECT "stockActual" FROM productos WHERE "isActive" = true`
        )
        const productos = productosResult.rows

        const stockPromedio =
          productos.reduce((sum: number, p: any) => sum + p.stockActual, 0) /
          (productos.length || 1)
        const rotacionInventario = totalMovimientos / (stockPromedio || 1)

        // 2. Calcular Tasa de Desabastecimiento (Productos bajo stock mínimo / Total productos)
        const todosProductosResult = await fastify.db.query(
          `SELECT "stockActual", "stockMin" FROM productos WHERE "isActive" = true`
        )
        const todosProductos = todosProductosResult.rows

        const productosStockBajo = todosProductos.filter(
          (p: any) => p.stockActual <= p.stockMin
        ).length
        const totalProductos = todosProductos.length
        const stockoutRate =
          totalProductos > 0 ? (productosStockBajo / totalProductos) * 100 : 0

        // 3. Calcular Costo de Inventario (Stock actual * Costo unitario)
        const costoResult = await fastify.db.query(
          `SELECT COALESCE(SUM("stockActual" * costo), 0) as total FROM productos WHERE "isActive" = true`
        )
        const costoInventario = Number(costoResult.rows[0]?.total || 0)

        // 4. Calcular Tiempo Promedio de Aprobación (En días)
        const solicitudesQuery = desde
          ? `SELECT "fechaCreacion", "fechaActualizacion" 
             FROM solicitudes_compra 
             WHERE estado IN ('APROBADA', 'RECHAZADA') 
             AND "fechaActualizacion" >= $1 AND "fechaActualizacion" <= $2`
          : `SELECT "fechaCreacion", "fechaActualizacion" 
             FROM solicitudes_compra 
             WHERE estado IN ('APROBADA', 'RECHAZADA')`
        
        const solicitudesResult = await fastify.db.query(
          solicitudesQuery,
          fechaParams
        )

        const tiemposAprobacion = solicitudesResult.rows.map((s: any) => {
          const diff =
            new Date(s.fechaActualizacion).getTime() -
            new Date(s.fechaCreacion).getTime()
          return diff / (1000 * 60 * 60 * 24) // Convertir a días
        })

        const tiempoAprobacion =
          tiemposAprobacion.length > 0
            ? tiemposAprobacion.reduce((sum: number, t: number) => sum + t, 0) /
              tiemposAprobacion.length
            : 0

        return reply.send({
          success: true,
          data: {
            rotacionInventario: Number(rotacionInventario.toFixed(2)),
            stockoutRate: Number(stockoutRate.toFixed(2)),
            costoInventario: Number(costoInventario.toFixed(2)),
            tiempoAprobacion: Number(tiempoAprobacion.toFixed(2)),
          },
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Error al calcular KPIs',
        })
      }
    }
  )

  // GET /api/reports/top-products - Productos con mayor rotación
  fastify.get(
    '/top-products',
    {
      schema: {
        tags: ['Reports'],
        summary: 'Obtener productos con mayor rotación',
        querystring: {
          type: 'object',
          properties: {
            desde: { type: 'string', format: 'date' },
            hasta: { type: 'string', format: 'date' },
            periodo: { type: 'string', enum: ['7d', '30d', '90d', '1y'] },
            limit: { type: 'number', default: 10 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const query = PeriodoQuerySchema.extend({
          limit: z.coerce.number().int().min(1).max(50).default(10),
        }).parse(request.query)

        const hasta = query.hasta || new Date()
        let desde = query.desde

        if (!desde && query.periodo) {
          const dias =
            query.periodo === '7d'
              ? 7
              : query.periodo === '30d'
                ? 30
                : query.periodo === '90d'
                  ? 90
                  : 365
          desde = new Date(hasta)
          desde.setDate(desde.getDate() - dias)
        }

        // Query para obtener productos con mayor rotación
        const productsQuery = desde
          ? `
          SELECT 
            p.id,
            p.codigo,
            p.nombre,
            p.categoria,
            p.unidad,
            p."stockActual",
            COUNT(m.id) as movimientos,
            COALESCE(SUM(m.cantidad), 0) as "cantidadMovida",
            COALESCE(SUM(m.cantidad * p.costo), 0) as "valorMovido"
          FROM productos p
          LEFT JOIN movimientos_inventario m ON m."productoId" = p.id AND m.fecha >= $1 AND m.fecha <= $2
          WHERE p."isActive" = true
          GROUP BY p.id
          ORDER BY "cantidadMovida" DESC
          LIMIT $3
        `
          : `
          SELECT 
            p.id,
            p.codigo,
            p.nombre,
            p.categoria,
            p.unidad,
            p."stockActual",
            COUNT(m.id) as movimientos,
            COALESCE(SUM(m.cantidad), 0) as "cantidadMovida",
            COALESCE(SUM(m.cantidad * p.costo), 0) as "valorMovido"
          FROM productos p
          LEFT JOIN movimientos_inventario m ON m."productoId" = p.id
          WHERE p."isActive" = true
          GROUP BY p.id
          ORDER BY "cantidadMovida" DESC
          LIMIT $1
        `

        const productsParams = desde ? [desde, hasta, query.limit] : [query.limit]
        
        const result = await fastify.db.query(productsQuery, productsParams)

        // Construir respuesta
        const topProducts = result.rows.map((row: any) => {
          const cantidadMovida = Number(row.cantidadMovida)
          const valorMovido = Number(row.valorMovido || 0)
          const rotacion =
            row.stockActual > 0 ? cantidadMovida / row.stockActual : 0

          return {
            id: row.id,
            codigo: row.codigo,
            nombre: row.nombre,
            categoria: row.categoria,
            unidad: row.unidad,
            movimientos: Number(row.movimientos),
            cantidadMovida,
            rotacion: Number(rotacion.toFixed(2)),
            stockActual: row.stockActual,
            valorMovido: Number(valorMovido.toFixed(2)),
          }
        })

        return reply.send({
          success: true,
          data: topProducts,
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Error al obtener productos',
        })
      }
    }
  )

  // GET /api/reports/movimientos-temporales - Movimientos por período de tiempo
  fastify.get(
    '/movimientos-temporales',
    {
      schema: {
        tags: ['Reports'],
        summary: 'Obtener movimientos agrupados por fecha',
      },
    },
    async (request, reply) => {
      try {
        const query = PeriodoQuerySchema.parse(request.query)

        const hasta = query.hasta || new Date()
        let desde = query.desde

        if (!desde && query.periodo) {
          const dias =
            query.periodo === '7d'
              ? 7
              : query.periodo === '30d'
                ? 30
                : query.periodo === '90d'
                  ? 90
                  : 365
          desde = new Date(hasta)
          desde.setDate(desde.getDate() - dias)
        }

        // Obtener movimientos (todos si no hay filtro de fecha)
        const movimientosQuery = desde
          ? `SELECT fecha, tipo, cantidad FROM movimientos_inventario WHERE fecha >= $1 AND fecha <= $2 ORDER BY fecha ASC`
          : `SELECT fecha, tipo, cantidad FROM movimientos_inventario ORDER BY fecha ASC`
        
        const movimientosParams = desde ? [desde, hasta] : []
        
        const movimientosResult = await fastify.db.query(
          movimientosQuery,
          movimientosParams
        )
        const movimientos = movimientosResult.rows

        // Agrupar por fecha y tipo
        const agrupado: Record<
          string,
          { fecha: string; entradas: number; salidas: number }
        > = {}

        movimientos.forEach((mov) => {
          const fechaKey = mov.fecha.toISOString().split('T')[0]

          if (!agrupado[fechaKey]) {
            agrupado[fechaKey] = { fecha: fechaKey, entradas: 0, salidas: 0 }
          }

          if (mov.tipo === 'ENTRADA') {
            agrupado[fechaKey].entradas += mov.cantidad
          } else {
            agrupado[fechaKey].salidas += mov.cantidad
          }
        })

        const resultado = Object.values(agrupado).sort(
          (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        )

        return reply.send({
          success: true,
          data: resultado,
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Error al obtener movimientos',
        })
      }
    }
  )

  // GET /api/reports/alertas - Alertas y recomendaciones del sistema
  fastify.get(
    '/alertas',
    {
      schema: {
        tags: ['Reports'],
        summary: 'Obtener alertas y recomendaciones del sistema',
      },
    },
    async (request, reply) => {
      try {
        const alertas = []

        // 1. Productos con stock crítico
        const productosStockBajoResult = await fastify.db.query(
          `SELECT nombre FROM productos WHERE "isActive" = true AND "stockActual" <= "stockMin" LIMIT 3`
        )
        const productosStockBajo = productosStockBajoResult.rows

        if (productosStockBajo.length > 0) {
          alertas.push({
            id: 'stock-critico',
            type: 'warning',
            title: 'Stock crítico detectado',
            description: `${productosStockBajo.length} producto(s) están por debajo del stock mínimo: ${productosStockBajo.map((p: any) => p.nombre).join(', ')}`,
            action: 'Ver productos críticos',
          })
        }

        // 2. Solicitudes pendientes de aprobación
        const solicitudesPendientesResult = await fastify.db.query(
          `SELECT COUNT(*) as total FROM solicitudes_compra WHERE estado = 'EN_APROBACION'`
        )
        const solicitudesPendientes = Number(solicitudesPendientesResult.rows[0]?.total || 0)

        if (solicitudesPendientes > 0) {
          alertas.push({
            id: 'solicitudes-pendientes',
            type: 'info',
            title: `${solicitudesPendientes} solicitud(es) pendiente(s)`,
            description: 'Hay solicitudes de compra esperando aprobación',
            action: 'Ver solicitudes',
          })
        }

        // 3. Productos sin movimiento reciente
        const hace30Dias = new Date()
        hace30Dias.setDate(hace30Dias.getDate() - 30)

        const productosSinMovimientoResult = await fastify.db.query(
          `SELECT COUNT(*) as total FROM productos p 
           WHERE p."isActive" = true 
           AND NOT EXISTS (
             SELECT 1 FROM movimientos_inventario mi 
             WHERE mi."productoId" = p.id AND mi.fecha >= $1
           )`,
          [hace30Dias]
        )
        const productosSinMovimiento = Number(productosSinMovimientoResult.rows[0]?.total || 0)

        if (productosSinMovimiento > 0) {
          alertas.push({
            id: 'sin-movimiento',
            type: 'info',
            title: 'Productos sin movimiento',
            description: `${productosSinMovimiento} producto(s) no han tenido movimientos en los últimos 30 días`,
            action: 'Ver análisis',
          })
        }

        return reply.send({
          success: true,
          data: alertas,
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.status(500).send({
          success: false,
          message: 'Error al obtener alertas',
        })
      }
    }
  )
}
