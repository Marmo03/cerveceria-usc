// Contenedor de Dependencias e Inyección
// Configuración centralizada de todos los casos de uso y repositorios

import { PrismaClient } from '@prisma/client'
import { PrismaMovimientoInventarioRepository } from '../infra/prisma/movimiento-inventario-repository.js'
import {
  RegistrarSalidaInventarioUseCase,
  RegistrarEntradaInventarioUseCase,
} from '../services/inventario-use-cases.js'
import { EventSystemFactory } from '../domain/events/event-system.js'

// Interfaz del contenedor
export interface DIContainer {
  // Repositorios
  movimientoInventarioRepo: PrismaMovimientoInventarioRepository

  // Casos de uso
  registrarSalidaInventarioUC: RegistrarSalidaInventarioUseCase
  registrarEntradaInventarioUC: RegistrarEntradaInventarioUseCase

  // Sistema de eventos
  eventPublisher: any
}

export class DependencyContainer implements DIContainer {
  private _prisma: PrismaClient

  // Repositorios
  public movimientoInventarioRepo: PrismaMovimientoInventarioRepository

  // Casos de uso
  public registrarSalidaInventarioUC: RegistrarSalidaInventarioUseCase
  public registrarEntradaInventarioUC: RegistrarEntradaInventarioUseCase

  // Sistema de eventos
  public eventPublisher: any

  constructor() {
    // Inicializar Prisma
    this._prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    })

    // Configurar sistema de eventos
    this.eventPublisher = EventSystemFactory.getInstance()

    // Inicializar repositorios
    this.movimientoInventarioRepo = new PrismaMovimientoInventarioRepository(
      this._prisma
    )

    // TODO: Inicializar más repositorios cuando estén listos
    // this.productoRepo = new PrismaProductoRepository(this._prisma);
    // this.solicitudRepo = new PrismaSolicitudRepository(this._prisma);

    // Inicializar casos de uso con dependencias
    this.registrarSalidaInventarioUC = new RegistrarSalidaInventarioUseCase(
      null as any, // TODO: productoRepo cuando esté listo
      this.movimientoInventarioRepo,
      this.eventPublisher
    )

    this.registrarEntradaInventarioUC = new RegistrarEntradaInventarioUseCase(
      null as any, // TODO: productoRepo cuando esté listo
      this.movimientoInventarioRepo,
      this.eventPublisher
    )

    // Configurar observers del sistema de eventos
    // EventSystemFactory.setupObservers(this.eventPublisher, {
    //   kpiService: null, // TODO: implementar cuando esté listo
    //   alertService: null,
    //   productoService: null
    // });
  }

  // Método para cerrar conexiones
  async dispose(): Promise<void> {
    await this._prisma.$disconnect()
  }

  // Getter para acceso a Prisma (para casos especiales)
  get prisma(): PrismaClient {
    return this._prisma
  }
}

// Singleton del contenedor
let containerInstance: DependencyContainer | null = null

export function getDIContainer(): DependencyContainer {
  if (!containerInstance) {
    containerInstance = new DependencyContainer()
  }
  return containerInstance
}

export async function disposeDIContainer(): Promise<void> {
  if (containerInstance) {
    await containerInstance.dispose()
    containerInstance = null
  }
}
