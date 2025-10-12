// Casos de Uso - Gestión de Inventario
// CU-INV-01: Registrar salida de inventario
// CU-INV-02: Registrar entrada de inventario

import {
  Producto,
  MovimientoInventario,
  TipoMovimiento,
  InventarioActualizadoEvent,
} from '../domain/entities.js'
import {
  ProductoRepository,
  MovimientoInventarioRepository,
  NotFoundError,
  ValidationError,
} from '../domain/repositories.js'
import { EventPublisher, EventFactory } from '../domain/events/event-system.js'

// DTOs para casos de uso
export interface RegistrarMovimientoInventarioRequest {
  productoId: string
  tipo: TipoMovimiento
  cantidad: number
  usuarioId: string
  comentario?: string
  referencia?: string
}

export interface MovimientoInventarioResponse {
  movimiento: MovimientoInventario
  stockAnterior: number
  stockNuevo: number
}

// CU-INV-01: Registrar salida de inventario
export class RegistrarSalidaInventarioUseCase {
  constructor(
    private productoRepo: ProductoRepository,
    private movimientoRepo: MovimientoInventarioRepository,
    private eventPublisher: EventPublisher
  ) {}

  async execute(
    request: RegistrarMovimientoInventarioRequest
  ): Promise<MovimientoInventarioResponse> {
    // Validaciones previas
    this.validarRequest(request)

    if (request.tipo !== TipoMovimiento.SALIDA) {
      throw new ValidationError(
        'Este caso de uso solo maneja salidas de inventario'
      )
    }

    if (request.cantidad <= 0) {
      throw new ValidationError('La cantidad debe ser mayor a cero')
    }

    // Verificar que el producto existe
    const producto = await this.productoRepo.findById(request.productoId)
    if (!producto) {
      throw new NotFoundError('Producto', request.productoId)
    }

    if (!producto.isActive) {
      throw new ValidationError(
        'No se pueden registrar movimientos en productos inactivos'
      )
    }

    // Verificar stock suficiente
    if (producto.stockActual < request.cantidad) {
      throw new ValidationError(
        `Stock insuficiente. Stock actual: ${producto.stockActual}, Solicitado: ${request.cantidad}`
      )
    }

    const stockAnterior = producto.stockActual
    const stockNuevo = stockAnterior - request.cantidad

    try {
      // Registrar movimiento
      const movimiento = await this.movimientoRepo.create({
        productoId: request.productoId,
        tipo: request.tipo,
        cantidad: request.cantidad,
        fecha: new Date(),
        usuarioId: request.usuarioId,
        comentario: request.comentario,
        referencia: request.referencia,
      })

      // Actualizar stock del producto
      const productoActualizado = await this.productoRepo.actualizarStock(
        request.productoId,
        stockNuevo
      )

      // Emitir evento para observers (KPIs, alertas, etc.)
      const evento = EventFactory.crearEventoInventarioActualizado(
        request.productoId,
        stockAnterior,
        stockNuevo,
        request.tipo,
        request.cantidad
      )

      await this.eventPublisher.notify(evento)

      return {
        movimiento,
        stockAnterior,
        stockNuevo,
      }
    } catch (error) {
      // En caso de error, asegurarse de que no quede estado inconsistente
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new Error(
        `Error al registrar salida de inventario: ${errorMessage}`
      )
    }
  }

  private validarRequest(request: RegistrarMovimientoInventarioRequest): void {
    if (!request.productoId) {
      throw new ValidationError('ID del producto es requerido')
    }
    if (!request.usuarioId) {
      throw new ValidationError('ID del usuario es requerido')
    }
    if (request.cantidad === undefined || request.cantidad === null) {
      throw new ValidationError('Cantidad es requerida')
    }
  }
}

// CU-INV-02: Registrar entrada de inventario
export class RegistrarEntradaInventarioUseCase {
  constructor(
    private productoRepo: ProductoRepository,
    private movimientoRepo: MovimientoInventarioRepository,
    private eventPublisher: EventPublisher
  ) {}

  async execute(
    request: RegistrarMovimientoInventarioRequest
  ): Promise<MovimientoInventarioResponse> {
    // Validaciones previas
    this.validarRequest(request)

    if (request.tipo !== TipoMovimiento.ENTRADA) {
      throw new ValidationError(
        'Este caso de uso solo maneja entradas de inventario'
      )
    }

    if (request.cantidad <= 0) {
      throw new ValidationError('La cantidad debe ser mayor a cero')
    }

    // Verificar que el producto existe
    const producto = await this.productoRepo.findById(request.productoId)
    if (!producto) {
      throw new NotFoundError('Producto', request.productoId)
    }

    if (!producto.isActive) {
      throw new ValidationError(
        'No se pueden registrar movimientos en productos inactivos'
      )
    }

    const stockAnterior = producto.stockActual
    const stockNuevo = stockAnterior + request.cantidad

    try {
      // Registrar movimiento
      const movimiento = await this.movimientoRepo.create({
        productoId: request.productoId,
        tipo: request.tipo,
        cantidad: request.cantidad,
        fecha: new Date(),
        usuarioId: request.usuarioId,
        comentario: request.comentario,
        referencia: request.referencia,
      })

      // Actualizar stock del producto
      const productoActualizado = await this.productoRepo.actualizarStock(
        request.productoId,
        stockNuevo
      )

      // Emitir evento para observers
      const evento = EventFactory.crearEventoInventarioActualizado(
        request.productoId,
        stockAnterior,
        stockNuevo,
        request.tipo,
        request.cantidad
      )

      await this.eventPublisher.notify(evento)

      return {
        movimiento,
        stockAnterior,
        stockNuevo,
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new Error(
        `Error al registrar entrada de inventario: ${errorMessage}`
      )
    }
  }

  private validarRequest(request: RegistrarMovimientoInventarioRequest): void {
    if (!request.productoId) {
      throw new ValidationError('ID del producto es requerido')
    }
    if (!request.usuarioId) {
      throw new ValidationError('ID del usuario es requerido')
    }
    if (request.cantidad === undefined || request.cantidad === null) {
      throw new ValidationError('Cantidad es requerida')
    }
  }
}

// CU-INV-03: Consultar historial de movimientos
export interface ConsultarHistorialRequest {
  productoId?: string
  fechaInicio?: Date
  fechaFin?: Date
  tipo?: TipoMovimiento
  limite?: number
}

export class ConsultarHistorialMovimientosUseCase {
  constructor(
    private movimientoRepo: MovimientoInventarioRepository,
    private productoRepo: ProductoRepository
  ) {}

  async execute(
    request: ConsultarHistorialRequest
  ): Promise<MovimientoInventario[]> {
    // Si se especifica un producto, verificar que existe
    if (request.productoId) {
      const producto = await this.productoRepo.findById(request.productoId)
      if (!producto) {
        throw new NotFoundError('Producto', request.productoId)
      }

      return this.movimientoRepo.findByProductoId(
        request.productoId,
        request.limite
      )
    }

    // Si se especifica rango de fechas
    if (request.fechaInicio && request.fechaFin) {
      return this.movimientoRepo.findByDateRange(
        request.fechaInicio,
        request.fechaFin
      )
    }

    // Si se especifica tipo de movimiento
    if (request.tipo) {
      return this.movimientoRepo.findByTipo(
        request.tipo,
        request.fechaInicio,
        request.fechaFin
      )
    }

    throw new ValidationError(
      'Debe especificar al menos un criterio de búsqueda'
    )
  }
}
