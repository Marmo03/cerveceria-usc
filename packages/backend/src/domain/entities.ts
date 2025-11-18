// Entidades del dominio - Cervecería USC
// Representación de las entidades de negocio con sus reglas y validaciones

export interface Producto {
  id: string
  sku: string
  nombre: string
  categoria: string
  unidad: string
  proveedorId?: string
  stockActual: number
  stockMin: number
  leadTime: number
  costo: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MovimientoInventario {
  id: string
  productoId: string
  tipo: TipoMovimiento
  cantidad: number
  fecha: Date
  usuarioId: string
  comentario?: string
  referencia?: string
}

export interface PoliticaAbastecimiento {
  id: string
  productoId: string
  estrategia: EstrategiaReposicion
  rop: number // Reorder Point
  stockSeguridad: number
  parametrosJSON?: any
  createdAt: Date
  updatedAt: Date
}

export interface SolicitudCompra {
  id: string
  productoId: string
  cantidad: number
  estado: EstadoSolicitud
  creadorId: string
  aprobadorActualId?: string
  historialJSON?: any
  fechaCreacion: Date
  fechaActualizacion: Date
}

export interface Aprobacion {
  id: string
  solicitudId: string
  nivel: number
  aprobadorId: string
  estado: EstadoAprobacion
  comentario?: string
  fecha: Date
}

export interface Indicador {
  id: string
  tipo: TipoIndicador
  periodo: string
  valor: number
  metadataJSON?: any
  fechaCalculo: Date
}

export interface Importacion {
  id: string
  tipo: TipoImportacion
  estado: EstadoImportacion
  archivo: string
  resumenJSON?: any
  erroresJSON?: any
  usuarioId: string
  fechaInicio: Date
  fechaFin?: Date
}

// Enums del dominio
export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
}

export enum EstrategiaReposicion {
  EOQ = 'EOQ',
  MANUAL = 'MANUAL',
}

export enum EstadoSolicitud {
  BORRADOR = 'BORRADOR',
  EN_APROBACION = 'EN_APROBACION',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  CANCELADA = 'CANCELADA',
}

export enum EstadoAprobacion {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

export enum TipoIndicador {
  ROTACION_INVENTARIO = 'ROTACION_INVENTARIO',
  FILL_RATE = 'FILL_RATE',
  TIEMPO_CICLO = 'TIEMPO_CICLO',
  NIVEL_SERVICIO = 'NIVEL_SERVICIO',
  BACKORDERS = 'BACKORDERS',
  COSTO_INVENTARIO = 'COSTO_INVENTARIO',
}

export enum TipoImportacion {
  VENTAS = 'VENTAS',
  STOCK = 'STOCK',
  PRODUCTOS = 'PRODUCTOS',
}

export enum EstadoImportacion {
  PENDIENTE = 'PENDIENTE',
  PROCESANDO = 'PROCESANDO',
  COMPLETADA = 'COMPLETADA',
  FALLIDA = 'FALLIDA',
  PARCIAL = 'PARCIAL',
}

// Value Objects
export interface SugerenciaReabastecimiento {
  productoId: string
  cantidadSugerida: number
  rop: number
  estrategiaUsada: EstrategiaReposicion
  parametros: any
  fechaCalculo: Date
}

export interface DatosEOQ {
  demandaAnual: number
  costoOrden: number
  costoAlmacenamiento: number
  leadTime: number
}

// Eventos del dominio
export interface DomainEvent {
  eventId: string
  eventType: string
  aggregateId: string
  eventData: any
  timestamp: Date
}

export interface InventarioActualizadoEvent extends DomainEvent {
  eventType: 'InventarioActualizado'
  eventData: {
    productoId: string
    stockAnterior: number
    stockNuevo: number
    tipoMovimiento: TipoMovimiento
    cantidad: number
  }
}

export interface SolicitudActualizadaEvent extends DomainEvent {
  eventType: 'SolicitudActualizada'
  eventData: {
    solicitudId: string
    estadoAnterior: EstadoSolicitud
    estadoNuevo: EstadoSolicitud
    aprobadorId?: string
  }
}
