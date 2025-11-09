# API's

Cada Endpoint cumple una función específica dentro de la API y se accede mediante diferentes métodos HTTP, como GET, POST, PUT y DELETE. Todos los endpoints requieren autenticación excepto los de login y registro.

## Autenticación

### POST /api/auth/login

Descripción:
Este endpoint permite autenticar un usuario en el sistema.

Parámetros:

```json
{
  "email": "string",
  "password": "string"
}
```

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cm2xyz123",
    "email": "admin@cerveceria.com",
    "firstName": "Admin",
    "lastName": "Usuario",
    "role": {
      "id": "cm2abc789",
      "name": "Administrador",
      "permissions": { ... }
    }
  }
}
```

### POST /api/auth/register

Descripción:
Este endpoint permite registrar un nuevo usuario en el sistema.

Parámetros:

```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "roleId": "string"
}
```

Respuesta exitosa:
Código de estado: 201 (Created)

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "cm2xyz456",
    "email": "nuevo@cerveceria.com"
  }
}
```

### GET /api/auth/profile

Descripción:
Este endpoint devuelve la información del usuario autenticado.

Parámetros:

- Header: Authorization: Bearer {token}

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "user": {
    "id": "cm2xyz123",
    "email": "admin@cerveceria.com",
    "firstName": "Admin",
    "lastName": "Usuario",
    "role": {
      "name": "Administrador"
    }
  }
}
```

## Productos

### GET /api/products

Descripción:
Este endpoint devuelve la lista completa de productos activos.

Parámetros:

- Ninguno

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "products": [
    {
      "id": "cm2prod001",
      "sku": "CERV-001",
      "name": "Cerveza Lager",
      "description": "Cerveza tipo lager 355ml",
      "unitPrice": 2500,
      "currentStock": 500,
      "isActive": true
    }
  ]
}
```

### GET /api/products/:id

Descripción:
Este endpoint devuelve los detalles de un producto específico.

Parámetros:

- id: ID del producto

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "product": {
    "id": "cm2prod001",
    "sku": "CERV-001",
    "name": "Cerveza Lager",
    "description": "Cerveza tipo lager 355ml",
    "unitPrice": 2500,
    "currentStock": 500,
    "minStockLevel": 100,
    "maxStockLevel": 1000,
    "reorderPoint": 200,
    "isActive": true
  }
}
```

### POST /api/products

Descripción:
Este endpoint permite crear un nuevo producto.

Parámetros:

```json
{
  "sku": "CERV-002",
  "name": "Cerveza IPA",
  "description": "Cerveza estilo IPA 355ml",
  "unitPrice": 3000,
  "currentStock": 0,
  "minStockLevel": 50,
  "maxStockLevel": 500,
  "reorderPoint": 100
}
```

Respuesta exitosa:
Código de estado: 201 (Created)

```json
{
  "success": true,
  "message": "Producto creado exitosamente",
  "product": {
    "id": "cm2prod002",
    "sku": "CERV-002",
    "name": "Cerveza IPA"
  }
}
```

### PUT /api/products/:id

Descripción:
Este endpoint permite actualizar un producto existente.

Parámetros:

- id: ID del producto
- Body: Campos a actualizar

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "message": "Producto actualizado exitosamente",
  "product": {
    "id": "cm2prod001",
    "name": "Cerveza Lager Premium"
  }
}
```

### DELETE /api/products/:id

Descripción:
Este endpoint permite eliminar (desactivar) un producto.

Parámetros:

- id: ID del producto

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "message": "Producto eliminado exitosamente"
}
```

## Inventario

### GET /api/inventory/movements

Descripción:
Este endpoint devuelve el historial de movimientos de inventario.

Parámetros:

- Query opcional: productId, startDate, endDate

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "movements": [
    {
      "id": "cm2mov001",
      "productId": "cm2prod001",
      "movementType": "IN",
      "quantity": 100,
      "previousStock": 400,
      "newStock": 500,
      "reason": "Compra de proveedor",
      "createdAt": "2024-11-09T10:00:00Z",
      "createdBy": {
        "firstName": "Admin",
        "lastName": "Usuario"
      }
    }
  ]
}
```

### POST /api/inventory/movements

Descripción:
Este endpoint permite registrar un nuevo movimiento de inventario.

Parámetros:

```json
{
  "productId": "cm2prod001",
  "movementType": "IN" | "OUT",
  "quantity": 100,
  "reason": "Compra de proveedor",
  "referenceNumber": "PO-2024-001"
}
```

Respuesta exitosa:
Código de estado: 201 (Created)

```json
{
  "success": true,
  "message": "Movimiento registrado exitosamente",
  "movement": {
    "id": "cm2mov002",
    "newStock": 600
  }
}
```

### GET /api/inventory/stock-levels

Descripción:
Este endpoint devuelve los niveles de stock actuales de todos los productos.

Parámetros:

- Ninguno

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "stockLevels": [
    {
      "productId": "cm2prod001",
      "productName": "Cerveza Lager",
      "currentStock": 500,
      "minStockLevel": 100,
      "reorderPoint": 200,
      "status": "NORMAL"
    }
  ]
}
```

## Solicitudes de Compra

### GET /api/purchase-requests

Descripción:
Este endpoint devuelve todas las solicitudes de compra.

Parámetros:

- Query opcional: status, createdBy

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "requests": [
    {
      "id": "cm2req001",
      "requestNumber": "REQ-2024-001",
      "status": "PENDING",
      "totalAmount": 250000,
      "requestedBy": {
        "firstName": "Operario",
        "lastName": "Usuario"
      },
      "createdAt": "2024-11-09T10:00:00Z"
    }
  ]
}
```

### POST /api/purchase-requests

Descripción:
Este endpoint permite crear una nueva solicitud de compra.

Parámetros:

```json
{
  "products": [
    {
      "productId": "cm2prod001",
      "quantity": 100,
      "unitPrice": 2500
    }
  ],
  "supplierId": "cm2sup001",
  "notes": "Pedido urgente"
}
```

Respuesta exitosa:
Código de estado: 201 (Created)

```json
{
  "success": true,
  "message": "Solicitud creada exitosamente",
  "request": {
    "id": "cm2req002",
    "requestNumber": "REQ-2024-002",
    "status": "PENDING"
  }
}
```

### PUT /api/purchase-requests/:id/approve

Descripción:
Este endpoint permite aprobar una solicitud de compra.

Parámetros:

- id: ID de la solicitud
- Body: { "comments": "string" }

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "message": "Solicitud aprobada exitosamente",
  "request": {
    "id": "cm2req001",
    "status": "APPROVED"
  }
}
```

### PUT /api/purchase-requests/:id/reject

Descripción:
Este endpoint permite rechazar una solicitud de compra.

Parámetros:

- id: ID de la solicitud
- Body: { "reason": "string" }

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "message": "Solicitud rechazada",
  "request": {
    "id": "cm2req001",
    "status": "REJECTED"
  }
}
```

## Logística

### GET /api/logistics/shipments

Descripción:
Este endpoint devuelve todas los envíos.

Parámetros:

- Query opcional: status, trackingNumber

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "shipments": [
    {
      "id": "cm2ship001",
      "trackingNumber": "SHIP-2024-001",
      "status": "IN_TRANSIT",
      "origin": "Bodega Central",
      "destination": "Cliente ABC",
      "estimatedDelivery": "2024-11-15T00:00:00Z",
      "carrier": {
        "name": "Transportes XYZ"
      }
    }
  ]
}
```

### POST /api/logistics/shipments

Descripción:
Este endpoint permite crear un nuevo envío.

Parámetros:

```json
{
  "purchaseRequestId": "cm2req001",
  "carrierId": "cm2car001",
  "origin": "Bodega Central",
  "destination": "Cliente ABC",
  "estimatedDelivery": "2024-11-15"
}
```

Respuesta exitosa:
Código de estado: 201 (Created)

```json
{
  "success": true,
  "message": "Envío creado exitosamente",
  "shipment": {
    "id": "cm2ship002",
    "trackingNumber": "SHIP-2024-002"
  }
}
```

### PUT /api/logistics/shipments/:id/status

Descripción:
Este endpoint permite actualizar el estado de un envío.

Parámetros:

- id: ID del envío
- Body: { "status": "IN_TRANSIT" | "IN_DELIVERY" | "DELIVERED" | "CANCELLED" }

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "message": "Estado actualizado exitosamente",
  "shipment": {
    "id": "cm2ship001",
    "status": "DELIVERED"
  }
}
```

## Reportes y KPIs

### GET /api/reports/kpis

Descripción:
Este endpoint devuelve los indicadores clave de rendimiento.

Parámetros:

- Query opcional: startDate, endDate

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "kpis": {
    "inventoryTurnover": 5.2,
    "fillRate": 0.95,
    "averageApprovalTime": 48,
    "onTimeDeliveryRate": 0.92,
    "totalOrders": 150,
    "pendingOrders": 12
  }
}
```

### GET /api/reports/inventory-summary

Descripción:
Este endpoint devuelve un resumen del estado del inventario.

Parámetros:

- Ninguno

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "summary": {
    "totalProducts": 50,
    "lowStockProducts": 5,
    "outOfStockProducts": 2,
    "totalValue": 5000000
  }
}
```

### GET /api/reports/sales-summary

Descripción:
Este endpoint devuelve un resumen de ventas.

Parámetros:

- Query: startDate, endDate

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "success": true,
  "summary": {
    "totalSales": 10000000,
    "totalOrders": 200,
    "averageOrderValue": 50000,
    "topProducts": [
      {
        "productName": "Cerveza Lager",
        "unitsSold": 1500
      }
    ]
  }
}
```

## Health Check

### GET /health

Descripción:
Este endpoint verifica el estado del servidor y la conexión a la base de datos.

Parámetros:

- Ninguno

Respuesta exitosa:
Código de estado: 200 (OK)

```json
{
  "status": "ok",
  "timestamp": "2024-11-09T10:00:00.000Z",
  "version": "1.0.0",
  "database": "connected"
}
```

## Códigos de Estado HTTP

- **200 OK** - Solicitud exitosa
- **201 Created** - Recurso creado exitosamente
- **400 Bad Request** - Datos de entrada inválidos
- **401 Unauthorized** - No autenticado o token inválido
- **403 Forbidden** - No tiene permisos para esta acción
- **404 Not Found** - Recurso no encontrado
- **500 Internal Server Error** - Error interno del servidor

## Autenticación

Todos los endpoints (excepto `/api/auth/login` y `/api/auth/register`) requieren un token JWT en el header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

El token se obtiene mediante el endpoint de login y tiene una validez de 24 horas.
