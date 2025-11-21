/**
 * Servicio para integración con Servientrega API a través del proxy del backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const PROXY_BASE = `${API_BASE_URL}/api/logistics/servientrega-proxy`

const ID_PAIS_COLOMBIA = 1
const LANGUAGE = 'es'
const ID_PRODUCTO_DEFAULT = 2 // Paqueteo

export interface Ciudad {
  id: number
  nombre: string
  departamento?: string
  pais?: string
}

export interface Cotizacion {
  costoEnvio: number
  tiempoEstimado: string
  producto: string
  formaPago?: string
  medioTransporte?: string
}

export interface CoordenadaGeo {
  latitud: number
  longitud: number
  direccionCompleta?: string
}

/**
 * Buscar ciudades origen por nombre
 */
export async function buscarCiudadesOrigen(query: string): Promise<Ciudad[]> {
  try {
    const url = `${PROXY_BASE}/Cotizador/AutoCompleteCiudadesOrigen/${ID_PAIS_COLOMBIA}/${ID_PRODUCTO_DEFAULT}/${LANGUAGE}/${encodeURIComponent(query)}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
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
    return []
  }
}

/**
 * Buscar ciudades destino por nombre desde una ciudad origen
 */
export async function buscarCiudadesDestino(
  idCiudadOrigen: number,
  query: string
): Promise<Ciudad[]> {
  try {
    const url = `${PROXY_BASE}/Cotizador/AutoCompleteCiudadesDepartamentoDestino/${ID_PAIS_COLOMBIA}/${idCiudadOrigen}/${ID_PRODUCTO_DEFAULT}/${LANGUAGE}/${encodeURIComponent(query)}`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
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
    return []
  }
}

/**
 * Cotizar envío
 */
export async function cotizarEnvio(params: {
  idCiudadOrigen: number
  idCiudadDestino: number
  largo: number
  alto: number
  ancho: number
  peso: number
  valorDeclarado: number
}): Promise<Cotizacion[]> {
  try {
    const {
      idCiudadOrigen,
      idCiudadDestino,
      largo,
      alto,
      ancho,
      peso,
      valorDeclarado
    } = params

    const url = `${PROXY_BASE}/Cotizador/Tarifas/${idCiudadOrigen}/${idCiudadDestino}/${largo}/${alto}/${ancho}/${peso}/${valorDeclarado}/${ID_PRODUCTO_DEFAULT}/${LANGUAGE}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}`)
    }
    
    const data = await response.json()
    
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
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
    return []
  }
}

/**
 * Geocodificar dirección usando Nominatim (OpenStreetMap) - proxy del backend
 */
export async function geocodificarDireccion(
  direccion: string,
  ciudad?: string
): Promise<CoordenadaGeo | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/logistics/geocodificar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ direccion, ciudad })
    })
    
    if (!response.ok) {
      return null
    }
    
    const result = await response.json()
    
    if (result.success && result.data) {
      return {
        latitud: result.data.latitud,
        longitud: result.data.longitud,
        direccionCompleta: result.data.direccionCompleta
      }
    }
    
    return null
  } catch (error) {
    console.error('Error geocodificando:', error)
    return null
  }
}
