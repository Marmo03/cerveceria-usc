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
        const usuarios = await fastify.prisma.user.findMany({
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true,
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        return reply.send({
          success: true,
          data: usuarios,
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
        const roles = await fastify.prisma.role.findMany({
          orderBy: {
            name: 'asc',
          },
          distinct: ['name'], // Evitar roles duplicados por nombre
        })

        return reply.send({
          success: true,
          data: roles,
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
        const existingUser = await fastify.prisma.user.findUnique({
          where: { email: data.email },
        })

        if (existingUser) {
          return reply.status(400).send({
            success: false,
            error: 'El email ya está registrado',
          })
        }

        // Buscar el rol por nombre
        const role = await fastify.prisma.role.findFirst({
          where: { name: data.roleName },
        })

        if (!role) {
          return reply.status(400).send({
            success: false,
            error: `Rol '${data.roleName}' no encontrado`,
          })
        }

        // Generar contraseña temporal si no se proporciona
        const password =
          data.password || `Cerveceria${Math.random().toString(36).slice(-8)}`
        const hashedPassword = await bcrypt.hash(password, 10)

        // Crear el usuario
        const nuevoUsuario = await fastify.prisma.user.create({
          data: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            password: hashedPassword,
            roleId: role.id,
            isActive: true,
          },
          include: {
            role: true,
          },
        })

        // No devolver la contraseña en la respuesta
        const { password: _, ...usuarioSinPassword } = nuevoUsuario

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
        const usuario = await fastify.prisma.user.findUnique({
          where: { id },
        })

        if (!usuario) {
          return reply.status(404).send({
            success: false,
            error: 'Usuario no encontrado',
          })
        }

        // Buscar el nuevo rol
        const nuevoRol = await fastify.prisma.role.findFirst({
          where: { name: data.roleName },
        })

        if (!nuevoRol) {
          return reply.status(400).send({
            success: false,
            error: `Rol '${data.roleName}' no encontrado`,
          })
        }

        // Actualizar el rol del usuario
        const usuarioActualizado = await fastify.prisma.user.update({
          where: { id },
          data: {
            roleId: nuevoRol.id,
          },
          include: {
            role: true,
          },
        })

        const { password: _, ...usuarioSinPassword } = usuarioActualizado

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
        const usuario = await fastify.prisma.user.findUnique({
          where: { id },
        })

        if (!usuario) {
          return reply.status(404).send({
            success: false,
            error: 'Usuario no encontrado',
          })
        }

        // Si se actualiza el email, verificar que no exista
        if (data.email && data.email !== usuario.email) {
          const emailExiste = await fastify.prisma.user.findUnique({
            where: { email: data.email },
          })

          if (emailExiste) {
            return reply.status(400).send({
              success: false,
              error: 'El email ya está en uso',
            })
          }
        }

        // Actualizar usuario
        const usuarioActualizado = await fastify.prisma.user.update({
          where: { id },
          data,
          include: {
            role: true,
          },
        })

        const { password: _, ...usuarioSinPassword } = usuarioActualizado

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

        const usuario = await fastify.prisma.user.findUnique({
          where: { id },
        })

        if (!usuario) {
          return reply.status(404).send({
            success: false,
            error: 'Usuario no encontrado',
          })
        }

        // Desactivar usuario
        await fastify.prisma.user.update({
          where: { id },
          data: { isActive: false },
        })

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
}

export default usuariosRoutes
