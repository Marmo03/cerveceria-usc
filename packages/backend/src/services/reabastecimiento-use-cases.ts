// Casos de Uso - Reabastecimiento
// CU-REB-01: Calcular sugerencia de pedido (Strategy Pattern)

import {
  Producto,
  PoliticaAbastecimiento,
  SugerenciaReabastecimiento,
  EstrategiaReposicion,
} from '../domain/entities.js'
import {
  ProductoRepository,
  PoliticaAbastecimientoRepository,
  MovimientoInventarioRepository,
  NotFoundError,
  ValidationError,
} from '../domain/repositories.js'
import { GestorEstrategiaReabastecimiento } from '../domain/strategies/reabastecimiento.js'

// DTOs para reabastecimiento
export interface CalcularSugerenciaRequest {
  productoId: string
  parametrosPersonalizados?: any
}

export interface SugerenciaReabastecimientoResponse {
  sugerencia: SugerenciaReabastecimiento
  producto: Producto
  politica: PoliticaAbastecimiento
  requiereReabastecimiento: boolean
  razon: string
}

export interface CrearPoliticaRequest {
  productoId: string
  estrategia: EstrategiaReposicion
  rop: number
  stockSeguridad: number
  parametrosJSON?: any
}

// CU-REB-01: Calcular sugerencia de pedido
export class CalcularSugerenciaPedidoUseCase {
  constructor(
    private productoRepo: ProductoRepository,
    private politicaRepo: PoliticaAbastecimientoRepository,
    private movimientoRepo: MovimientoInventarioRepository,
    private gestorEstrategias: GestorEstrategiaReabastecimiento
  ) {}

  async execute(
    request: CalcularSugerenciaRequest
  ): Promise<SugerenciaReabastecimientoResponse> {
    // Validar request
    if (!request.productoId) {
      throw new ValidationError('ID del producto es requerido')
    }

    // Verificar que el producto existe
    const producto = await this.productoRepo.findById(request.productoId)
    if (!producto) {
      throw new NotFoundError('Producto', request.productoId)
    }

    if (!producto.isActive) {
      throw new ValidationError(
        'No se pueden calcular sugerencias para productos inactivos'
      )
    }

    // Obtener política de abastecimiento
    let politica = await this.politicaRepo.findByProductoId(request.productoId)
    if (!politica) {
      // Crear política por defecto si no existe
      politica = await this.crearPoliticaPorDefecto(producto)
    }

    // Preparar parámetros para el cálculo
    const parametros = await this.prepararParametros(
      producto,
      politica,
      request.parametrosPersonalizados
    )

    // Calcular sugerencia usando Strategy Pattern
    const sugerencia = await this.gestorEstrategias.calcularSugerencia(
      producto,
      politica.estrategia,
      parametros
    )

    // Determinar si requiere reabastecimiento
    const requiereReabastecimiento = producto.stockActual <= sugerencia.rop
    const razon = this.determinarRazon(
      producto,
      sugerencia,
      requiereReabastecimiento
    )

    return {
      sugerencia,
      producto,
      politica,
      requiereReabastecimiento,
      razon,
    }
  }

  private async crearPoliticaPorDefecto(
    producto: Producto
  ): Promise<PoliticaAbastecimiento> {
    // Crear política manual por defecto
    const politicaDefecto = {
      productoId: producto.id,
      estrategia: EstrategiaReposicion.MANUAL,
      rop: producto.stockMin,
      stockSeguridad: Math.ceil(producto.stockMin * 0.5), // 50% del stock mínimo
      parametrosJSON: {
        cantidadFija: producto.stockMin * 2,
        createdByDefault: true,
      },
    }

    return this.politicaRepo.create(politicaDefecto)
  }

  private async prepararParametros(
    producto: Producto,
    politica: PoliticaAbastecimiento,
    parametrosPersonalizados?: any
  ): Promise<any> {
    if (politica.estrategia === EstrategiaReposicion.EOQ) {
      // Para EOQ, calcular parámetros basados en historial
      const demandaAnual = await this.calcularDemandaAnual(producto.id)

      return {
        demandaAnual,
        costoOrden: parametrosPersonalizados?.costoOrden || 50, // Valor por defecto
        costoAlmacenamiento:
          parametrosPersonalizados?.costoAlmacenamiento ||
          producto.costo * 0.25, // 25% del costo como holding cost
        leadTime: producto.leadTime,
        ...parametrosPersonalizados,
      }
    }

    if (politica.estrategia === EstrategiaReposicion.MANUAL) {
      return {
        cantidadFija:
          politica.parametrosJSON?.cantidadFija || producto.stockMin * 2,
        ropManual: politica.rop,
        ...parametrosPersonalizados,
      }
    }

    return parametrosPersonalizados || {}
  }

  private async calcularDemandaAnual(productoId: string): Promise<number> {
    // Calcular demanda anual basada en movimientos de salida de los últimos 12 meses
    const fechaFin = new Date()
    const fechaInicio = new Date()
    fechaInicio.setMonth(fechaFin.getMonth() - 12)

    const movimientos = await this.movimientoRepo.findByDateRange(
      fechaInicio,
      fechaFin
    )
    const movimientosProducto = movimientos.filter(
      (m) => m.productoId === productoId && m.tipo === 'SALIDA'
    )

    const totalSalidas = movimientosProducto.reduce(
      (sum, mov) => sum + mov.cantidad,
      0
    )

    // Si no hay historial suficiente, usar estimación basada en stock mínimo
    return totalSalidas > 0 ? totalSalidas : 30 * 12 // 30 unidades por mes como default
  }

  private determinarRazon(
    producto: Producto,
    sugerencia: SugerenciaReabastecimiento,
    requiereReabastecimiento: boolean
  ): string {
    if (!requiereReabastecimiento) {
      return `Stock actual (${producto.stockActual}) está por encima del ROP (${sugerencia.rop})`
    }

    if (producto.stockActual <= 0) {
      return `Stock agotado - Reabastecimiento urgente requerido`
    }

    if (producto.stockActual <= producto.stockMin * 0.5) {
      return `Stock crítico - Por debajo del 50% del mínimo`
    }

    return `Stock por debajo del ROP (${sugerencia.rop}) - Reabastecimiento recomendado`
  }
}

// CU-REB-02: Gestionar política de abastecimiento
export class GestionarPoliticaAbastecimientoUseCase {
  constructor(
    private productoRepo: ProductoRepository,
    private politicaRepo: PoliticaAbastecimientoRepository
  ) {}

  async crearPolitica(
    request: CrearPoliticaRequest
  ): Promise<PoliticaAbastecimiento> {
    // Validar request
    this.validarPoliticaRequest(request)

    // Verificar que el producto existe
    const producto = await this.productoRepo.findById(request.productoId)
    if (!producto) {
      throw new NotFoundError('Producto', request.productoId)
    }

    // Verificar que no existe ya una política
    const politicaExistente = await this.politicaRepo.findByProductoId(
      request.productoId
    )
    if (politicaExistente) {
      throw new ValidationError(
        'Ya existe una política de abastecimiento para este producto'
      )
    }

    // Crear nueva política
    return this.politicaRepo.create({
      productoId: request.productoId,
      estrategia: request.estrategia,
      rop: request.rop,
      stockSeguridad: request.stockSeguridad,
      parametrosJSON: request.parametrosJSON || {},
    })
  }

  async actualizarPolitica(
    politicaId: string,
    updates: Partial<PoliticaAbastecimiento>
  ): Promise<PoliticaAbastecimiento> {
    const politica = await this.politicaRepo.findById(politicaId)
    if (!politica) {
      throw new NotFoundError('Política de abastecimiento', politicaId)
    }

    return this.politicaRepo.update(politicaId, updates)
  }

  async eliminarPolitica(politicaId: string): Promise<void> {
    const politica = await this.politicaRepo.findById(politicaId)
    if (!politica) {
      throw new NotFoundError('Política de abastecimiento', politicaId)
    }

    await this.politicaRepo.delete(politicaId)
  }

  async obtenerPoliticaPorProducto(
    productoId: string
  ): Promise<PoliticaAbastecimiento | null> {
    return this.politicaRepo.findByProductoId(productoId)
  }

  private validarPoliticaRequest(request: CrearPoliticaRequest): void {
    if (!request.productoId) {
      throw new ValidationError('ID del producto es requerido')
    }
    if (!request.estrategia) {
      throw new ValidationError('Estrategia es requerida')
    }
    if (request.rop < 0) {
      throw new ValidationError('ROP no puede ser negativo')
    }
    if (request.stockSeguridad < 0) {
      throw new ValidationError('Stock de seguridad no puede ser negativo')
    }
  }
}

// CU-REB-03: Generar reporte de productos que requieren reabastecimiento
export interface ProductoReabastecimiento {
  producto: Producto
  sugerencia: SugerenciaReabastecimiento
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
  diasSinStock?: number // Estimación de días hasta agotarse
}

export class GenerarReporteReabastecimientoUseCase {
  constructor(
    private productoRepo: ProductoRepository,
    private calcularSugerenciaUC: CalcularSugerenciaPedidoUseCase
  ) {}

  async execute(): Promise<ProductoReabastecimiento[]> {
    // Obtener todos los productos activos
    const productos = await this.productoRepo.findAll({ isActive: true })

    const productosReabastecimiento: ProductoReabastecimiento[] = []

    // Calcular sugerencias para cada producto
    for (const producto of productos) {
      try {
        const resultado = await this.calcularSugerenciaUC.execute({
          productoId: producto.id,
        })

        if (resultado.requiereReabastecimiento) {
          const prioridad = this.determinarPrioridad(
            producto,
            resultado.sugerencia
          )
          const diasSinStock = this.estimarDiasSinStock(producto)

          productosReabastecimiento.push({
            producto,
            sugerencia: resultado.sugerencia,
            prioridad,
            diasSinStock,
          })
        }
      } catch (error) {
        console.error(
          `Error calculando reabastecimiento para producto ${producto.id}:`,
          error
        )
        // Continuar con otros productos
      }
    }

    // Ordenar por prioridad (ALTA -> MEDIA -> BAJA)
    return productosReabastecimiento.sort((a, b) => {
      const prioridadOrder = { ALTA: 0, MEDIA: 1, BAJA: 2 }
      return prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad]
    })
  }

  private determinarPrioridad(
    producto: Producto,
    sugerencia: SugerenciaReabastecimiento
  ): 'ALTA' | 'MEDIA' | 'BAJA' {
    const stockActual = producto.stockActual
    const stockMin = producto.stockMin

    if (stockActual <= 0) {
      return 'ALTA' // Sin stock
    }

    if (stockActual <= stockMin * 0.3) {
      return 'ALTA' // Menos del 30% del mínimo
    }

    if (stockActual <= stockMin * 0.7) {
      return 'MEDIA' // Menos del 70% del mínimo
    }

    return 'BAJA' // Por encima del 70% pero bajo ROP
  }

  private estimarDiasSinStock(producto: Producto): number | undefined {
    // Estimación simplificada basada en consumo promedio
    // En implementación real, usar historial de movimientos
    if (producto.stockActual <= 0) return 0

    // Suponer consumo diario promedio (esto debería calcularse del historial)
    const consumoDiarioPromedio = 2 // Placeholder

    return Math.floor(producto.stockActual / consumoDiarioPromedio)
  }
}
