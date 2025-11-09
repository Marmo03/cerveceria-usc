# Arquitectura

## Documentación de la Arquitectura de la Aplicación

La aplicación utiliza una arquitectura de tres capas, compuesta por una base de datos PostgreSQL para el almacenamiento de datos, un frontend desarrollado con Vue.js para la interfaz de usuario y un backend implementado con Fastify para el procesamiento de datos y la lógica del servidor.

### Base de Datos - PostgreSQL

La base de datos utilizada en la aplicación es PostgreSQL 16, un sistema de gestión de bases de datos relacional de código abierto. PostgreSQL se encarga de almacenar y administrar los datos de la aplicación de manera eficiente y segura. Proporciona una estructura tabular para organizar y relacionar los datos mediante tablas, columnas y filas.

PostgreSQL ofrece características avanzadas como:

- **ACID Compliance** - Transacciones seguras y confiables
- **JSONB** - Almacenamiento eficiente de datos JSON
- **Full-Text Search** - Búsqueda de texto completo nativa
- **Row-Level Security** - Seguridad a nivel de fila
- **Connection Pooling** - Gestión eficiente de conexiones

### Frontend - Vue.js

El frontend de la aplicación está desarrollado utilizando Vue.js 3, un framework JavaScript progresivo de código abierto para construir interfaces de usuario interactivas y dinámicas. Vue.js utiliza componentes reutilizables para representar la interfaz de usuario, lo que facilita la creación de aplicaciones modulares y fáciles de mantener.

Vue.js proporciona:

- **Composition API** - Sistema de composición moderno y flexible
- **Reactivity System** - Sistema de reactividad eficiente
- **Single File Components** - Componentes autocontenidos (.vue)
- **Vue Router** - Sistema de enrutamiento integrado
- **Pinia** - Gestión de estado centralizada

La interfaz de usuario se renderiza en el navegador web y permite a los usuarios interactuar con la aplicación de forma intuitiva mediante páginas organizadas por módulos:

- Dashboard
- Productos
- Inventario
- Solicitudes de Compra
- Logística
- KPIs
- Perfil

### Backend - Fastify

El backend de la aplicación está construido utilizando Fastify, un framework web de Node.js de código abierto conocido por su velocidad y bajo overhead. Fastify proporciona un conjunto de herramientas y características que simplifican el desarrollo de aplicaciones web robustas y escalables.

Fastify se encarga de:

- Manejar las solicitudes del cliente
- Procesar la lógica del servidor
- Interactuar con la base de datos mediante Prisma ORM
- Generar respuestas adecuadas en formato JSON

El backend sigue la **Arquitectura Hexagonal** (también conocida como Ports and Adapters), lo que facilita la separación de preocupaciones y el desarrollo organizado. Los controladores de Fastify gestionan las solicitudes HTTP, interactúan con la base de datos y procesan los datos antes de enviar una respuesta al cliente.

### Arquitectura Hexagonal

La estructura del backend se organiza en capas:

**1. Domain Layer (Núcleo del Negocio)**

- Entidades de dominio (Producto, Usuario, Solicitud, Envío)
- Interfaces de repositorios
- Lógica de negocio pura sin dependencias externas

**2. Application Layer (Casos de Uso)**

- Servicios de aplicación
- Implementación de casos de uso
- Orquestación de flujos de negocio

**3. Infrastructure Layer (Adaptadores)**

- Implementaciones de repositorios con Prisma
- Adaptadores de base de datos
- Servicios externos

**4. Presentation Layer (Controllers)**

- Controladores HTTP
- Validación de entrada con Zod
- Transformación de respuestas

### Patrones de Diseño Implementados

**Strategy Pattern** - Algoritmos de reabastecimiento intercambiables:

- EOQ (Economic Order Quantity)
- Just-in-Time
- Fixed Quantity

**Chain of Responsibility** - Flujo de aprobaciones multinivel:

- Aprobador Operativo
- Aprobador Gerencial
- Aprobador Ejecutivo

**Observer Pattern** - Sistema de eventos para KPIs:

- Actualización automática de indicadores
- Notificaciones de cambios de estado

**Repository Pattern** - Abstracción de acceso a datos:

- Interfaces genéricas
- Implementaciones específicas con Prisma

### Flujo de Datos

El flujo de datos en la aplicación sigue el patrón cliente-servidor. El cliente, que en este caso es el frontend de Vue.js, envía solicitudes HTTP al backend de Fastify para realizar operaciones y obtener información.

```
[Frontend Vue.js]
       ↓ HTTP Request (POST /auth/login)
[Controllers] - Validación con Zod
       ↓
[Use Cases] - Lógica de negocio
       ↓
[Repositories] - Prisma ORM
       ↓
[PostgreSQL Database]
       ↓
[Repositories] - Transformación de datos
       ↓
[Controllers] - Respuesta JSON
       ↓ HTTP Response (200 OK + JWT token)
[Frontend Vue.js]
```

El backend procesa las solicitudes, realiza operaciones en la base de datos según sea necesario y genera respuestas adecuadas en formato JSON. Estas respuestas se envían de vuelta al cliente, donde se utilizan para actualizar la interfaz de usuario y mostrar los datos relevantes.

La comunicación entre el frontend y el backend se realiza a través de **API RESTful**, utilizando solicitudes HTTP como GET, POST, PUT y DELETE para realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) en los datos.

### Seguridad

La aplicación implementa múltiples capas de seguridad:

**Autenticación:**

- JWT (JSON Web Tokens) para sesiones stateless
- Tokens de acceso y refresh tokens
- Bcrypt para hashing de contraseñas

**Autorización:**

- Control de acceso basado en roles (RBAC)
- Middleware de verificación de permisos
- Guards de rutas en el frontend

**Validación:**

- Schemas de validación con Zod
- Sanitización de entrada
- Prevención de SQL Injection mediante Prisma

Esta arquitectura modular y bien definida permite un desarrollo eficiente, escalable y mantenible de la aplicación, separando las responsabilidades de cada capa y facilitando la integración de nuevas funcionalidades.

Con esta arquitectura, la aplicación logra un equilibrio entre una interfaz de usuario interactiva, un backend sólido y una base de datos eficiente para brindar una experiencia de usuario óptima.
