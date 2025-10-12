// Adaptador para trabajos en segundo plano (Jobs/Colas)
// Maneja tareas asíncronas como procesamiento de archivos y notificaciones

export interface JobService {
  procesarImportacionCSV(job: ImportacionJob): Promise<void>
  calcularKPIsPeriodicos(job: KPIJob): Promise<void>
  enviarAlertasStock(job: AlertaJob): Promise<void>
}

export interface ImportacionJob {
  id: string
  tipo: 'PRODUCTOS' | 'STOCK' | 'VENTAS'
  archivo: string
  contenido: string
  usuarioId: string
  configuracion?: any
}

export interface KPIJob {
  id: string
  periodo: string
  tiposIndicadores: string[]
  forzarRecalculo?: boolean
}

export interface AlertaJob {
  id: string
  tipoAlerta: 'STOCK_BAJO' | 'REABASTECIMIENTO' | 'APROBACIONES_PENDIENTES'
  configuracion?: any
}

// Implementación mock para desarrollo
export class MockJobService implements JobService {
  private trabajosEnEjecucion = new Map<string, any>()

  async procesarImportacionCSV(job: ImportacionJob): Promise<void> {
    console.log('🔄 [MOCK JOB] Iniciando procesamiento de importación:', job.id)

    this.trabajosEnEjecucion.set(job.id, {
      ...job,
      estado: 'PROCESANDO',
      iniciadoEn: new Date(),
    })

    // Simular procesamiento
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simular resultado
    const exito = Math.random() > 0.2 // 80% de éxito

    if (exito) {
      console.log('✅ [MOCK JOB] Importación completada:', job.id)
      this.trabajosEnEjecucion.set(job.id, {
        ...this.trabajosEnEjecucion.get(job.id),
        estado: 'COMPLETADO',
        finalizadoEn: new Date(),
        resultado: {
          filasExitosas: 45,
          filasConError: 2,
          errores: [
            { fila: 3, error: 'SKU duplicado' },
            { fila: 8, error: 'Precio inválido' },
          ],
        },
      })
    } else {
      console.log('❌ [MOCK JOB] Error en importación:', job.id)
      this.trabajosEnEjecucion.set(job.id, {
        ...this.trabajosEnEjecucion.get(job.id),
        estado: 'ERROR',
        finalizadoEn: new Date(),
        error: 'Error inesperado en el procesamiento',
      })
    }
  }

  async calcularKPIsPeriodicos(job: KPIJob): Promise<void> {
    console.log('📊 [MOCK JOB] Calculando KPIs para período:', job.periodo)

    this.trabajosEnEjecucion.set(job.id, {
      ...job,
      estado: 'PROCESANDO',
      iniciadoEn: new Date(),
    })

    // Simular cálculo de cada indicador
    for (const tipo of job.tiposIndicadores) {
      console.log(`  - Calculando ${tipo}...`)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    console.log('✅ [MOCK JOB] KPIs calculados para:', job.periodo)
    this.trabajosEnEjecucion.set(job.id, {
      ...this.trabajosEnEjecucion.get(job.id),
      estado: 'COMPLETADO',
      finalizadoEn: new Date(),
      resultado: {
        indicadoresCalculados: job.tiposIndicadores.length,
        periodo: job.periodo,
      },
    })
  }

  async enviarAlertasStock(job: AlertaJob): Promise<void> {
    console.log('🚨 [MOCK JOB] Verificando alertas de stock...')

    this.trabajosEnEjecucion.set(job.id, {
      ...job,
      estado: 'PROCESANDO',
      iniciadoEn: new Date(),
    })

    // Simular verificación de productos
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const alertasEncontradas = Math.floor(Math.random() * 5)

    console.log(`📧 [MOCK JOB] Enviando ${alertasEncontradas} alertas de stock`)

    this.trabajosEnEjecucion.set(job.id, {
      ...this.trabajosEnEjecucion.get(job.id),
      estado: 'COMPLETADO',
      finalizadoEn: new Date(),
      resultado: {
        alertasEnviadas: alertasEncontradas,
        productosRevisados: 25,
      },
    })
  }

  // Método para consultar estado de trabajos
  obtenerEstadoTrabajo(jobId: string): any {
    return this.trabajosEnEjecucion.get(jobId)
  }

  // Método para listar trabajos activos
  listarTrabajosActivos(): any[] {
    return Array.from(this.trabajosEnEjecucion.values()).filter(
      (job) => job.estado === 'PROCESANDO'
    )
  }
}

// Implementación usando Bull Queue (Redis) para producción
export class BullJobService implements JobService {
  private queues: Map<string, any> = new Map()

  constructor(redisConfig?: { host: string; port: number; password?: string }) {
    // En implementación real:
    // const Queue = require('bull');
    // this.queues.set('importacion', new Queue('importacion csv', redisConfig));
    // this.queues.set('kpis', new Queue('calcular kpis', redisConfig));
    // this.queues.set('alertas', new Queue('alertas stock', redisConfig));

    console.log(
      '🔄 Job service configurado con Redis:',
      redisConfig?.host || 'localhost'
    )
  }

  async procesarImportacionCSV(job: ImportacionJob): Promise<void> {
    // En implementación real:
    // const queue = this.queues.get('importacion');
    // await queue.add('procesar-csv', job, {
    //   attempts: 3,
    //   backoff: 'exponential',
    //   removeOnComplete: 10,
    //   removeOnFail: 5
    // });

    console.log('🔄 [BULL] Trabajo de importación encolado:', job.id)
  }

  async calcularKPIsPeriodicos(job: KPIJob): Promise<void> {
    // const queue = this.queues.get('kpis');
    // await queue.add('calcular-kpis', job, {
    //   attempts: 2,
    //   delay: 5000 // Retrasar 5 segundos
    // });

    console.log('📊 [BULL] Trabajo de KPIs encolado:', job.periodo)
  }

  async enviarAlertasStock(job: AlertaJob): Promise<void> {
    // const queue = this.queues.get('alertas');
    // await queue.add('enviar-alertas', job, {
    //   repeat: { cron: '0 9 * * *' } // Todos los días a las 9 AM
    // });

    console.log('🚨 [BULL] Trabajo de alertas programado')
  }
}

// Factory para crear el servicio apropiado
export class JobServiceFactory {
  static create(type: 'mock' | 'bull' = 'mock', config?: any): JobService {
    switch (type) {
      case 'bull':
        return new BullJobService(config)
      case 'mock':
      default:
        return new MockJobService()
    }
  }
}
