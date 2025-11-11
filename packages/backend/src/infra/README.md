# 🔧 Infrastructure Layer - Adaptadores

> **Principio**: Esta capa contiene **adaptadores** que conectan el domain con tecnologías externas (bases de datos, APIs, servicios).

---

## 📖 Propósito

El **Infrastructure Layer** es responsable de:

- **Implementar** las interfaces (ports) definidas en domain
- **Conectar** con tecnologías externas (Prisma, APIs, Email, etc.)
- **Adaptarse** a cambios de infraestructura sin afectar el negocio
- **Gestionar** persistencia y comunicación externa

---

## 📁 Estructura

```
infra/
├── prisma/                  # 🗄️ Implementaciones de repositorios
│   ├── producto-repository.ts
│   ├── movimiento-inventario-repository.ts
│   ├── solicitud-repository.ts
│   ├── orden-compra-repository.ts
│   ├── kpi-repository.ts
│   └── usuario-repository.ts
│
└── adapters/                # 🔌 Servicios externos
    ├── email-service.ts         # Envío de correos
    ├── job-service.ts           # Jobs programados
    ├── notification-service.ts  # Notificaciones
    └── external-api-client.ts   # Integraciones
```

---

## 🏗️ Arquitectura

### Hexagonal Architecture (Ports & Adapters)

```
┌─────────────────────────────────────────────┐
│             Domain Layer                     │
│  (Entities, Business Logic, Interfaces)      │
│                                              │
│  interface ProductoRepository {             │
│    findAll(): Promise<Producto[]>           │  ← PORT (Interface)
│    findById(id): Promise<Producto>          │
│  }                                           │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│         Infrastructure Layer                 │
│                                              │
│  class PrismaProductoRepository             │  ← ADAPTER (Implementation)
│    implements ProductoRepository {          │
│                                              │
│    async findAll() {                        │
│      return this.prisma.producto.findMany() │
│    }                                         │
│  }                                           │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│          External Technology                 │
│         (PostgreSQL + Prisma)                │
└─────────────────────────────────────────────┘
```

**Ventajas**:

- ✅ **Cambiar base de datos** sin afectar domain
- ✅ **Testeable** con mocks fácilmente
- ✅ **Independencia** del domain

---

## 🗄️ Repositorios Prisma

### Estructura de un Repositorio

```typescript
// domain/repositories.ts (PORT)
export interface ProductoRepository {
  findAll(filtros?: Filtros): Promise<Producto[]>
  findById(id: string): Promise<Producto | null>
  create(data: CrearProducto): Promise<Producto>
  update(id: string, data: ActualizarProducto): Promise<Producto>
  delete(id: string): Promise<void>
}

// infra/prisma/producto-repository.ts (ADAPTER)
import { PrismaClient, Producto as PrismaProducto } from '@prisma/client'
import { ProductoRepository } from '../../domain/repositories.js'
import {
  Producto,
  CrearProducto,
  ActualizarProducto,
} from '../../domain/entities.js'

export class PrismaProductoRepository implements ProductoRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(filtros?: Filtros): Promise<Producto[]> {
    const productos = await this.prisma.producto.findMany({
      where: this.buildWhereClause(filtros),
      include: {
        proveedor: true,
        politicaReabastecimiento: true,
      },
    })

    return productos.map(this.toDomain)
  }

  async findById(id: string): Promise<Producto | null> {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        proveedor: true,
        politicaReabastecimiento: true,
      },
    })

    return producto ? this.toDomain(producto) : null
  }

  async create(data: CrearProducto): Promise<Producto> {
    const producto = await this.prisma.producto.create({
      data: this.toPrisma(data),
    })

    return this.toDomain(producto)
  }

  async update(id: string, data: ActualizarProducto): Promise<Producto> {
    const producto = await this.prisma.producto.update({
      where: { id },
      data: this.toPrisma(data),
    })

    return this.toDomain(producto)
  }

  async delete(id: string): Promise<void> {
    // Soft delete
    await this.prisma.producto.update({
      where: { id },
      data: { isActive: false },
    })
  }

  // Mappers (Domain ↔ Prisma)
  private toDomain(prisma: PrismaProducto): Producto {
    return {
      id: prisma.id,
      sku: prisma.sku,
      nombre: prisma.nombre,
      categoria: prisma.categoria,
      stockActual: prisma.stockActual,
      stockMin: prisma.stockMin,
      costo: prisma.costo.toNumber(),
      // ... más campos
    }
  }

  private toPrisma(domain: CrearProducto | ActualizarProducto) {
    return {
      sku: domain.sku,
      nombre: domain.nombre,
      categoria: domain.categoria,
      costo: domain.costo,
      // ... más campos
    }
  }

  private buildWhereClause(filtros?: Filtros) {
    if (!filtros) return {}

    return {
      categoria: filtros.categoria,
      isActive: filtros.isActive ?? true,
      stockActual: filtros.stockBajo
        ? { lte: this.prisma.producto.fields.stockMin }
        : undefined,
    }
  }
}
```

---

### Repositorios Implementados

#### 1. **producto-repository.ts**

**Propósito**: Persistencia de productos

**Métodos**:

```typescript
;-findAll(filtros) - // Listar con filtros
  findById(id) - // Obtener por ID
  findBySku(sku) - // Buscar por SKU
  create(data) - // Crear producto
  update(id, data) - // Actualizar producto
  delete id - // Soft delete
  findBajoStock() - // Productos con stock < stockMin
  findByProveedor(id) // Productos de un proveedor
```

---

#### 2. **movimiento-inventario-repository.ts**

**Propósito**: Historial de movimientos de inventario

**Métodos**:

```typescript
;-findAll(filtros) - // Listar movimientos
  findById(id) - // Obtener por ID
  create(data) - // Registrar movimiento
  findByProducto(id) - // Movimientos de un producto
  findByTipo(tipo) - // Filtrar por ENTRADA/SALIDA
  findByDateRange(desde, hasta) - // Rango de fechas
  getResumen() // Resumen consolidado
```

---

#### 3. **solicitud-repository.ts**

**Propósito**: Solicitudes de compra

**Métodos**:

```typescript
;-findAll(filtros) - // Listar solicitudes
  findById(id) - // Obtener por ID
  create(data) - // Crear solicitud
  update(id, data) - // Actualizar estado
  findPendientes() - // Solicitudes PENDIENTE
  findByNivelAprobacion(nivel) - // Por nivel
  aprobar(id, userId) - // Aprobar solicitud
  rechazar(id, userId) // Rechazar solicitud
```

---

#### 4. **orden-compra-repository.ts**

**Propósito**: Órdenes de compra

**Métodos**:

```typescript
;-findAll(filtros) - // Listar órdenes
  findById(id) - // Obtener por ID
  create(data) - // Crear orden
  update(id, data) - // Actualizar orden
  findBySolicitud(id) - // Orden de una solicitud
  findByProveedor(id) // Órdenes de un proveedor
```

---

#### 5. **kpi-repository.ts**

**Propósito**: Almacenamiento de KPIs

**Métodos**:

```typescript
;-saveRotacionInventario(data) - // Guardar rotación
  saveFillRate(data) - // Guardar fill rate
  saveTiempoCiclo(data) - // Guardar tiempo ciclo
  getHistorico(kpiType, periodo) - // Histórico de KPI
  getUltimoValor(kpiType) // Último valor calculado
```

---

#### 6. **usuario-repository.ts**

**Propósito**: Gestión de usuarios

**Métodos**:

```typescript
;-findAll() - // Listar usuarios
  findById(id) - // Obtener por ID
  findByEmail(email) - // Buscar por email
  create(data) - // Crear usuario
  update(id, data) - // Actualizar usuario
  delete id - // Eliminar usuario
  verifyPassword(email, password) // Verificar credenciales
```

---

## 🔌 Adapters (Servicios Externos)

### email-service.ts

**Propósito**: Envío de correos electrónicos

```typescript
export interface EmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>
  sendTemplate(to: string, template: string, data: any): Promise<void>
}

export class NodemailerEmailService implements EmailService {
  private transporter: Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: body,
    })
  }

  async sendTemplate(to: string, template: string, data: any): Promise<void> {
    const body = this.renderTemplate(template, data)
    await this.sendEmail(to, this.getSubject(template), body)
  }

  private renderTemplate(template: string, data: any): string {
    // Renderizar template con Handlebars o similar
    return templates[template](data)
  }

  private getSubject(template: string): string {
    const subjects = {
      'solicitud-aprobada': 'Solicitud Aprobada',
      'solicitud-rechazada': 'Solicitud Rechazada',
      'stock-bajo': 'Alerta: Stock Bajo',
    }
    return subjects[template] || 'Notificación'
  }
}
```

**Templates de email**:

- `solicitud-aprobada` → Notificar aprobación de solicitud
- `solicitud-rechazada` → Notificar rechazo
- `stock-bajo` → Alerta de stock bajo
- `orden-creada` → Nueva orden de compra

---

### job-service.ts

**Propósito**: Jobs programados (cron jobs)

```typescript
export interface JobService {
  scheduleJob(name: string, cron: string, handler: () => Promise<void>): void
  cancelJob(name: string): void
}

export class NodeCronJobService implements JobService {
  private jobs: Map<string, ScheduledTask> = new Map()

  scheduleJob(name: string, cron: string, handler: () => Promise<void>): void {
    const task = schedule.scheduleJob(cron, async () => {
      try {
        await handler()
      } catch (error) {
        logger.error({ error, jobName: name }, 'Job failed')
      }
    })

    this.jobs.set(name, task)
    logger.info({ name, cron }, 'Job scheduled')
  }

  cancelJob(name: string): void {
    const task = this.jobs.get(name)
    if (task) {
      task.cancel()
      this.jobs.delete(name)
      logger.info({ name }, 'Job cancelled')
    }
  }
}
```

**Jobs configurados**:

```typescript
// Verificar reabastecimiento cada 6 horas
jobService.scheduleJob(
  'verificar-reabastecimiento',
  '0 */6 * * *',
  async () => {
    const useCase = container.resolve('ReabastecimientoUseCases')
    await useCase.verificarReabastecimiento()
  }
)

// Calcular KPIs diariamente a las 2 AM
jobService.scheduleJob('calcular-kpis', '0 2 * * *', async () => {
  const useCase = container.resolve('KPIsUseCases')
  await useCase.calcularTodosLosKPIs()
})

// Limpiar logs antiguos cada semana
jobService.scheduleJob('limpiar-logs', '0 3 * * 0', async () => {
  await cleanupLogs(30) // 30 días
})
```

---

### notification-service.ts

**Propósito**: Notificaciones push/in-app

```typescript
export interface NotificationService {
  sendNotification(
    userId: string,
    message: string,
    type: NotificationType
  ): Promise<void>
  markAsRead(notificationId: string): Promise<void>
  getUnreadCount(userId: string): Promise<number>
}

export class InAppNotificationService implements NotificationService {
  constructor(private prisma: PrismaClient) {}

  async sendNotification(
    userId: string,
    message: string,
    type: NotificationType
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId,
        message,
        type,
        isRead: false,
      },
    })

    // Emitir evento WebSocket (si está configurado)
    this.emitWebSocketEvent(userId, message)
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.prisma.notification.count({
      where: { userId, isRead: false },
    })
  }

  private emitWebSocketEvent(userId: string, message: string): void {
    // WebSocket implementation (si se requiere)
  }
}
```

**Tipos de notificaciones**:

- `SOLICITUD_APROBADA`
- `SOLICITUD_RECHAZADA`
- `STOCK_BAJO`
- `ENVIO_ENTREGADO`
- `NUEVA_ORDEN`

---

### external-api-client.ts

**Propósito**: Integraciones con APIs externas

```typescript
export interface ExternalAPIClient {
  getProveedorInfo(proveedorId: string): Promise<ProveedorInfo>
  getTipoCambio(moneda: string): Promise<number>
  verificarDisponibilidad(productoSku: string): Promise<boolean>
}

export class HttpExternalAPIClient implements ExternalAPIClient {
  private axios: AxiosInstance

  constructor() {
    this.axios = axios.create({
      baseURL: process.env.EXTERNAL_API_URL,
      timeout: 5000,
      headers: {
        Authorization: `Bearer ${process.env.EXTERNAL_API_KEY}`,
      },
    })
  }

  async getProveedorInfo(proveedorId: string): Promise<ProveedorInfo> {
    const response = await this.axios.get(`/proveedores/${proveedorId}`)
    return response.data
  }

  async getTipoCambio(moneda: string): Promise<number> {
    const response = await this.axios.get(`/tipo-cambio/${moneda}`)
    return response.data.valor
  }

  async verificarDisponibilidad(productoSku: string): Promise<boolean> {
    const response = await this.axios.get(`/disponibilidad/${productoSku}`)
    return response.data.disponible
  }
}
```

---

## 🔄 Mappers (Domain ↔ Persistence)

**Principio**: Separar modelos del domain de modelos de persistencia

```typescript
// Mapper genérico
interface Mapper<DomainEntity, PersistenceEntity> {
  toDomain(persistence: PersistenceEntity): DomainEntity
  toPersistence(domain: DomainEntity): PersistenceEntity
}

// Ejemplo: ProductoMapper
class ProductoMapper implements Mapper<Producto, PrismaProducto> {
  toDomain(prisma: PrismaProducto): Producto {
    return {
      id: prisma.id,
      sku: prisma.sku,
      nombre: prisma.nombre,
      costo: prisma.costo.toNumber(), // Decimal a number
      stockActual: prisma.stockActual,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    }
  }

  toPersistence(domain: Producto): PrismaProducto {
    return {
      id: domain.id,
      sku: domain.sku,
      nombre: domain.nombre,
      costo: new Decimal(domain.costo), // number a Decimal
      stockActual: domain.stockActual,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
```

**Ventajas**:

- ✅ Domain no depende de Prisma
- ✅ Fácil cambiar ORM
- ✅ Conversiones centralizadas

---

## 🧪 Testing de Repositorios

```typescript
describe('PrismaProductoRepository', () => {
  let prisma: PrismaClient
  let repo: ProductoRepository

  beforeAll(async () => {
    prisma = new PrismaClient()
    repo = new PrismaProductoRepository(prisma)
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('findById', () => {
    it('should return producto when exists', async () => {
      // Given
      const producto = await prisma.producto.create({
        data: { sku: 'TEST-001', nombre: 'Test', ... },
      })

      // When
      const result = await repo.findById(producto.id)

      // Then
      expect(result).toBeDefined()
      expect(result?.sku).toBe('TEST-001')
    })

    it('should return null when not exists', async () => {
      const result = await repo.findById('non-existent-id')
      expect(result).toBeNull()
    })
  })
})
```

---

## 🎓 Principios Aplicados

### 1. **Dependency Inversion Principle (DIP)**

```
Domain define INTERFACE (Port)
         ↑
Infrastructure implementa INTERFACE (Adapter)
```

✅ Domain no depende de infraestructura

---

### 2. **Single Responsibility Principle (SRP)**

- ✅ Un repositorio = una entidad
- ✅ Un adapter = un servicio externo

---

### 3. **Open/Closed Principle (OCP)**

- ✅ Fácil agregar nuevos adapters sin modificar domain
- ✅ Cambiar de Prisma a TypeORM sin afectar use cases

---

## 📚 Referencias

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Ports and Adapters](https://jmgarridopaz.github.io/content/hexagonalarchitecture.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

---

**Mantenedor**: @Marmo03  
**Última actualización**: 10 de Noviembre 2025
