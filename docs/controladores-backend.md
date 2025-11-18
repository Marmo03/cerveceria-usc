# Controladores Backend

En esta sección de la documentación, encontrarás información detallada sobre los controladores backend de nuestra aplicación.

## Controlador de Autenticación

El controlador `AuthController` se encarga de gestionar las operaciones relacionadas con la autenticación y autorización de usuarios en la aplicación.

### Iniciar Sesión

Endpoint: `POST /api/auth/login`

Este endpoint permite autenticar un usuario en el sistema. Se espera recibir los siguientes datos en formato JSON:

- `email`: Email del usuario
- `password`: Contraseña del usuario

El controlador realiza las siguientes operaciones:

1. Validar los datos de entrada usando Zod
2. Buscar el usuario en la base de datos por email
3. Verificar que el usuario esté activo
4. Comparar la contraseña usando Bcrypt
5. Generar un token JWT con la información del usuario
6. Retornar el token y los datos del usuario

Ejemplo de solicitud:

```json
{
  "email": "admin@cerveceria.com",
  "password": "admin123"
}
```

Ejemplo de respuesta exitosa:

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
      "id": "cm2role001",
      "name": "Administrador",
      "permissions": {
        "canCreateProducts": true,
        "canApproveRequests": true
      }
    }
  }
}
```

### Registrar Usuario

Endpoint: `POST /api/auth/register`

Este endpoint permite registrar un nuevo usuario en el sistema.

Parámetros de solicitud:

- `email`: Email del usuario
- `password`: Contraseña (mínimo 6 caracteres)
- `firstName`: Nombre del usuario
- `lastName`: Apellido del usuario
- `roleId`: ID del rol a asignar

El controlador `AuthController` se encarga de procesar esta solicitud y realizar las siguientes operaciones:

1. Validar los datos de entrada con Zod
2. Verificar que el email no esté ya registrado
3. Validar que el rol existe en el sistema
4. Hash de la contraseña usando Bcrypt con salt rounds de 12
5. Crear el usuario en la tabla `users` de la base de datos
6. Retornar la información del usuario creado

Ejemplo de solicitud:

```json
{
  "email": "nuevo@cerveceria.com",
  "password": "password123",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "roleId": "cm2role002"
}
```

La respuesta del servidor será un objeto JSON con la siguiente estructura:

```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "user": {
    "id": "cm2user123",
    "email": "nuevo@cerveceria.com",
    "firstName": "Nuevo",
    "lastName": "Usuario",
    "role": {
      "id": "cm2role002",
      "name": "Operario"
    }
  }
}
```

### Obtener Perfil

Endpoint: `GET /api/auth/profile`

Este endpoint permite obtener la información del usuario autenticado.

Parámetros:

- Header: Authorization: Bearer {token}

El controlador extrae el token JWT del header, valida la firma y retorna la información del usuario asociado.

## Controlador de Productos

El controlador `ProductsController` gestiona todas las operaciones CRUD relacionadas con los productos de la cervecería.

### Listar Productos

Endpoint: `GET /api/products`

Este endpoint devuelve la lista completa de productos activos en el sistema.

El controlador realiza una consulta a la tabla `products` filtrando solo los productos con `isActive = true` y ordenándolos alfabéticamente por nombre.

Ejemplo de respuesta:

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
    },
    {
      "id": "cm2prod002",
      "sku": "CERV-002",
      "name": "Cerveza IPA",
      "description": "Cerveza estilo IPA 355ml",
      "unitPrice": 3000,
      "currentStock": 300,
      "isActive": true
    }
  ]
}
```

### Obtener Producto por ID

Endpoint: `GET /api/products/:id`

Este endpoint permite obtener los detalles completos de un producto específico identificado por su ID.

Parámetros de ruta:

- `id`: ID del producto

El controlador busca el producto en la base de datos usando el ID proporcionado. Si no se encuentra, retorna un error 404.

Ejemplo de respuesta:

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
    "isActive": true,
    "createdAt": "2024-10-08T10:00:00Z",
    "updatedAt": "2024-11-09T10:00:00Z"
  }
}
```

### Crear Producto

Endpoint: `POST /api/products`

Este endpoint permite crear un nuevo producto en el catálogo.

Parámetros de solicitud:

```json
{
  "sku": "CERV-003",
  "name": "Cerveza Stout",
  "description": "Cerveza oscura estilo stout 355ml",
  "unitPrice": 3500,
  "currentStock": 0,
  "minStockLevel": 50,
  "maxStockLevel": 500,
  "reorderPoint": 100
}
```

El controlador realiza las siguientes validaciones:

- SKU único
- Nombre no vacío
- Precio mayor a 0
- Niveles de stock válidos

Luego inserta el nuevo producto en la tabla `products`.

### Actualizar Producto

Endpoint: `PUT /api/products/:id`

Este endpoint permite actualizar los datos de un producto existente.

Parámetros de ruta:

- `id`: ID del producto a actualizar

Parámetros de solicitud:
Se envía un objeto JSON con los campos a actualizar.

Ejemplo:

```json
{
  "name": "Cerveza Lager Premium",
  "unitPrice": 2800,
  "currentStock": 550
}
```

El controlador actualiza solo los campos proporcionados en la solicitud.

### Eliminar Producto

Endpoint: `DELETE /api/products/:id`

Este endpoint permite eliminar (desactivar) un producto del catálogo.

Parámetros de ruta:

- `id`: ID del producto a eliminar

El sistema realiza una eliminación lógica, estableciendo `isActive = false` en lugar de eliminar físicamente el registro.

## Controlador de Inventario

El controlador `InventoryController` gestiona los movimientos de inventario y el control de stock.

### Registrar Movimiento

Endpoint: `POST /api/inventory/movements`

Este endpoint permite registrar un movimiento de inventario (entrada o salida).

Parámetros:

```json
{
  "productId": "cm2prod001",
  "movementType": "IN",
  "quantity": 100,
  "reason": "Compra de proveedor",
  "referenceNumber": "PO-2024-001"
}
```

El controlador realiza las siguientes operaciones:

1. Validar que el producto existe
2. Validar que la cantidad sea positiva
3. Si es salida (OUT), verificar que hay suficiente stock
4. Calcular el nuevo stock
5. Crear registro en la tabla `movimientos_inventario`
6. Actualizar el campo `currentStock` en la tabla `products`
7. Disparar evento para actualizar KPIs (Observer Pattern)

### Obtener Movimientos

Endpoint: `GET /api/inventory/movements`

Este endpoint devuelve el historial de movimientos de inventario con filtros opcionales.

Query parameters opcionales:

- `productId`: Filtrar por producto
- `startDate`: Fecha inicio
- `endDate`: Fecha fin
- `movementType`: IN o OUT

El controlador construye una consulta dinámica con Prisma incluyendo las relaciones con `product` y `user` (creador del movimiento).

## Controlador de Solicitudes de Compra

El controlador `PurchaseRequestsController` gestiona el flujo completo de solicitudes de compra y aprobaciones.

### Crear Solicitud

Endpoint: `POST /api/purchase-requests`

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
  "notes": "Pedido urgente para fin de mes"
}
```

El controlador realiza las siguientes operaciones:

1. Validar que todos los productos existen
2. Calcular el monto total de la solicitud
3. Generar número de solicitud único (REQ-YYYY-NNN)
4. Crear registro en tabla `solicitudes_compra`
5. Crear registros relacionados en tabla de detalles
6. Iniciar flujo de aprobación usando Chain of Responsibility Pattern
7. Asignar al primer aprobador según el monto

### Aprobar Solicitud

Endpoint: `PUT /api/purchase-requests/:id/approve`

Este endpoint permite a un aprobador aprobar una solicitud de compra.

El controlador verifica:

- El usuario tiene rol de Aprobador
- La solicitud está en estado PENDING
- El usuario es el aprobador asignado actual
- Registra la aprobación en la tabla `aprobaciones`
- Avanza al siguiente nivel o marca como APPROVED si es el último nivel

### Rechazar Solicitud

Endpoint: `PUT /api/purchase-requests/:id/reject`

Similar al anterior pero cambia el estado a REJECTED y no continúa la cadena de aprobación.

## Controlador de Logística

El controlador `LogisticsController` gestiona los envíos y el tracking de entregas.

### Crear Envío

Endpoint: `POST /api/logistics/shipments`

Este endpoint crea un nuevo envío a partir de una solicitud de compra aprobada.

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

El controlador:

1. Genera número de tracking único (SHIP-YYYY-NNN)
2. Crea registro en tabla `envios`
3. Crea ruta de envío en tabla `rutas_envio`
4. Establece estado inicial como PENDING

### Actualizar Estado de Envío

Endpoint: `PUT /api/logistics/shipments/:id/status`

Este endpoint actualiza el estado de un envío en su ruta.

Estados posibles:

- PENDING (Pendiente)
- IN_TRANSIT (En tránsito)
- IN_DELIVERY (En entrega)
- DELIVERED (Entregado)
- CANCELLED (Cancelado)

Cada cambio de estado se registra en la tabla `estados_envio` con timestamp para tracking completo.

## Controlador de Reportes

El controlador `ReportsController` genera reportes e indicadores del sistema.

### Obtener KPIs

Endpoint: `GET /api/reports/kpis`

Este endpoint calcula y retorna los indicadores clave de rendimiento:

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

Cada KPI se calcula mediante consultas SQL complejas usando Prisma:

- **Inventory Turnover**: COGS / Average Inventory
- **Fill Rate**: Órdenes completadas / Total órdenes
- **Average Approval Time**: Promedio de tiempo entre creación y aprobación
- **On-Time Delivery**: Entregas a tiempo / Total entregas

Los KPIs se actualizan automáticamente cuando ocurren eventos relevantes gracias al Observer Pattern implementado en el sistema.

## Manejo de Errores

Todos los controladores implementan manejo de errores consistente:

**Validación con Zod:**

```typescript
try {
  const data = schema.parse(request.body);
} catch (error) {
  if (error instanceof z.ZodError) {
    return reply.status(400).send({
      success: false,
      message: "Datos inválidos",
      errors: error.errors,
    });
  }
}
```

**Errores de Base de Datos:**

```typescript
catch (error) {
  fastify.log.error('Error:', error)
  return reply.status(500).send({
    success: false,
    message: 'Error interno del servidor'
  })
}
```

**Recursos No Encontrados:**

```typescript
if (!resource) {
  return reply.status(404).send({
    success: false,
    message: "Recurso no encontrado",
  });
}
```

Esta arquitectura de controladores sigue los principios de la Arquitectura Hexagonal, separando la lógica de presentación (HTTP) de la lógica de negocio, facilitando el mantenimiento y testing de la aplicación.
