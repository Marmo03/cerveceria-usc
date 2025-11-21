// Middlewares de Autenticación y Autorización
// JWT Authentication, RBAC, y validaciones

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

// Tipos para el contexto de usuario
export interface UserContext {
  id: string
  email: string
  firstName: string
  lastName: string
  roleId: string
  roleName: string
  permissions: string[]
}

// Extender tipos de Fastify
declare module 'fastify' {
  interface FastifyRequest {
    user?: UserContext
  }

  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>
    authorize: (
      roles: string[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

// Plugin de middlewares de seguridad
const securityMiddlewaresPlugin: FastifyPluginAsync = async (fastify) => {
  // Middleware de autenticación JWT
  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Verificar que el token esté presente
        const token = request.headers.authorization?.replace('Bearer ', '')

        if (!token) {
          return reply.status(401).send({
            error: 'No autorizado',
            message: 'Token de acceso requerido',
          })
        }

        // Verificar y decodificar el token JWT
        const decoded = fastify.jwt.verify(token) as any

        // TODO: Aquí normalmente consultarías la base de datos para obtener los datos completos del usuario
        // Por ahora, usamos los datos del token
        request.user = {
          id: decoded.userId,
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          roleId: decoded.roleId,
          roleName: decoded.roleName,
          permissions: decoded.permissions || [],
        }
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return reply.status(401).send({
            error: 'Token expirado',
            message: 'El token de acceso ha expirado',
          })
        }

        if (error.name === 'JsonWebTokenError') {
          return reply.status(401).send({
            error: 'Token inválido',
            message: 'El token de acceso no es válido',
          })
        }

        request.log.error(error)
        return reply.status(401).send({
          error: 'Error de autenticación',
          message: 'No se pudo verificar el token',
        })
      }
    }
  )

  // Middleware de autorización basada en roles (RBAC)
  fastify.decorate('authorize', (allowedRoles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      // El usuario debe estar autenticado primero
      if (!request.user) {
        return reply.status(401).send({
          error: 'No autenticado',
          message: 'Debe autenticarse primero',
        })
      }

      // Verificar si el rol del usuario está en los roles permitidos
      if (!allowedRoles.includes(request.user.roleName)) {
        return reply.status(403).send({
          error: 'Acceso denegado',
          message: `Rol '${request.user.roleName}' no tiene permisos para esta acción. Roles requeridos: ${allowedRoles.join(', ')}`,
        })
      }

      // Si llegamos aquí, el usuario tiene autorización
    }
  })

  // Hook para agregar información de usuario a los logs
  fastify.addHook('onRequest', async (request) => {
    // Solo para rutas protegidas
    if (request.headers.authorization && request.user) {
      request.log = request.log.child({
        userId: request.user.id,
        userRole: request.user.roleName,
      })
    }
  })

  // Hook para manejo de errores de validación
  fastify.setErrorHandler((error, request, reply) => {
    // Errores de validación Zod
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        error: 'Datos inválidos',
        message: 'Los datos proporcionados no cumplen con el formato requerido',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          value: issue.input,
        })),
      })
    }

    // Errores de JWT
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError'
    ) {
      return reply.status(401).send({
        error: 'Error de autenticación',
        message: error.message,
      })
    }

    // Errores de dominio personalizados
    if (error.code) {
      const statusMap = {
        NOT_FOUND: 404,
        DUPLICATE: 409,
        VALIDATION: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
      }

      const status = statusMap[error.code as keyof typeof statusMap] || 500

      return reply.status(status).send({
        error: error.name || 'Error',
        message: error.message,
      })
    }

    // Error genérico del servidor
    request.log.error(error)
    return reply.status(500).send({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error inesperado',
    })
  })

  // Rate limiting más específico para endpoints sensibles
  await fastify.register(import('@fastify/rate-limit'), {
    max: 5,
    timeWindow: '1 minute',
    skipOnError: true,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  })
}

// Schemas de validación comunes
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const DateRangeSchema = z
  .object({
    fechaDesde: z.string().datetime().optional(),
    fechaHasta: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.fechaDesde && data.fechaHasta) {
        return new Date(data.fechaDesde) <= new Date(data.fechaHasta)
      }
      return true
    },
    {
      message: 'La fecha de inicio debe ser anterior a la fecha de fin',
      path: ['fechaDesde'],
    }
  )

// Utilidades para manejo de errores
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message, 400, 'VALIDATION')
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} con ID ${id} no encontrado`
      : `${resource} no encontrado`
    super(message, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT')
  }
}

// Utilidad para crear respuestas paginadas
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const pages = Math.ceil(total / limit)

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNextPage: page < pages,
      hasPrevPage: page > 1,
    },
  }
}

// Middleware para logging estructurado
export const requestLoggingMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const start = Date.now()

  // Log de request
  request.log.info(
    {
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    },
    'Request iniciado'
  )

  // Hook para log de response
  reply.raw.on('finish', () => {
    const duration = Date.now() - start

    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration: `${duration}ms`,
      },
      'Request completado'
    )
  })
}

export default securityMiddlewaresPlugin
