# Módulo de Productos - Documentación Completa

## 📋 Descripción General

El módulo de productos es el núcleo del sistema de gestión de inventario de Cervecería USC. Permite gestionar el catálogo completo de productos con sus características, políticas de reabastecimiento y relaciones con proveedores.

## 🏗️ Arquitectura

### Backend (API REST)

**Ubicación:** `packages/backend/src/controllers/productos.ts` (766 líneas)

**Tecnologías:**

- Fastify 4 (Framework HTTP)
- Prisma ORM (Acceso a base de datos)
- Zod (Validación de esquemas)
- JWT (Autenticación)

**Endpoints Implementados:**

| Método | Ruta                          | Autenticación | Roles           | Descripción                          |
| ------ | ----------------------------- | ------------- | --------------- | ------------------------------------ |
| GET    | `/api/productos`              | No            | -               | Listar productos con filtros         |
| GET    | `/api/productos/:id`          | No            | -               | Obtener producto por ID              |
| POST   | `/api/productos`              | Sí            | ADMIN, OPERARIO | Crear producto                       |
| PUT    | `/api/productos/:id`          | Sí            | ADMIN, OPERARIO | Actualizar producto                  |
| DELETE | `/api/productos/:id`          | Sí            | ADMIN           | Eliminar producto (soft delete)      |
| GET    | `/api/productos/:id/politica` | No            | -               | Obtener política de reabastecimiento |
| POST   | `/api/productos/:id/politica` | Sí            | ADMIN, OPERARIO | Crear política de reabastecimiento   |

### Frontend (Vue 3 + Pinia)

**Ubicación:** `packages/frontend/src/stores/products.ts` (396 líneas)

**Tecnologías:**

- Vue 3 (Framework UI)
- Pinia (State Management)
- Axios (Cliente HTTP)
- TypeScript (Tipado estático)

**Página:** `packages/frontend/src/pages/ProductosPage.vue`

## 📊 Modelo de Datos

### Producto

```typescript
interface Producto {
  id: string; // UUID del producto
  sku: string; // Código único (Stock Keeping Unit)
  nombre: string; // Nombre descriptivo
  categoria: string; // Categoría del producto
  unidad: string; // Unidad de medida (kg, L, unidad, etc.)
  costo: number; // Costo unitario
  stockActual: number; // Stock disponible actual
  stockMin: number; // Stock mínimo para alertas
  leadTime: number; // Tiempo de entrega en días
  isActive: boolean; // Estado activo/inactivo
  proveedorId?: string; // ID del proveedor (opcional)
  createdAt: string; // Fecha de creación
  updatedAt: string; // Fecha de última actualización

  // Relaciones
  proveedor?: {
    id: string;
    nombre: string;
    email: string;
    telefono?: string;
  };
  politicaAbastecimiento?: {
    estrategia: "EOQ" | "MANUAL";
    rop: number;
    stockSeguridad: number;
  };
}
```

### Política de Abastecimiento

```typescript
interface PoliticaAbastecimiento {
  id: string;
  productoId: string;
  estrategia: "EOQ" | "MANUAL"; // Estrategia de reabastecimiento
  rop: number; // Reorder Point (punto de reorden)
  stockSeguridad: number; // Stock de seguridad
  parametrosJSON?: object; // Parámetros adicionales en JSON
  createdAt: string;
  updatedAt: string;
}
```

## 🔧 Funcionalidades Implementadas

### 1. Listar Productos con Filtros

**Endpoint:** `GET /api/productos`

**Query Parameters:**

- `categoria` (string): Filtrar por categoría
- `isActive` (boolean): Solo activos o inactivos
- `stockBajo` (boolean): Productos con stock menor o igual a stockMin
- `proveedorId` (string): Productos de un proveedor específico
- `busqueda` (string): Búsqueda por SKU o nombre (case-insensitive)
- `page` (number): Número de página (default: 1)
- `limit` (number): Resultados por página (default: 20, max: 100)

**Respuesta:**

```json
{
  "productos": [
    {
      "id": "...",
      "sku": "MALTA-001",
      "nombre": "Malta Pilsen Premium",
      "categoria": "Materia Prima",
      "stockActual": 500,
      "stockMin": 100,
      "proveedor": {
        "nombre": "Maltería Andina"
      },
      "politicaAbastecimiento": {
        "estrategia": "EOQ",
        "rop": 150
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### 2. Crear Producto

**Endpoint:** `POST /api/productos`

**Autenticación:** Requerida (JWT Token)
**Roles:** ADMIN, OPERARIO

**Body:**

```json
{
  "sku": "MALTA-001",
  "nombre": "Malta Pilsen Premium",
  "categoria": "Materia Prima",
  "unidad": "kg",
  "costo": 2500,
  "stockActual": 500,
  "stockMin": 100,
  "leadTime": 7,
  "proveedorId": "proveedor-uuid"
}
```

**Validaciones:**

- SKU único (no puede existir otro producto con el mismo SKU)
- Todos los campos numéricos deben ser positivos
- SKU: máximo 50 caracteres
- Nombre: máximo 200 caracteres

**Respuesta Exitosa (201):**

```json
{
  "id": "producto-uuid",
  "sku": "MALTA-001",
  "nombre": "Malta Pilsen Premium",
  "categoria": "Materia Prima",
  "mensaje": "Producto creado exitosamente"
}
```

### 3. Actualizar Producto

**Endpoint:** `PUT /api/productos/:id`

**Autenticación:** Requerida
**Roles:** ADMIN, OPERARIO

**Body:** Todos los campos son opcionales (actualización parcial)

**Validaciones:**

- Si se actualiza el SKU, debe ser único
- El producto debe existir

### 4. Eliminar Producto

**Endpoint:** `DELETE /api/productos/:id`

**Autenticación:** Requerida
**Roles:** ADMIN

**Comportamiento:** Soft delete (marca `isActive = false`)

### 5. Política de Reabastecimiento

**Crear Política:** `POST /api/productos/:id/politica`

**Body:**

```json
{
  "estrategia": "EOQ",
  "rop": 150,
  "stockSeguridad": 50,
  "parametrosJSON": {
    "demandaAnual": 6000,
    "costoOrden": 500,
    "costoAlmacenamiento": 100
  }
}
```

## 🎨 Store de Frontend (Pinia)

### Estado (State)

```typescript
{
  productos: Producto[]          // Lista de productos
  productoActual: Producto | null  // Producto seleccionado
  loading: boolean               // Estado de carga
  error: string | null           // Mensaje de error
  filtros: FiltrosProductos      // Filtros actuales
  pagination: Pagination         // Info de paginación
}
```

### Getters

- `productosActivos`: Filtra solo productos activos
- `productosStockBajo`: Productos con stock <= stockMin
- `productosPorCategoria`: Agrupa productos por categoría
- `tieneProductos`: Verifica si hay productos

### Actions

```typescript
// Operaciones CRUD
await store.fetchProductos({ categoria: "Materia Prima", page: 1 });
await store.fetchProductoById(id);
await store.createProducto(data);
await store.updateProducto(id, data);
await store.deleteProducto(id);

// Políticas
await store.fetchPoliticaAbastecimiento(productoId);
await store.savePoliticaAbastecimiento(productoId, data);

// Utilidades
await store.changePage(2);
await store.changeLimit(50);
await store.buscarProductos("malta");
await store.filtrarPorCategoria("Materia Prima");
await store.filtrarStockBajo();
await store.clearFiltros();
```

## 🔐 Seguridad

### Autenticación JWT

Todas las operaciones de escritura (POST, PUT, DELETE) requieren token JWT en el header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Control de Acceso por Roles

| Operación           | ADMIN | OPERARIO | APROBADOR | ANALISTA |
| ------------------- | ----- | -------- | --------- | -------- |
| Ver productos       | ✅    | ✅       | ✅        | ✅       |
| Crear producto      | ✅    | ✅       | ❌        | ❌       |
| Actualizar producto | ✅    | ✅       | ❌        | ❌       |
| Eliminar producto   | ✅    | ❌       | ❌        | ❌       |

### Validaciones de Negocio

1. **SKU único**: No puede haber dos productos con el mismo SKU
2. **Valores positivos**: Costo, stock, leadTime deben ser >= 0
3. **Longitud de campos**: SKU (50), nombre (200), categoría (100)
4. **Soft delete**: Los productos no se eliminan físicamente

## 📝 Ejemplos de Uso

### Ejemplo 1: Listar todos los productos activos

```typescript
import { useProductsStore } from "@/stores/products";

const store = useProductsStore();

// Cargar productos activos
await store.fetchProductos({ isActive: true });

// Acceder a los datos
console.log(store.productos);
console.log(store.pagination);
```

### Ejemplo 2: Crear un nuevo producto

```typescript
const nuevoProducto = {
  sku: "LUPULO-001",
  nombre: "Lúpulo Cascade",
  categoria: "Materia Prima",
  unidad: "kg",
  costo: 5000,
  stockActual: 50,
  stockMin: 10,
  leadTime: 14,
};

try {
  await store.createProducto(nuevoProducto);
  // Producto creado exitosamente
  console.log("Producto creado!");
} catch (error) {
  // Manejar error
  console.error(store.error);
}
```

### Ejemplo 3: Buscar productos con stock bajo

```typescript
// Filtrar productos con stock bajo
await store.filtrarStockBajo();

// Los productos ahora están filtrados
console.log(store.productos); // Solo productos con stockActual <= stockMin
```

### Ejemplo 4: Configurar política de reabastecimiento

```typescript
const politica = {
  estrategia: "EOQ" as const,
  rop: 150,
  stockSeguridad: 50,
  parametrosJSON: {
    demandaAnual: 6000,
    costoOrden: 500,
    costoAlmacenamiento: 100,
  },
};

await store.savePoliticaAbastecimiento(productoId, politica);
```

## 🧪 Testing

### Datos de Prueba (Seed)

El seed script crea los siguientes productos de ejemplo:

```typescript
[
  {
    sku: "MALTA-001",
    nombre: "Malta Pilsen",
    categoria: "Materia Prima",
    stockActual: 500,
    stockMin: 100,
  },
  {
    sku: "LUPULO-001",
    nombre: "Lúpulo Cascade",
    categoria: "Materia Prima",
    stockActual: 50,
    stockMin: 20,
  },
  {
    sku: "LEVADURA-001",
    nombre: "Levadura Ale",
    categoria: "Materia Prima",
    stockActual: 30,
    stockMin: 10,
  },
];
```

### Comandos para Probar

```bash
# Backend
cd packages/backend
npm run dev

# Test con curl
curl http://localhost:3001/api/productos

# Test crear producto (requiere token)
curl -X POST http://localhost:3001/api/productos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "sku": "TEST-001",
    "nombre": "Producto de Prueba",
    "categoria": "Test",
    "unidad": "unidad",
    "costo": 1000,
    "stockActual": 10,
    "stockMin": 5,
    "leadTime": 7
  }'
```

## 🚀 Próximas Mejoras

1. **Exportación de datos**: CSV, Excel, PDF
2. **Importación masiva**: Cargar productos desde archivo
3. **Historial de cambios**: Auditoría de modificaciones
4. **Imágenes de productos**: Upload y gestión de imágenes
5. **Códigos de barras**: Generación y escaneo
6. **Categorías dinámicas**: CRUD de categorías
7. **Análisis de rotación**: Productos más/menos vendidos
8. **Precios de venta**: Gestión de precios y márgenes
9. **Alertas automáticas**: Notificaciones de stock bajo
10. **Integración con proveedores**: Pedidos automáticos

## 📚 Referencias

- **Documentación Fastify**: https://fastify.dev
- **Prisma ORM**: https://www.prisma.io/docs
- **Pinia Store**: https://pinia.vuejs.org
- **Zod Validation**: https://zod.dev

## ✅ Estado del Módulo

**Backend:** ✅ COMPLETO Y FUNCIONAL

- CRUD completo implementado
- Validaciones robustas
- Autenticación JWT
- Control de acceso por roles
- Manejo de errores
- Logging con Pino

**Frontend:** ✅ COMPLETO Y FUNCIONAL

- Store Pinia completo (396 líneas)
- Todas las operaciones CRUD
- Filtros y búsqueda
- Paginación
- Manejo de errores
- TypeScript con tipos completos

**Pendiente:**

- Página ProductosPage.vue (próximo paso)
- Componentes de UI (formularios, tablas)
- Tests unitarios y de integración

---

**Última actualización:** Noviembre 10, 2025
**Autor:** Sistema de Gestión Cervecería USC
