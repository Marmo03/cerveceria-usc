import { FastifyRequest, FastifyReply } from 'fastify'
import { AuthenticatedUser } from '../types/auth.js'

// Middleware de autenticación JWT
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Verificar que el header Authorization existe
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return reply.status(401).send({
        success: false,
        message: 'Token de acceso requerido',
      })
    }

    // Extraer token del header Bearer
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      return reply.status(401).send({
        success: false,
        message: 'Formato de token inválido',
      })
    }

    // Verificar y decodificar token
    const decoded = request.server.jwt.verify(token) as {
      userId: string
      email: string
      roleId: string
      roleName: string
    }

    // Agregar información del usuario al request
    request.currentUser = decoded
  } catch (error) {
    return reply.status(401).send({
      success: false,
      message: 'Token inválido o expirado',
    })
  }
}

// Middleware para verificar permisos específicos
export function requireRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // NO llamar a authenticate aquí - ya se llama en preHandler
    if (!request.currentUser) {
      return reply.status(401).send({
        success: false,
        message: 'No autenticado',
      })
    }

    // Comparación case-insensitive
    const userRole = request.currentUser.roleName.toUpperCase()
    const hasPermission = allowedRoles.some(
      (role) => role.toUpperCase() === userRole
    )

    if (!hasPermission) {
      return reply.status(403).send({
        success: false,
        message: 'Sin permisos suficientes',
      })
    }
  }
}

// Middleware para verificar que el usuario esté activo
export async function requireActiveUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await authenticate(request, reply)

  if (!request.currentUser) {
    return reply.status(401).send({
      success: false,
      message: 'No autenticado',
    })
  }

  try {
    // Verificar que el usuario sigue activo en la base de datos
    const user = await request.server.prisma.user.findUnique({
      where: { id: request.currentUser.userId },
      select: { isActive: true },
    })

    if (!user || !user.isActive) {
      return reply.status(401).send({
        success: false,
        message: 'Usuario inactivo',
      })
    }
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: 'Error verificando usuario',
    })
  }
}
