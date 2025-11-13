import { FastifyInstance } from 'fastify'
import { z } from 'zod'

// Schemas de validación
const PeriodoQuerySchema = z.object({
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  periodo: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
})

export default async function reportsRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma

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

        if (!desde) {
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

        // 1. Calcular Rotación de Inventario (Movimientos totales / Stock promedio)
        const movimientos = await prisma.movimientosInventario.aggregate({
          _sum: { cantidad: true },
          where: {
            fecha: { gte: desde, lte: hasta },
          },
        })

        const productos = await prisma.producto.findMany({
          where: { isActive: true },
          select: { stockActual: true },
        })

        const stockPromedio =
          productos.reduce((sum, p) => sum + p.stockActual, 0) /
          (productos.length || 1)
        const rotacionInventario =
          (movimientos._sum.cantidad || 0) / (stockPromedio || 1)

        // 2. Calcular Tasa de Desabastecimiento (Productos bajo stock mínimo / Total productos)
        const todosProductos = await prisma.producto.findMany({
          where: { isActive: true },
          select: { stockActual: true, stockMin: true },
        })

        const productosStockBajo = todosProductos.filter(
          (p) => p.stockActual <= p.stockMin
        ).length
        const totalProductos = todosProductos.length
        const stockoutRate =
          totalProductos > 0 ? (productosStockBajo / totalProductos) * 100 : 0

        // 3. Calcular Costo de Inventario (Stock actual * Costo unitario)
        const productosConCosto = await prisma.producto.findMany({
          where: { isActive: true },
          select: { stockActual: true, costo: true },
        })

        const costoInventario = productosConCosto.reduce(
          (sum, p) => sum + p.stockActual * p.costo,
          0
        )

        // 4. Calcular Tiempo Promedio de Aprobación (En días)
        const solicitudesAprobadas = await prisma.solicitudCompra.findMany({
          where: {
            estado: { in: ['APROBADA', 'RECHAZADA'] },
            fechaActualizacion: { gte: desde, lte: hasta },
          },
          select: {
            fechaCreacion: true,
            fechaActualizacion: true,
          },
        })

        const tiemposAprobacion = solicitudesAprobadas.map((s) => {
          const diff =
            s.fechaActualizacion.getTime() - s.fechaCreacion.getTime()
          return diff / (1000 * 60 * 60 * 24) // Convertir a días
        })

        const tiempoAprobacion =
          tiemposAprobacion.length > 0
            ? tiemposAprobacion.reduce((sum, t) => sum + t, 0) /
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
        fastify.log.error('Error al obtener KPIs:', error)
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

        if (!desde) {
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

        // Obtener movimientos agrupados por producto
        const movimientosPorProducto =
          await prisma.movimientosInventario.groupBy({
            by: ['productoId'],
            _count: { id: true },
            _sum: { cantidad: true },
            where: {
              fecha: { gte: desde, lte: hasta },
            },
            orderBy: {
              _count: { id: 'desc' },
            },
            take: query.limit,
          })

        // Obtener detalles de los productos
        const productoIds = movimientosPorProducto.map((m) => m.productoId)
        const productos = await prisma.producto.findMany({
          where: { id: { in: productoIds } },
          select: {
            id: true,
            sku: true,
            nombre: true,
            categoria: true,
            unidad: true,
            stockActual: true,
            costo: true,
          },
        })

        // Construir respuesta
        const topProducts = movimientosPorProducto
          .map((mov) => {
            const producto = productos.find((p) => p.id === mov.productoId)
            if (!producto) return null

            const cantidadMovida = mov._sum.cantidad || 0
            const valorMovido = cantidadMovida * producto.costo
            const rotacion =
              producto.stockActual > 0
                ? cantidadMovida / producto.stockActual
                : 0

            return {
              id: producto.id,
              codigo: producto.sku,
              nombre: producto.nombre,
              categoria: producto.categoria,
              unidad: producto.unidad,
              movimientos: mov._count.id,
              cantidadMovida,
              rotacion: Number(rotacion.toFixed(2)),
              stockActual: producto.stockActual,
              valorMovido: Number(valorMovido.toFixed(2)),
            }
          })
          .filter(Boolean)

        return reply.send({
          success: true,
          data: topProducts,
        })
      } catch (error) {
        fastify.log.error('Error al obtener top products:', error)
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

        if (!desde) {
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

        // Obtener movimientos
        const movimientos = await prisma.movimientosInventario.findMany({
          where: {
            fecha: { gte: desde, lte: hasta },
          },
          select: {
            fecha: true,
            tipo: true,
            cantidad: true,
          },
          orderBy: { fecha: 'asc' },
        })

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
        fastify.log.error('Error al obtener movimientos temporales:', error)
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
        const todosLosProductos = await prisma.producto.findMany({
          where: { isActive: true },
          select: { nombre: true, stockActual: true, stockMin: true },
        })

        const productosStockBajo = todosLosProductos
          .filter((p) => p.stockActual <= p.stockMin)
          .slice(0, 3)

        if (productosStockBajo.length > 0) {
          alertas.push({
            id: 'stock-critico',
            type: 'warning',
            title: 'Stock crítico detectado',
            description: `${productosStockBajo.length} producto(s) están por debajo del stock mínimo: ${productosStockBajo.map((p) => p.nombre).join(', ')}`,
            action: 'Ver productos críticos',
          })
        }

        // 2. Solicitudes pendientes de aprobación
        const solicitudesPendientes = await prisma.solicitudCompra.count({
          where: { estado: 'EN_APROBACION' },
        })

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

        const productosSinMovimiento = await prisma.producto.count({
          where: {
            isActive: true,
            movimientos: {
              none: {
                fecha: { gte: hace30Dias },
              },
            },
          },
        })

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
        fastify.log.error('Error al obtener alertas:', error)
        return reply.status(500).send({
          success: false,
          message: 'Error al obtener alertas',
        })
      }
    }
  )
}
