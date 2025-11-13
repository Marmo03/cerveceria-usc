import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { PrismaClient } from '@prisma/client'

// Importar rutas
import authRoutes from './controllers/auth.js'
import productosRoutes from './controllers/productos.js'
import inventarioRoutes from './controllers/inventario.js'
import salesRoutes from './controllers/sales.js'
import reportsRoutes from './controllers/reports.js'
import logisticsRoutes from './controllers/logistics.js'
import solicitudesRoutes from './controllers/solicitudes.js'
import usuariosRoutes from './controllers/usuarios.js'

// Importar middleware de autenticación
import {
  authenticate,
  requireRole,
  requireActiveUser,
} from './middleware/auth.js'

// Importar tipos
import { AuthenticatedUser } from './types/auth.js'

// Configuración del servidor
const server: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
})

// Instancia global de Prisma
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// Decorar Fastify con Prisma para acceso global
server.decorate('prisma', prisma)

// Decorar Fastify con funciones de autenticación
server.decorate('authenticate', authenticate)
server.decorate('requireRole', requireRole)
server.decorate('requireActiveUser', requireActiveUser)

// Configurar plugins de seguridad
async function configurePlugins() {
  // CORS
  await server.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })

  // Helmet para headers de seguridad
  await server.register(helmet, {
    contentSecurityPolicy: false, // Deshabilitado para desarrollo
  })

  // Rate limiting
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  // JWT para autenticación
  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
  })

  // Swagger para documentación de API
  await server.register(swagger, {
    swagger: {
      info: {
        title: 'Cervecería USC API',
        description: 'API REST para gestión de cervecería universitaria',
        version: '1.0.0',
      },
      externalDocs: {
        url: 'https://swagger.io',
        description: 'Find more info here',
      },
      host: process.env.HOST || 'localhost:3000',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'auth', description: 'Autenticación y autorización' },
        { name: 'productos', description: 'Gestión de productos' },
        {
          name: 'inventario',
          description: 'Gestión de inventario y movimientos',
        },
        { name: 'sales', description: 'Gestión de ventas' },
        { name: 'reports', description: 'Reportes e indicadores' },
        {
          name: 'logistics',
          description: 'Gestión de logística y rastreo de envíos',
        },
        {
          name: 'Solicitudes',
          description: 'Gestión de solicitudes de compra',
        },
        {
          name: 'Usuarios',
          description: 'Gestión de usuarios y roles (solo ADMIN)',
        },
      ],
    },
  })

  await server.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
  })
}

// Configurar rutas
async function configureRoutes() {
  // Health check
  server.get('/health', async (request, reply) => {
    const dbHealth = await checkDatabaseHealth()
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: dbHealth ? 'connected' : 'disconnected',
    }
  })

  // Registrar rutas de la API
  await server.register(authRoutes, { prefix: '/api/auth' })
  await server.register(productosRoutes, { prefix: '/api/productos' })
  await server.register(inventarioRoutes, { prefix: '/api/inventario' })
  await server.register(salesRoutes, { prefix: '/api/sales' })
  await server.register(reportsRoutes, { prefix: '/api/reports' })
  await server.register(logisticsRoutes, { prefix: '/api/logistics' })
  await server.register(solicitudesRoutes, { prefix: '/api/solicitudes' })
  await server.register(usuariosRoutes, { prefix: '/api/usuarios' })
}

// Verificar salud de la base de datos
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    server.log.error({ error }, 'Database health check failed')
    return false
  }
}

// Manejo de errores global
server.setErrorHandler((error, request, reply) => {
  server.log.error(error)

  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation,
    })
    return
  }

  if (error.statusCode) {
    reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
    })
    return
  }

  reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Something went wrong',
  })
})

// Hook para cerrar conexión de Prisma al terminar el servidor
server.addHook('onClose', async () => {
  await prisma.$disconnect()
})

// Inicializar servidor
async function start() {
  try {
    await configurePlugins()
    await configureRoutes()

    const host = process.env.HOST || '0.0.0.0'
    const port = parseInt(process.env.PORT || '3000')

    await server.listen({ host, port })
    server.log.info(`Cervecería USC API running on http://${host}:${port}`)
    server.log.info(
      `Swagger docs available at http://${host}:${port}/documentation`
    )
  } catch (error) {
    server.log.error(error)
    process.exit(1)
  }
}

// Manejo de señales para cierre graceful
process.on('SIGINT', () => server.close())
process.on('SIGTERM', () => server.close())

// Declaración de tipos para TypeScript
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    authenticate: typeof authenticate
    requireRole: typeof requireRole
    requireActiveUser: typeof requireActiveUser
  }
  interface FastifyRequest {
    currentUser?: AuthenticatedUser
  }
}

start()
