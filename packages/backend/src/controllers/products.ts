import { FastifyInstance } from 'fastify'

export default async function productRoutes(fastify: FastifyInstance) {
  // GET /products - Listar productos
  fastify.get('/', {
    schema: {
      tags: ['products'],
      summary: 'Listar todos los productos',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  sku: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  unitPrice: { type: 'number' },
                  currentStock: { type: 'number' },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const products = await fastify.prisma.product.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })

      return reply.send({
        success: true,
        products,
      })
    } catch (error) {
      fastify.log.error('Error obteniendo productos:', error)
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  })

  // GET /products/:id - Obtener producto por ID
  fastify.get<{ Params: { id: string } }>('/:id', {
    schema: {
      tags: ['products'],
      summary: 'Obtener producto por ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params

      const product = await fastify.prisma.product.findUnique({
        where: { id },
      })

      if (!product) {
        return reply.status(404).send({
          success: false,
          message: 'Producto no encontrado',
        })
      }

      return reply.send({
        success: true,
        product,
      })
    } catch (error) {
      fastify.log.error('Error obteniendo producto:', error)
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  })
}