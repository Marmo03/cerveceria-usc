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
  roleId: z.string().uuid('ID de rol inválido'),
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

      fastify.log.info(`Intento de login para: ${email}`)

      // Buscar usuario en base de datos con SQL directo
      const result = await fastify.db.query(
        `SELECT u.id, u.email, u.password, u."firstName", u."lastName", u."roleId", u."isActive",
                r.name as role_name, r.permissions as role_permissions 
         FROM users u 
         JOIN roles r ON u."roleId" = r.id 
         WHERE u.email = $1`,
        [email]
      )

      if (result.rows.length === 0) {
        fastify.log.warn(`Usuario no encontrado: ${email}`)
        return reply.status(401).send({
          success: false,
          message: 'Credenciales inválidas',
        })
      }

      const user = result.rows[0]

      if (!user.isActive) {
        fastify.log.warn(`Usuario inactivo: ${email}`)
        return reply.status(401).send({
          success: false,
          message: 'Credenciales inválidas',
        })
      }

      fastify.log.info(`Usuario encontrado: ${user.email}, verificando password...`)

      // Verificar password
      const passwordMatch = await bcrypt.compare(password, user.password)
      
      if (!passwordMatch) {
        fastify.log.warn(`Password incorrecto para: ${email}`)
        fastify.log.warn(`Password hash en DB: ${user.password}`)
        return reply.status(401).send({
          success: false,
          message: 'Credenciales inválidas',
        })
      }

      fastify.log.info(`Login exitoso para: ${email}`)

      // Generar token JWT
      const token = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role_name,
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
            id: user.roleId,
            name: user.role_name,
            permissions: JSON.parse(user.role_permissions || '{}'),
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

      console.error('=== ERROR COMPLETO EN LOGIN ===')
      console.error('Tipo:', typeof error)
      console.error('Error:', error)
      console.error('Message:', error instanceof Error ? error.message : String(error))
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack')
      console.error('================================')
      
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
      const existingUserResult = await fastify.db.query(
        `SELECT id FROM users WHERE email = $1`,
        [userData.email]
      )

      if (existingUserResult.rows.length > 0) {
        return reply.status(409).send({
          success: false,
          message: 'El email ya está registrado',
        })
      }

      // Verificar que el rol existe
      const roleResult = await fastify.db.query(
        `SELECT id, name FROM roles WHERE id = $1`,
        [userData.roleId]
      )

      if (roleResult.rows.length === 0) {
        return reply.status(400).send({
          success: false,
          message: 'Rol inválido',
        })
      }

      const role = roleResult.rows[0]

      // Hash del password
      const hashedPassword = await bcrypt.hash(userData.password, 12)

      // Crear usuario
      const userResult = await fastify.db.query(
        `INSERT INTO users (id, email, password, "firstName", "lastName", "roleId", "isActive", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, NOW(), NOW())
         RETURNING id, email, "firstName", "lastName", "roleId"`,
        [userData.email, hashedPassword, userData.firstName, userData.lastName, userData.roleId]
      )

      const user = userResult.rows[0]

      return reply.status(201).send({
        success: true,
        message: 'Usuario creado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: {
            id: user.roleId,
            name: role.name,
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

      const result = await fastify.db.query(
        `SELECT u.*, r.name as role_name, r.permissions as role_permissions 
         FROM users u 
         JOIN roles r ON u."roleId" = r.id 
         WHERE u.id = $1`,
        [userId]
      )

      const user = result.rows[0]

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
            id: user.roleId,
            name: user.role_name,
            permissions: JSON.parse(user.role_permissions || '{}'),
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