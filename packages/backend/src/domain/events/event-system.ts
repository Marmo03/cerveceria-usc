// Observer Pattern - Sistema de Eventos y KPIs
// Permite notificar automáticamente cambios en inventario y solicitudes para actualizar indicadores

import {
  DomainEvent,
  InventarioActualizadoEvent,
  SolicitudActualizadaEvent,
  TipoIndicador,
} from '../entities.js'

// Subject (Observable)
export interface EventPublisher {
  subscribe(observer: EventObserver): void
  unsubscribe(observer: EventObserver): void
  notify(event: DomainEvent): Promise<void>
}

// Observer interface
export interface EventObserver {
  getEventTypes(): string[]
  handle(event: DomainEvent): Promise<void>
}

// Implementación concreta del Publisher
export class DomainEventPublisher implements EventPublisher {
  private observers: Map<string, EventObserver[]>

  constructor() {
    this.observers = new Map()
  }

  subscribe(observer: EventObserver): void {
    const eventTypes = observer.getEventTypes()

    eventTypes.forEach((eventType) => {
      if (!this.observers.has(eventType)) {
        this.observers.set(eventType, [])
      }

      const observersForType = this.observers.get(eventType)!
      if (!observersForType.includes(observer)) {
        observersForType.push(observer)
      }
    })
  }

  unsubscribe(observer: EventObserver): void {
    const eventTypes = observer.getEventTypes()

    eventTypes.forEach((eventType) => {
      const observersForType = this.observers.get(eventType)
      if (observersForType) {
        const index = observersForType.indexOf(observer)
        if (index > -1) {
          observersForType.splice(index, 1)
        }
      }
    })
  }

  async notify(event: DomainEvent): Promise<void> {
    const observersForType = this.observers.get(event.eventType) || []

    // Procesar observadores en paralelo
    const promises = observersForType.map((observer) =>
      observer.handle(event).catch((error) => {
        console.error(`Error en observer ${observer.constructor.name}:`, error)
        // No re-lanzar el error para no afectar otros observers
      })
    )

    await Promise.all(promises)
  }

  // Método utilitario para publicar eventos
  async publish(event: DomainEvent): Promise<void> {
    await this.notify(event)
  }
}

// Observer concreto: Actualizador de KPIs de Inventario
export class InventarioKPIObserver implements EventObserver {
  constructor(
    private kpiService: any // Se inyectará el servicio de KPIs
  ) {}

  getEventTypes(): string[] {
    return ['InventarioActualizado']
  }

  async handle(event: DomainEvent): Promise<void> {
    if (event.eventType !== 'InventarioActualizado') return

    const inventarioEvent = event as InventarioActualizadoEvent
    const { productoId, stockNuevo, tipoMovimiento } = inventarioEvent.eventData

    try {
      // Actualizar indicadores relacionados con inventario
      await this.actualizarRotacionInventario(productoId)
      await this.actualizarNivelServicio(productoId, stockNuevo)
      await this.actualizarCostoInventario(productoId, stockNuevo)

      console.log(
        `KPIs de inventario actualizados para producto: ${productoId}`
      )
    } catch (error) {
      console.error('Error actualizando KPIs de inventario:', error)
      throw error
    }
  }

  private async actualizarRotacionInventario(
    productoId: string
  ): Promise<void> {
    // Lógica para calcular rotación de inventario
    // Rotación = Costo de mercancías vendidas / Inventario promedio
    if (this.kpiService?.actualizarIndicador) {
      await this.kpiService.actualizarIndicador({
        tipo: TipoIndicador.ROTACION_INVENTARIO,
        productoId,
        periodo: this.obtenerPeriodoActual(),
      })
    }
  }

  private async actualizarNivelServicio(
    productoId: string,
    stockActual: number
  ): Promise<void> {
    // Lógica para calcular nivel de servicio
    // Nivel de servicio = (Pedidos completos / Total pedidos) * 100
    if (this.kpiService?.actualizarIndicador) {
      await this.kpiService.actualizarIndicador({
        tipo: TipoIndicador.NIVEL_SERVICIO,
        productoId,
        periodo: this.obtenerPeriodoActual(),
        stockActual,
      })
    }
  }

  private async actualizarCostoInventario(
    productoId: string,
    stockActual: number
  ): Promise<void> {
    if (this.kpiService?.actualizarIndicador) {
      await this.kpiService.actualizarIndicador({
        tipo: TipoIndicador.COSTO_INVENTARIO,
        productoId,
        periodo: this.obtenerPeriodoActual(),
        stockActual,
      })
    }
  }

  private obtenerPeriodoActual(): string {
    const fecha = new Date()
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
  }
}

// Observer concreto: Gestor de Alertas de Stock
export class AlertasStockObserver implements EventObserver {
  constructor(
    private alertService: any, // Servicio de alertas/notificaciones
    private productoService: any // Servicio de productos
  ) {}

  getEventTypes(): string[] {
    return ['InventarioActualizado']
  }

  async handle(event: DomainEvent): Promise<void> {
    if (event.eventType !== 'InventarioActualizado') return

    const inventarioEvent = event as InventarioActualizadoEvent
    const { productoId, stockNuevo } = inventarioEvent.eventData

    try {
      // Obtener información del producto para verificar stock mínimo
      const producto = await this.productoService?.obtenerPorId(productoId)

      if (producto && stockNuevo <= producto.stockMin) {
        await this.alertService?.enviarAlerta({
          tipo: 'STOCK_BAJO',
          productoId,
          stockActual: stockNuevo,
          stockMinimo: producto.stockMin,
          mensaje: `Stock bajo para ${producto.nombre} (${producto.sku})`,
        })
      }

      // Verificar stock crítico (50% del mínimo)
      if (producto && stockNuevo <= producto.stockMin * 0.5) {
        await this.alertService?.enviarAlerta({
          tipo: 'STOCK_CRITICO',
          productoId,
          stockActual: stockNuevo,
          prioridad: 'ALTA',
          mensaje: `Stock crítico para ${producto.nombre} (${producto.sku})`,
        })
      }
    } catch (error) {
      console.error('Error procesando alertas de stock:', error)
      throw error
    }
  }
}

// Observer concreto: KPIs de Solicitudes
export class SolicitudesKPIObserver implements EventObserver {
  constructor(private kpiService: any) {}

  getEventTypes(): string[] {
    return ['SolicitudActualizada']
  }

  async handle(event: DomainEvent): Promise<void> {
    if (event.eventType !== 'SolicitudActualizada') return

    const solicitudEvent = event as SolicitudActualizadaEvent
    const { solicitudId, estadoNuevo } = solicitudEvent.eventData

    try {
      // Actualizar KPIs según el nuevo estado
      await this.actualizarTiempoCiclo(solicitudId, estadoNuevo)
      await this.actualizarFillRate(solicitudId, estadoNuevo)

      console.log(`KPIs de solicitudes actualizados para: ${solicitudId}`)
    } catch (error) {
      console.error('Error actualizando KPIs de solicitudes:', error)
      throw error
    }
  }

  private async actualizarTiempoCiclo(
    solicitudId: string,
    estado: string
  ): Promise<void> {
    if (estado === 'APROBADA' || estado === 'RECHAZADA') {
      if (this.kpiService?.actualizarIndicador) {
        await this.kpiService.actualizarIndicador({
          tipo: TipoIndicador.TIEMPO_CICLO,
          solicitudId,
          periodo: this.obtenerPeriodoActual(),
        })
      }
    }
  }

  private async actualizarFillRate(
    solicitudId: string,
    estado: string
  ): Promise<void> {
    if (estado === 'APROBADA') {
      if (this.kpiService?.actualizarIndicador) {
        await this.kpiService.actualizarIndicador({
          tipo: TipoIndicador.FILL_RATE,
          solicitudId,
          periodo: this.obtenerPeriodoActual(),
        })
      }
    }
  }

  private obtenerPeriodoActual(): string {
    const fecha = new Date()
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
  }
}

// Factory y configuración del sistema de eventos
export class EventSystemFactory {
  private static instance: DomainEventPublisher

  static getInstance(): DomainEventPublisher {
    if (!this.instance) {
      this.instance = new DomainEventPublisher()
    }
    return this.instance
  }

  static setupObservers(
    publisher: DomainEventPublisher,
    services: {
      kpiService?: any
      alertService?: any
      productoService?: any
    }
  ): void {
    // Registrar observers
    if (services.kpiService) {
      publisher.subscribe(new InventarioKPIObserver(services.kpiService))
      publisher.subscribe(new SolicitudesKPIObserver(services.kpiService))
    }

    if (services.alertService && services.productoService) {
      publisher.subscribe(
        new AlertasStockObserver(
          services.alertService,
          services.productoService
        )
      )
    }
  }
}

// Utilidades para crear eventos
export class EventFactory {
  static crearEventoInventarioActualizado(
    productoId: string,
    stockAnterior: number,
    stockNuevo: number,
    tipoMovimiento: string,
    cantidad: number
  ): InventarioActualizadoEvent {
    return {
      eventId: this.generarId(),
      eventType: 'InventarioActualizado',
      aggregateId: productoId,
      eventData: {
        productoId,
        stockAnterior,
        stockNuevo,
        tipoMovimiento: tipoMovimiento as any,
        cantidad,
      },
      timestamp: new Date(),
    }
  }

  static crearEventoSolicitudActualizada(
    solicitudId: string,
    estadoAnterior: string,
    estadoNuevo: string,
    aprobadorId?: string
  ): SolicitudActualizadaEvent {
    return {
      eventId: this.generarId(),
      eventType: 'SolicitudActualizada',
      aggregateId: solicitudId,
      eventData: {
        solicitudId,
        estadoAnterior: estadoAnterior as any,
        estadoNuevo: estadoNuevo as any,
        aprobadorId,
      },
      timestamp: new Date(),
    }
  }

  private static generarId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }
}
