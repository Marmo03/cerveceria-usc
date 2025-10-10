import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Esquemas de validación
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
})

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
  firstName: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'Apellido debe tener al menos 2 caracteres'),
  roleId: z.string().cuid('ID de rol inválido'),
})

interface LoginBody {
  email: string
  password: string
}

interface RegisterBody {
  email: string
  password: string
  firstName: string
  lastName: string
  roleId: string
}

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /auth/login - Autenticar usuario
  fastify.post<{ Body: LoginBody }>('/login', {
    schema: {
      tags: ['auth'],
      summary: 'Iniciar sesión',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    permissions: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
    try {
      // Validar entrada
      const { email, password } = loginSchema.parse(request.body)

      // Buscar usuario en base de datos
      const user = await fastify.prisma.user.findUnique({
        where: { email },
        include: {
          role: true,
        },
      })

      if (!user || !user.isActive) {
        return reply.status(401).send({
          success: false,
          message: 'Credenciales inválidas',
        })
      }

      // Verificar password
      const passwordMatch = await bcrypt.compare(password, user.password)
      if (!passwordMatch) {
        return reply.status(401).send({
          success: false,
          message: 'Credenciales inválidas',
        })
      }

      // Generar token JWT
      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
      })

      return reply.send({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: {
            id: user.role.id,
            name: user.role.name,
            permissions: user.role.permissions,
          },
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Datos inválidos',
          errors: error.errors,
        })
      }

      fastify.log.error('Error en login:', error)
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  })

  // POST /auth/register - Registrar nuevo usuario
  fastify.post<{ Body: RegisterBody }>('/register', {
    schema: {
      tags: ['auth'],
      summary: 'Registrar usuario',
      body: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName', 'roleId'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          firstName: { type: 'string', minLength: 2 },
          lastName: { type: 'string', minLength: 2 },
          roleId: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
    try {
      // Validar entrada
      const userData = registerSchema.parse(request.body)

      // Verificar si el email ya existe
      const existingUser = await fastify.prisma.user.findUnique({
        where: { email: userData.email },
      })

      if (existingUser) {
        return reply.status(409).send({
          success: false,
          message: 'El email ya está registrado',
        })
      }

      // Verificar que el rol existe
      const role = await fastify.prisma.role.findUnique({
        where: { id: userData.roleId },
      })

      if (!role) {
        return reply.status(400).send({
          success: false,
          message: 'Rol inválido',
        })
      }

      // Hash del password
      const hashedPassword = await bcrypt.hash(userData.password, 12)

      // Crear usuario
      const user = await fastify.prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          roleId: userData.roleId,
        },
        include: {
          role: true,
        },
      })

      return reply.status(201).send({
        success: true,
        message: 'Usuario creado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: {
            id: user.role.id,
            name: user.role.name,
          },
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          message: 'Datos inválidos',
          errors: error.errors,
        })
      }

      fastify.log.error('Error en registro:', error)
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  })

  // GET /auth/me - Obtener información del usuario autenticado
  fastify.get('/me', {
    schema: {
      tags: ['auth'],
      summary: 'Obtener perfil del usuario autenticado',
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).userId

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: true,
        },
      })

      if (!user) {
        return reply.status(404).send({
          success: false,
          message: 'Usuario no encontrado',
        })
      }

      return reply.send({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: {
            id: user.role.id,
            name: user.role.name,
            permissions: user.role.permissions,
          },
        },
      })
    } catch (error) {
      fastify.log.error('Error obteniendo perfil:', error)
      return reply.status(500).send({
        success: false,
        message: 'Error interno del servidor',
      })
    }
  })
}