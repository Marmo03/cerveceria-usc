/**
 * Servicio de integración con API de Servientrega
 * Documentación: https://mobile.servientrega.com/ApiIngresoCLientes/Help
 */

import fetch from 'node-fetch'

const SERVIENTREGA_BASE_URL = 'https://mobile.servientrega.com/ApiIngresoCLientes/api'
const ID_PAIS_COLOMBIA = 1 // Colombia
const LANGUAGE = 'es'

// Interfaces
export interface Ciudad {
  id: number
  nombre: string
  departamento: string
  pais: string
}

export interface Cotizacion {
  ciudadOrigen: string
  ciudadDestino: string
  peso: number // kg
  valorDeclarado: number
  largo: number // cm
  alto: number // cm
  ancho: number // cm
  costoEnvio: number
  tiempoEstimado: string
  producto: string
  formaPago: string
  medioTransporte: string
}

export interface Restriccion {
  tipo: string
  descripcion: string
  activa: boolean
}

/**
 * Obtener lista de ciudades origen disponibles
 */
export async function obtenerCiudadesOrigen(idProducto: number = 2): Promise<Ciudad[]> {
  try {
    const url = `${SERVIENTREGA_BASE_URL}/Cotizador/CiudadesOrigen/${ID_PAIS_COLOMBIA}/${idProducto}/${LANGUAGE}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Parsear respuesta de Servientrega a nuestro formato
    return data.map((item: any) => ({
      id: item.id || item.idCiudad,
      nombre: item.nombre || item.nombreCiudad,
      departamento: item.departamento || item.nombreDepartamento,
      pais: 'Colombia'
    }))
  } catch (error) {
    console.error('Error obteniendo ciudades origen:', error)
    throw error
  }
}

/**
 * Autocompletar ciudades origen por nombre
 */
export async function buscarCiudadesOrigen(
  nombreCiudad: string,
  idProducto: number = 2
): Promise<Ciudad[]> {
  try {
    const url = `${SERVIENTREGA_BASE_URL}/Cotizador/AutoCompleteCiudadesOrigen/${ID_PAIS_COLOMBIA}/${idProducto}/${LANGUAGE}/${encodeURIComponent(nombreCiudad)}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return data.map((item: any) => ({
      id: item.id || item.idCiudad,
      nombre: item.nombre || item.nombreCiudad,
      departamento: item.departamento || item.nombreDepartamento,
      pais: 'Colombia'
    }))
  } catch (error) {
    console.error('Error buscando ciudades origen:', error)
    throw error
  }
}

/**
 * Obtener ciudades destino disponibles desde una ciudad origen
 */
export async function obtenerCiudadesDestino(
  idCiudadOrigen: number,
  idProducto: number = 2
): Promise<Ciudad[]> {
  try {
    const url = `${SERVIENTREGA_BASE_URL}/Cotizador/CiudadesDepartamentoDestino/${ID_PAIS_COLOMBIA}/${idCiudadOrigen}/${idProducto}/${LANGUAGE}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return data.map((item: any) => ({
      id: item.id || item.idCiudad,
      nombre: item.nombre || item.nombreCiudad,
      departamento: item.departamento || item.nombreDepartamento,
      pais: 'Colombia'
    }))
  } catch (error) {
    console.error('Error obteniendo ciudades destino:', error)
    throw error
  }
}

/**
 * Autocompletar ciudades destino por nombre
 */
export async function buscarCiudadesDestino(
  idCiudadOrigen: number,
  nombreCiudad: string,
  idProducto: number = 2
): Promise<Ciudad[]> {
  try {
    const url = `${SERVIENTREGA_BASE_URL}/Cotizador/AutoCompleteCiudadesDepartamentoDestino/${ID_PAIS_COLOMBIA}/${idCiudadOrigen}/${idProducto}/${LANGUAGE}/${encodeURIComponent(nombreCiudad)}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return data.map((item: any) => ({
      id: item.id || item.idCiudad,
      nombre: item.nombre || item.nombreCiudad,
      departamento: item.departamento || item.nombreDepartamento,
      pais: 'Colombia'
    }))
  } catch (error) {
    console.error('Error buscando ciudades destino:', error)
    throw error
  }
}

/**
 * Cotizar envío
 */
export async function cotizarEnvio(params: {
  idCiudadOrigen: number
  idCiudadDestino: number
  largo: number // cm
  alto: number // cm
  ancho: number // cm
  peso: number // kg
  valorDeclarado: number
  idProducto?: number
}): Promise<Cotizacion[]> {
  try {
    const {
      idCiudadOrigen,
      idCiudadDestino,
      largo,
      alto,
      ancho,
      peso,
      valorDeclarado,
      idProducto = 2 // Producto por defecto (ej: Paqueteo)
    } = params

    const url = `${SERVIENTREGA_BASE_URL}/Cotizador/Tarifas/${idCiudadOrigen}/${idCiudadDestino}/${largo}/${alto}/${ancho}/${peso}/${valorDeclarado}/${idProducto}/${LANGUAGE}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Parsear respuesta
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        ciudadOrigen: item.nombreCiudadOrigen || '',
        ciudadDestino: item.nombreCiudadDestino || '',
        peso: peso,
        valorDeclarado: valorDeclarado,
        largo: largo,
        alto: alto,
        ancho: ancho,
        costoEnvio: item.vlrFlete || item.valorFlete || 0,
        tiempoEstimado: item.tiempoEntrega || item.diasEntrega || 'N/D',
        producto: item.nombreProducto || 'Paqueteo',
        formaPago: item.formaPago || 'Crédito',
        medioTransporte: item.medioTransporte || 'Terrestre'
      }))
    }
    
    return []
  } catch (error) {
    console.error('Error cotizando envío:', error)
    throw error
  }
}

/**
 * Verificar restricciones de red operativa
 */
export async function verificarRestricciones(params: {
  idCiudadOrigen: number
  idCiudadDestino: number
  peso: number
  largo: number
  alto: number
  ancho: number
  idProducto?: number
}): Promise<Restriccion[]> {
  try {
    const {
      idCiudadOrigen,
      idCiudadDestino,
      peso,
      largo,
      alto,
      ancho,
      idProducto = 2
    } = params

    const url = `${SERVIENTREGA_BASE_URL}/Cotizador/restriccionesRedOperativa/${ID_PAIS_COLOMBIA}/${idCiudadOrigen}/${ID_PAIS_COLOMBIA}/${idCiudadDestino}/${idProducto}/${peso}/${largo}/${alto}/${ancho}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        tipo: item.tipo || 'GENERAL',
        descripcion: item.descripcion || item.mensaje || 'Restricción aplicable',
        activa: item.activa !== false
      }))
    }
    
    return []
  } catch (error) {
    console.error('Error verificando restricciones:', error)
    throw error
  }
}

/**
 * Geocodificar dirección usando Nominatim (OpenStreetMap)
 * GRATIS - Sin API Key necesaria
 */
export async function geocodificarDireccion(direccion: string, ciudad?: string): Promise<{
  latitud: number
  longitud: number
  direccionCompleta: string
} | null> {
  try {
    const query = ciudad ? `${direccion}, ${ciudad}, Colombia` : `${direccion}, Colombia`
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Cerveceria-USC-App/1.0' // Requerido por Nominatim
      }
    })
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (data.length > 0) {
      const result = data[0]
      return {
        latitud: parseFloat(result.lat),
        longitud: parseFloat(result.lon),
        direccionCompleta: result.display_name
      }
    }
    
    return null
  } catch (error) {
    console.error('Error geocodificando dirección:', error)
    return null
  }
}
