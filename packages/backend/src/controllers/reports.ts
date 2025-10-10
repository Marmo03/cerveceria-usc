import { FastifyInstance } from 'fastify'

export default async function reportsRoutes(fastify: FastifyInstance) {
  fastify.get('/', async (request, reply) => {
    return reply.send({
      success: true,
      message: 'Reports routes - Coming soon',
    })
  })
}