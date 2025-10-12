// Casos de Uso - KPIs e Indicadores
// CU-KPI-01: Actualizar indicador tras evento (Observer Pattern)
// CU-KPI-02: Consultar y exportar KPIs

import {
  Indicador,
  TipoIndicador,
  DomainEvent,
  InventarioActualizadoEvent,
  SolicitudActualizadaEvent,
} from '../domain/entities.js'
import {
  IndicadorRepository,
  ProductoRepository,
  MovimientoInventarioRepository,
  SolicitudCompraRepository,
  NotFoundError,
  ValidationError,
} from '../domain/repositories.js'

// DTOs para KPIs
export interface ActualizarIndicadorRequest {
  tipo: TipoIndicador
  productoId?: string
  solicitudId?: string
  periodo: string
  stockActual?: number
  forzarRecalculo?: boolean
}

export interface ConsultarKPIsRequest {
  tipo?: TipoIndicador
  periodo?: string
  fechaDesde?: Date
  fechaHasta?: Date
  productoId?: string
}

export interface KPIResumen {
  indicador: Indicador
  tendencia: 'MEJORA' | 'ESTABLE' | 'EMPEORA'
  variacionPorcentual?: number
  metadata: {
    descripcion: string
    unidadMedida: string
    rangoOptimo?: string
    interpretacion: string
  }
}

export interface DashboardKPIs {
  resumenGeneral: {
    totalProductos: number
    solicitudesPendientes: number
    nivelPromedio: number
    alertasActivas: number
  }
  indicadoresPrincipales: KPIResumen[]
  tendencias: {
    periodo: string
    valores: Record<TipoIndicador, number>
  }[]
}

// CU-KPI-01: Actualizar indicador tras evento
export class ActualizarIndicadorUseCase {
  constructor(
    private indicadorRepo: IndicadorRepository,
    private productoRepo: ProductoRepository,
    private movimientoRepo: MovimientoInventarioRepository,
    private solicitudRepo: SolicitudCompraRepository
  ) {}

  async execute(request: ActualizarIndicadorRequest): Promise<Indicador> {
    this.validarRequest(request)

    // Verificar si ya existe un indicador para este tipo y período
    const indicadoresExistentes = await this.indicadorRepo.findByTipo(
      request.tipo,
      request.periodo
    )

    let indicador: Indicador

    if (indicadoresExistentes.length > 0 && !request.forzarRecalculo) {
      // Actualizar existente
      indicador = indicadoresExistentes[0]
      const nuevoValor = await this.calcularIndicador(request)
      indicador = await this.indicadorRepo.update(indicador.id, {
        valor: nuevoValor,
        fechaCalculo: new Date(),
      })
    } else {
      // Crear nuevo
      const valor = await this.calcularIndicador(request)
      indicador = await this.indicadorRepo.create({
        tipo: request.tipo,
        periodo: request.periodo,
        valor,
        metadataJSON: this.generarMetadata(request),
        fechaCalculo: new Date(),
      })
    }

    return indicador
  }

  private async calcularIndicador(
    request: ActualizarIndicadorRequest
  ): Promise<number> {
    switch (request.tipo) {
      case TipoIndicador.ROTACION_INVENTARIO:
        return this.calcularRotacionInventario(
          request.productoId,
          request.periodo
        )

      case TipoIndicador.FILL_RATE:
        return this.calcularFillRate(request.periodo)

      case TipoIndicador.TIEMPO_CICLO:
        return this.calcularTiempoCiclo(request.periodo)

      case TipoIndicador.NIVEL_SERVICIO:
        return this.calcularNivelServicio(request.productoId, request.periodo)

      case TipoIndicador.BACKORDERS:
        return this.calcularBackorders(request.periodo)

      case TipoIndicador.COSTO_INVENTARIO:
        return this.calcularCostoInventario(
          request.productoId,
          request.stockActual
        )

      default:
        throw new ValidationError(
          `Tipo de indicador no soportado: ${request.tipo}`
        )
    }
  }

  private async calcularRotacionInventario(
    productoId?: string,
    periodo?: string
  ): Promise<number> {
    // Rotación = Costo de mercancías vendidas / Inventario promedio
    // Simplificado: Total salidas / Stock promedio en el período

    const fechaFin = new Date()
    const fechaInicio = new Date()

    // Determinar rango basado en período
    if (periodo?.includes('-')) {
      const [año, mes] = periodo.split('-')
      fechaInicio.setFullYear(parseInt(año), parseInt(mes) - 1, 1)
      fechaFin.setFullYear(parseInt(año), parseInt(mes), 0)
    } else {
      fechaInicio.setMonth(fechaFin.getMonth() - 1) // Último mes por defecto
    }

    let totalSalidas = 0
    let stockPromedio = 0

    if (productoId) {
      // Rotación para producto específico
      const movimientos = await this.movimientoRepo.findByProductoId(productoId)
      const movimientosPeriodo = movimientos.filter(
        (m) =>
          m.fecha >= fechaInicio && m.fecha <= fechaFin && m.tipo === 'SALIDA'
      )

      totalSalidas = movimientosPeriodo.reduce((sum, m) => sum + m.cantidad, 0)

      const producto = await this.productoRepo.findById(productoId)
      stockPromedio = producto ? producto.stockActual : 1 // Evitar división por cero
    } else {
      // Rotación general
      const movimientos = await this.movimientoRepo.findByDateRange(
        fechaInicio,
        fechaFin
      )
      const salidas = movimientos.filter((m) => m.tipo === 'SALIDA')
      totalSalidas = salidas.reduce((sum, m) => sum + m.cantidad, 0)

      const productos = await this.productoRepo.findAll({ isActive: true })
      stockPromedio =
        productos.reduce((sum, p) => sum + p.stockActual, 0) / productos.length
    }

    return stockPromedio > 0
      ? Number((totalSalidas / stockPromedio).toFixed(2))
      : 0
  }

  private async calcularFillRate(periodo?: string): Promise<number> {
    // Fill Rate = (Solicitudes completadas / Total solicitudes) * 100
    const solicitudes = await this.solicitudRepo.findAll()

    if (solicitudes.length === 0) return 100 // Sin solicitudes = 100% fill rate

    const completadas = solicitudes.filter(
      (s) => s.estado === 'APROBADA'
    ).length
    return Number(((completadas / solicitudes.length) * 100).toFixed(2))
  }

  private async calcularTiempoCiclo(periodo?: string): Promise<number> {
    // Tiempo promedio desde creación hasta aprobación/rechazo
    const solicitudes = await this.solicitudRepo.findAll()
    const finalizadas = solicitudes.filter(
      (s) => s.estado === 'APROBADA' || s.estado === 'RECHAZADA'
    )

    if (finalizadas.length === 0) return 0

    const tiempos = finalizadas.map((s) => {
      const inicio = new Date(s.fechaCreacion)
      const fin = new Date(s.fechaActualizacion)
      return (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60) // Horas
    })

    const promedio = tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length
    return Number(promedio.toFixed(2))
  }

  private async calcularNivelServicio(
    productoId?: string,
    periodo?: string
  ): Promise<number> {
    // Nivel de servicio = % de tiempo que el stock estuvo disponible
    // Simplificado: (Días sin stock bajo / Total días) * 100

    if (productoId) {
      const producto = await this.productoRepo.findById(productoId)
      if (!producto) return 0

      // Si stock actual > mínimo, considerar buen nivel de servicio
      return producto.stockActual > producto.stockMin ? 95 : 70
    }

    // Nivel de servicio general
    const productos = await this.productoRepo.findAll({ isActive: true })
    const productosConBuenStock = productos.filter(
      (p) => p.stockActual > p.stockMin
    ).length

    return productos.length > 0
      ? Number(((productosConBuenStock / productos.length) * 100).toFixed(2))
      : 100
  }

  private async calcularBackorders(periodo?: string): Promise<number> {
    // Número de productos con stock por debajo del mínimo
    const productos = await this.productoRepo.findConStockBajo()
    return productos.length
  }

  private async calcularCostoInventario(
    productoId?: string,
    stockActual?: number
  ): Promise<number> {
    if (productoId) {
      const producto = await this.productoRepo.findById(productoId)
      if (!producto) return 0

      const stock = stockActual ?? producto.stockActual
      return Number((stock * producto.costo).toFixed(2))
    }

    // Costo total del inventario
    const productos = await this.productoRepo.findAll({ isActive: true })
    const costoTotal = productos.reduce(
      (sum, p) => sum + p.stockActual * p.costo,
      0
    )
    return Number(costoTotal.toFixed(2))
  }

  private generarMetadata(request: ActualizarIndicadorRequest): any {
    return {
      calculadoPara: request.productoId ? 'producto' : 'general',
      productoId: request.productoId,
      solicitudId: request.solicitudId,
      parametros: {
        periodo: request.periodo,
        stockActual: request.stockActual,
        fechaCalculo: new Date().toISOString(),
      },
    }
  }

  private validarRequest(request: ActualizarIndicadorRequest): void {
    if (!request.tipo) {
      throw new ValidationError('Tipo de indicador es requerido')
    }
    if (!request.periodo) {
      throw new ValidationError('Período es requerido')
    }
  }
}

// CU-KPI-02: Consultar KPIs
export class ConsultarKPIsUseCase {
  constructor(private indicadorRepo: IndicadorRepository) {}

  async execute(request: ConsultarKPIsRequest): Promise<KPIResumen[]> {
    let indicadores: Indicador[]

    if (request.tipo && request.periodo) {
      indicadores = await this.indicadorRepo.findByTipo(
        request.tipo,
        request.periodo
      )
    } else if (request.tipo) {
      indicadores = await this.indicadorRepo.findByTipo(request.tipo)
    } else if (request.periodo) {
      indicadores = await this.indicadorRepo.findByPeriodo(request.periodo)
    } else {
      // Obtener indicadores más recientes de cada tipo
      const tipos = Object.values(TipoIndicador)
      indicadores = []

      for (const tipo of tipos) {
        const indicadoresTipo = await this.indicadorRepo.findByTipo(tipo)
        if (indicadoresTipo.length > 0) {
          // Obtener el más reciente
          const masReciente = indicadoresTipo.sort(
            (a, b) =>
              new Date(b.fechaCalculo).getTime() -
              new Date(a.fechaCalculo).getTime()
          )[0]
          indicadores.push(masReciente)
        }
      }
    }

    return Promise.all(
      indicadores.map((indicador) => this.crearKPIResumen(indicador))
    )
  }

  private async crearKPIResumen(indicador: Indicador): Promise<KPIResumen> {
    // Calcular tendencia comparando con período anterior
    const tendencia = await this.calcularTendencia(indicador)

    return {
      indicador,
      tendencia: tendencia.direccion,
      variacionPorcentual: tendencia.variacion,
      metadata: this.generarMetadataDescriptiva(indicador.tipo),
    }
  }

  private async calcularTendencia(indicador: Indicador): Promise<{
    direccion: 'MEJORA' | 'ESTABLE' | 'EMPEORA'
    variacion?: number
  }> {
    // Obtener indicador del período anterior para comparar
    const periodoAnterior = this.calcularPeriodoAnterior(indicador.periodo)
    const indicadoresAnteriores = await this.indicadorRepo.findByTipo(
      indicador.tipo,
      periodoAnterior
    )

    if (indicadoresAnteriores.length === 0) {
      return { direccion: 'ESTABLE' }
    }

    const valorAnterior = indicadoresAnteriores[0].valor
    const valorActual = indicador.valor

    const variacion = ((valorActual - valorAnterior) / valorAnterior) * 100

    // Determinar si el cambio es mejora o empeora según el tipo de indicador
    const esPositivoMejora = this.esIndicadorPositivo(indicador.tipo)

    let direccion: 'MEJORA' | 'ESTABLE' | 'EMPEORA'

    if (Math.abs(variacion) < 5) {
      // Menos del 5% se considera estable
      direccion = 'ESTABLE'
    } else if (variacion > 0) {
      direccion = esPositivoMejora ? 'MEJORA' : 'EMPEORA'
    } else {
      direccion = esPositivoMejora ? 'EMPEORA' : 'MEJORA'
    }

    return {
      direccion,
      variacion: Number(Math.abs(variacion).toFixed(2)),
    }
  }

  private calcularPeriodoAnterior(periodo: string): string {
    if (periodo.includes('-')) {
      const [año, mes] = periodo.split('-').map(Number)
      const fecha = new Date(año, mes - 1, 1)
      fecha.setMonth(fecha.getMonth() - 1)
      return `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`
    }

    // Para otros formatos, simplemente restar 1
    return String(Number(periodo) - 1)
  }

  private esIndicadorPositivo(tipo: TipoIndicador): boolean {
    // Definir qué indicadores son "mejores" cuando suben
    const indicadoresPositivos = [
      TipoIndicador.ROTACION_INVENTARIO,
      TipoIndicador.FILL_RATE,
      TipoIndicador.NIVEL_SERVICIO,
    ]

    return indicadoresPositivos.includes(tipo)
  }

  private generarMetadataDescriptiva(tipo: TipoIndicador): {
    descripcion: string
    unidadMedida: string
    rangoOptimo?: string
    interpretacion: string
  } {
    const metadata = {
      [TipoIndicador.ROTACION_INVENTARIO]: {
        descripcion: 'Número de veces que se rota el inventario en un período',
        unidadMedida: 'veces',
        rangoOptimo: '6-12 veces/año',
        interpretacion: 'Mayor rotación indica mejor eficiencia en ventas',
      },
      [TipoIndicador.FILL_RATE]: {
        descripcion: 'Porcentaje de solicitudes completadas exitosamente',
        unidadMedida: '%',
        rangoOptimo: '95-100%',
        interpretacion: 'Mayor fill rate indica mejor nivel de servicio',
      },
      [TipoIndicador.TIEMPO_CICLO]: {
        descripcion: 'Tiempo promedio desde solicitud hasta aprobación',
        unidadMedida: 'horas',
        rangoOptimo: '< 24 horas',
        interpretacion: 'Menor tiempo indica procesos más eficientes',
      },
      [TipoIndicador.NIVEL_SERVICIO]: {
        descripcion: 'Porcentaje de tiempo con stock disponible',
        unidadMedida: '%',
        rangoOptimo: '95-98%',
        interpretacion: 'Mayor nivel indica mejor disponibilidad',
      },
      [TipoIndicador.BACKORDERS]: {
        descripcion: 'Número de productos con stock por debajo del mínimo',
        unidadMedida: 'productos',
        rangoOptimo: '0-2 productos',
        interpretacion: 'Menor número indica mejor control de inventario',
      },
      [TipoIndicador.COSTO_INVENTARIO]: {
        descripcion: 'Valor monetario total del inventario actual',
        unidadMedida: '$',
        interpretacion: 'Debe balancearse con nivel de servicio',
      },
    }

    return (
      metadata[tipo] || {
        descripcion: 'Indicador personalizado',
        unidadMedida: 'unidades',
        interpretacion: 'Consultar documentación específica',
      }
    )
  }
}

// CU-KPI-03: Generar dashboard de KPIs
export class GenerarDashboardKPIsUseCase {
  constructor(
    private consultarKPIsUC: ConsultarKPIsUseCase,
    private productoRepo: ProductoRepository,
    private solicitudRepo: SolicitudCompraRepository,
    private indicadorRepo: IndicadorRepository
  ) {}

  async execute(periodo?: string): Promise<DashboardKPIs> {
    const periodoActual = periodo || this.obtenerPeriodoActual()

    // Obtener resumen general
    const resumenGeneral = await this.obtenerResumenGeneral()

    // Obtener indicadores principales
    const indicadoresPrincipales = await this.consultarKPIsUC.execute({
      periodo: periodoActual,
    })

    // Obtener tendencias de los últimos 3 períodos
    const tendencias = await this.obtenerTendencias(periodoActual)

    return {
      resumenGeneral,
      indicadoresPrincipales,
      tendencias,
    }
  }

  private async obtenerResumenGeneral() {
    const productos = await this.productoRepo.findAll({ isActive: true })
    const solicitudes = await this.solicitudRepo.findAll()
    const solicitudesPendientes = solicitudes.filter(
      (s) => s.estado === 'EN_APROBACION'
    ).length
    const productosStockBajo = await this.productoRepo.findConStockBajo()

    const stockPromedio =
      productos.length > 0
        ? productos.reduce((sum, p) => sum + p.stockActual, 0) /
          productos.length
        : 0

    return {
      totalProductos: productos.length,
      solicitudesPendientes,
      nivelPromedio: Number(stockPromedio.toFixed(1)),
      alertasActivas: productosStockBajo.length,
    }
  }

  private async obtenerTendencias(periodoActual: string) {
    const periodos = this.generarPeriodosAnteriores(periodoActual, 3)
    const tendencias = []

    for (const periodo of periodos) {
      const valores: Record<string, number> = {}

      for (const tipo of Object.values(TipoIndicador)) {
        const indicadores = await this.indicadorRepo.findByTipo(tipo, periodo)
        valores[tipo] = indicadores.length > 0 ? indicadores[0].valor : 0
      }

      tendencias.push({
        periodo,
        valores: valores as Record<TipoIndicador, number>,
      })
    }

    return tendencias
  }

  private obtenerPeriodoActual(): string {
    const fecha = new Date()
    return `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`
  }

  private generarPeriodosAnteriores(
    periodoBase: string,
    cantidad: number
  ): string[] {
    const periodos = [periodoBase]
    let periodoActual = periodoBase

    for (let i = 1; i < cantidad; i++) {
      const [año, mes] = periodoActual.split('-').map(Number)
      const fecha = new Date(año, mes - 1, 1)
      fecha.setMonth(fecha.getMonth() - 1)
      periodoActual = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`
      periodos.unshift(periodoActual)
    }

    return periodos
  }
}
