import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import pg from 'pg'
import { config } from 'dotenv'

// Cargar variables de entorno
config()

// Importar rutas
import authRoutes from './controllers/auth.js'
import productosRoutes from './controllers/productos.js'
import inventarioRoutes from './controllers/inventario.js'
import salesRoutes from './controllers/sales.js'
import reportsRoutes from './controllers/reports.js'
import logisticsRoutes from './controllers/logistics.js'
import solicitudesRoutes from './controllers/solicitudes.js'
import usuariosRoutes from './controllers/usuarios.js'
import multipart from '@fastify/multipart'

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

// Pool de conexiones de PostgreSQL
console.log('=== CONFIGURACIÓN DE DATABASE ===')
console.log('DATABASE_URL:', process.env.DATABASE_URL)
console.log('=================================')

const pool = new pg.Pool({
  host: '127.0.0.1',
  port: 5433,
  database: 'cerveceria_usc',
  user: 'cerveceria_user',
  password: 'cerveceria_password',
  max: 20,
})

// Test de conexión inmediato
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ ERROR DE CONEXIÓN AL POOL:', err.message)
  } else {
    console.log('✅ POOL CONECTADO EXITOSAMENTE:', res.rows[0])
  }
})

// Decorar Fastify con el pool
server.decorate('db', pool)

// TEMPORAL: Mantener prisma decorador para compatibilidad con controladores antiguos
// TODO: Migrar todos los controladores de fastify.prisma a fastify.db
server.decorate('prisma', {
  // Proxy que redirige a mensajes de error informativos cuando se intente usar
  producto: {
    findMany: async () => { throw new Error('MIGRACIÓN PENDIENTE: productos.findMany - Use fastify.db con SQL directo') },
    findUnique: async () => { throw new Error('MIGRACIÓN PENDIENTE: productos.findUnique - Use fastify.db con SQL directo') },
    create: async () => { throw new Error('MIGRACIÓN PENDIENTE: productos.create - Use fastify.db con SQL directo') },
    update: async () => { throw new Error('MIGRACIÓN PENDIENTE: productos.update - Use fastify.db con SQL directo') },
    count: async () => { throw new Error('MIGRACIÓN PENDIENTE: productos.count - Use fastify.db con SQL directo') },
  },
  user: {
    findMany: async () => { throw new Error('MIGRACIÓN PENDIENTE: user.findMany - Use fastify.db con SQL directo') },
    findUnique: async () => { throw new Error('MIGRACIÓN PENDIENTE: user.findUnique - Use fastify.db con SQL directo') },
    findFirst: async () => { throw new Error('MIGRACIÓN PENDIENTE: user.findFirst - Use fastify.db con SQL directo') },
    create: async () => { throw new Error('MIGRACIÓN PENDIENTE: user.create - Use fastify.db con SQL directo') },
    update: async () => { throw new Error('MIGRACIÓN PENDIENTE: user.update - Use fastify.db con SQL directo') },
  },
  role: {
    findMany: async () => { throw new Error('MIGRACIÓN PENDIENTE: role.findMany - Use fastify.db con SQL directo') },
    findFirst: async () => { throw new Error('MIGRACIÓN PENDIENTE: role.findFirst - Use fastify.db con SQL directo') },
  },
  solicitudCompra: {
    findMany: async () => { throw new Error('MIGRACIÓN PENDIENTE: solicitudCompra.findMany - Use fastify.db con SQL directo') },
    findUnique: async () => { throw new Error('MIGRACIÓN PENDIENTE: solicitudCompra.findUnique - Use fastify.db con SQL directo') },
    create: async () => { throw new Error('MIGRACIÓN PENDIENTE: solicitudCompra.create - Use fastify.db con SQL directo') },
    update: async () => { throw new Error('MIGRACIÓN PENDIENTE: solicitudCompra.update - Use fastify.db con SQL directo') },
  },
  movimientoInventario: {
    findMany: async () => { throw new Error('MIGRACIÓN PENDIENTE: movimientoInventario.findMany - Use fastify.db con SQL directo') },
    count: async () => { throw new Error('MIGRACIÓN PENDIENTE: movimientoInventario.count - Use fastify.db con SQL directo') },
  },
  $transaction: async () => { throw new Error('MIGRACIÓN PENDIENTE: $transaction - Use BEGIN/COMMIT con fastify.db') },
})

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

  // Multipart para subida de archivos
  await server.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
      files: 1, // Un archivo a la vez
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
  await server.register(usuariosRoutes, { prefix: '/api/usuarios' })
  await server.register(inventarioRoutes, { prefix: '/api/inventario' })
  await server.register(solicitudesRoutes, { prefix: '/api/solicitudes' })
  await server.register(salesRoutes, { prefix: '/api/sales' })
  await server.register(logisticsRoutes, { prefix: '/api/logistics' }) // ✅ MIGRADO
  await server.register(reportsRoutes, { prefix: '/api/reports' }) // ✅ MIGRADO
}

// Verificar salud de la base de datos
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1')
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

// Hook para cerrar conexión del pool al terminar el servidor
server.addHook('onClose', async () => {
  await pool.end()
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

// Capturar errores no manejados
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason)
  process.exit(1)
})

// Declaración de tipos para TypeScript
declare module 'fastify' {
  interface FastifyInstance {
    db: pg.Pool
    prisma: any // TEMPORAL: Para compatibilidad con controladores no migrados
    authenticate: typeof authenticate
    requireRole: typeof requireRole
    requireActiveUser: typeof requireActiveUser
  }
  interface FastifyRequest {
    currentUser?: AuthenticatedUser
  }
}

start()

// Mantener el proceso vivo
setInterval(() => {}, 1000 * 60 * 60) // Cada hora
