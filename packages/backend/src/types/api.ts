// Tipos y utilidades para la API
// Definiciones de tipos comunes y utilidades

import { z } from 'zod'

// Contexto de usuario autenticado
export interface UserContext {
  id: string
  email: string
  firstName: string
  lastName: string
  roleId: string
  roleName: 'ADMIN' | 'OPERARIO' | 'APROBADOR' | 'ANALISTA'
  permissions: string[]
}

// Schemas de validación comunes
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
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

// Tipos para respuestas API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  details?: any[]
}

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

// Clases de error personalizadas
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

// Utilidades para respuestas
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  }
}

export function errorResponse(
  error: string,
  details?: any[],
  statusCode?: number
): ApiResponse {
  return {
    success: false,
    error,
    details,
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

// Utilidades de validación
export function validateZodSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        received: (issue as any).received || 'unknown',
      }))
      throw new ValidationError('Datos inválidos', JSON.stringify(details))
    }
    throw error
  }
}

// Mapeo de códigos de error a status HTTP
export const ERROR_STATUS_MAP = {
  NOT_FOUND: 404,
  DUPLICATE: 409,
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
} as const

// Roles y permisos
export const ROLES = {
  ADMIN: 'ADMIN',
  OPERARIO: 'OPERARIO',
  APROBADOR: 'APROBADOR',
  ANALISTA: 'ANALISTA',
} as const

export const PERMISSIONS = {
  // Productos
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',

  // Inventario
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_READ: 'inventory:read',

  // Solicitudes
  SOLICITUD_CREATE: 'solicitud:create',
  SOLICITUD_READ: 'solicitud:read',
  SOLICITUD_APPROVE: 'solicitud:approve',

  // KPIs
  KPI_READ: 'kpi:read',
  KPI_EXPORT: 'kpi:export',

  // Importaciones
  IMPORT_CREATE: 'import:create',
  IMPORT_READ: 'import:read',

  // Políticas
  POLICY_CREATE: 'policy:create',
  POLICY_UPDATE: 'policy:update',
} as const

// Configuración de permisos por rol
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.OPERARIO]: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.INVENTORY_CREATE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.SOLICITUD_CREATE,
    PERMISSIONS.SOLICITUD_READ,
  ],
  [ROLES.APROBADOR]: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.SOLICITUD_READ,
    PERMISSIONS.SOLICITUD_APPROVE,
    PERMISSIONS.KPI_READ,
  ],
  [ROLES.ANALISTA]: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.SOLICITUD_READ,
    PERMISSIONS.KPI_READ,
    PERMISSIONS.KPI_EXPORT,
    PERMISSIONS.POLICY_CREATE,
    PERMISSIONS.POLICY_UPDATE,
  ],
} as const

// Utilidad para verificar permisos
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission)
}

export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  )
}

export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  )
}

// Constantes de la aplicación
export const APP_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  JWT_EXPIRES_IN: '24h',
  BCRYPT_ROUNDS: 12,

  // Configuración de archivos
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['text/csv', 'application/vnd.ms-excel'],

  // Rate limiting
  RATE_LIMIT_MAX: 100,
  RATE_LIMIT_WINDOW: '1 minute',

  // Configuración de stock
  DEFAULT_LEAD_TIME: 7,
  MIN_STOCK_MULTIPLIER: 0.5,
  CRITICAL_STOCK_MULTIPLIER: 0.3,
} as const
