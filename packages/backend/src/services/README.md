# 💼 Services Layer - Casos de Uso

> **Principio**: Esta capa contiene la **lógica de aplicación** (casos de uso), orquestando el domain y la infraestructura.

---

## 📖 Propósito

El **Services Layer** (también llamado **Application Layer**) es responsable de:

- **Orquestar** las operaciones del negocio
- **Coordinar** entre el domain y la infraestructura
- **Implementar** casos de uso específicos
- **Gestionar** transacciones y flujos de trabajo

---

## 📁 Estructura

```
services/
├── inventario-use-cases.ts        # 📦 Gestión de inventario
├── solicitudes-use-cases.ts       # 🛒 Solicitudes de compra
├── reabastecimiento-use-cases.ts  # 🔄 Reabastecimiento automático
├── kpis-use-cases.ts              # 📊 Cálculo de KPIs
├── importaciones-use-cases.ts     # 📥 Importación masiva
└── logistics.ts                    # 🚚 Logística y envíos
```

---

## 🏗️ Arquitectura

### Flujo de Datos

```
Controller (HTTP)
      ↓
[Use Case]  ← Punto de entrada de la lógica de negocio
      ↓
Domain Logic (Entities, Strategies, etc.)
      ↓
Repository (Interface)
      ↓
Infrastructure (Prisma, External APIs)
```

### Responsabilidades

```typescript
// ✅ Use Case - Orquestación
class InventarioUseCases {
  async registrarMovimiento(data: MovimientoInput): Promise<Result> {
    // 1. Validación de negocio
    const producto = await this.productoRepo.findById(data.productoId)
    if (!producto) throw new NotFoundError()

    // 2. Lógica de dominio
    const movimiento = Movimiento.create(data)
    movimiento.afectarStock(producto)

    // 3. Persistencia (transacción)
    await this.movimientoRepo.create(movimiento)
    await this.productoRepo.update(producto)

    // 4. Eventos (Observer Pattern)
    await this.eventBus.publish(MovimientoCreated(movimiento))

    // 5. Retorno
    return Result.success(movimiento)
  }
}
```

---

## 📦 inventario-use-cases.ts

**Propósito**: Gestión de movimientos de inventario

### Casos de Uso Implementados

#### 1. **Registrar Movimiento**

```typescript
async registrarMovimiento(data: {
  productoId: string
  tipo: 'ENTRADA' | 'SALIDA'
  cantidad: number
  comentario?: string
  referencia?: string
}): Promise<MovimientoInventario>
```

**Flujo**:

1. Validar que producto existe
2. Validar stock suficiente (si es SALIDA)
3. Crear movimiento
4. Actualizar stock del producto
5. Emitir evento `MovimientoInventarioCreated`
6. Verificar si necesita reabastecimiento

**Eventos generados**:

- `MovimientoInventarioCreated` → Actualiza rotación de inventario
- `StockBajoDetectado` → Trigger para reabastecimiento automático

---

#### 2. **Listar Movimientos**

```typescript
async listarMovimientos(filtros: {
  productoId?: string
  tipo?: 'ENTRADA' | 'SALIDA'
  fechaDesde?: Date
  fechaHasta?: Date
  page: number
  limit: number
}): Promise<PaginatedResult<MovimientoInventario>>
```

**Features**:

- Filtros múltiples
- Paginación
- Ordenamiento por fecha descendente

---

#### 3. **Obtener Resumen**

```typescript
async obtenerResumen(): Promise<ResumenInventario>
```

**Retorna**:

```typescript
{
  totalProductos: 150,
  valorTotalInventario: 125000,
  productosBajoStock: 12,
  movimientosMesActual: 450,
  topProductosMasSalidas: [...]
}
```

---

## 🛒 solicitudes-use-cases.ts

**Propósito**: Gestión de solicitudes de compra

### Casos de Uso Implementados

#### 1. **Crear Solicitud**

```typescript
async crearSolicitud(data: {
  items: Array<{ productoId: string, cantidad: number, precio: number }>
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE'
  comentario?: string
}): Promise<Solicitud>
```

**Flujo**:

1. Validar que todos los productos existen
2. Calcular monto total
3. Determinar nivel de aprobación requerido (Chain of Responsibility)
4. Crear solicitud en estado `PENDIENTE`
5. Notificar a aprobador inicial

**Niveles de aprobación**:

- Monto < $5,000 → Nivel 1 (Operativo)
- Monto < $50,000 → Nivel 2 (Gerencial)
- Monto >= $50,000 → Nivel 3 (Ejecutivo)

---

#### 2. **Aprobar/Rechazar Solicitud**

```typescript
async procesarAprobacion(
  solicitudId: string,
  decision: 'APROBAR' | 'RECHAZAR',
  comentario?: string
): Promise<Solicitud>
```

**Flujo (Chain of Responsibility)**:

```
Solicitud en Nivel 1
      ↓
Aprobador Nivel 1 [APROBAR]
      ↓
¿Requiere más aprobaciones?
      ↓ SI
Solicitud pasa a Nivel 2
      ↓
Aprobador Nivel 2 [APROBAR]
      ↓
¿Requiere más aprobaciones?
      ↓ NO
SOLICITUD APROBADA ✅
      ↓
Crear Orden de Compra
```

**Eventos**:

- `SolicitudAprobada` → Crear orden de compra automáticamente
- `SolicitudRechazada` → Notificar a creador

---

## 🔄 reabastecimiento-use-cases.ts

**Propósito**: Reabastecimiento automático basado en políticas

### Casos de Uso Implementados

#### 1. **Verificar Productos para Reabastecimiento**

```typescript
async verificarReabastecimiento(): Promise<ProductoParaReorden[]>
```

**Flujo**:

1. Obtener todos los productos activos
2. Para cada producto:
   - Verificar si `stockActual <= ROP` (Reorder Point)
   - Aplicar estrategia configurada (Strategy Pattern)
   - Calcular cantidad a ordenar
3. Retornar lista de productos que necesitan reorden

**Estrategias soportadas**:

- `EOQ`: Economic Order Quantity
- `MANUAL`: Cantidad configurada manualmente
- `JIT`: Just-in-Time (futuro)
- `FIXED_QUANTITY`: Cantidad fija (futuro)

---

#### 2. **Crear Solicitud Automática**

```typescript
async crearSolicitudAutomatica(
  productoId: string,
  cantidad: number
): Promise<Solicitud>
```

**Flujo**:

1. Obtener producto y política de reabastecimiento
2. Calcular precio estimado
3. Crear solicitud automáticamente con prioridad `ALTA`
4. Asignar a flujo de aprobación

**Trigger**:

- Evento `StockBajoDetectado`
- Job programado (cada 6 horas)

---

## 📊 kpis-use-cases.ts

**Propósito**: Cálculo y gestión de indicadores clave

### KPIs Implementados

#### 1. **Rotación de Inventario**

```typescript
async calcularRotacionInventario(
  productoId: string,
  periodo: 'MES' | 'TRIMESTRE' | 'AÑO'
): Promise<number>
```

**Fórmula**:

```
Rotación = Costo de Ventas / Inventario Promedio

Ejemplo:
- Costo de ventas (mes): $50,000
- Inventario promedio: $25,000
- Rotación = 50,000 / 25,000 = 2 veces/mes
```

**Interpretación**:

- Alta rotación (>4): Producto se vende rápido, poco stock
- Baja rotación (<1): Producto se vende lento, mucho stock

---

#### 2. **Fill Rate**

```typescript
async calcularFillRate(): Promise<number>
```

**Fórmula**:

```
Fill Rate = (Pedidos Completos / Total Pedidos) × 100

Ejemplo:
- Pedidos completos: 95
- Total pedidos: 100
- Fill Rate = 95%
```

**Objetivo**: >95%

---

#### 3. **Tiempo de Ciclo de Orden**

```typescript
async calcularTiempoCicloOrden(): Promise<number>
```

**Fórmula**:

```
Tiempo Ciclo = Promedio(Fecha Entrega - Fecha Solicitud)

Ejemplo:
- Orden 1: 10 días
- Orden 2: 8 días
- Orden 3: 12 días
- Promedio = 10 días
```

**Objetivo**: <7 días

---

#### 4. **Días de Inventario**

```typescript
async calcularDiasInventario(productoId: string): Promise<number>
```

**Fórmula**:

```
Días Inventario = Stock Actual / Ventas Promedio Diarias

Ejemplo:
- Stock actual: 500 unidades
- Ventas promedio: 50 unidades/día
- Días = 500 / 50 = 10 días
```

**Interpretación**: Cuántos días durará el stock al ritmo actual

---

## 📥 importaciones-use-cases.ts

**Propósito**: Importación masiva de datos desde archivos

### Casos de Uso Implementados

#### 1. **Importar Productos desde CSV**

```typescript
async importarProductosCSV(file: File): Promise<ImportResult>
```

**Flujo**:

1. Validar formato CSV
2. Parsear filas
3. Validar cada producto (Zod schema)
4. Insertar en batch (transacción)
5. Retornar resumen (insertados, errores)

**Formato esperado**:

```csv
sku,nombre,categoria,unidad,costo,stockMin,leadTime
SKU001,Botella 330ml,Envases,UNIDAD,1.50,100,7
SKU002,Tapa Corona,Insumos,UNIDAD,0.10,500,3
```

---

## 🚚 logistics.ts

**Propósito**: Gestión de logística y envíos

### Casos de Uso Implementados

#### 1. **Crear Envío**

```typescript
async crearEnvio(data: {
  ordenId: string
  transportistaId: string
  direccionDestino: string
  pesoKg: number
}): Promise<Envio>
```

**Flujo**:

1. Validar orden existe
2. Crear registro de envío con estado `PENDIENTE`
3. Generar número de seguimiento
4. Notificar a transportista

---

#### 2. **Actualizar Estado de Envío**

```typescript
async actualizarEstadoEnvio(
  envioId: string,
  nuevoEstado: EstadoEnvio,
  ubicacion?: string
): Promise<Envio>
```

**Estados**:

```
PENDIENTE → EN_TRANSITO → EN_DISTRIBUCION → ENTREGADO
                  ↓
               INCIDENCIA
```

**Eventos**:

- `EnvioEntregado` → Actualizar fill rate, cerrar orden
- `IncidenciaDetectada` → Notificar a gerencia

---

## 🔧 Dependency Injection

Todos los use cases reciben sus dependencias por constructor:

```typescript
class InventarioUseCases {
  constructor(
    private productoRepo: ProductoRepository, // Port
    private movimientoRepo: MovimientoRepository, // Port
    private eventBus: EventBus, // Port
    private logger: Logger // Port
  ) {}
}

// Registro en container
container.register('InventarioUseCases', () => {
  return new InventarioUseCases(
    container.resolve('ProductoRepository'),
    container.resolve('MovimientoRepository'),
    container.resolve('EventBus'),
    container.resolve('Logger')
  )
})
```

**Beneficios**:

- ✅ Testeable (inyectar mocks)
- ✅ Flexible (cambiar implementaciones)
- ✅ Sin acoplamiento fuerte

---

## 🧪 Testing de Use Cases

```typescript
describe('InventarioUseCases', () => {
  describe('registrarMovimiento', () => {
    it('should register ENTRADA and update stock', async () => {
      // Given
      const mockProductoRepo = {
        findById: jest.fn().mockResolvedValue({ id: '1', stockActual: 100 }),
        update: jest.fn(),
      }
      const mockMovimientoRepo = {
        create: jest.fn(),
      }
      const mockEventBus = {
        publish: jest.fn(),
      }

      const useCase = new InventarioUseCases(
        mockProductoRepo,
        mockMovimientoRepo,
        mockEventBus,
        logger
      )

      // When
      await useCase.registrarMovimiento({
        productoId: '1',
        tipo: 'ENTRADA',
        cantidad: 50,
      })

      // Then
      expect(mockProductoRepo.update).toHaveBeenCalledWith({
        id: '1',
        stockActual: 150, // 100 + 50
      })
      expect(mockEventBus.publish).toHaveBeenCalled()
    })
  })
})
```

---

## 📚 Patrones Aplicados

### 1. **Use Case Pattern**

- ✅ Cada archivo = un conjunto de casos de uso relacionados
- ✅ Nombres expresan intención (`registrarMovimiento`, `aprobarSolicitud`)
- ✅ Sin lógica de presentación (solo negocio)

### 2. **Orchestration Pattern**

- ✅ Use cases orquestan domain + infrastructure
- ✅ Coordinan transacciones
- ✅ Gestionan eventos

### 3. **Result Pattern**

```typescript
class Result<T> {
  constructor(
    public success: boolean,
    public data?: T,
    public error?: Error
  ) {}

  static ok<T>(data: T): Result<T> {
    return new Result(true, data)
  }

  static fail<T>(error: Error): Result<T> {
    return new Result(false, undefined, error)
  }
}

// Uso
const result = await useCase.registrarMovimiento(data)
if (!result.success) {
  return reply.status(400).send({ error: result.error })
}
return reply.send(result.data)
```

---

## 🎓 Principios Aplicados

- ✅ **Single Responsibility**: Cada use case tiene una responsabilidad clara
- ✅ **Dependency Inversion**: Depende de interfaces (ports), no de implementaciones
- ✅ **Open/Closed**: Fácil agregar nuevos use cases sin modificar existentes

---

**Mantenedor**: @Marmo03  
**Última actualización**: 10 de Noviembre 2025
