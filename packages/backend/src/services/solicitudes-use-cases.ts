// Casos de Uso - Solicitudes de Compra
// CU-SC-01: Enviar solicitud a aprobaciones (Chain of Responsibility)
// CU-APR-01: Aprobar/Rechazar solicitud

import {
  SolicitudCompra,
  Aprobacion,
  EstadoSolicitud,
  EstadoAprobacion,
  SolicitudActualizadaEvent,
} from '../domain/entities.js'
import {
  ProductoRepository,
  SolicitudCompraRepository,
  AprobacionRepository,
  NotFoundError,
  ValidationError,
} from '../domain/repositories.js'
import {
  GestorAprobaciones,
  ContextoAprobacion,
  ResultadoAprobacion,
} from '../domain/approvals/chain-of-responsibility.js'
import { EventPublisher, EventFactory } from '../domain/events/event-system.js'

// DTOs para solicitudes de compra
export interface CrearSolicitudRequest {
  productoId: string
  cantidad: number
  creadorId: string
  comentario?: string
  basadaEnSugerencia?: boolean
}

export interface EnviarAprobacionRequest {
  solicitudId: string
  usuarioId: string
}

export interface ProcesarAprobacionRequest {
  aprobacionId: string
  usuarioId: string
  decision: EstadoAprobacion // APROBADA | RECHAZADA
  comentario?: string
}

export interface SolicitudCompraResponse {
  solicitud: SolicitudCompra
  aprobaciones: Aprobacion[]
  proximoAprobador?: {
    nivel: number
    rolRequerido: string
  }
}

// CU-SC-01: Crear y enviar solicitud a aprobaciones
export class CrearSolicitudCompraUseCase {
  constructor(
    private productoRepo: ProductoRepository,
    private solicitudRepo: SolicitudCompraRepository,
    private aprobacionRepo: AprobacionRepository,
    private gestorAprobaciones: GestorAprobaciones,
    private eventPublisher: EventPublisher
  ) {}

  async execute(
    request: CrearSolicitudRequest
  ): Promise<SolicitudCompraResponse> {
    // Validaciones
    this.validarCrearSolicitudRequest(request)

    // Verificar que el producto existe
    const producto = await this.productoRepo.findById(request.productoId)
    if (!producto) {
      throw new NotFoundError('Producto', request.productoId)
    }

    if (!producto.isActive) {
      throw new ValidationError(
        'No se pueden crear solicitudes para productos inactivos'
      )
    }

    // Crear solicitud en estado BORRADOR
    const solicitud = await this.solicitudRepo.create({
      productoId: request.productoId,
      cantidad: request.cantidad,
      estado: EstadoSolicitud.BORRADOR,
      creadorId: request.creadorId,
      historialJSON: {
        eventos: [
          {
            fecha: new Date(),
            evento: 'CREADA',
            usuario: request.creadorId,
            comentario: request.comentario,
            basadaEnSugerencia: request.basadaEnSugerencia,
          },
        ],
      },
    })

    return {
      solicitud,
      aprobaciones: [],
      proximoAprobador: undefined,
    }
  }

  private validarCrearSolicitudRequest(request: CrearSolicitudRequest): void {
    if (!request.productoId) {
      throw new ValidationError('ID del producto es requerido')
    }
    if (!request.creadorId) {
      throw new ValidationError('ID del creador es requerido')
    }
    if (!request.cantidad || request.cantidad <= 0) {
      throw new ValidationError('La cantidad debe ser mayor a cero')
    }
  }
}

// CU-SC-02: Enviar solicitud a aprobaciones
export class EnviarSolicitudAprobacionUseCase {
  constructor(
    private solicitudRepo: SolicitudCompraRepository,
    private aprobacionRepo: AprobacionRepository,
    private gestorAprobaciones: GestorAprobaciones,
    private eventPublisher: EventPublisher
  ) {}

  async execute(
    request: EnviarAprobacionRequest
  ): Promise<SolicitudCompraResponse> {
    // Validar request
    if (!request.solicitudId || !request.usuarioId) {
      throw new ValidationError('ID de solicitud y usuario son requeridos')
    }

    // Obtener solicitud
    const solicitud = await this.solicitudRepo.findById(request.solicitudId)
    if (!solicitud) {
      throw new NotFoundError('Solicitud de compra', request.solicitudId)
    }

    // Verificar que esté en estado BORRADOR
    if (solicitud.estado !== EstadoSolicitud.BORRADOR) {
      throw new ValidationError(
        `La solicitud ya fue enviada a aprobación. Estado actual: ${solicitud.estado}`
      )
    }

    // Verificar que el usuario puede enviar (creador o admin)
    if (solicitud.creadorId !== request.usuarioId) {
      // TODO: Verificar si es admin - esto vendría del contexto de usuario
      throw new ValidationError(
        'Solo el creador puede enviar la solicitud a aprobación'
      )
    }

    // Determinar próximo aprobador
    const proximoAprobador = this.gestorAprobaciones.determinarProximoAprobador(
      solicitud,
      0
    )
    if (!proximoAprobador) {
      throw new ValidationError('No se pudo determinar el próximo aprobador')
    }

    // Actualizar solicitud a EN_APROBACION
    const solicitudActualizada = await this.solicitudRepo.update(
      request.solicitudId,
      {
        estado: EstadoSolicitud.EN_APROBACION,
        historialJSON: {
          ...solicitud.historialJSON,
          eventos: [
            ...(solicitud.historialJSON?.eventos || []),
            {
              fecha: new Date(),
              evento: 'ENVIADA_APROBACION',
              usuario: request.usuarioId,
              nivelAprobacion: proximoAprobador.nivel,
            },
          ],
        },
      }
    )

    // Crear primera aprobación pendiente
    const aprobacion = await this.aprobacionRepo.create({
      solicitudId: request.solicitudId,
      nivel: proximoAprobador.nivel,
      aprobadorId: '', // Se asignará cuando un aprobador tome la solicitud
      estado: EstadoAprobacion.PENDIENTE,
      fecha: new Date(),
    })

    // Emitir evento
    const evento = EventFactory.crearEventoSolicitudActualizada(
      request.solicitudId,
      EstadoSolicitud.BORRADOR,
      EstadoSolicitud.EN_APROBACION
    )
    await this.eventPublisher.notify(evento)

    return {
      solicitud: solicitudActualizada,
      aprobaciones: [aprobacion],
      proximoAprobador,
    }
  }
}

// CU-APR-01: Aprobar/Rechazar solicitud
export class ProcesarAprobacionUseCase {
  constructor(
    private solicitudRepo: SolicitudCompraRepository,
    private aprobacionRepo: AprobacionRepository,
    private gestorAprobaciones: GestorAprobaciones,
    private eventPublisher: EventPublisher
  ) {}

  async execute(
    request: ProcesarAprobacionRequest,
    usuarioContext: { id: string; roleId: string; roleName: string }
  ): Promise<SolicitudCompraResponse> {
    // Validaciones
    this.validarProcesarAprobacionRequest(request)

    // Obtener aprobación
    const aprobacion = await this.aprobacionRepo.findById(request.aprobacionId)
    if (!aprobacion) {
      throw new NotFoundError('Aprobación', request.aprobacionId)
    }

    if (aprobacion.estado !== EstadoAprobacion.PENDIENTE) {
      throw new ValidationError(
        `La aprobación ya fue procesada. Estado: ${aprobacion.estado}`
      )
    }

    // Obtener solicitud
    const solicitud = await this.solicitudRepo.findById(aprobacion.solicitudId)
    if (!solicitud) {
      throw new NotFoundError('Solicitud de compra', aprobacion.solicitudId)
    }

    if (solicitud.estado !== EstadoSolicitud.EN_APROBACION) {
      throw new ValidationError(
        `La solicitud no está en proceso de aprobación. Estado: ${solicitud.estado}`
      )
    }

    // Actualizar aprobación con la decisión del usuario
    const aprobacionActualizada = await this.aprobacionRepo.update(
      request.aprobacionId,
      {
        aprobadorId: request.usuarioId,
        estado: request.decision,
        comentario: request.comentario,
        fecha: new Date(),
      }
    )

    // Preparar contexto para Chain of Responsibility
    const contexto: ContextoAprobacion = {
      solicitud,
      aprobacion: aprobacionActualizada,
      usuario: usuarioContext,
    }

    // Procesar usando Chain of Responsibility
    const resultado = await this.gestorAprobaciones.procesarAprobacion(contexto)

    // Actualizar solicitud según el resultado
    const nuevoEstado = this.determinarNuevoEstado(resultado, solicitud)
    const solicitudActualizada = await this.actualizarSolicitud(
      solicitud,
      nuevoEstado,
      resultado,
      request.usuarioId
    )

    // Crear próxima aprobación si es necesario
    let proximaAprobacion: Aprobacion | undefined
    if (resultado.requiereSiguienteAprobador && resultado.siguienteNivel) {
      proximaAprobacion = await this.aprobacionRepo.create({
        solicitudId: solicitud.id,
        nivel: resultado.siguienteNivel,
        aprobadorId: '', // Se asignará cuando un aprobador tome la solicitud
        estado: EstadoAprobacion.PENDIENTE,
        fecha: new Date(),
      })
    }

    // Obtener todas las aprobaciones actualizadas
    const todasAprobaciones = await this.aprobacionRepo.findBySolicitudId(
      solicitud.id
    )

    // Emitir evento
    const evento = EventFactory.crearEventoSolicitudActualizada(
      solicitud.id,
      solicitud.estado,
      nuevoEstado,
      request.usuarioId
    )
    await this.eventPublisher.notify(evento)

    // Determinar próximo aprobador si aplica
    const proximoAprobador =
      resultado.requiereSiguienteAprobador && resultado.siguienteNivel
        ? {
            nivel: resultado.siguienteNivel,
            rolRequerido: this.getRolParaNivel(resultado.siguienteNivel),
          }
        : undefined

    return {
      solicitud: solicitudActualizada,
      aprobaciones: todasAprobaciones,
      proximoAprobador,
    }
  }

  private validarProcesarAprobacionRequest(
    request: ProcesarAprobacionRequest
  ): void {
    if (!request.aprobacionId) {
      throw new ValidationError('ID de aprobación es requerido')
    }
    if (!request.usuarioId) {
      throw new ValidationError('ID de usuario es requerido')
    }
    if (!request.decision) {
      throw new ValidationError('Decisión es requerida')
    }
    if (
      ![EstadoAprobacion.APROBADA, EstadoAprobacion.RECHAZADA].includes(
        request.decision
      )
    ) {
      throw new ValidationError('Decisión debe ser APROBADA o RECHAZADA')
    }
  }

  private determinarNuevoEstado(
    resultado: ResultadoAprobacion,
    solicitud: SolicitudCompra
  ): EstadoSolicitud {
    if (!resultado.aprobada) {
      return EstadoSolicitud.RECHAZADA
    }

    if (resultado.requiereSiguienteAprobador) {
      return EstadoSolicitud.EN_APROBACION // Continúa en aprobación
    }

    return EstadoSolicitud.APROBADA // Aprobación final
  }

  private async actualizarSolicitud(
    solicitud: SolicitudCompra,
    nuevoEstado: EstadoSolicitud,
    resultado: ResultadoAprobacion,
    usuarioId: string
  ): Promise<SolicitudCompra> {
    const historialActualizado = {
      ...solicitud.historialJSON,
      eventos: [
        ...(solicitud.historialJSON?.eventos || []),
        {
          fecha: new Date(),
          evento: nuevoEstado,
          usuario: usuarioId,
          comentario: resultado.comentario,
          razon: resultado.razon,
        },
      ],
    }

    return this.solicitudRepo.update(solicitud.id, {
      estado: nuevoEstado,
      historialJSON: historialActualizado,
    })
  }

  private getRolParaNivel(nivel: number): string {
    switch (nivel) {
      case 1:
        return 'APROBADOR'
      case 2:
        return 'ADMIN'
      default:
        return 'ADMIN'
    }
  }
}

// CU-SC-03: Consultar solicitudes
export interface ConsultarSolicitudesRequest {
  creadorId?: string
  aprobadorId?: string
  estado?: EstadoSolicitud
  fechaDesde?: Date
  fechaHasta?: Date
  productoId?: string
}

export class ConsultarSolicitudesUseCase {
  constructor(
    private solicitudRepo: SolicitudCompraRepository,
    private aprobacionRepo: AprobacionRepository
  ) {}

  async execute(
    request: ConsultarSolicitudesRequest
  ): Promise<SolicitudCompraResponse[]> {
    const solicitudes = await this.solicitudRepo.findAll({
      creadorId: request.creadorId,
      estado: request.estado,
      fechaDesde: request.fechaDesde,
      fechaHasta: request.fechaHasta,
      productoId: request.productoId,
    })

    const resultado: SolicitudCompraResponse[] = []

    for (const solicitud of solicitudes) {
      const aprobaciones = await this.aprobacionRepo.findBySolicitudId(
        solicitud.id
      )

      resultado.push({
        solicitud,
        aprobaciones,
        proximoAprobador: undefined, // No calculamos próximo en consultas
      })
    }

    return resultado
  }
}
