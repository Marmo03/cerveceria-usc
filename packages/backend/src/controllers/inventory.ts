import { FastifyInstance } from 'fastify'

export default async function inventoryRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    return reply.send({
      success: true,
      message: 'Inventory routes - Coming soon',
    })
  })
}