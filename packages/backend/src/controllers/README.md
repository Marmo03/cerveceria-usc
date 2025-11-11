# 🌐 Controllers Layer - Presentation

> **Principio**: Esta capa expone la **lógica de negocio** a través de endpoints HTTP (REST API).

---

## 📖 Propósito

El **Controllers Layer** (Presentation Layer) es responsable de:

- **Recibir** peticiones HTTP
- **Validar** datos de entrada (Zod schemas)
- **Delegar** a los use cases
- **Transformar** respuestas para el cliente
- **Manejar** errores HTTP

---

## 📁 Estructura

```
controllers/
├── auth.ts            # 🔐 Autenticación y autorización
├── productos.ts       # 📦 CRUD de productos
├── inventario.ts      # 📊 Movimientos de inventario
├── sales.ts           # 💰 Gestión de ventas
├── reports.ts         # 📈 Reportes e indicadores
└── logistics.ts       # 🚚 Logística y envíos
```

---

## 🏗️ Arquitectura

### Flujo de Request/Response

```
Cliente (Frontend)
      ↓
HTTP Request (JSON)
      ↓
[Middleware] → Auth, Rate Limit, CORS
      ↓
[Controller] → Validación (Zod)
      ↓
[Use Case] → Lógica de negocio
      ↓
[Repository] → Base de datos
      ↓
HTTP Response (JSON)
      ↓
Cliente (Frontend)
```

---

## 🔐 auth.ts

**Propósito**: Autenticación y gestión de usuarios

### Endpoints

#### POST /api/auth/register

```typescript
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@cerveceria.com",
  "password": "SecurePass123!",
  "nombre": "Juan Pérez",
  "rol": "OPERATIVO"
}

→ Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "usuario@cerveceria.com",
    "nombre": "Juan Pérez",
    "rol": "OPERATIVO"
  }
}
```

---

#### POST /api/auth/login

```typescript
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@cerveceria.com",
  "password": "SecurePass123!"
}

→ Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "user": {
      "id": "uuid",
      "email": "usuario@cerveceria.com",
      "rol": "OPERATIVO"
    }
  }
}
```

---

#### GET /api/auth/profile

```typescript
GET /api/auth/profile
Authorization: Bearer {token}

→ Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "usuario@cerveceria.com",
    "nombre": "Juan Pérez",
    "rol": "OPERATIVO",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}
```

**Middleware**: Requiere autenticación JWT

---

## 📦 productos.ts

**Propósito**: Gestión completa del catálogo de productos

### Endpoints

#### GET /api/productos

```typescript
GET /api/productos?categoria=Envases&stockBajo=true&page=1&limit=20
Authorization: Bearer {token}

→ Response 200
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "sku": "BOT-330",
        "nombre": "Botella 330ml",
        "categoria": "Envases",
        "stockActual": 50,
        "stockMin": 100,
        "costo": 1.50,
        "necesitaReabastecimiento": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Filtros soportados**:

- `categoria`: Filtrar por categoría
- `isActive`: Solo activos/inactivos
- `stockBajo`: Solo productos con stock < stockMin
- `proveedorId`: Productos de un proveedor
- `busqueda`: Buscar por SKU o nombre
- `page`/`limit`: Paginación

---

#### GET /api/productos/:id

```typescript
GET /api/productos/uuid
Authorization: Bearer {token}

→ Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "BOT-330",
    "nombre": "Botella 330ml",
    "categoria": "Envases",
    "unidad": "UNIDAD",
    "costo": 1.50,
    "stockActual": 50,
    "stockMin": 100,
    "leadTime": 7,
    "proveedor": {
      "id": "uuid",
      "nombre": "Proveedor XYZ"
    },
    "politica": {
      "estrategia": "EOQ",
      "rop": 80,
      "stockSeguridad": 20
    }
  }
}
```

---

#### POST /api/productos

```typescript
POST /api/productos
Authorization: Bearer {token}
Content-Type: application/json

{
  "sku": "BOT-500",
  "nombre": "Botella 500ml",
  "categoria": "Envases",
  "unidad": "UNIDAD",
  "costo": 2.00,
  "stockActual": 0,
  "stockMin": 50,
  "leadTime": 7,
  "proveedorId": "uuid"
}

→ Response 201
{
  "success": true,
  "data": { ...producto creado }
}
```

**Validaciones**:

- ✅ SKU único
- ✅ Costo > 0
- ✅ stockMin >= 0
- ✅ leadTime >= 1

---

#### PUT /api/productos/:id

```typescript
PUT /api/productos/uuid
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Botella 500ml Premium",
  "costo": 2.50,
  "stockMin": 100
}

→ Response 200
{
  "success": true,
  "data": { ...producto actualizado }
}
```

---

#### DELETE /api/productos/:id

```typescript
DELETE /api/productos/uuid
Authorization: Bearer {token}

→ Response 200
{
  "success": true,
  "message": "Producto eliminado correctamente"
}
```

**Nota**: Es un soft delete (marca `isActive = false`)

---

#### GET /api/productos/:id/politica

```typescript
GET /api/productos/uuid/politica
Authorization: Bearer {token}

→ Response 200
{
  "success": true,
  "data": {
    "estrategia": "EOQ",
    "rop": 80,
    "stockSeguridad": 20,
    "parametrosJSON": {
      "demandaAnual": 5000,
      "costoOrden": 100,
      "costoAlmacenamiento": 5
    }
  }
}
```

---

#### POST /api/productos/:id/politica

```typescript
POST /api/productos/uuid/politica
Authorization: Bearer {token}
Content-Type: application/json

{
  "estrategia": "EOQ",
  "rop": 80,
  "stockSeguridad": 20,
  "parametrosJSON": {
    "demandaAnual": 5000,
    "costoOrden": 100,
    "costoAlmacenamiento": 5
  }
}

→ Response 201
{
  "success": true,
  "data": { ...política creada }
}
```

**Estrategias soportadas**:

- `EOQ`: Economic Order Quantity
- `MANUAL`: Reorden manual
- `JIT`: Just-in-Time (futuro)
- `FIXED_QUANTITY`: Cantidad fija (futuro)

---

## 📊 inventario.ts

**Propósito**: Gestión de movimientos de inventario

### Endpoints

#### POST /api/inventario/movimientos

```typescript
POST /api/inventario/movimientos
Authorization: Bearer {token}
Content-Type: application/json

{
  "productoId": "uuid",
  "tipo": "ENTRADA",
  "cantidad": 100,
  "comentario": "Compra a proveedor ABC",
  "referencia": "OC-2025-001"
}

→ Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "productoId": "uuid",
    "tipo": "ENTRADA",
    "cantidad": 100,
    "stockAnterior": 50,
    "stockNuevo": 150,
    "comentario": "Compra a proveedor ABC",
    "referencia": "OC-2025-001",
    "createdAt": "2025-11-10T10:00:00Z"
  }
}
```

**Tipos**:

- `ENTRADA`: Compras, devoluciones, ajustes positivos
- `SALIDA`: Ventas, devoluciones, ajustes negativos

**Validaciones**:

- ✅ Producto existe
- ✅ Cantidad > 0
- ✅ Si SALIDA: stock suficiente

**Eventos generados**:

- `MovimientoInventarioCreated` → Actualiza KPIs
- `StockBajoDetectado` → Trigger reabastecimiento

---

#### GET /api/inventario/movimientos

```typescript
GET /api/inventario/movimientos?productoId=uuid&tipo=ENTRADA&page=1&limit=20
Authorization: Bearer {token}

→ Response 200
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "productoId": "uuid",
        "tipo": "ENTRADA",
        "cantidad": 100,
        "stockAnterior": 50,
        "stockNuevo": 150,
        "comentario": "Compra a proveedor ABC",
        "createdAt": "2025-11-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 450,
      "totalPages": 23
    }
  }
}
```

**Filtros soportados**:

- `productoId`: Movimientos de un producto
- `tipo`: Solo ENTRADAS o SALIDAS
- `fechaDesde`/`fechaHasta`: Rango de fechas
- `referencia`: Búsqueda por referencia

---

#### GET /api/inventario/resumen

```typescript
GET /api/inventario/resumen
Authorization: Bearer {token}

→ Response 200
{
  "success": true,
  "data": {
    "totalProductos": 150,
    "valorTotalInventario": 125000,
    "productosBajoStock": 12,
    "movimientosMesActual": 450,
    "topProductosMasSalidas": [
      {
        "productoId": "uuid",
        "nombre": "Botella 330ml",
        "totalSalidas": 5000
      }
    ]
  }
}
```

---

#### GET /api/inventario/productos/:id

```typescript
GET /api/inventario/productos/uuid
Authorization: Bearer {token}

→ Response 200
{
  "success": true,
  "data": {
    "producto": {
      "id": "uuid",
      "nombre": "Botella 330ml",
      "stockActual": 150
    },
    "ultimosMovimientos": [...],
    "estadisticas": {
      "entradasMes": 500,
      "salidasMes": 450,
      "rotacion": 3.2,
      "diasInventario": 10
    }
  }
}
```

---

## 💰 sales.ts

**Propósito**: Gestión de ventas

### Endpoints

- `POST /api/sales` - Registrar venta
- `GET /api/sales` - Listar ventas
- `GET /api/sales/:id` - Detalle de venta

---

## 📈 reports.ts

**Propósito**: Reportes e indicadores

### Endpoints

- `GET /api/reports/kpis` - Dashboard de KPIs
- `GET /api/reports/rotacion` - Rotación de inventario
- `GET /api/reports/fill-rate` - Fill rate
- `GET /api/reports/tiempo-ciclo` - Tiempo de ciclo

---

## 🚚 logistics.ts

**Propósito**: Logística y rastreo

### Endpoints

- `POST /api/logistics/envios` - Crear envío
- `GET /api/logistics/envios` - Listar envíos
- `PUT /api/logistics/envios/:id` - Actualizar estado
- `GET /api/logistics/tracking/:numero` - Rastrear envío

---

## 🛡️ Validación con Zod

Todos los endpoints validan datos de entrada con Zod:

```typescript
const CrearProductoSchema = z.object({
  sku: z.string().min(1).max(50),
  nombre: z.string().min(1).max(200),
  costo: z.number().positive(),
  stockMin: z.number().int().min(0),
})

// Uso en endpoint
fastify.post<{ Body: CrearProductoBody }>(
  '/productos',
  {
    schema: {
      body: CrearProductoSchema,
    },
  },
  async (request, reply) => {
    const validationResult = validateZodSchema(
      CrearProductoSchema,
      request.body
    )
    if (!validationResult.success) {
      return reply.status(400).send(errorResponse(validationResult.error))
    }

    // ... lógica
  }
)
```

**Ventajas**:

- ✅ Type-safe (TypeScript infiere tipos)
- ✅ Errores descriptivos
- ✅ Validación automática

---

## 🚨 Manejo de Errores

```typescript
// Errores del negocio
class NotFoundError extends Error {
  statusCode = 404
}

class ValidationError extends Error {
  statusCode = 400
}

class UnauthorizedError extends Error {
  statusCode = 401
}

// Error handler global (server.ts)
server.setErrorHandler((error, request, reply) => {
  if (error.statusCode) {
    return reply.status(error.statusCode).send({
      success: false,
      error: error.message,
    })
  }

  // Error no manejado
  logger.error(error)
  return reply.status(500).send({
    success: false,
    error: 'Internal Server Error',
  })
})
```

---

## 🔒 Autenticación

Middleware de autenticación JWT:

```typescript
// middleware/auth.ts
async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' })
  }
}

// Uso en controlador
fastify.get(
  '/productos',
  { onRequest: [authenticate] },
  async (request, reply) => {
    // request.user está disponible
  }
)
```

---

## 📚 Documentación con Swagger

Todos los endpoints están documentados con Swagger:

```typescript
fastify.get(
  '/productos',
  {
    schema: {
      tags: ['productos'],
      summary: 'Listar productos',
      description: 'Obtiene lista de productos con filtros opcionales',
      querystring: FiltrosProductoSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
  },
  handler
)
```

Accesible en: `http://localhost:3000/documentation`

---

## 🧪 Testing de Controllers

```typescript
describe('ProductosController', () => {
  it('GET /productos should return paginated list', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/productos?page=1&limit=10',
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      success: true,
      data: {
        items: expect.any(Array),
        pagination: expect.any(Object),
      },
    })
  })
})
```

---

## 📋 Checklist para Agregar Nuevo Endpoint

- [ ] Crear schema Zod para validación
- [ ] Definir tipos TypeScript
- [ ] Implementar handler con try/catch
- [ ] Agregar documentación Swagger
- [ ] Agregar middleware de auth si es necesario
- [ ] Probar con Postman/Thunder Client
- [ ] Escribir test de integración
- [ ] Actualizar CHANGELOG

---

**Mantenedor**: @Marmo03  
**Última actualización**: 10 de Noviembre 2025
