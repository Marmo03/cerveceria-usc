// Repository Pattern - Interfaces para acceso a datos
// Abstrae el acceso a datos para facilitar testing y mantener la lógica de dominio separada

import {
  Producto,
  MovimientoInventario,
  PoliticaAbastecimiento,
  SolicitudCompra,
  Aprobacion,
  Indicador,
  Importacion,
  TipoMovimiento,
  EstadoSolicitud,
  TipoIndicador,
} from './entities.js'

// Repository interfaces (contratos)

export interface ProductoRepository {
  findById(id: string): Promise<Producto | null>
  findBySku(sku: string): Promise<Producto | null>
  findAll(filtros?: ProductoFiltros): Promise<Producto[]>
  create(
    producto: Omit<Producto, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Producto>
  update(id: string, data: Partial<Producto>): Promise<Producto>
  delete(id: string): Promise<void>
  actualizarStock(id: string, nuevoStock: number): Promise<Producto>
  findConStockBajo(): Promise<Producto[]>
}

export interface MovimientoInventarioRepository {
  findById(id: string): Promise<MovimientoInventario | null>
  findByProductoId(
    productoId: string,
    limite?: number
  ): Promise<MovimientoInventario[]>
  findByDateRange(
    fechaInicio: Date,
    fechaFin: Date
  ): Promise<MovimientoInventario[]>
  create(
    movimiento: Omit<MovimientoInventario, 'id'>
  ): Promise<MovimientoInventario>
  findByTipo(
    tipo: TipoMovimiento,
    fechaInicio?: Date,
    fechaFin?: Date
  ): Promise<MovimientoInventario[]>
  obtenerResumenPorProducto(
    productoId: string,
    periodo: string
  ): Promise<ResumenMovimientos>
}

export interface PoliticaAbastecimientoRepository {
  findById(id: string): Promise<PoliticaAbastecimiento | null>
  findByProductoId(productoId: string): Promise<PoliticaAbastecimiento | null>
  findAll(): Promise<PoliticaAbastecimiento[]>
  create(
    politica: Omit<PoliticaAbastecimiento, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PoliticaAbastecimiento>
  update(
    id: string,
    data: Partial<PoliticaAbastecimiento>
  ): Promise<PoliticaAbastecimiento>
  delete(id: string): Promise<void>
}

export interface SolicitudCompraRepository {
  findById(id: string): Promise<SolicitudCompra | null>
  findAll(filtros?: SolicitudFiltros): Promise<SolicitudCompra[]>
  findByEstado(estado: EstadoSolicitud): Promise<SolicitudCompra[]>
  findByCreador(creadorId: string): Promise<SolicitudCompra[]>
  findByAprobador(aprobadorId: string): Promise<SolicitudCompra[]>
  create(
    solicitud: Omit<
      SolicitudCompra,
      'id' | 'fechaCreacion' | 'fechaActualizacion'
    >
  ): Promise<SolicitudCompra>
  update(id: string, data: Partial<SolicitudCompra>): Promise<SolicitudCompra>
  delete(id: string): Promise<void>
  contarPorEstado(): Promise<Record<EstadoSolicitud, number>>
}

export interface AprobacionRepository {
  findById(id: string): Promise<Aprobacion | null>
  findBySolicitudId(solicitudId: string): Promise<Aprobacion[]>
  findByAprobadorId(aprobadorId: string): Promise<Aprobacion[]>
  create(aprobacion: Omit<Aprobacion, 'id'>): Promise<Aprobacion>
  update(id: string, data: Partial<Aprobacion>): Promise<Aprobacion>
  findPendientesPorAprobador(aprobadorId: string): Promise<Aprobacion[]>
}

export interface IndicadorRepository {
  findById(id: string): Promise<Indicador | null>
  findByTipo(tipo: TipoIndicador, periodo?: string): Promise<Indicador[]>
  findByPeriodo(periodo: string): Promise<Indicador[]>
  create(indicador: Omit<Indicador, 'id' | 'createdAt'>): Promise<Indicador>
  update(id: string, data: Partial<Indicador>): Promise<Indicador>
  delete(id: string): Promise<void>
  obtenerHistorico(
    tipo: TipoIndicador,
    periodos: string[]
  ): Promise<Indicador[]>
}

export interface ImportacionRepository {
  findById(id: string): Promise<Importacion | null>
  findAll(filtros?: ImportacionFiltros): Promise<Importacion[]>
  findByUsuarioId(usuarioId: string): Promise<Importacion[]>
  create(
    importacion: Omit<Importacion, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Importacion>
  update(id: string, data: Partial<Importacion>): Promise<Importacion>
  delete(id: string): Promise<void>
  findEnProceso(): Promise<Importacion[]>
}

// DTOs para filtros y consultas
export interface ProductoFiltros {
  categoria?: string
  isActive?: boolean
  stockBajo?: boolean
  proveedorId?: string
  busqueda?: string // Para buscar por nombre o SKU
}

export interface SolicitudFiltros {
  estado?: EstadoSolicitud
  creadorId?: string
  aprobadorId?: string
  fechaDesde?: Date
  fechaHasta?: Date
  productoId?: string
}

export interface ImportacionFiltros {
  tipo?: string
  estado?: string
  usuarioId?: string
  fechaDesde?: Date
  fechaHasta?: Date
}

// DTOs para resultados agregados
export interface ResumenMovimientos {
  productoId: string
  periodo: string
  totalEntradas: number
  totalSalidas: number
  stockInicial: number
  stockFinal: number
  movimientos: number
}

export interface EstadisticasInventario {
  totalProductos: number
  productosActivos: number
  productosStockBajo: number
  valorTotalInventario: number
  rotacionPromedio: number
}

export interface EstadisticasSolicitudes {
  totalSolicitudes: number
  solicitudesPendientes: number
  solicitudesAprobadas: number
  solicitudesRechazadas: number
  tiempoPromedioAprobacion: number // en horas
}

// Interfaz principal que agrupa todos los repositorios
export interface RepositoryManager {
  productos: ProductoRepository
  movimientos: MovimientoInventarioRepository
  politicas: PoliticaAbastecimientoRepository
  solicitudes: SolicitudCompraRepository
  aprobaciones: AprobacionRepository
  indicadores: IndicadorRepository
  importaciones: ImportacionRepository

  // Métodos utilitarios
  obtenerEstadisticasInventario(): Promise<EstadisticasInventario>
  obtenerEstadisticasSolicitudes(): Promise<EstadisticasSolicitudes>

  // Transacciones
  executarEnTransaccion<T>(
    operacion: (repos: RepositoryManager) => Promise<T>
  ): Promise<T>
}

// Excepciones específicas del repositorio
export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export class NotFoundError extends RepositoryError {
  constructor(entity: string, id: string) {
    super(`${entity} con ID ${id} no encontrado`, 'NOT_FOUND')
  }
}

export class DuplicateError extends RepositoryError {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} con ${field} '${value}' ya existe`, 'DUPLICATE')
  }
}

export class ValidationError extends RepositoryError {
  constructor(message: string) {
    super(message, 'VALIDATION')
  }
}
