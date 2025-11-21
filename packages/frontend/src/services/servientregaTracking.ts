/**
 * Servicio para rastrear envíos de Servientrega
 * 
 * Este servicio maneja la consulta de guías/números de rastreo
 * de Servientrega para conocer el estado actual y el historial
 * de movimientos de los pedidos que llegan a la empresa.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface TrackingResponse {
  numeroGuia: string
  estado: string
  origen?: string
  destino?: string
  fechaEstimada?: string
  mensaje?: string
  historial?: TrackingEvent[]
  detalles?: {
    remitente?: string
    destinatario?: string
    peso?: string
    unidades?: string
  }
}

export interface TrackingEvent {
  estado?: string
  descripcion?: string
  fecha?: string
  fechaHora?: string
  ubicacion?: string
  observaciones?: string
}

/**
 * Rastrea un envío de Servientrega usando el número de guía
 * 
 * IMPORTANTE: Servientrega tiene varios endpoints posibles para tracking:
 * 1. /Rastreo/RastreoEnvio/{numeroGuia}
 * 2. /Rastreo/Seguimiento/{numeroGuia}
 * 3. /Tracking/ConsultarGuia/{numeroGuia}
 * 
 * La estructura exacta depende de la versión de la API que estés usando.
 * Este código intenta adaptarse a diferentes formatos de respuesta.
 * 
 * @param numeroGuia - Número de guía de Servientrega
 * @returns Información del rastreo del envío
 */
export async function rastrearEnvio(numeroGuia: string): Promise<TrackingResponse> {
  try {
    // Intentar con el endpoint de rastreo principal
    let url = `${API_BASE_URL}/logistics/servientrega-proxy/Rastreo/RastreoEnvio/${encodeURIComponent(numeroGuia)}`
    
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Si falla, intentar endpoint alternativo
    if (!response.ok && response.status === 404) {
      url = `${API_BASE_URL}/logistics/servientrega-proxy/Tracking/ConsultarGuia/${encodeURIComponent(numeroGuia)}`
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Número de guía no encontrado. Verifica que el número sea correcto.')
      }
      throw new Error(`Error ${response.status}: No se pudo consultar el envío`)
    }

    const data = await response.json()

    // Validar si la respuesta indica error
    if (data.success === false || data.error) {
      throw new Error(data.message || data.error || 'No se encontró información para esta guía')
    }

    // Transformar respuesta al formato estándar
    return transformarRespuestaServientrega(data, numeroGuia)
  } catch (error: any) {
    console.error('Error al rastrear envío:', error)
    
    // Mensaje más amigable para el usuario
    if (error.message.includes('404') || error.message.includes('no encontrado')) {
      throw new Error('Número de guía no encontrado. Verifica que el número sea correcto.')
    } else if (error.message.includes('500')) {
      throw new Error('Error en el servidor de Servientrega. Intenta nuevamente más tarde.')
    } else {
      throw error
    }
  }
}

/**
 * Transforma la respuesta de Servientrega al formato estándar de la aplicación
 * 
 * Servientrega puede devolver diferentes estructuras según la versión de la API:
 * - estadoActual vs estado
 * - eventos vs historial vs movimientos
 * - ciudadOrigen vs origen
 * etc.
 */
function transformarRespuestaServientrega(data: any, numeroGuia: string): TrackingResponse {
  return {
    numeroGuia: numeroGuia,
    estado: data.estadoActual || data.estado || data.estadoEnvio || 'DESCONOCIDO',
    origen: data.ciudadOrigen || data.origen || data.origenNombre || '',
    destino: data.ciudadDestino || data.destino || data.destinoNombre || '',
    fechaEstimada: data.fechaEntrega || data.fechaEstimada || data.fechaEntregaEstimada || '',
    mensaje: data.mensaje || data.observaciones || data.descripcionEstado || '',
    historial: transformarHistorial(data),
    detalles: {
      remitente: data.remitente || data.nombreRemitente || '',
      destinatario: data.destinatario || data.consignatario || data.nombreDestinatario || '',
      peso: data.peso || data.pesoReal || data.pesoKg || '',
      unidades: data.unidades || data.cantidadPiezas || data.piezas || '',
    },
  }
}

/**
 * Transforma el historial de eventos al formato estándar
 */
function transformarHistorial(data: any): TrackingEvent[] {
  // Intentar extraer historial de diferentes campos posibles
  const eventos = data.eventos || data.historial || data.movimientos || data.novedades || []

  if (!Array.isArray(eventos)) {
    return []
  }

  return eventos.map((evento: any) => ({
    estado: evento.estado || evento.estadoNombre || evento.descripcionEstado || '',
    descripcion: evento.descripcion || evento.observacion || evento.detalle || '',
    fecha: evento.fecha || evento.fechaHora || evento.fechaEvento || '',
    fechaHora: evento.fechaHora || evento.fecha || '',
    ubicacion: evento.ubicacion || evento.ciudad || evento.localidad || '',
    observaciones: evento.observaciones || evento.notas || '',
  }))
}

/**
 * Consulta múltiples guías a la vez (útil para dashboard)
 * 
 * @param numerosGuia - Array de números de guía
 * @returns Array de resultados de tracking
 */
export async function rastrearMultiplesEnvios(
  numerosGuia: string[]
): Promise<TrackingResponse[]> {
  const resultados = await Promise.allSettled(
    numerosGuia.map((guia) => rastrearEnvio(guia))
  )

  return resultados
    .filter((r) => r.status === 'fulfilled')
    .map((r: any) => r.value)
}

/**
 * Valida el formato de un número de guía de Servientrega
 * 
 * Nota: Servientrega usa diferentes formatos según el tipo de servicio,
 * generalmente son números de 9-13 dígitos.
 * 
 * @param numeroGuia - Número a validar
 * @returns true si el formato parece válido
 */
export function validarNumeroGuia(numeroGuia: string): boolean {
  if (!numeroGuia || typeof numeroGuia !== 'string') {
    return false
  }

  const guiaLimpia = numeroGuia.trim()

  // Debe tener entre 8 y 15 caracteres
  if (guiaLimpia.length < 8 || guiaLimpia.length > 15) {
    return false
  }

  // Puede contener números, letras mayúsculas y guiones
  const formatoValido = /^[0-9A-Z\-]+$/
  return formatoValido.test(guiaLimpia)
}
