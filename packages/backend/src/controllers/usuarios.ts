/**
 * Controlador de Gestión de Usuarios y Roles
 *
 * Endpoints para que ADMIN pueda:
 * - Listar usuarios
 * - Crear nuevos usuarios con asignación de rol
 * - Actualizar roles de usuarios existentes
 * - Activar/desactivar usuarios
 * - Listar roles disponibles
 */

import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Schemas de validación
const CrearUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  roleName: z.enum(['ADMIN', 'OPERARIO', 'APROBADOR', 'ANALISTA'], {
    errorMap: () => ({ message: 'Rol inválido' }),
  }),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .optional(),
})

const ActualizarRolSchema = z.object({
  roleName: z.enum(['ADMIN', 'OPERARIO', 'APROBADOR', 'ANALISTA']),
})

const ActualizarUsuarioSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
})

type CrearUsuarioBody = z.infer<typeof CrearUsuarioSchema>
type ActualizarRolBody = z.infer<typeof ActualizarRolSchema>
type ActualizarUsuarioBody = z.infer<typeof ActualizarUsuarioSchema>

const usuariosRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /usuarios - Listar todos los usuarios (solo ADMIN)
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate, fastify.requireRole(['ADMIN'])],
      schema: {
        tags: ['Usuarios'],
        summary: 'Listar todos los usuarios',
        description:
          'Obtiene la lista completa de usuarios del sistema (solo ADMIN)',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    isActive: { type: 'boolean' },
                    role: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                      },
                    },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await fastify.db.query(`
          SELECT 
            u.id, u.email, u."firstName", u."lastName", u."isActive", u."createdAt",
            json_build_object(
              'id', r.id,
              'name', r.name,
              'description', r.description
            ) as role
          FROM users u
          INNER JOIN roles r ON u."roleId" = r.id
          ORDER BY u."createdAt" DESC
        `)

        return reply.send({
          success: true,
          data: result.rows,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          error: 'Error al obtener usuarios',
          message: error.message,
        })
      }
    }
  )

  // GET /usuarios/roles - Listar roles disponibles
  fastify.get(
    '/roles',
    {
      preHandler: [fastify.authenticate, fastify.requireRole(['ADMIN'])],
      schema: {
        tags: ['Usuarios'],
        summary: 'Listar roles disponibles',
        description:
          'Obtiene todos los roles del sistema con sus descripciones',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await fastify.db.query(`
          SELECT DISTINCT ON (name) id, name, description, permissions
          FROM roles
          ORDER BY name, id ASC
        `)

        return reply.send({
          success: true,
          data: result.rows,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          error: 'Error al obtener roles',
          message: error.message,
        })
      }
    }
  )

  // POST /usuarios - Crear nuevo usuario con rol (solo ADMIN)
  fastify.post<{
    Body: CrearUsuarioBody
  }>(
    '/',
    {
      preHandler: [fastify.authenticate, fastify.requireRole(['ADMIN'])],
      schema: {
        tags: ['Usuarios'],
        summary: 'Crear nuevo usuario',
        description: 'Crea un nuevo usuario y le asigna un rol (solo ADMIN)',
        body: {
          type: 'object',
          required: ['email', 'firstName', 'lastName', 'roleName'],
          properties: {
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string', minLength: 2 },
            lastName: { type: 'string', minLength: 2 },
            roleName: {
              type: 'string',
              enum: ['ADMIN', 'OPERARIO', 'APROBADOR', 'ANALISTA'],
            },
            password: { type: 'string', minLength: 6 },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  role: { type: 'object' },
                },
              },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const data = CrearUsuarioSchema.parse(request.body)

        // Verificar si el email ya existe
        const existingResult = await fastify.db.query(
          'SELECT id FROM users WHERE email = $1',
          [data.email]
        )

        if (existingResult.rows.length > 0) {
          return reply.status(400).send({
            success: false,
            error: 'El email ya está registrado',
          })
        }

        // Buscar el rol por nombre
        const roleResult = await fastify.db.query(
          'SELECT id FROM roles WHERE name = $1',
          [data.roleName]
        )

        if (roleResult.rows.length === 0) {
          return reply.status(400).send({
            success: false,
            error: `Rol '${data.roleName}' no encontrado`,
          })
        }

        const role = roleResult.rows[0]

        // Generar contraseña temporal si no se proporciona
        const password =
          data.password || `Cerveceria${Math.random().toString(36).slice(-8)}`
        const hashedPassword = await bcrypt.hash(password, 10)

        // Crear el usuario
        const { randomUUID } = await import('crypto')
        const userId = randomUUID()
        const now = new Date()

        const createResult = await fastify.db.query(`
          INSERT INTO users (
            id, email, "firstName", "lastName", password, "roleId", "isActive", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id, email, "firstName", "lastName", "roleId", "isActive", "createdAt"
        `, [userId, data.email, data.firstName, data.lastName, hashedPassword, role.id, true, now, now])

        const usuarioCreado = createResult.rows[0]

        // Obtener datos del rol
        const roleDataResult = await fastify.db.query(
          'SELECT id, name, description FROM roles WHERE id = $1',
          [usuarioCreado.roleId]
        )

        const usuarioSinPassword = {
          ...usuarioCreado,
          role: roleDataResult.rows[0]
        }

        return reply.status(201).send({
          success: true,
          data: usuarioSinPassword,
          message: data.password
            ? 'Usuario creado exitosamente'
            : `Usuario creado con contraseña temporal: ${password}`,
        })
      } catch (error: any) {
        request.log.error(error)

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            error: 'Datos inválidos',
            details: error.errors,
          })
        }

        return reply.status(500).send({
          success: false,
          error: 'Error al crear usuario',
          message: error.message,
        })
      }
    }
  )

  // PATCH /usuarios/:id/rol - Actualizar rol de un usuario (solo ADMIN)
  fastify.patch<{
    Params: { id: string }
    Body: ActualizarRolBody
  }>(
    '/:id/rol',
    {
      preHandler: [fastify.authenticate, fastify.requireRole(['ADMIN'])],
      schema: {
        tags: ['Usuarios'],
        summary: 'Actualizar rol de usuario',
        description: 'Cambia el rol de un usuario existente (solo ADMIN)',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['roleName'],
          properties: {
            roleName: {
              type: 'string',
              enum: ['ADMIN', 'OPERARIO', 'APROBADOR', 'ANALISTA'],
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const data = ActualizarRolSchema.parse(request.body)

        // Verificar que el usuario existe
        const usuarioResult = await fastify.db.query(
          'SELECT id FROM users WHERE id = $1',
          [id]
        )

        if (usuarioResult.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Usuario no encontrado',
          })
        }

        // Buscar el nuevo rol
        const nuevoRolResult = await fastify.db.query(
          'SELECT id FROM roles WHERE name = $1',
          [data.roleName]
        )

        if (nuevoRolResult.rows.length === 0) {
          return reply.status(400).send({
            success: false,
            error: `Rol '${data.roleName}' no encontrado`,
          })
        }

        const nuevoRol = nuevoRolResult.rows[0]

        // Actualizar el rol del usuario
        await fastify.db.query(
          'UPDATE users SET "roleId" = $1, "updatedAt" = $2 WHERE id = $3',
          [nuevoRol.id, new Date(), id]
        )

        // Obtener usuario actualizado con rol
        const updatedResult = await fastify.db.query(`
          SELECT 
            u.id, u.email, u."firstName", u."lastName", u."isActive", u."createdAt",
            json_build_object('id', r.id, 'name', r.name, 'description', r.description) as role
          FROM users u
          INNER JOIN roles r ON u."roleId" = r.id
          WHERE u.id = $1
        `, [id])

        const usuarioSinPassword = updatedResult.rows[0]

        return reply.send({
          success: true,
          data: usuarioSinPassword,
          message: `Rol actualizado a ${data.roleName}`,
        })
      } catch (error: any) {
        request.log.error(error)

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            error: 'Datos inválidos',
            details: error.errors,
          })
        }

        return reply.status(500).send({
          success: false,
          error: 'Error al actualizar rol',
          message: error.message,
        })
      }
    }
  )

  // PATCH /usuarios/:id/password - Cambiar contraseña de usuario (solo ADMIN)
  fastify.patch<{
    Params: { id: string }
    Body: { newPassword: string }
  }>(
    '/:id/password',
    {
      preHandler: [fastify.authenticate, fastify.requireRole(['ADMIN'])],
      schema: {
        tags: ['Usuarios'],
        summary: 'Cambiar contraseña de usuario',
        description: 'Permite al ADMIN cambiar la contraseña de cualquier usuario',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['newPassword'],
          properties: {
            newPassword: { 
              type: 'string', 
              minLength: 6,
              description: 'Nueva contraseña (mínimo 6 caracteres)'
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const { newPassword } = request.body

        // Validar longitud de contraseña
        if (!newPassword || newPassword.length < 6) {
          return reply.status(400).send({
            success: false,
            error: 'La contraseña debe tener al menos 6 caracteres',
          })
        }

        // Verificar que el usuario existe
        const usuarioResult = await fastify.db.query(
          'SELECT id, email, "firstName", "lastName" FROM users WHERE id = $1',
          [id]
        )

        if (usuarioResult.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Usuario no encontrado',
          })
        }

        const usuario = usuarioResult.rows[0]

        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Actualizar contraseña
        await fastify.db.query(
          'UPDATE users SET password = $1, "updatedAt" = $2 WHERE id = $3',
          [hashedPassword, new Date(), id]
        )

        request.log.info(`Contraseña cambiada para usuario ${usuario.email} por admin ${request.currentUser!.email}`)

        return reply.send({
          success: true,
          message: `Contraseña actualizada exitosamente para ${usuario.firstName} ${usuario.lastName}`,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          error: 'Error al cambiar contraseña',
          message: error.message,
        })
      }
    }
  )

  // PATCH /usuarios/:id - Actualizar información de usuario (solo ADMIN)
  fastify.patch<{
    Params: { id: string }
    Body: ActualizarUsuarioBody
  }>(
    '/:id',
    {
      preHandler: [fastify.authenticate, fastify.requireRole(['ADMIN'])],
      schema: {
        tags: ['Usuarios'],
        summary: 'Actualizar usuario',
        description: 'Actualiza información de un usuario (solo ADMIN)',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            firstName: { type: 'string', minLength: 2 },
            lastName: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            isActive: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const data = ActualizarUsuarioSchema.parse(request.body)

        // Verificar que el usuario existe
        const usuarioResult = await fastify.db.query(
          'SELECT id, email FROM users WHERE id = $1',
          [id]
        )

        if (usuarioResult.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Usuario no encontrado',
          })
        }

        const usuario = usuarioResult.rows[0]

        // Si se actualiza el email, verificar que no exista
        if (data.email && data.email !== usuario.email) {
          const emailResult = await fastify.db.query(
            'SELECT id FROM users WHERE email = $1',
            [data.email]
          )

          if (emailResult.rows.length > 0) {
            return reply.status(400).send({
              success: false,
              error: 'El email ya está en uso',
            })
          }
        }

        // Construir UPDATE dinámico
        const updates: string[] = []
        const values: any[] = []
        let paramCount = 0

        if (data.firstName) {
          paramCount++
          updates.push(`"firstName" = $${paramCount}`)
          values.push(data.firstName)
        }
        if (data.lastName) {
          paramCount++
          updates.push(`"lastName" = $${paramCount}`)
          values.push(data.lastName)
        }
        if (data.email) {
          paramCount++
          updates.push(`email = $${paramCount}`)
          values.push(data.email)
        }
        if (data.isActive !== undefined) {
          paramCount++
          updates.push(`"isActive" = $${paramCount}`)
          values.push(data.isActive)
        }

        paramCount++
        updates.push(`"updatedAt" = $${paramCount}`)
        values.push(new Date())

        paramCount++
        values.push(id)

        // Actualizar usuario
        await fastify.db.query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
          values
        )

        // Obtener usuario actualizado
        const updatedResult = await fastify.db.query(`
          SELECT 
            u.id, u.email, u."firstName", u."lastName", u."isActive", u."createdAt",
            json_build_object('id', r.id, 'name', r.name, 'description', r.description) as role
          FROM users u
          INNER JOIN roles r ON u."roleId" = r.id
          WHERE u.id = $1
        `, [id])

        const usuarioSinPassword = updatedResult.rows[0]

        return reply.send({
          success: true,
          data: usuarioSinPassword,
          message: 'Usuario actualizado exitosamente',
        })
      } catch (error: any) {
        request.log.error(error)

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            error: 'Datos inválidos',
            details: error.errors,
          })
        }

        return reply.status(500).send({
          success: false,
          error: 'Error al actualizar usuario',
          message: error.message,
        })
      }
    }
  )

  // DELETE /usuarios/:id - Desactivar usuario (soft delete)
  fastify.delete<{
    Params: { id: string }
  }>(
    '/:id',
    {
      preHandler: [fastify.authenticate, fastify.requireRole(['ADMIN'])],
      schema: {
        tags: ['Usuarios'],
        summary: 'Desactivar usuario',
        description: 'Desactiva un usuario (soft delete, solo ADMIN)',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params
        const currentUserId = request.currentUser!.userId

        // No permitir que un admin se desactive a sí mismo
        if (id === currentUserId) {
          return reply.status(400).send({
            success: false,
            error: 'No puedes desactivar tu propia cuenta',
          })
        }

        const usuarioResult = await fastify.db.query(
          'SELECT id FROM users WHERE id = $1',
          [id]
        )

        if (usuarioResult.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Usuario no encontrado',
          })
        }

        // Desactivar usuario
        await fastify.db.query(
          'UPDATE users SET "isActive" = $1, "updatedAt" = $2 WHERE id = $3',
          [false, new Date(), id]
        )

        return reply.send({
          success: true,
          message: 'Usuario desactivado exitosamente',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          error: 'Error al desactivar usuario',
          message: error.message,
        })
      }
    }
  )

  // GET /perfil - Obtener perfil del usuario actual
  fastify.get(
    '/perfil',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Obtener perfil del usuario autenticado',
        tags: ['Usuarios'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  phone: { type: 'string', nullable: true },
                  position: { type: 'string', nullable: true },
                  department: { type: 'string', nullable: true },
                  isActive: { type: 'boolean' },
                  role: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                    },
                  },
                  stats: {
                    type: 'object',
                    properties: {
                      solicitudes: { type: 'number' },
                      aprobaciones: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.userId

        // Obtener datos del usuario con su rol
        const userResult = await fastify.db.query(
          `SELECT 
            u.id,
            u.email,
            u."firstName",
            u."lastName",
            u.phone,
            u.position,
            u.department,
            u."isActive",
            r.id as role_id,
            r.name as role_name,
            r.description as role_description
          FROM users u
          LEFT JOIN roles r ON u."roleId" = r.id
          WHERE u.id = $1`,
          [userId]
        )

        if (userResult.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Usuario no encontrado',
          })
        }

        const user = userResult.rows[0]

        // Obtener estadísticas del usuario
        const statsResult = await fastify.db.query(
          `SELECT 
            (SELECT COUNT(*) FROM solicitudes_compra WHERE "creadorId" = $1) as solicitudes,
            (SELECT COUNT(*) FROM aprobaciones WHERE "aprobadorId" = $1) as aprobaciones
          `,
          [userId]
        )

        const stats = statsResult.rows[0] || { solicitudes: 0, aprobaciones: 0 }

        return reply.send({
          success: true,
          data: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            position: user.position,
            department: user.department,
            isActive: user.isActive,
            role: {
              id: user.role_id,
              name: user.role_name,
              description: user.role_description,
            },
            stats: {
              solicitudes: parseInt(stats.solicitudes),
              aprobaciones: parseInt(stats.aprobaciones),
            },
          },
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          error: 'Error al obtener perfil',
          message: error.message,
        })
      }
    }
  )

  // PUT /perfil - Actualizar perfil del usuario actual
  fastify.put(
    '/perfil',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Actualizar perfil del usuario autenticado',
        tags: ['Usuarios'],
        body: {
          type: 'object',
          properties: {
            firstName: { type: 'string', minLength: 2 },
            lastName: { type: 'string', minLength: 2 },
            phone: { type: 'string', nullable: true },
            position: { type: 'string', nullable: true },
            department: { type: 'string', nullable: true },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.userId
        const { firstName, lastName, phone, position, department } =
          request.body as any

        const updates: string[] = []
        const values: any[] = []
        let paramIndex = 1

        if (firstName !== undefined) {
          updates.push(`"firstName" = $${paramIndex++}`)
          values.push(firstName)
        }
        if (lastName !== undefined) {
          updates.push(`"lastName" = $${paramIndex++}`)
          values.push(lastName)
        }
        if (phone !== undefined) {
          updates.push(`phone = $${paramIndex++}`)
          values.push(phone)
        }
        if (position !== undefined) {
          updates.push(`position = $${paramIndex++}`)
          values.push(position)
        }
        if (department !== undefined) {
          updates.push(`department = $${paramIndex++}`)
          values.push(department)
        }

        if (updates.length === 0) {
          return reply.status(400).send({
            success: false,
            error: 'No hay campos para actualizar',
          })
        }

        updates.push(`"updatedAt" = $${paramIndex++}`)
        values.push(new Date())

        values.push(userId)

        await fastify.db.query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
          values
        )

        return reply.send({
          success: true,
          message: 'Perfil actualizado correctamente',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          error: 'Error al actualizar perfil',
          message: error.message,
        })
      }
    }
  )

  // PUT /perfil/password - Cambiar contraseña del usuario actual
  fastify.put(
    '/perfil/password',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Cambiar contraseña del usuario autenticado',
        tags: ['Usuarios'],
        body: {
          type: 'object',
          required: ['currentPassword', 'newPassword'],
          properties: {
            currentPassword: { type: 'string' },
            newPassword: { type: 'string', minLength: 6 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.userId
        const { currentPassword, newPassword } = request.body as any

        // Obtener contraseña actual del usuario
        const userResult = await fastify.db.query(
          'SELECT password FROM users WHERE id = $1',
          [userId]
        )

        if (userResult.rows.length === 0) {
          return reply.status(404).send({
            success: false,
            error: 'Usuario no encontrado',
          })
        }

        const user = userResult.rows[0]

        // Verificar contraseña actual
        const isValidPassword = await bcrypt.compare(
          currentPassword,
          user.password
        )

        if (!isValidPassword) {
          return reply.status(400).send({
            success: false,
            error: 'La contraseña actual es incorrecta',
          })
        }

        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Actualizar contraseña
        await fastify.db.query(
          'UPDATE users SET password = $1, "updatedAt" = $2 WHERE id = $3',
          [hashedPassword, new Date(), userId]
        )

        return reply.send({
          success: true,
          message: 'Contraseña actualizada correctamente',
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          error: 'Error al cambiar contraseña',
          message: error.message,
        })
      }
    }
  )

  // GET /perfil/actividad - Obtener actividad reciente del usuario
  fastify.get(
    '/perfil/actividad',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Obtener actividad reciente del usuario autenticado',
        tags: ['Usuarios'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 10 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    type: { type: 'string' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    date: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.userId
        const { limit = 10 } = request.query as any

        // Obtener solicitudes creadas por el usuario
        const solicitudesResult = await fastify.db.query(
          `SELECT 
            'solicitud-' || sc.id as id,
            'solicitud' as type,
            'Solicitud creada' as title,
            'SC-' || TO_CHAR(sc."fechaCreacion", 'YYYY') || '-' || LPAD(sc.id::text, 3, '0') || ': ' || 
              COALESCE(p.nombre, 'Sin producto') as description,
            sc."fechaCreacion" as date
          FROM solicitudes_compra sc
          LEFT JOIN productos p ON sc."productoId" = p.id
          WHERE sc."creadorId" = $1
          ORDER BY sc."fechaCreacion" DESC
          LIMIT $2`,
          [userId, Math.floor(limit / 2)]
        )

        // Obtener aprobaciones realizadas por el usuario
        const aprobacionesResult = await fastify.db.query(
          `SELECT 
            'aprobacion-' || a.id as id,
            'aprobacion' as type,
            'Solicitud ' || LOWER(a.estado) as title,
            'SC-' || TO_CHAR(sc."fechaCreacion", 'YYYY') || '-' || LPAD(sc.id::text, 3, '0') as description,
            a.fecha as date
          FROM aprobaciones a
          JOIN solicitudes_compra sc ON a."solicitudId" = sc.id
          WHERE a."aprobadorId" = $1
          ORDER BY a.fecha DESC
          LIMIT $2`,
          [userId, Math.floor(limit / 2)]
        )

        // Combinar y ordenar por fecha
        const actividades = [
          ...solicitudesResult.rows,
          ...aprobacionesResult.rows,
        ]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit)

        return reply.send({
          success: true,
          data: actividades,
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          error: 'Error al obtener actividad',
          message: error.message,
        })
      }
    }
  )
}

export default usuariosRoutes
