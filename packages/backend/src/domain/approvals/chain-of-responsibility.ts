// Chain of Responsibility Pattern - Sistema de Aprobaciones
// Maneja el flujo de aprobaciones multinivel para solicitudes de compra

import {
  SolicitudCompra,
  Aprobacion,
  EstadoSolicitud,
  EstadoAprobacion,
} from '../entities.js'

// Contexto de aprobación
export interface ContextoAprobacion {
  solicitud: SolicitudCompra
  aprobacion: Aprobacion
  usuario: {
    id: string
    roleId: string
    roleName: string
  }
}

// Resultado de procesamiento
export interface ResultadoAprobacion {
  aprobada: boolean
  siguienteNivel?: number
  requiereSiguienteAprobador: boolean
  comentario?: string
  razon?: string
}

// Handler abstracto
export abstract class AprobacionHandler {
  protected siguienteHandler?: AprobacionHandler

  setSiguiente(handler: AprobacionHandler): AprobacionHandler {
    this.siguienteHandler = handler
    return handler
  }

  abstract puedeAprobar(contexto: ContextoAprobacion): boolean
  abstract procesar(contexto: ContextoAprobacion): Promise<ResultadoAprobacion>

  async manejar(contexto: ContextoAprobacion): Promise<ResultadoAprobacion> {
    if (this.puedeAprobar(contexto)) {
      return this.procesar(contexto)
    }

    if (this.siguienteHandler) {
      return this.siguienteHandler.manejar(contexto)
    }

    throw new Error('No hay handler disponible para procesar esta aprobación')
  }
}

// Handler concreto: Nivel 1 - Jefe de Área (Operario → Aprobador)
export class AprobacionNivel1Handler extends AprobacionHandler {
  puedeAprobar(contexto: ContextoAprobacion): boolean {
    return (
      contexto.aprobacion.nivel === 1 &&
      contexto.usuario.roleName === 'APROBADOR' &&
      contexto.solicitud.estado === EstadoSolicitud.EN_APROBACION
    )
  }

  async procesar(contexto: ContextoAprobacion): Promise<ResultadoAprobacion> {
    const { aprobacion, solicitud } = contexto

    if (aprobacion.estado === EstadoAprobacion.APROBADA) {
      // Verificar si necesita ir a nivel 2 (solicitudes > $10,000 o cantidad > 100)
      const requiereNivel2 = this.requiereAprobacionNivel2(solicitud)

      return {
        aprobada: true,
        siguienteNivel: requiereNivel2 ? 2 : undefined,
        requiereSiguienteAprobador: requiereNivel2,
        comentario: aprobacion.comentario,
      }
    }

    // Rechazada
    return {
      aprobada: false,
      requiereSiguienteAprobador: false,
      comentario: aprobacion.comentario,
      razon: 'Rechazada en nivel 1',
    }
  }

  private requiereAprobacionNivel2(solicitud: SolicitudCompra): boolean {
    // Lógica de negocio: solicitudes de alto valor van a nivel 2
    // Este valor podría venir de configuración
    return solicitud.cantidad > 100 // Más de 100 unidades requiere nivel 2
  }
}

// Handler concreto: Nivel 2 - Director/Gerente
export class AprobacionNivel2Handler extends AprobacionHandler {
  puedeAprobar(contexto: ContextoAprobacion): boolean {
    return (
      contexto.aprobacion.nivel === 2 &&
      (contexto.usuario.roleName === 'ADMIN' ||
        contexto.usuario.roleName === 'APROBADOR') &&
      contexto.solicitud.estado === EstadoSolicitud.EN_APROBACION
    )
  }

  async procesar(contexto: ContextoAprobacion): Promise<ResultadoAprobacion> {
    const { aprobacion } = contexto

    if (aprobacion.estado === EstadoAprobacion.APROBADA) {
      return {
        aprobada: true,
        requiereSiguienteAprobador: false, // Nivel final
        comentario: aprobacion.comentario,
      }
    }

    return {
      aprobada: false,
      requiereSiguienteAprobador: false,
      comentario: aprobacion.comentario,
      razon: 'Rechazada en nivel 2',
    }
  }
}

// Handler concreto: Aprobación de Emergencia (Admin puede aprobar cualquier nivel)
export class AprobacionEmergenciaHandler extends AprobacionHandler {
  puedeAprobar(contexto: ContextoAprobacion): boolean {
    return (
      contexto.usuario.roleName === 'ADMIN' &&
      contexto.solicitud.estado === EstadoSolicitud.EN_APROBACION
    )
  }

  async procesar(contexto: ContextoAprobacion): Promise<ResultadoAprobacion> {
    const { aprobacion } = contexto

    return {
      aprobada: aprobacion.estado === EstadoAprobacion.APROBADA,
      requiereSiguienteAprobador: false, // Admin puede finalizar cualquier aprobación
      comentario: `${aprobacion.comentario} [APROBACIÓN DE EMERGENCIA]`,
      razon:
        aprobacion.estado === EstadoAprobacion.RECHAZADA
          ? 'Rechazada por Admin'
          : undefined,
    }
  }
}

// Gestor principal del Chain of Responsibility
export class GestorAprobaciones {
  private cadenaAprobacion!: AprobacionHandler

  constructor() {
    this.construirCadena()
  }

  private construirCadena(): void {
    // Construir la cadena: Emergencia → Nivel1 → Nivel2
    const nivel1 = new AprobacionNivel1Handler()
    const nivel2 = new AprobacionNivel2Handler()
    const emergencia = new AprobacionEmergenciaHandler()

    // Emergencia puede manejar cualquier caso, pero se evalúa primero
    emergencia.setSiguiente(nivel1).setSiguiente(nivel2)

    this.cadenaAprobacion = emergencia
  }

  async procesarAprobacion(
    contexto: ContextoAprobacion
  ): Promise<ResultadoAprobacion> {
    try {
      return await this.cadenaAprobacion.manejar(contexto)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new Error(`Error en el proceso de aprobación: ${errorMessage}`)
    }
  }

  // Método para determinar el próximo aprobador basado en la lógica de negocio
  determinarProximoAprobador(
    solicitud: SolicitudCompra,
    nivelActual: number
  ): {
    nivel: number
    rolRequerido: string
  } | null {
    switch (nivelActual) {
      case 0: // Inicial
        return { nivel: 1, rolRequerido: 'APROBADOR' }

      case 1: // Después del primer nivel
        // Verificar si requiere segundo nivel
        if (solicitud.cantidad > 100) {
          return { nivel: 2, rolRequerido: 'ADMIN' }
        }
        return null // No requiere más aprobaciones

      case 2: // Segundo nivel
        return null // Nivel máximo alcanzado

      default:
        return null
    }
  }

  // Validar si un usuario puede crear aprobaciones en un nivel específico
  puedeCrearAprobacion(rolUsuario: string, nivel: number): boolean {
    switch (nivel) {
      case 1:
        return rolUsuario === 'APROBADOR' || rolUsuario === 'ADMIN'
      case 2:
        return rolUsuario === 'ADMIN'
      default:
        return false
    }
  }
}

// Factory para el gestor (Singleton)
export class GestorAprobacionesFactory {
  private static instance: GestorAprobaciones

  static getInstance(): GestorAprobaciones {
    if (!this.instance) {
      this.instance = new GestorAprobaciones()
    }
    return this.instance
  }
}
