import { FastifyInstance } from 'fastify'

export default async function salesRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    return reply.send({
      success: true,
      message: 'Sales routes - Coming soon',
    })
  })
}