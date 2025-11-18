# 🎯 Domain Layer - Núcleo del Negocio

> **Principio**: Esta capa contiene la lógica de negocio pura, **sin dependencias de frameworks o tecnologías externas**.

---

## 📖 Propósito

El **Domain Layer** es el corazón de la Arquitectura Hexagonal. Contiene:

- **Entidades**: Modelos de dominio con comportamiento
- **Reglas de negocio**: Lógica que define cómo funciona la cervecería
- **Interfaces (Ports)**: Contratos que la infraestructura debe implementar
- **Patrones de diseño**: Estrategias, cadenas de responsabilidad, eventos

---

## 📁 Estructura

```
domain/
├── entities.ts               # ✅ Entidades de dominio
├── repositories.ts           # ✅ Interfaces (Ports)
├── strategies/               # 🎯 Strategy Pattern
│   └── reabastecimiento.ts       # Algoritmos de reorden
├── approvals/                # ⛓️ Chain of Responsibility
│   └── chain-of-responsibility.ts # Flujo de aprobaciones
└── events/                   # 👁️ Observer Pattern
    └── event-system.ts           # Sistema de eventos
```

---

## 🧱 Entidades de Dominio

**Archivo**: `entities.ts`

Las entidades representan los conceptos clave del negocio:

```typescript
// Ejemplos de entidades
interface Producto {
  id: string
  sku: string
  nombre: string
  categoria: string
  stockActual: number
  stockMin: number
  necesitaReabastecimiento(): boolean // ← Comportamiento
}

interface MovimientoInventario {
  id: string
  tipo: 'ENTRADA' | 'SALIDA'
  cantidad: number
  afectarStock(producto: Producto): void // ← Comportamiento
}
```

**Características**:

- ✅ Sin dependencias de frameworks
- ✅ Contienen comportamiento (no solo datos)
- ✅ Expresan el lenguaje del negocio (Ubiquitous Language)

---

## 🔌 Repositorios (Ports)

**Archivo**: `repositories.ts`

Define **interfaces** (contratos) que la infraestructura debe implementar:

```typescript
// Port (Interface)
interface ProductoRepository {
  findAll(): Promise<Producto[]>
  findById(id: string): Promise<Producto | null>
  create(data: CrearProducto): Promise<Producto>
  update(id: string, data: ActualizarProducto): Promise<Producto>
  delete(id: string): Promise<void>
}

// Adapter (Implementación real en infra/prisma/)
class PrismaProductoRepository implements ProductoRepository {
  // ... implementación con Prisma
}
```

**Beneficios**:

- ✅ **Inversión de dependencias**: Domain no depende de infraestructura
- ✅ **Testeable**: Fácil crear mocks
- ✅ **Intercambiable**: Cambiar de Prisma a TypeORM sin afectar domain

---

## 🎯 Strategy Pattern

**Archivo**: `strategies/reabastecimiento.ts`

Algoritmos intercambiables de reabastecimiento de inventario.

### Estrategias Implementadas

#### 1. **EOQ (Economic Order Quantity)**

```typescript
class EOQStrategy implements EstrategiaReabastecimiento {
  calcularCantidad(producto: Producto): number {
    const D = producto.demandaAnual
    const S = producto.costoOrden
    const H = producto.costoAlmacenamiento
    return Math.sqrt((2 * D * S) / H)
  }
}
```

**Cuándo usar**: Demanda constante, costo de orden conocido

---

#### 2. **Manual Strategy**

```typescript
class ManualStrategy implements EstrategiaReabastecimiento {
  calcularCantidad(producto: Producto): number {
    return producto.cantidadReordenManual || 0
  }
}
```

**Cuándo usar**: Productos especiales, decisión humana

---

#### 3. **Just-in-Time (JIT)** [Futuro]

```typescript
class JustInTimeStrategy implements EstrategiaReabastecimiento {
  calcularCantidad(producto: Producto): number {
    // Reorden solo cuando se necesita, minimizando stock
    return producto.demandaProximos7Dias
  }
}
```

**Cuándo usar**: Productos perecederos, alta rotación

---

#### 4. **Fixed Quantity** [Futuro]

```typescript
class FixedQuantityStrategy implements EstrategiaReabastecimiento {
  calcularCantidad(producto: Producto): number {
    return producto.cantidadFija || 100
  }
}
```

**Cuándo usar**: Política de compra en lotes fijos

---

### Uso

```typescript
// Seleccionar estrategia según configuración
const estrategia = getEstrategia(producto.politicaAbastecimiento)
const cantidadReorden = estrategia.calcularCantidad(producto)

// Crear solicitud automáticamente
await solicitudService.crearAutomatica(producto, cantidadReorden)
```

**Ventajas**:

- ✅ Fácil agregar nuevas estrategias
- ✅ Sin modificar código existente (Open/Closed Principle)
- ✅ Configuración por producto

---

## ⛓️ Chain of Responsibility

**Archivo**: `approvals/chain-of-responsibility.ts`

Flujo de aprobaciones multinivel para solicitudes de compra.

### Cadena de Aprobadores

```
Solicitud Creada
       ↓
┌──────────────────────┐
│ Aprobador Operativo  │  Nivel 1 (hasta $5,000)
│ (Jefe de Almacén)    │
└──────────────────────┘
       ↓ [Aprueba]
┌──────────────────────┐
│ Aprobador Gerencial  │  Nivel 2 (hasta $50,000)
│ (Gerente de Compras) │
└──────────────────────┘
       ↓ [Aprueba]
┌──────────────────────┐
│ Aprobador Ejecutivo  │  Nivel 3 (sin límite)
│ (Director General)   │
└──────────────────────┘
       ↓ [Aprueba]
    APROBADA ✅

[Rechaza en cualquier nivel] → RECHAZADA ❌
```

### Implementación

```typescript
abstract class AprobadorBase {
  protected siguiente?: AprobadorBase

  setNext(aprobador: AprobadorBase): AprobadorBase {
    this.siguiente = aprobador
    return aprobador
  }

  async aprobar(solicitud: Solicitud): Promise<void> {
    if (this.puedeAprobar(solicitud)) {
      await this.procesarAprobacion(solicitud)
      if (this.siguiente && !solicitud.aprobada) {
        await this.siguiente.aprobar(solicitud)
      }
    }
  }

  abstract puedeAprobar(solicitud: Solicitud): boolean
  abstract procesarAprobacion(solicitud: Solicitud): Promise<void>
}
```

### Uso

```typescript
// Configurar cadena
const operativo = new AprobadorOperativo()
const gerencial = new AprobadorGerencial()
const ejecutivo = new AprobadorEjecutivo()

operativo.setNext(gerencial).setNext(ejecutivo)

// Procesar solicitud
await operativo.aprobar(solicitud)
```

**Ventajas**:

- ✅ Desacopla remitente de receptores
- ✅ Fácil modificar niveles de aprobación
- ✅ Responsabilidad clara por nivel

---

## 👁️ Observer Pattern

**Archivo**: `events/event-system.ts`

Sistema de eventos para actualización automática de KPIs.

### Eventos del Sistema

```typescript
// Eventos disponibles
enum EventType {
  MOVIMIENTO_INVENTARIO_CREATED = 'movimiento_inventario_created',
  SOLICITUD_APROBADA = 'solicitud_aprobada',
  ENVIO_ENTREGADO = 'envio_entregado',
  STOCK_BAJO_DETECTADO = 'stock_bajo_detectado',
}
```

### Observers (Escuchas)

```typescript
// Observer para rotación de inventario
class RotacionInventarioObserver implements Observer {
  async update(event: DomainEvent): Promise<void> {
    if (event.type === EventType.MOVIMIENTO_INVENTARIO_CREATED) {
      await this.recalcularRotacion(event.data.productoId)
    }
  }
}

// Observer para fill rate
class FillRateObserver implements Observer {
  async update(event: DomainEvent): Promise<void> {
    if (event.type === EventType.ENVIO_ENTREGADO) {
      await this.actualizarFillRate()
    }
  }
}
```

### Event Bus

```typescript
class EventBus {
  private observers: Map<EventType, Observer[]> = new Map()

  subscribe(eventType: EventType, observer: Observer): void {
    const observers = this.observers.get(eventType) || []
    observers.push(observer)
    this.observers.set(eventType, observers)
  }

  async publish(event: DomainEvent): Promise<void> {
    const observers = this.observers.get(event.type) || []
    await Promise.all(observers.map((o) => o.update(event)))
  }
}
```

### Uso

```typescript
// Registrar observers
eventBus.subscribe(
  EventType.MOVIMIENTO_INVENTARIO_CREATED,
  new RotacionInventarioObserver()
)

// Emitir evento
await eventBus.publish({
  type: EventType.MOVIMIENTO_INVENTARIO_CREATED,
  data: { productoId: '123', tipo: 'ENTRADA', cantidad: 100 },
  timestamp: new Date(),
})

// Observers se ejecutan automáticamente
```

**Ventajas**:

- ✅ Desacoplamiento total (emisor no conoce receptores)
- ✅ KPIs actualizados en tiempo real
- ✅ Fácil agregar nuevos observers sin modificar código existente

---

## 🎓 Principios Aplicados

### 1. **Domain-Driven Design (DDD)**

- ✅ **Ubiquitous Language**: Código habla el lenguaje del negocio
- ✅ **Bounded Context**: Contexto claro de inventario/logística
- ✅ **Entities**: Objetos con identidad y comportamiento

### 2. **SOLID Principles**

- ✅ **SRP**: Cada clase tiene una responsabilidad
- ✅ **OCP**: Abierto a extensión, cerrado a modificación (Strategies)
- ✅ **DIP**: Domain depende de abstracciones, no de implementaciones

### 3. **Clean Architecture**

- ✅ **Independence**: Domain no depende de nada externo
- ✅ **Testability**: Fácil crear unit tests sin mocks complejos
- ✅ **Flexibility**: Cambiar infraestructura sin afectar lógica

---

## 🧪 Testing del Domain

```typescript
// Test de entidad (sin dependencias)
describe('Producto', () => {
  it('should detect when needs restock', () => {
    const producto = new Producto({
      stockActual: 5,
      stockMin: 10,
    })

    expect(producto.necesitaReabastecimiento()).toBe(true)
  })
})

// Test de estrategia
describe('EOQStrategy', () => {
  it('should calculate EOQ correctly', () => {
    const strategy = new EOQStrategy()
    const producto = {
      demandaAnual: 1000,
      costoOrden: 100,
      costoAlmacenamiento: 5,
    }

    const cantidad = strategy.calcularCantidad(producto)
    expect(cantidad).toBe(200)
  })
})

// Test de cadena de responsabilidad
describe('ApprovalChain', () => {
  it('should approve low-value request at level 1', async () => {
    const solicitud = { monto: 3000, nivel: 1 }
    await operativo.aprobar(solicitud)

    expect(solicitud.aprobada).toBe(true)
    expect(solicitud.nivel).toBe(1)
  })
})
```

---

## 📚 Referencias

- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Design Patterns - Gang of Four](https://refactoring.guru/design-patterns)

---

**Mantenedor**: @Marmo03  
**Última actualización**: 10 de Noviembre 2025
