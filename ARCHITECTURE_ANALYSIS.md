# 🏗️ Análisis de Arquitectura - Cervecería USC

> **Fecha**: 10 de Noviembre 2025  
> **Propósito**: Documentar patrones de diseño, estructura y plan de refactorización para nuevos colaboradores

---

## 📋 Tabla de Contenidos

1. [Patrones de Diseño Identificados](#patrones-de-diseño)
2. [Estructura Actual del Proyecto](#estructura-actual)
3. [Archivos Duplicados Identificados](#archivos-duplicados)
4. [Problemas y Áreas de Mejora](#problemas-detectados)
5. [Plan de Refactorización](#plan-de-refactorización)
6. [Guía para Nuevos Colaboradores](#guía-para-colaboradores)

---

## 🎨 Patrones de Diseño Identificados

### 1. **Arquitectura Hexagonal (Ports & Adapters)**

**Ubicación**: `packages/backend/src/`

```
domain/          ← Núcleo del negocio (sin dependencias externas)
  ├── entities.ts          # Entidades de dominio
  ├── repositories.ts      # Interfaces (ports)
  ├── strategies/          # Strategy Pattern
  └── approvals/           # Chain of Responsibility

infra/           ← Adaptadores de infraestructura
  ├── prisma/              # Implementación de repositorios
  └── adapters/            # Servicios externos

services/        ← Casos de uso (Application Layer)
  ├── inventario-use-cases.ts
  ├── solicitudes-use-cases.ts
  └── ...

controllers/     ← Presentation Layer (HTTP)
  ├── auth.ts
  ├── products.ts
  └── ...
```

**Beneficios**:

- ✅ Independencia de frameworks
- ✅ Testeable (domain sin dependencias)
- ✅ Cambio de base de datos sin afectar lógica

---

### 2. **Strategy Pattern** 🎯

**Ubicación**: `packages/backend/src/domain/strategies/reabastecimiento.ts`

**Propósito**: Algoritmos intercambiables de reabastecimiento de inventario

```typescript
// Estrategias implementadas:
-EOQStrategy - // Economic Order Quantity
  ManualStrategy - // Reorden manual
  JustInTimeStrategy - // Just-in-Time
  FixedQuantityStrategy; // Cantidad fija
```

**Uso**:

```typescript
// Seleccionar estrategia según configuración
const estrategia = getEstrategia(producto.politicaAbastecimiento);
const cantidadReorden = estrategia.calcularCantidad(producto);
```

**Beneficios**:

- ✅ Fácil agregar nuevas estrategias
- ✅ Sin modificar código existente
- ✅ Configuración por producto

---

### 3. **Chain of Responsibility** ⛓️

**Ubicación**: `packages/backend/src/domain/approvals/chain-of-responsibility.ts`

**Propósito**: Flujo de aprobaciones multinivel para solicitudes de compra

```typescript
// Cadena de aprobadores:
AprobadorOperativo (nivel 1)
    ↓
AprobadorGerencial (nivel 2)
    ↓
AprobadorEjecutivo (nivel 3)
```

**Flujo**:

1. Solicitud creada → asignada a nivel 1
2. Nivel 1 aprueba → pasa a nivel 2
3. Nivel 2 aprueba → pasa a nivel 3
4. Nivel 3 aprueba → APROBADA
5. Cualquier nivel rechaza → RECHAZADA

**Beneficios**:

- ✅ Desacopla remitente de receptores
- ✅ Fácil modificar niveles
- ✅ Responsabilidad clara

---

### 4. **Repository Pattern** 📚

**Ubicación**:

- Interfaces: `packages/backend/src/domain/repositories.ts`
- Implementaciones: `packages/backend/src/infra/prisma/`

**Propósito**: Abstracción de acceso a datos

```typescript
// Interface (Port)
interface ProductoRepository {
  findAll(): Promise<Producto[]>;
  findById(id: string): Promise<Producto | null>;
  create(data: CrearProducto): Promise<Producto>;
  update(id: string, data: ActualizarProducto): Promise<Producto>;
}

// Implementación (Adapter)
class PrismaProductoRepository implements ProductoRepository {
  constructor(private prisma: PrismaClient) {}
  // ... implementación con Prisma
}
```

**Beneficios**:

- ✅ Cambiar ORM sin afectar casos de uso
- ✅ Fácil mockear para tests
- ✅ Lógica de negocio independiente

---

### 5. **Observer Pattern** 👁️

**Ubicación**: `packages/backend/src/domain/events/event-system.ts`

**Propósito**: Sistema de eventos para actualización de KPIs

```typescript
// Eventos del sistema:
-MovimientoInventarioCreated -
  SolicitudAprobada -
  EnvioEntregado -
  // Observers:
  RotacionInventarioObserver -
  FillRateObserver -
  TiempoCicloObserver;
```

**Flujo**:

```
Acción (ej: crear movimiento)
    ↓
Emitir evento
    ↓
Observers notificados
    ↓
Actualizar KPIs automáticamente
```

**Beneficios**:

- ✅ Desacoplamiento total
- ✅ KPIs actualizados en tiempo real
- ✅ Fácil agregar nuevos observers

---

### 6. **Dependency Injection Container** 💉

**Ubicación**: `packages/backend/src/config/container.ts`

**Propósito**: Gestión centralizada de dependencias

```typescript
// Registro de dependencias
container.register("ProductoRepository", PrismaProductoRepository);
container.register("InventarioUseCases", InventarioUseCases);

// Resolución automática
const inventario = container.resolve("InventarioUseCases");
```

**Beneficios**:

- ✅ Inversión de control
- ✅ Testing más fácil
- ✅ Gestión centralizada

---

## 📁 Estructura Actual del Proyecto

```
cerveceria-usc/
├── packages/
│   ├── backend/                    # API Fastify + TypeScript
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Esquema PostgreSQL
│   │   │   ├── seed.ts            # Datos de prueba
│   │   │   └── migrations/        # Historial de migraciones
│   │   │
│   │   └── src/
│   │       ├── server.ts          # Punto de entrada
│   │       │
│   │       ├── config/            # Configuración
│   │       │   └── container.ts   # DI Container
│   │       │
│   │       ├── domain/            # 🎯 CORE - Lógica de negocio
│   │       │   ├── entities.ts           # Entidades puras
│   │       │   ├── repositories.ts       # Interfaces (ports)
│   │       │   ├── strategies/           # Strategy Pattern
│   │       │   ├── approvals/            # Chain of Responsibility
│   │       │   └── events/               # Observer Pattern
│   │       │
│   │       ├── services/          # Casos de uso (Application Layer)
│   │       │   ├── inventario-use-cases.ts
│   │       │   ├── solicitudes-use-cases.ts
│   │       │   ├── reabastecimiento-use-cases.ts
│   │       │   ├── kpis-use-cases.ts
│   │       │   ├── logistics.ts
│   │       │   └── importaciones-use-cases.ts
│   │       │
│   │       ├── infra/             # Adaptadores de infraestructura
│   │       │   ├── prisma/               # Repository implementations
│   │       │   │   ├── producto-repository.ts
│   │       │   │   └── movimiento-inventario-repository.ts
│   │       │   └── adapters/             # Servicios externos
│   │       │       ├── email-service.ts
│   │       │       └── job-service.ts
│   │       │
│   │       ├── controllers/       # ⚠️ DUPLICADOS DETECTADOS
│   │       │   ├── auth.ts
│   │       │   ├── products.ts           # ❌ DUPLICADO
│   │       │   ├── productos.ts          # ✅ MÁS COMPLETO
│   │       │   ├── inventory.ts          # ❌ STUB
│   │       │   ├── inventario.ts         # ✅ COMPLETO
│   │       │   ├── inventario-v2.ts      # ❌ DUPLICADO
│   │       │   ├── logistics.ts
│   │       │   ├── sales.ts
│   │       │   └── reports.ts
│   │       │
│   │       ├── middleware/        # Guards y seguridad
│   │       │   ├── auth.ts               # Verificación JWT
│   │       │   └── security.ts           # Rate limiting, etc.
│   │       │
│   │       ├── schemas/           # Validación Zod
│   │       │   └── logistics.ts
│   │       │
│   │       ├── types/             # Tipos TypeScript
│   │       │   ├── auth.ts
│   │       │   └── api.ts
│   │       │
│   │       ├── repositories/      # ⚠️ DUPLICADO con infra/prisma
│   │       │   └── logistics.ts
│   │       │
│   │       └── tests/             # Tests unitarios
│   │           └── unit/
│   │               └── inventario-use-cases.test.ts
│   │
│   └── frontend/                   # Vue.js 3 + TypeScript
│       ├── src/
│       │   ├── main.ts            # Punto de entrada
│       │   ├── App.vue            # Componente raíz
│       │   │
│       │   ├── pages/             # Páginas (routes)
│       │   │   ├── LoginPage.vue
│       │   │   ├── DashboardPage.vue
│       │   │   ├── ProductosPage.vue
│       │   │   ├── InventarioPage.vue
│       │   │   ├── SolicitudesPage.vue
│       │   │   ├── LogisticaPage.vue
│       │   │   ├── KPIsPage.vue
│       │   │   └── PerfilPage.vue
│       │   │
│       │   ├── components/        # Componentes reutilizables
│       │   │   ├── AppLayout.vue
│       │   │   └── logistics/
│       │   │       ├── EnviosTab.vue
│       │   │       ├── TrackingTab.vue
│       │   │       ├── TransportistasTab.vue
│       │   │       └── EstadisticasTab.vue
│       │   │
│       │   ├── stores/            # Pinia State Management
│       │   │   ├── auth.ts
│       │   │   └── logistics.ts
│       │   │
│       │   └── router/            # Vue Router
│       │       └── index.ts
│       │
│       ├── public/                # Assets estáticos
│       ├── vite.config.ts         # Configuración Vite
│       └── tailwind.config.js     # Configuración Tailwind
│
├── docs/                           # Documentación GitBook
│   ├── README.md
│   ├── SUMMARY.md
│   ├── arquitectura/
│   ├── apis.md
│   ├── controladores-backend.md
│   ├── base-de-datos.md
│   ├── frontend.md
│   └── p2p/                       # Metodología P2P
│
├── infra/                          # Infraestructura
│   ├── docker-compose.yml         # PostgreSQL + n8n
│   └── n8n/                       # Workflows RPA
│
└── [archivos raíz]
    ├── package.json               # Monorepo workspace
    ├── .gitbook.yaml              # Configuración GitBook
    └── commitlint.config.js       # Conventional commits
```

---

## ⚠️ Archivos Duplicados Identificados

### 1. **Controladores de Productos**

| Archivo                    | Estado          | Líneas | Uso Actual                |
| -------------------------- | --------------- | ------ | ------------------------- |
| `controllers/products.ts`  | ❌ **ELIMINAR** | 93     | Stub básico, solo GET     |
| `controllers/productos.ts` | ✅ **MANTENER** | 535    | CRUD completo + políticas |

**Acción**: Eliminar `products.ts`, mantener `productos.ts`

---

### 2. **Controladores de Inventario**

| Archivo                        | Estado          | Líneas | Uso Actual                   |
| ------------------------------ | --------------- | ------ | ---------------------------- |
| `controllers/inventory.ts`     | ❌ **ELIMINAR** | 9      | Solo stub "Coming soon"      |
| `controllers/inventario.ts`    | ✅ **MANTENER** | 447    | CRUD completo de movimientos |
| `controllers/inventario-v2.ts` | ❌ **ELIMINAR** | ?      | Versión obsoleta             |

**Acción**: Eliminar `inventory.ts` e `inventario-v2.ts`, mantener `inventario.ts`

---

### 3. **Repositorios Duplicados**

| Ubicación           | Estado          | Notas                   |
| ------------------- | --------------- | ----------------------- |
| `infra/prisma/*.ts` | ✅ **MANTENER** | Implementaciones reales |
| `repositories/*.ts` | ⚠️ **REVISAR**  | Puede estar duplicado   |

**Acción**: Verificar si `repositories/` duplica `infra/prisma/`

---

### 4. **Archivos Sin Uso**

| Archivo                              | Motivo                                   |
| ------------------------------------ | ---------------------------------------- |
| `logistics-simple.ts` (raíz backend) | Archivo suelto, posible prototipo        |
| `commitlint.config.js` (duplicado)   | Existe en raíz, no necesario en packages |

---

## 🐛 Problemas Detectados

### 1. **Inconsistencia en Nombres**

```
❌ Mezclado inglés/español:
   - controllers/products.ts vs controllers/productos.ts
   - controllers/inventory.ts vs controllers/inventario.ts

✅ Solución: Estandarizar a español (productos, inventario)
```

---

### 2. **Rutas No Registradas**

```typescript
// server.ts solo registra:
- /api/products    ← usa products.ts (stub)
- /api/inventory   ← usa inventory.ts (stub)

// No registra:
- /api/productos   ← productos.ts (completo) NO USADO
- /api/inventario  ← inventario.ts (completo) NO USADO
```

**Problema crítico**: Los controladores completos no están expuestos en la API!

---

### 3. **Falta de Documentación en Código**

```typescript
// ❌ Actual
export default async function productRoutes(fastify: FastifyInstance) {
  fastify.get('/', { ... })
}

// ✅ Debería ser
/**
 * Rutas de gestión de productos
 *
 * Endpoints:
 * - GET    /productos         - Listar productos con filtros
 * - GET    /productos/:id     - Obtener producto por ID
 * - POST   /productos         - Crear nuevo producto
 * - PUT    /productos/:id     - Actualizar producto
 * - DELETE /productos/:id     - Eliminar producto (soft delete)
 *
 * @param fastify - Instancia de Fastify
 */
export default async function productosRoutes(fastify: FastifyInstance) {
  // ...
}
```

---

### 4. **Tests Incompletos**

```
Solo existe: tests/unit/inventario-use-cases.test.ts

Faltan tests para:
- ❌ Controladores
- ❌ Otros casos de uso
- ❌ Estrategias
- ❌ Chain of Responsibility
- ❌ Repositorios
```

---

## 🔧 Plan de Refactorización

### Fase 1: Limpieza de Duplicados (PRIORIDAD ALTA)

**Tareas**:

1. ✅ **Eliminar controladores stub**

   ```bash
   rm packages/backend/src/controllers/products.ts
   rm packages/backend/src/controllers/inventory.ts
   rm packages/backend/src/controllers/inventario-v2.ts
   ```

2. ✅ **Renombrar controladores a español**

   ```bash
   # Ya están en español, solo verificar consistencia
   ```

3. ✅ **Actualizar server.ts**

   ```typescript
   // Cambiar imports
   - import productRoutes from './controllers/products.js'
   + import productosRoutes from './controllers/productos.js'

   - import inventoryRoutes from './controllers/inventory.js'
   + import inventarioRoutes from './controllers/inventario.js'

   // Cambiar registros
   - await server.register(productRoutes, { prefix: '/api/products' })
   + await server.register(productosRoutes, { prefix: '/api/productos' })

   - await server.register(inventoryRoutes, { prefix: '/api/inventory' })
   + await server.register(inventarioRoutes, { prefix: '/api/inventario' })
   ```

4. ✅ **Eliminar archivos sueltos**
   ```bash
   rm packages/backend/logistics-simple.ts
   ```

---

### Fase 2: Documentación de Código (PRIORIDAD ALTA)

**Tareas**:

1. ✅ **Agregar JSDoc a todos los archivos**
   - Descripción de propósito
   - Parámetros y retornos
   - Ejemplos de uso
   - Patrones de diseño utilizados

2. ✅ **README por carpeta**
   - `domain/README.md` - Explicar entidades y patrones
   - `services/README.md` - Explicar casos de uso
   - `controllers/README.md` - Explicar endpoints
   - `infra/README.md` - Explicar adaptadores

3. ✅ **Diagramas de flujo**
   - Flujo de aprobaciones
   - Flujo de inventario
   - Flujo de logística

---

### Fase 3: Mejoras de Estructura (PRIORIDAD MEDIA)

**Tareas**:

1. ✅ **Consolidar repositorios**
   - Mover todo a `infra/prisma/`
   - Eliminar `repositories/` si duplica

2. ✅ **Organizar types**
   - Crear `types/index.ts` como barrel export
   - Separar por dominio

3. ✅ **Estandarizar esquemas Zod**
   - Mover todos a `schemas/`
   - Crear `schemas/index.ts`

---

### Fase 4: Testing (PRIORIDAD MEDIA)

**Tareas**:

1. ✅ **Tests de casos de uso**
   - Uno por cada archivo en `services/`

2. ✅ **Tests de estrategias**
   - EOQ, JIT, Fixed Quantity, Manual

3. ✅ **Tests de cadena de aprobación**
   - Flujo completo de aprobación

4. ✅ **Tests de integración**
   - Endpoints completos

---

## 👥 Guía para Nuevos Colaboradores

### Onboarding Rápido

#### 1. **Instalación**

```bash
# Clonar repositorio
git clone https://github.com/Marmo03/cerveceria-usc.git
cd cerveceria-usc

# Instalar dependencias
npm install

# Configurar base de datos
cd packages/backend
cp .env.example .env
# Editar .env con tus credenciales PostgreSQL

# Ejecutar migraciones
npx prisma migrate dev

# Poblar con datos de prueba
npm run db:seed

# Ejecutar aplicación
# Terminal 1 - Backend
cd packages/backend && npm run dev

# Terminal 2 - Frontend
cd packages/frontend && npm run dev
```

#### 2. **Estructura de una Nueva Feature**

```
Ejemplo: Agregar módulo de "Proveedores"

1. Domain (Núcleo)
   └── domain/entities.ts          # Agregar interface Proveedor

2. Repository (Port)
   └── domain/repositories.ts      # Agregar ProveedorRepository interface

3. Repository (Adapter)
   └── infra/prisma/proveedor-repository.ts  # Implementación

4. Use Cases
   └── services/proveedores-use-cases.ts    # Lógica de negocio

5. Controller
   └── controllers/proveedores.ts           # Endpoints HTTP

6. Router
   └── server.ts                    # Registrar ruta

7. Frontend Store
   └── frontend/src/stores/proveedores.ts   # Estado

8. Frontend Page
   └── frontend/src/pages/ProveedoresPage.vue  # UI
```

#### 3. **Convenciones de Código**

**Commits**:

```bash
feat(module): add new feature
fix(module): fix bug
docs(module): update documentation
refactor(module): refactor code
test(module): add tests
```

**Nombres de archivos**:

- ✅ `productos.ts` (español, minúsculas)
- ✅ `producto-repository.ts` (kebab-case)
- ❌ `Products.ts` (mayúsculas)
- ❌ `product_repository.ts` (snake_case)

**Nombres de variables**:

```typescript
// ✅ Correcto
const productoActual = await repo.findById(id);
const listaProductos = await repo.findAll();

// ❌ Incorrecto
const product = await repo.findById(id);
const productList = await repo.findAll();
```

#### 4. **Debugging**

```typescript
// Logs estructurados
fastify.log.info({ productoId, cantidad }, 'Registrando movimiento')
fastify.log.error({ error }, 'Error al crear producto')

// Prisma debug
// En .env:
DEBUG=prisma:query
```

#### 5. **Testing**

```typescript
// Estructura de test
describe('InventarioUseCases', () => {
  describe('registrarMovimiento', () => {
    it('should register ENTRADA correctly', async () => {
      // Given (Preparación)
      const mockRepo = createMockRepository()

      // When (Acción)
      const result = await useCase.registrarMovimiento(...)

      // Then (Verificación)
      expect(result.success).toBe(true)
    })
  })
})
```

---

## 📚 Recursos Adicionales

- 📖 [Documentación completa](./docs/README.md)
- 🏗️ [Arquitectura Hexagonal](./docs/arquitectura/architecture.md)
- 🔌 [Endpoints API](./docs/apis.md)
- 🗄️ [Base de Datos](./docs/base-de-datos.md)
- 🎨 [Frontend](./docs/frontend.md)

---

## ✅ Checklist para Pull Requests

Antes de crear un PR, verificar:

- [ ] Código sigue convenciones de naming
- [ ] Agregados comentarios JSDoc
- [ ] Tests pasan (`npm test`)
- [ ] Lint pasa (`npm run lint`)
- [ ] Commits siguen conventional commits
- [ ] README actualizado si es necesario
- [ ] Sin archivos duplicados
- [ ] Sin código comentado extenso
- [ ] Variables de entorno documentadas

---

**Última actualización**: 10 de Noviembre 2025  
**Mantenedor**: @Marmo03
