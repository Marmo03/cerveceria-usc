# Módulo de Inventario - Documentación Completa

## 📋 Descripción General

El módulo de inventario gestiona todos los movimientos de entrada y salida de productos, proporcionando trazabilidad completa de las operaciones, estadísticas en tiempo real y alertas automáticas de stock bajo.

## 🏗️ Arquitectura

### Backend (API REST)

**Ubicación:** `packages/backend/src/controllers/inventario.ts` (505 líneas)

**Tecnologías:**

- Fastify 4 (Framework HTTP)
- Prisma ORM con transacciones
- Zod (Validación de esquemas)
- JWT (Autenticación)

**Endpoints Implementados:**

| Método | Ruta                          | Autenticación | Roles           | Descripción                  |
| ------ | ----------------------------- | ------------- | --------------- | ---------------------------- |
| POST   | `/api/inventario/movimientos` | Sí            | ADMIN, OPERARIO | Registrar entrada/salida     |
| GET    | `/api/inventario/movimientos` | No            | -               | Listar historial con filtros |
| GET    | `/api/inventario/resumen`     | No            | -               | Estadísticas generales       |
| GET    | `/api/inventario/alertas`     | No            | -               | Productos con stock bajo     |

### Frontend (Vue 3 + Pinia)

**Ubicación:** `packages/frontend/src/stores/inventory.ts` (385 líneas)

**Tecnologías:**

- Vue 3 (Framework UI)
- Pinia (State Management)
- Axios (Cliente HTTP)
- TypeScript (Tipado estático)

**Página:** `packages/frontend/src/pages/InventarioPage.vue`

## 📊 Modelo de Datos

### Movimiento de Inventario

```typescript
interface Movimiento {
  id: string; // UUID del movimiento
  productoId: string; // ID del producto
  tipo: "ENTRADA" | "SALIDA"; // Tipo de movimiento
  cantidad: number; // Cantidad del movimiento
  fecha: DateTime; // Fecha y hora del movimiento
  usuarioId: string; // Usuario que registró el movimiento
  comentario?: string; // Comentario opcional
  referencia?: string; // Referencia externa (ej: número de orden)
  createdAt: DateTime; // Fecha de creación del registro

  // Relaciones
  producto: {
    id: string;
    sku: string;
    nombre: string;
    categoria: string;
    unidad: string;
  };
  usuario: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}
```

### Resumen de Inventario

```typescript
interface ResumenInventario {
  totalProductos: number; // Total de productos en el catálogo
  productosActivos: number; // Productos activos
  productosStockBajo: number; // Productos con stock bajo
  valorTotalInventario: number; // Valor total del inventario
  ultimosMovimientos: Array<{
    // Últimos 10 movimientos
    id: string;
    productoNombre: string;
    productoSku: string;
    tipo: "ENTRADA" | "SALIDA";
    cantidad: number;
    fecha: string;
    comentario?: string;
    referencia?: string;
  }>;
}
```

### Alerta de Stock

```typescript
interface AlertaStock {
  productoId: string;
  sku: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  prioridad: "ALTA" | "MEDIA" | "BAJA";
  diasSinStock: number; // Estimación de días hasta agotarse
  leadTime: number; // Tiempo de entrega del proveedor
}
```

## 🔧 Funcionalidades Implementadas

### 1. Registrar Movimiento de Inventario

**Endpoint:** `POST /api/inventario/movimientos`

**Autenticación:** Requerida (JWT Token)
**Roles:** ADMIN, OPERARIO

**Body:**

```json
{
  "productoId": "uuid-del-producto",
  "tipo": "ENTRADA",
  "cantidad": 50,
  "comentario": "Compra a proveedor principal",
  "referencia": "OC-2024-001"
}
```

**Validaciones:**

- ✅ Producto debe existir
- ✅ Cantidad debe ser positiva
- ✅ Para SALIDA: stock debe ser suficiente
- ✅ Usuario debe estar autenticado

**Proceso (Transaccional):**

1. Validar datos de entrada con Zod
2. Verificar existencia del producto
3. Para SALIDA: verificar stock suficiente
4. **Iniciar transacción de base de datos**
5. Crear registro de movimiento
6. Actualizar stockActual del producto
7. **Commit de transacción**
8. Registrar log de operación

**Respuesta Exitosa (201):**

```json
{
  "success": true,
  "data": {
    "movimiento": {
      "id": "mov-uuid",
      "productoId": "prod-uuid",
      "tipo": "ENTRADA",
      "cantidad": 50,
      "fecha": "2025-11-10T12:00:00Z",
      "producto": {
        "sku": "MALTA-001",
        "nombre": "Malta Pilsen Premium"
      },
      "usuario": {
        "email": "operario@cerveceria-usc.edu.co",
        "firstName": "Juan",
        "lastName": "Pérez"
      }
    },
    "stockAnterior": 100,
    "stockNuevo": 150
  },
  "message": "Movimiento registrado exitosamente"
}
```

**Errores Posibles:**

- **404 Not Found**: Producto no existe

```json
{
  "success": false,
  "error": "Producto no encontrado"
}
```

- **409 Conflict**: Stock insuficiente

```json
{
  "success": false,
  "error": "Stock insuficiente",
  "details": [
    {
      "message": "Stock actual: 10, solicitado: 50"
    }
  ]
}
```

- **401 Unauthorized**: Usuario no autenticado

### 2. Consultar Historial de Movimientos

**Endpoint:** `GET /api/inventario/movimientos`

**Query Parameters:**

- `productoId` (string): Filtrar por producto específico
- `tipo` (ENTRADA|SALIDA): Filtrar por tipo de movimiento
- `fechaDesde` (datetime): Fecha inicial del rango
- `fechaHasta` (datetime): Fecha final del rango
- `page` (number): Número de página (default: 1)
- `limit` (number): Resultados por página (default: 20, max: 100)

**Respuesta:**

```json
{
  "data": [
    {
      "id": "mov-1",
      "productoId": "prod-1",
      "tipo": "SALIDA",
      "cantidad": 10,
      "fecha": "2025-11-10T10:30:00Z",
      "comentario": "Venta cliente mayorista",
      "referencia": "VEN-2024-045",
      "producto": {
        "sku": "MALTA-001",
        "nombre": "Malta Pilsen Premium",
        "categoria": "Materia Prima",
        "unidad": "kg"
      },
      "usuario": {
        "email": "operario@cerveceria-usc.edu.co",
        "firstName": "Juan",
        "lastName": "Pérez"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 3. Resumen de Inventario

**Endpoint:** `GET /api/inventario/resumen`

Proporciona estadísticas generales del inventario actual.

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "totalProductos": 45,
    "productosActivos": 42,
    "productosStockBajo": 7,
    "valorTotalInventario": 125750.5,
    "ultimosMovimientos": [
      {
        "id": "mov-123",
        "productoNombre": "Malta Pilsen Premium",
        "productoSku": "MALTA-001",
        "tipo": "SALIDA",
        "cantidad": 50,
        "fecha": "2025-11-10T15:45:00Z",
        "comentario": "Producción lote 2024-11",
        "referencia": "PROD-2024-11"
      }
    ]
  }
}
```

### 4. Alertas de Stock Bajo

**Endpoint:** `GET /api/inventario/alertas`

Lista productos que requieren atención por tener stock bajo o crítico.

**Cálculo de Prioridad:**

- **ALTA**: Stock actual ≤ Stock de seguridad O ≤ 50% del stock mínimo
- **MEDIA**: Stock actual ≤ 75% del stock mínimo
- **BAJA**: Stock actual ≤ stock mínimo pero > 75%

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "alertas": [
      {
        "productoId": "prod-1",
        "sku": "LUPULO-001",
        "nombre": "Lúpulo Cascade",
        "stockActual": 5,
        "stockMinimo": 20,
        "prioridad": "ALTA",
        "diasSinStock": 3,
        "leadTime": 14
      },
      {
        "productoId": "prod-2",
        "sku": "LEVADURA-001",
        "nombre": "Levadura Ale",
        "stockActual": 12,
        "stockMinimo": 15,
        "prioridad": "MEDIA",
        "diasSinStock": 7,
        "leadTime": 7
      }
    ],
    "resumen": {
      "totalAlertas": 7,
      "alertasAlta": 3,
      "alertasMedia": 2,
      "alertasBaja": 2
    }
  }
}
```

## 🎨 Store de Frontend (Pinia)

### Estado (State)

```typescript
{
  movimientos: Movimiento[]              // Lista de movimientos
  resumen: ResumenInventario | null     // Resumen del inventario
  alertas: AlertaStock[]                // Alertas de stock bajo
  resumenAlertas: ResumenAlertas | null // Resumen de alertas
  loading: boolean                      // Estado de carga
  error: string | null                  // Mensaje de error
  filtros: FiltrosMovimientos           // Filtros actuales
  pagination: Pagination | null         // Info de paginación
}
```

### Getters

- `movimientosEntrada`: Filtra solo movimientos de tipo ENTRADA
- `movimientosSalida`: Filtra solo movimientos de tipo SALIDA
- `alertasAlta`: Alertas de prioridad ALTA
- `alertasMedia`: Alertas de prioridad MEDIA
- `tieneAlertasCriticas`: Boolean si hay alertas ALTA
- `totalMovimientos`: Total de movimientos (con paginación)

### Actions

```typescript
// Registro de movimientos
await store.registrarMovimiento(data);
await store.registrarEntrada(productoId, cantidad, comentario, referencia);
await store.registrarSalida(productoId, cantidad, comentario, referencia);

// Consultas
await store.fetchMovimientos({ tipo: "ENTRADA", page: 1 });
await store.fetchResumen();
await store.fetchAlertas();

// Filtros
await store.filtrarPorProducto(productoId);
await store.filtrarPorTipo("ENTRADA");
await store.filtrarPorFechas("2025-01-01", "2025-12-31");
await store.clearFiltros();

// Utilidades
await store.changePage(2);
await store.changeLimit(50);
await store.refreshAll();
store.clearError();
```

## 🔐 Seguridad

### Autenticación JWT

Solo las operaciones de **escritura** (POST) requieren autenticación:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Control de Acceso por Roles

| Operación            | ADMIN | OPERARIO | APROBADOR | ANALISTA |
| -------------------- | ----- | -------- | --------- | -------- |
| Ver movimientos      | ✅    | ✅       | ✅        | ✅       |
| Ver resumen          | ✅    | ✅       | ✅        | ✅       |
| Ver alertas          | ✅    | ✅       | ✅        | ✅       |
| Registrar movimiento | ✅    | ✅       | ❌        | ❌       |

### Validaciones de Negocio

1. **Stock suficiente**: No permite salidas si stock < cantidad solicitada
2. **Producto existente**: Valida que el producto exista y esté activo
3. **Cantidad positiva**: Solo permite cantidades > 0
4. **Transaccionalidad**: Usa transacciones de BD para garantizar consistencia
5. **Trazabilidad**: Registra usuario y timestamp en cada movimiento
6. **Referencia opcional**: Permite vincular con otros módulos (ventas, compras)

## 📝 Ejemplos de Uso

### Ejemplo 1: Registrar entrada de compra

```typescript
import { useInventoryStore } from "@/stores/inventory";

const store = useInventoryStore();

const entrada = {
  productoId: "prod-uuid-malta-001",
  tipo: "ENTRADA" as const,
  cantidad: 500,
  comentario: "Compra mensual a proveedor principal",
  referencia: "OC-2024-11-001",
};

try {
  const resultado = await store.registrarMovimiento(entrada);
  console.log("Stock anterior:", resultado.data.stockAnterior);
  console.log("Stock nuevo:", resultado.data.stockNuevo);
} catch (error) {
  console.error("Error:", store.error);
}
```

### Ejemplo 2: Registrar salida para producción

```typescript
// Atajo para salidas
await store.registrarSalida(
  "prod-uuid-malta-001",
  50,
  "Consumo para producción de lote 2024-11",
  "PROD-2024-11"
);
```

### Ejemplo 3: Consultar movimientos de un producto

```typescript
// Filtrar movimientos de un producto específico
await store.filtrarPorProducto("prod-uuid-malta-001");

// Ver los movimientos
console.log(store.movimientos);
console.log("Total:", store.totalMovimientos);
```

### Ejemplo 4: Ver alertas de stock bajo

```typescript
// Cargar alertas
await store.fetchAlertas();

// Verificar si hay alertas críticas
if (store.tieneAlertasCriticas) {
  console.log("⚠️ Hay alertas críticas!");
  console.log("Alertas ALTA:", store.alertasAlta.length);

  // Procesar alertas de alta prioridad
  store.alertasAlta.forEach((alerta) => {
    console.log(
      `${alerta.nombre}: ${alerta.stockActual}/${alerta.stockMinimo}`
    );
  });
}
```

### Ejemplo 5: Dashboard de inventario

```typescript
// Cargar todos los datos del dashboard
await store.refreshAll();

// Mostrar estadísticas
console.log("Total productos:", store.resumen?.totalProductos);
console.log("Productos con stock bajo:", store.resumen?.productosStockBajo);
console.log("Valor total:", store.resumen?.valorTotalInventario);

// Mostrar últimos movimientos
store.resumen?.ultimosMovimientos.forEach((mov) => {
  console.log(`${mov.tipo}: ${mov.productoNombre} - ${mov.cantidad}`);
});
```

## 🔄 Flujo de Trabajo Típico

### Flujo de Entrada (Compra)

1. Proveedor envía mercancía
2. Operario verifica y cuenta productos
3. Registra entrada en el sistema:
   ```typescript
   await store.registrarEntrada(
     productoId,
     cantidadRecibida,
     "Compra según OC-2024-11-001",
     "OC-2024-11-001"
   );
   ```
4. Sistema actualiza stock automáticamente
5. Sistema registra quién y cuándo se hizo la entrada

### Flujo de Salida (Producción/Venta)

1. Se requiere material para producción o venta
2. Operario verifica stock disponible
3. Registra salida:
   ```typescript
   await store.registrarSalida(
     productoId,
     cantidadRequerida,
     "Consumo para lote de producción",
     "PROD-2024-11-05"
   );
   ```
4. Sistema valida que hay stock suficiente
5. Actualiza stock y registra movimiento

### Flujo de Monitoreo

1. Analista accede al dashboard
2. Revisa resumen de inventario:
   ```typescript
   await store.fetchResumen();
   ```
3. Verifica alertas de stock:
   ```typescript
   await store.fetchAlertas();
   ```
4. Genera reporte o toma acción sobre alertas críticas

## 🧪 Testing

### Datos de Prueba

Para probar el módulo, crea productos con el seed y registra movimientos:

```bash
# Backend
cd packages/backend
npm run dev

# Test registrar entrada
curl -X POST http://localhost:3001/api/inventario/movimientos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productoId": "prod-uuid",
    "tipo": "ENTRADA",
    "cantidad": 100,
    "comentario": "Test de entrada",
    "referencia": "TEST-001"
  }'

# Test consultar movimientos
curl http://localhost:3001/api/inventario/movimientos?tipo=ENTRADA&limit=10

# Test resumen
curl http://localhost:3001/api/inventario/resumen

# Test alertas
curl http://localhost:3001/api/inventario/alertas
```

## 🚀 Próximas Mejoras

1. **Ajustes de inventario**: Movimiento especial para correcciones
2. **Importación masiva**: Cargar movimientos desde CSV/Excel
3. **Reportes PDF**: Generar reportes imprimibles
4. **Gráficos**: Visualización de tendencias de inventario
5. **Predicción de stock**: ML para predecir cuándo se agotará
6. **Transferencias entre bodegas**: Movimientos entre ubicaciones
7. **Códigos de barras**: Escanear para registrar movimientos
8. **Fotos de evidencia**: Adjuntar imágenes a movimientos
9. **Notificaciones**: Alertas automáticas por email/SMS
10. **Integración con producción**: Crear movimientos automáticos

## 📚 Referencias

- **Transacciones en Prisma**: https://www.prisma.io/docs/concepts/components/prisma-client/transactions
- **Fastify Hooks**: https://fastify.dev/docs/latest/Reference/Hooks/
- **Pinia Stores**: https://pinia.vuejs.org/core-concepts/

## ✅ Estado del Módulo

**Backend:** ✅ COMPLETO Y FUNCIONAL

- POST /movimientos con transacciones ✅
- GET /movimientos con filtros avanzados ✅
- GET /resumen con estadísticas reales ✅
- GET /alertas con cálculo de prioridad ✅
- Autenticación JWT ✅
- Control de acceso por roles ✅
- Validación de stock suficiente ✅
- Actualización automática de stock ✅
- Logging completo ✅

**Frontend:** ✅ COMPLETO Y FUNCIONAL

- Store Pinia completo (385 líneas) ✅
- Todas las operaciones implementadas ✅
- Filtros y búsqueda ✅
- Paginación ✅
- Getters útiles ✅
- Manejo de errores ✅
- TypeScript con tipos completos ✅

**Pendiente:**

- Página InventarioPage.vue (UI)
- Componentes de formulario de movimientos
- Gráficos de tendencias
- Tests unitarios y de integración

---

**Última actualización:** Noviembre 10, 2025
**Autor:** Sistema de Gestión Cervecería USC
