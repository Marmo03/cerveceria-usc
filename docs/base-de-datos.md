# Base de Datos

## Esquema de la Base de Datos

La aplicación utiliza PostgreSQL 16 como sistema de gestión de base de datos relacional. El esquema está diseñado siguiendo principios de normalización y separación de dominios.

## Dominios del Sistema

La base de datos está organizada en 6 dominios principales:

### 1. Dominio de Usuarios y Roles

- `roles` - Roles del sistema
- `users` - Usuarios de la aplicación

### 2. Dominio de Productos e Inventario

- `proveedores` - Proveedores de productos
- `productos` - Catálogo de productos
- `movimientos_inventario` - Historial de movimientos

### 3. Dominio de Reabastecimiento

- `politicas_abastecimiento` - Estrategias de reabastecimiento
- `solicitudes_compra` - Solicitudes de compra
- `aprobaciones` - Aprobaciones de solicitudes

### 4. Dominio de KPIs

- `indicadores` - Indicadores de rendimiento

### 5. Dominio de Importaciones

- `importaciones` - Procesamiento de archivos CSV

### 6. Dominio de Logística

- `transportistas` - Empresas de transporte
- `envios` - Envíos de productos
- `productos_envio` - Productos en cada envío
- `rutas_envio` - Rutas de envío
- `estados_envio` - Historial de estados

## Modelos Principales

### Tabla: roles

Almacena los roles del sistema con sus permisos.

| Campo       | Tipo          | Descripción                      |
| ----------- | ------------- | -------------------------------- |
| id          | String (CUID) | Identificador único              |
| name        | String        | Nombre del rol (único)           |
| description | String        | Descripción del rol              |
| permissions | String (JSON) | Permisos del rol en formato JSON |
| createdAt   | DateTime      | Fecha de creación                |
| updatedAt   | DateTime      | Fecha de actualización           |

**Roles del sistema:**

- ADMIN - Administrador con acceso completo
- OPERARIO - Gestión de inventario y productos
- APROBADOR - Aprobación de solicitudes
- ANALISTA - Consulta de datos y reportes

### Tabla: users

Almacena la información de los usuarios del sistema.

| Campo     | Tipo          | Descripción                    |
| --------- | ------------- | ------------------------------ |
| id        | String (CUID) | Identificador único            |
| email     | String        | Email del usuario (único)      |
| password  | String        | Contraseña hasheada con Bcrypt |
| firstName | String        | Nombre del usuario             |
| lastName  | String        | Apellido del usuario           |
| isActive  | Boolean       | Usuario activo/inactivo        |
| roleId    | String        | Referencia al rol              |
| createdAt | DateTime      | Fecha de creación              |
| updatedAt | DateTime      | Fecha de actualización         |

**Relaciones:**

- Pertenece a un `Role`
- Tiene muchos `MovimientoInventario`
- Tiene muchas `SolicitudCompra`
- Tiene muchas `Aprobacion`
- Tiene muchas `Importacion`

### Tabla: productos

Tabla principal del catálogo de productos.

| Campo       | Tipo          | Descripción                        |
| ----------- | ------------- | ---------------------------------- |
| id          | String (CUID) | Identificador único                |
| sku         | String        | Código SKU del producto (único)    |
| nombre      | String        | Nombre del producto                |
| categoria   | String        | Categoría del producto             |
| unidad      | String        | Unidad de medida (L, KG, Unidades) |
| proveedorId | String        | Referencia al proveedor            |
| stockActual | Int           | Stock actual en inventario         |
| stockMin    | Int           | Stock mínimo para alertas          |
| leadTime    | Int           | Tiempo de entrega en días          |
| costo       | Float         | Costo unitario del producto        |
| isActive    | Boolean       | Producto activo/inactivo           |
| createdAt   | DateTime      | Fecha de creación                  |
| updatedAt   | DateTime      | Fecha de actualización             |

**Relaciones:**

- Pertenece a un `Proveedor`
- Tiene muchos `MovimientoInventario`
- Tiene una `PoliticaAbastecimiento`
- Tiene muchas `SolicitudCompra`
- Tiene muchos `ProductoEnvio`

### Tabla: movimientos_inventario

Registra todos los movimientos de entrada y salida de inventario.

| Campo      | Tipo          | Descripción                                  |
| ---------- | ------------- | -------------------------------------------- |
| id         | String (CUID) | Identificador único                          |
| productoId | String        | Referencia al producto                       |
| tipo       | String        | Tipo de movimiento: "ENTRADA" o "SALIDA"     |
| cantidad   | Int           | Cantidad del movimiento                      |
| fecha      | DateTime      | Fecha del movimiento                         |
| usuarioId  | String        | Usuario que registró el movimiento           |
| comentario | String        | Comentario opcional                          |
| referencia | String        | Referencia externa (ej: número de solicitud) |
| createdAt  | DateTime      | Fecha de registro                            |

**Relaciones:**

- Pertenece a un `Producto`
- Pertenece a un `User`

### Tabla: politicas_abastecimiento

Define las estrategias de reabastecimiento para cada producto (Strategy Pattern).

| Campo          | Tipo          | Descripción                                          |
| -------------- | ------------- | ---------------------------------------------------- |
| id             | String (CUID) | Identificador único                                  |
| productoId     | String        | Referencia al producto (única)                       |
| estrategia     | String        | Estrategia: "EOQ", "MANUAL", "JIT", "FIXED_QUANTITY" |
| rop            | Int           | Reorder Point (punto de reorden)                     |
| stockSeguridad | Int           | Stock de seguridad                                   |
| parametrosJSON | String (JSON) | Parámetros específicos de la estrategia              |
| createdAt      | DateTime      | Fecha de creación                                    |
| updatedAt      | DateTime      | Fecha de actualización                               |

**Estrategias disponibles:**

- **EOQ** - Economic Order Quantity
- **MANUAL** - Reorden manual
- **JIT** - Just in Time
- **FIXED_QUANTITY** - Cantidad fija

### Tabla: solicitudes_compra

Gestiona las solicitudes de compra que requieren aprobación.

| Campo              | Tipo          | Descripción                                                               |
| ------------------ | ------------- | ------------------------------------------------------------------------- |
| id                 | String (CUID) | Identificador único                                                       |
| productoId         | String        | Referencia al producto                                                    |
| cantidad           | Int           | Cantidad solicitada                                                       |
| estado             | String        | Estado: "BORRADOR", "EN_APROBACION", "APROBADA", "RECHAZADA", "CANCELADA" |
| creadorId          | String        | Usuario que creó la solicitud                                             |
| aprobadorActualId  | String        | Aprobador actual en la cadena                                             |
| historialJSON      | String (JSON) | Historial de cambios                                                      |
| fechaCreacion      | DateTime      | Fecha de creación                                                         |
| fechaActualizacion | DateTime      | Fecha de última actualización                                             |

**Relaciones:**

- Pertenece a un `Producto`
- Pertenece a un `User` (creador)
- Pertenece a un `User` (aprobador actual)
- Tiene muchas `Aprobacion`
- Tiene muchos `Envio`

### Tabla: aprobaciones

Registra las aprobaciones de solicitudes (Chain of Responsibility Pattern).

| Campo       | Tipo          | Descripción                                  |
| ----------- | ------------- | -------------------------------------------- |
| id          | String (CUID) | Identificador único                          |
| solicitudId | String        | Referencia a la solicitud                    |
| nivel       | Int           | Nivel de aprobación (1, 2, 3...)             |
| aprobadorId | String        | Usuario aprobador                            |
| estado      | String        | Estado: "PENDIENTE", "APROBADA", "RECHAZADA" |
| comentario  | String        | Comentario del aprobador                     |
| fecha       | DateTime      | Fecha de aprobación                          |

**Flujo de aprobación:**

1. Nivel 1: Aprobador Operativo
2. Nivel 2: Aprobador Gerencial
3. Nivel 3: Aprobador Ejecutivo

### Tabla: envios

Gestiona los envíos de productos a clientes.

| Campo             | Tipo          | Descripción                         |
| ----------------- | ------------- | ----------------------------------- |
| id                | String (CUID) | Identificador único                 |
| numeroGuia        | String        | Número de guía/tracking (único)     |
| solicitudCompraId | String        | Referencia a solicitud de compra    |
| transportistaId   | String        | Referencia al transportista         |
| origen            | String        | Dirección de origen                 |
| destino           | String        | Dirección de destino                |
| estado            | String        | Estado del envío                    |
| prioridad         | String        | Prioridad: "ALTA", "NORMAL", "BAJA" |
| costoEnvio        | Float         | Costo del envío                     |
| pesoTotal         | Float         | Peso en KG                          |
| volumenTotal      | Float         | Volumen en m³                       |
| fechaEstimada     | DateTime      | Fecha estimada de entrega           |
| fechaEnvio        | DateTime      | Fecha de envío                      |
| fechaEntrega      | DateTime      | Fecha de entrega real               |
| observaciones     | String        | Observaciones adicionales           |
| metadataJSON      | String (JSON) | Datos adicionales                   |
| createdAt         | DateTime      | Fecha de creación                   |
| updatedAt         | DateTime      | Fecha de actualización              |

**Estados del envío:**

- PENDIENTE - En preparación
- EN_PREPARACION - Preparando el envío
- EN_TRANSITO - En camino
- EN_ADUANA - Trámites aduaneros
- EN_ENTREGA - En proceso de entrega
- ENTREGADO - Entregado exitosamente
- CANCELADO - Envío cancelado
- DEVUELTO - Envío devuelto

**Relaciones:**

- Pertenece a un `Transportista`
- Pertenece a una `SolicitudCompra`
- Tiene muchos `ProductoEnvio`
- Tiene muchas `RutaEnvio`
- Tiene muchos `EstadoEnvio`

### Tabla: indicadores

Almacena los KPIs calculados del sistema (Observer Pattern).

| Campo        | Tipo          | Descripción                                    |
| ------------ | ------------- | ---------------------------------------------- |
| id           | String (CUID) | Identificador único                            |
| tipo         | String        | Tipo de indicador                              |
| periodo      | String        | Período del cálculo (ej: "2024-10", "2024-Q3") |
| valor        | Float         | Valor del indicador                            |
| metadataJSON | String (JSON) | Metadata adicional                             |
| fechaCalculo | DateTime      | Fecha del cálculo                              |
| createdAt    | DateTime      | Fecha de registro                              |

**Tipos de indicadores:**

- **ROTACION_INVENTARIO** - Tasa de rotación de inventario
- **FILL_RATE** - Tasa de cumplimiento de pedidos
- **TIEMPO_CICLO** - Tiempo promedio de ciclo
- **NIVEL_SERVICIO** - Nivel de servicio al cliente
- **BACKORDERS** - Cantidad de pedidos pendientes
- **COSTO_INVENTARIO** - Costo total del inventario

## Relaciones entre Tablas

### Diagrama ER Simplificado

```
roles (1) ─────< (N) users
                      │
                      ├──< (N) movimientos_inventario >──< (1) productos
                      │                                          │
                      ├──< (N) solicitudes_compra ──────────────┤
                      │         │                                │
                      │         └──< (N) aprobaciones            │
                      │         │                                │
                      │         └──< (N) envios                  │
                      │                  │                       │
                      │                  ├──< (N) productos_envio ┘
                      │                  ├──< (N) rutas_envio
                      │                  └──< (N) estados_envio
                      │
                      └──< (N) importaciones

proveedores (1) ────< (N) productos ───< (1) politicas_abastecimiento

transportistas (1) ──< (N) envios
```

## Índices y Optimizaciones

La base de datos incluye índices automáticos en:

- Campos `@unique`: `email`, `sku`, `numeroGuia`
- Claves primarias: todos los campos `id`
- Claves foráneas: todos los campos `*Id`

PostgreSQL crea índices B-tree automáticamente para estas columnas, optimizando las consultas.

## Migraciones

El sistema usa Prisma Migrations para el control de versiones del esquema:

```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_descriptivo

# Aplicar migraciones en producción
npx prisma migrate deploy

# Ver estado de migraciones
npx prisma migrate status
```

## Seed Data

El sistema incluye datos de prueba para desarrollo:

```bash
npm run db:seed
```

**Datos incluidos:**

- 4 roles (Admin, Operario, Aprobador, Analista)
- 4 usuarios de prueba (uno por rol)
- 10+ productos de ejemplo
- 5 proveedores
- 3 transportistas
- Movimientos de inventario de ejemplo
- Políticas de abastecimiento

## Backup y Restore

### Crear backup:

```bash
pg_dump -h localhost -U cerveceria_user cerveceria_usc > backup.sql
```

### Restaurar backup:

```bash
psql -h localhost -U cerveceria_user cerveceria_usc < backup.sql
```

## Características de PostgreSQL Utilizadas

- **JSONB** - Almacenamiento eficiente de datos JSON (permissions, metadata)
- **Triggers** - Disparadores para actualizar campos automáticamente
- **Constraints** - Restricciones de integridad referencial
- **Transactions** - Transacciones ACID para operaciones complejas
- **Full-Text Search** - Búsqueda de texto completo (futuro)

## Mejores Prácticas Implementadas

1. **Normalización** - Tercera forma normal (3NF)
2. **Naming Convention** - Snake_case para nombres de tablas
3. **Soft Deletes** - Campo `isActive` en lugar de DELETE físico
4. **Timestamps** - `createdAt` y `updatedAt` en todas las tablas
5. **CUIDs** - Identificadores únicos collision-resistant
6. **Foreign Keys** - Integridad referencial en todas las relaciones
7. **JSON Fields** - Flexibilidad para datos dinámicos

Esta arquitectura de base de datos soporta eficientemente todos los requerimientos del sistema y permite escalabilidad futura.
