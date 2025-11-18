import { z } from 'zod'

// ===== ENUMS =====
export const TipoServicioTransporte = z.enum([
  'TERRESTRE',
  'AEREO',
  'MARITIMO',
  'MULTIMODAL',
])
export const EstadoEnvio = z.enum([
  'PENDIENTE',
  'EN_PREPARACION',
  'EN_TRANSITO',
  'EN_ADUANA',
  'EN_ENTREGA',
  'ENTREGADO',
  'CANCELADO',
  'DEVUELTO',
])
export const PrioridadEnvio = z.enum(['ALTA', 'NORMAL', 'BAJA'])

// ===== SCHEMAS DE TRANSPORTISTA =====
export const createTransportistaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  contacto: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  telefono: z.string().optional(),
  tipoServicio: TipoServicioTransporte,
  costoBase: z
    .number()
    .min(0, 'El costo base debe ser mayor o igual a 0')
    .default(0),
})

export const updateTransportistaSchema = createTransportistaSchema.partial()

export const transportistaResponseSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  contacto: z.string().nullable(),
  email: z.string().nullable(),
  telefono: z.string().nullable(),
  tipoServicio: z.string(),
  costoBase: z.number(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// ===== SCHEMAS DE ENVÍO =====
export const createEnvioSchema = z.object({
  numeroGuia: z.string().min(1, 'El número de guía es requerido'),
  solicitudCompraId: z.string().optional(),
  transportistaId: z.string().min(1, 'El transportista es requerido'),
  origen: z.string().min(1, 'El origen es requerido'),
  destino: z.string().min(1, 'El destino es requerido'),
  prioridad: PrioridadEnvio.default('NORMAL'),
  costoEnvio: z
    .number()
    .min(0, 'El costo de envío debe ser mayor o igual a 0')
    .default(0),
  pesoTotal: z
    .number()
    .min(0, 'El peso total debe ser mayor o igual a 0')
    .optional(),
  volumenTotal: z
    .number()
    .min(0, 'El volumen total debe ser mayor o igual a 0')
    .optional(),
  fechaEstimada: z.string().datetime().or(z.date()).optional(),
  fechaEnvio: z.string().datetime().or(z.date()).optional(),
  observaciones: z.string().optional(),
  metadataJSON: z.string().optional(),
  productos: z
    .array(
      z.object({
        productoId: z.string().min(1, 'El ID del producto es requerido'),
        cantidad: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
        observaciones: z.string().optional(),
      })
    )
    .min(1, 'Debe incluir al menos un producto'),
})

export const updateEnvioSchema = z.object({
  numeroGuia: z.string().min(1).optional(),
  solicitudCompraId: z.string().optional(),
  transportistaId: z.string().optional(),
  origen: z.string().optional(),
  destino: z.string().optional(),
  estado: EstadoEnvio.optional(),
  prioridad: PrioridadEnvio.optional(),
  costoEnvio: z.number().min(0).optional(),
  pesoTotal: z.number().min(0).optional(),
  volumenTotal: z.number().min(0).optional(),
  fechaEstimada: z.string().datetime().or(z.date()).optional(),
  fechaEnvio: z.string().datetime().or(z.date()).optional(),
  fechaEntrega: z.string().datetime().or(z.date()).optional(),
  observaciones: z.string().optional(),
  metadataJSON: z.string().optional(),
})

export const envioResponseSchema = z.object({
  id: z.string(),
  numeroGuia: z.string(),
  solicitudCompraId: z.string().nullable(),
  transportistaId: z.string(),
  origen: z.string(),
  destino: z.string(),
  estado: z.string(),
  prioridad: z.string(),
  costoEnvio: z.number(),
  pesoTotal: z.number().nullable(),
  volumenTotal: z.number().nullable(),
  fechaEstimada: z.date().nullable(),
  fechaEnvio: z.date().nullable(),
  fechaEntrega: z.date().nullable(),
  observaciones: z.string().nullable(),
  metadataJSON: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// ===== SCHEMAS DE RUTA DE ENVÍO =====
export const createRutaEnvioSchema = z.object({
  envioId: z.string().min(1, 'El ID del envío es requerido'),
  secuencia: z.number().int().min(1, 'La secuencia debe ser mayor a 0'),
  ubicacion: z.string().min(1, 'La ubicación es requerida'),
  descripcion: z.string().optional(),
  fechaLlegada: z.string().datetime().or(z.date()).optional(),
  fechaSalida: z.string().datetime().or(z.date()).optional(),
})

export const updateRutaEnvioSchema = createRutaEnvioSchema
  .partial()
  .omit({ envioId: true })

export const rutaEnvioResponseSchema = z.object({
  id: z.string(),
  envioId: z.string(),
  secuencia: z.number(),
  ubicacion: z.string(),
  descripcion: z.string().nullable(),
  fechaLlegada: z.date().nullable(),
  fechaSalida: z.date().nullable(),
  createdAt: z.date(),
})

// ===== SCHEMAS DE ESTADO DE ENVÍO =====
export const createEstadoEnvioSchema = z.object({
  envioId: z.string().min(1, 'El ID del envío es requerido'),
  estado: EstadoEnvio,
  ubicacion: z.string().optional(),
  descripcion: z.string().optional(),
  fecha: z.string().datetime().or(z.date()).optional(),
})

export const estadoEnvioResponseSchema = z.object({
  id: z.string(),
  envioId: z.string(),
  estado: z.string(),
  ubicacion: z.string().nullable(),
  descripcion: z.string().nullable(),
  fecha: z.date(),
  createdAt: z.date(),
})

// ===== SCHEMAS DE PRODUCTO EN ENVÍO =====
export const createProductoEnvioSchema = z.object({
  envioId: z.string().min(1, 'El ID del envío es requerido'),
  productoId: z.string().min(1, 'El ID del producto es requerido'),
  cantidad: z.number().int().min(1, 'La cantidad debe ser mayor a 0'),
  observaciones: z.string().optional(),
})

export const updateProductoEnvioSchema = createProductoEnvioSchema
  .partial()
  .omit({ envioId: true, productoId: true })

export const productoEnvioResponseSchema = z.object({
  id: z.string(),
  envioId: z.string(),
  productoId: z.string(),
  cantidad: z.number(),
  observaciones: z.string().nullable(),
  createdAt: z.date(),
})

// ===== SCHEMAS DE QUERY PARAMS =====
export const listEnviosQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  estado: EstadoEnvio.optional(),
  prioridad: PrioridadEnvio.optional(),
  transportistaId: z.string().optional(),
  fechaInicio: z.string().datetime().optional(),
  fechaFin: z.string().datetime().optional(),
  search: z.string().optional(),
})

export const listTransportistasQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  tipoServicio: TipoServicioTransporte.optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  search: z.string().optional(),
})

// ===== TYPES =====
export type CreateTransportistaInput = z.infer<typeof createTransportistaSchema>
export type UpdateTransportistaInput = z.infer<typeof updateTransportistaSchema>
export type TransportistaResponse = z.infer<typeof transportistaResponseSchema>

export type CreateEnvioInput = z.infer<typeof createEnvioSchema>
export type UpdateEnvioInput = z.infer<typeof updateEnvioSchema>
export type EnvioResponse = z.infer<typeof envioResponseSchema>

export type CreateRutaEnvioInput = z.infer<typeof createRutaEnvioSchema>
export type UpdateRutaEnvioInput = z.infer<typeof updateRutaEnvioSchema>
export type RutaEnvioResponse = z.infer<typeof rutaEnvioResponseSchema>

export type CreateEstadoEnvioInput = z.infer<typeof createEstadoEnvioSchema>
export type EstadoEnvioResponse = z.infer<typeof estadoEnvioResponseSchema>

export type CreateProductoEnvioInput = z.infer<typeof createProductoEnvioSchema>
export type UpdateProductoEnvioInput = z.infer<typeof updateProductoEnvioSchema>
export type ProductoEnvioResponse = z.infer<typeof productoEnvioResponseSchema>

export type ListEnviosQuery = z.infer<typeof listEnviosQuerySchema>
export type ListTransportistasQuery = z.infer<
  typeof listTransportistasQuerySchema
>
