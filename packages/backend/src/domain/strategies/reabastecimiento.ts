// Strategy Pattern - Estrategias de Reabastecimiento
// Permite cambiar algoritmos de cálculo de reabastecimiento dinámicamente

import {
  EstrategiaReposicion,
  SugerenciaReabastecimiento,
  DatosEOQ,
  Producto,
} from '../entities.js'

// Interfaz Strategy
export interface EstrategiaReabastecimientoStrategy {
  calcular(
    producto: Producto,
    parametros: any
  ): Promise<SugerenciaReabastecimiento>
  validarParametros(parametros: any): boolean
}

// Strategy concreta: EOQ (Economic Order Quantity)
export class EOQStrategy implements EstrategiaReabastecimientoStrategy {
  async calcular(
    producto: Producto,
    parametros: DatosEOQ
  ): Promise<SugerenciaReabastecimiento> {
    const { demandaAnual, costoOrden, costoAlmacenamiento, leadTime } =
      parametros

    // Fórmula EOQ: sqrt((2 * D * S) / H)
    // D = Demanda anual, S = Costo por orden, H = Costo de almacenamiento
    const eoq = Math.sqrt((2 * demandaAnual * costoOrden) / costoAlmacenamiento)

    // Cálculo ROP: (Demanda diaria * Lead time) + Stock de seguridad
    const demandaDiaria = demandaAnual / 365
    const rop = Math.ceil(demandaDiaria * leadTime + producto.stockMin)

    return {
      productoId: producto.id,
      cantidadSugerida: Math.ceil(eoq),
      rop,
      estrategiaUsada: EstrategiaReposicion.EOQ,
      parametros: {
        demandaAnual,
        costoOrden,
        costoAlmacenamiento,
        leadTime,
        demandaDiaria,
        eoqCalculado: eoq,
      },
      fechaCalculo: new Date(),
    }
  }

  validarParametros(parametros: DatosEOQ): boolean {
    return (
      parametros.demandaAnual > 0 &&
      parametros.costoOrden > 0 &&
      parametros.costoAlmacenamiento > 0 &&
      parametros.leadTime > 0
    )
  }
}

// Strategy concreta: Manual
export class ManualStrategy implements EstrategiaReabastecimientoStrategy {
  async calcular(
    producto: Producto,
    parametros: any
  ): Promise<SugerenciaReabastecimiento> {
    const { cantidadFija, ropManual } = parametros

    return {
      productoId: producto.id,
      cantidadSugerida: cantidadFija || producto.stockMin * 2, // Default: 2x stock mínimo
      rop: ropManual || producto.stockMin,
      estrategiaUsada: EstrategiaReposicion.MANUAL,
      parametros: {
        cantidadFija,
        ropManual,
        aplicadoPorDefecto: !cantidadFija,
      },
      fechaCalculo: new Date(),
    }
  }

  validarParametros(parametros: any): boolean {
    // Para estrategia manual, los parámetros son opcionales
    return true
  }
}

// Context - Gestor de estrategias
export class GestorEstrategiaReabastecimiento {
  private strategies: Map<
    EstrategiaReposicion,
    EstrategiaReabastecimientoStrategy
  >

  constructor() {
    this.strategies = new Map()
    this.strategies.set(EstrategiaReposicion.EOQ, new EOQStrategy())
    this.strategies.set(EstrategiaReposicion.MANUAL, new ManualStrategy())
  }

  async calcularSugerencia(
    producto: Producto,
    estrategia: EstrategiaReposicion,
    parametros: any
  ): Promise<SugerenciaReabastecimiento> {
    const strategy = this.strategies.get(estrategia)

    if (!strategy) {
      throw new Error(`Estrategia no soportada: ${estrategia}`)
    }

    if (!strategy.validarParametros(parametros)) {
      throw new Error(`Parámetros inválidos para estrategia ${estrategia}`)
    }

    return strategy.calcular(producto, parametros)
  }

  agregarEstrategia(
    tipo: EstrategiaReposicion,
    strategy: EstrategiaReabastecimientoStrategy
  ): void {
    this.strategies.set(tipo, strategy)
  }

  obtenerEstrategiasDisponibles(): EstrategiaReposicion[] {
    return Array.from(this.strategies.keys())
  }
}

// Factory para crear el gestor (Singleton)
export class EstrategiaReabastecimientoFactory {
  private static instance: GestorEstrategiaReabastecimiento

  static getInstance(): GestorEstrategiaReabastecimiento {
    if (!this.instance) {
      this.instance = new GestorEstrategiaReabastecimiento()
    }
    return this.instance
  }
}
