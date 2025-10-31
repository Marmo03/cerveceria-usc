import { LogisticsRepository } from '../repositories/logistics.js'
import type {
  CreateTransportistaInput,
  UpdateTransportistaInput,
  CreateEnvioInput,
  UpdateEnvioInput,
  CreateRutaEnvioInput,
  UpdateRutaEnvioInput,
  CreateEstadoEnvioInput,
  CreateProductoEnvioInput,
  UpdateProductoEnvioInput,
  ListEnviosQuery,
  ListTransportistasQuery,
} from '../schemas/logistics.js'

export class LogisticsService {
  constructor(private repository: LogisticsRepository) {}

  // ===== TRANSPORTISTAS =====

  async createTransportista(data: CreateTransportistaInput) {
    // Validar que no exista un transportista con el mismo nombre
    const existingTransportista = await this.repository.listTransportistas({
      page: 1,
      limit: 1,
      search: data.nombre,
    })

    if (
      existingTransportista.data.some(
        (t) => t.nombre.toLowerCase() === data.nombre.toLowerCase()
      )
    ) {
      throw new Error('Ya existe un transportista con ese nombre')
    }

    return this.repository.createTransportista(data)
  }

  async getTransportistaById(id: string) {
    const transportista = await this.repository.getTransportistaById(id)

    if (!transportista) {
      throw new Error('Transportista no encontrado')
    }

    return transportista
  }

  async listTransportistas(query: ListTransportistasQuery) {
    return this.repository.listTransportistas(query)
  }

  async updateTransportista(id: string, data: UpdateTransportistaInput) {
    await this.getTransportistaById(id) // Verificar que existe
    return this.repository.updateTransportista(id, data)
  }

  async deleteTransportista(id: string) {
    const transportista = await this.getTransportistaById(id)

    // Verificar que no tenga envíos activos
    const enviosActivos = await this.repository.listEnvios({
      page: 1,
      limit: 1,
      transportistaId: id,
    })

    if (enviosActivos.pagination.total > 0) {
      throw new Error(
        'No se puede eliminar un transportista con envíos registrados'
      )
    }

    return this.repository.deleteTransportista(id)
  }

  // ===== ENVÍOS =====

  async createEnvio(data: CreateEnvioInput) {
    // Validar que el número de guía sea único
    const existingEnvio = await this.repository.getEnvioByNumeroGuia(
      data.numeroGuia
    )

    if (existingEnvio) {
      throw new Error('Ya existe un envío con ese número de guía')
    }

    // Validar que el transportista exista
    await this.getTransportistaById(data.transportistaId)

    // Crear el envío con los productos
    return this.repository.createEnvio(data)
  }

  async getEnvioById(id: string) {
    const envio = await this.repository.getEnvioById(id)

    if (!envio) {
      throw new Error('Envío no encontrado')
    }

    return envio
  }

  async getEnvioByNumeroGuia(numeroGuia: string) {
    const envio = await this.repository.getEnvioByNumeroGuia(numeroGuia)

    if (!envio) {
      throw new Error('Envío no encontrado')
    }

    return envio
  }

  async listEnvios(query: ListEnviosQuery) {
    return this.repository.listEnvios(query)
  }

  async updateEnvio(id: string, data: UpdateEnvioInput) {
    await this.getEnvioById(id) // Verificar que existe

    // Si se está cambiando el transportista, validar que exista
    if (data.transportistaId) {
      await this.getTransportistaById(data.transportistaId)
    }

    return this.repository.updateEnvio(id, data)
  }

  async deleteEnvio(id: string) {
    const envio = await this.getEnvioById(id)

    // Solo se pueden eliminar envíos en estado PENDIENTE o CANCELADO
    if (envio.estado !== 'PENDIENTE' && envio.estado !== 'CANCELADO') {
      throw new Error(
        'Solo se pueden eliminar envíos en estado PENDIENTE o CANCELADO'
      )
    }

    return this.repository.deleteEnvio(id)
  }

  async cancelarEnvio(id: string, descripcion?: string) {
    const envio = await this.getEnvioById(id)

    // Solo se pueden cancelar envíos que no estén entregados
    if (envio.estado === 'ENTREGADO') {
      throw new Error('No se puede cancelar un envío que ya fue entregado')
    }

    // Actualizar estado a CANCELADO
    await this.repository.updateEnvio(id, { estado: 'CANCELADO' })

    // Crear registro de estado
    await this.repository.createEstadoEnvio({
      envioId: id,
      estado: 'CANCELADO',
      descripcion: descripcion || 'Envío cancelado',
    })

    return this.getEnvioById(id)
  }

  // ===== RUTAS DE ENVÍO =====

  async createRutaEnvio(data: CreateRutaEnvioInput) {
    // Verificar que el envío existe
    await this.getEnvioById(data.envioId)

    return this.repository.createRutaEnvio(data)
  }

  async listRutasEnvio(envioId: string) {
    await this.getEnvioById(envioId) // Verificar que existe
    return this.repository.listRutasEnvio(envioId)
  }

  async updateRutaEnvio(id: string, data: UpdateRutaEnvioInput) {
    return this.repository.updateRutaEnvio(id, data)
  }

  async deleteRutaEnvio(id: string) {
    return this.repository.deleteRutaEnvio(id)
  }

  // ===== ESTADOS DE ENVÍO (TRACKING) =====

  async createEstadoEnvio(data: CreateEstadoEnvioInput) {
    // Verificar que el envío existe
    const envio = await this.getEnvioById(data.envioId)

    // Validar transiciones de estado válidas
    this.validateEstadoTransition(envio.estado, data.estado)

    // Actualizar fecha de entrega si el estado es ENTREGADO
    if (data.estado === 'ENTREGADO') {
      await this.repository.updateEnvio(data.envioId, {
        fechaEntrega: new Date(),
      })
    }

    return this.repository.createEstadoEnvio(data)
  }

  async listEstadosEnvio(envioId: string) {
    await this.getEnvioById(envioId) // Verificar que existe
    return this.repository.listEstadosEnvio(envioId)
  }

  private validateEstadoTransition(estadoActual: string, nuevoEstado: string) {
    const transicionesValidas: Record<string, string[]> = {
      PENDIENTE: ['EN_PREPARACION', 'CANCELADO'],
      EN_PREPARACION: ['EN_TRANSITO', 'CANCELADO'],
      EN_TRANSITO: ['EN_ADUANA', 'EN_ENTREGA', 'DEVUELTO', 'CANCELADO'],
      EN_ADUANA: ['EN_TRANSITO', 'EN_ENTREGA', 'DEVUELTO'],
      EN_ENTREGA: ['ENTREGADO', 'DEVUELTO'],
      ENTREGADO: [], // Estado final
      CANCELADO: [], // Estado final
      DEVUELTO: ['EN_TRANSITO'], // Puede reintentar el envío
    }

    const permitidos = transicionesValidas[estadoActual] || []

    if (!permitidos.includes(nuevoEstado)) {
      throw new Error(
        `Transición de estado no válida: de ${estadoActual} a ${nuevoEstado}`
      )
    }
  }

  // ===== PRODUCTOS EN ENVÍO =====

  async createProductoEnvio(data: CreateProductoEnvioInput) {
    // Verificar que el envío existe y está en estado PENDIENTE
    const envio = await this.getEnvioById(data.envioId)

    if (envio.estado !== 'PENDIENTE') {
      throw new Error(
        'Solo se pueden agregar productos a envíos en estado PENDIENTE'
      )
    }

    return this.repository.createProductoEnvio(data)
  }

  async listProductosEnvio(envioId: string) {
    await this.getEnvioById(envioId) // Verificar que existe
    return this.repository.listProductosEnvio(envioId)
  }

  async updateProductoEnvio(id: string, data: UpdateProductoEnvioInput) {
    return this.repository.updateProductoEnvio(id, data)
  }

  async deleteProductoEnvio(id: string) {
    return this.repository.deleteProductoEnvio(id)
  }

  // ===== ESTADÍSTICAS =====

  async getEnviosStats() {
    return this.repository.getEnviosStats()
  }

  async getTransportistasStats() {
    return this.repository.getTransportistasStats()
  }

  // ===== UTILIDADES =====

  async calcularTiempoEntrega(envioId: string): Promise<number | null> {
    const envio = await this.getEnvioById(envioId)

    if (!envio.fechaEnvio || !envio.fechaEntrega) {
      return null
    }

    const diff = envio.fechaEntrega.getTime() - envio.fechaEnvio.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) // Días
  }

  async getEnviosPorEstado() {
    const stats = await this.getEnviosStats()
    return stats.porEstado
  }
}
