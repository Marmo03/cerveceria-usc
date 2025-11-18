# ⚙️ Backend - Cervecería USC

API backend desarrollada con Fastify, Prisma y PostgreSQL para el sistema de gestión de Cervecería USC.

## 🛠️ Stack Tecnológico

- **Fastify** - Framework web rápido y eficiente
- **Prisma** - ORM moderno para Node.js y TypeScript
- **PostgreSQL 16** - Base de datos relacional
- **TypeScript** - Tipado estático
- **Zod** - Validación de esquemas
- **JWT** - Autenticación
- **Vitest** - Testing framework
- **Pino** - Logging

## 🚀 Desarrollo

### Prerrequisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL 16 (o usar Docker)

### Instalación

```bash
# Desde la raíz del monorepo
npm install

# O específicamente para backend
npm install -w packages/backend

# ⚠️ IMPORTANTE: Instalar dependencias de ESLint (requerido para commits)
cd packages/backend
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

> **Nota para colaboradores**: El proyecto usa `husky` y `lint-staged` para validar código antes de cada commit. Asegúrate de tener instaladas las dependencias de ESLint o los commits fallarán.

### Variables de Entorno

Configurar variables en `infra/.env` (ver `infra/.env.example`):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cerveceria_usc"
JWT_SECRET="your-jwt-secret"
PORT=3000
NODE_ENV=development
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo con hot reload
npm run dev:backend      # Desde la raíz del monorepo

# Build y producción
npm run build           # Compilar TypeScript
npm run start           # Ejecutar versión compilada

# Base de datos
npm run db:generate     # Generar cliente Prisma
npm run db:migrate      # Ejecutar migraciones
npm run db:seed         # Ejecutar seeders
npm run db:studio       # Abrir Prisma Studio
npm run db:reset        # Reset completo de BD

# Testing
npm run test            # Tests unitarios
npm run test:coverage   # Tests con coverage
npm run test:watch      # Tests en modo watch
npm run test:integration # Tests de integración

# Calidad de código
npm run lint            # ESLint
npm run lint:fix        # ESLint con autofix
npm run format          # Prettier
npm run type-check      # Verificación de tipos TS

# Utilidades
npm run clean           # Limpiar directorios generados
```

## 📁 Estructura del Proyecto

```
packages/backend/
├── prisma/
│   ├── schema.prisma   # Esquema de base de datos
│   ├── migrations/     # Migraciones
│   └── seed.ts        # Datos de prueba
├── src/
│   ├── controllers/   # Controladores de rutas
│   ├── services/      # Lógica de negocio
│   ├── repositories/  # Acceso a datos
│   ├── middleware/    # Middleware personalizado
│   ├── utils/         # Utilidades
│   ├── types/         # Tipos TypeScript
│   ├── schemas/       # Esquemas de validación (Zod)
│   ├── plugins/       # Plugins de Fastify
│   └── server.ts      # Punto de entrada
├── tests/
│   ├── unit/          # Tests unitarios
│   ├── integration/   # Tests de integración
│   └── fixtures/      # Datos de prueba
└── ...archivos de configuración
```

## 🏗️ Arquitectura

### Patrón de Capas

```
Controllers (HTTP) → Services (Lógica) → Repositories (Datos)
```

### Principios

- **Separación de responsabilidades**
- **Inyección de dependencias**
- **Validación de entrada con Zod**
- **Manejo centralizado de errores**
- **Logging estructurado**

## 🔧 Configuración

### Base de Datos

```bash
# Inicializar base de datos
npm run db:migrate
npm run db:seed
```

### Prisma

El ORM está configurado con:

- Generación automática de tipos
- Migraciones versionadas
- Seeding automático
- Introspección de schema

### Fastify

Configuración incluye:

- CORS configurado
- Rate limiting
- Helmet para seguridad
- Swagger para documentación
- JWT para autenticación

## 📊 Base de Datos

### Modelo de Datos

```prisma
// Ejemplo del schema
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### Migraciones

```bash
# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npm run db:migrate:prod
```

## 🔐 Autenticación y Autorización

### JWT

- Tokens firmados con clave secreta
- Expiración configurable
- Refresh tokens (opcional)

### Middleware de Autenticación

```typescript
// Proteger rutas
fastify.register(async function (fastify) {
  await fastify.register(authenticate)

  fastify.get('/protected', async (request, reply) => {
    // request.user está disponible
  })
})
```

## 📝 API Documentation

### Swagger

La documentación de la API está disponible en:

- **Desarrollo**: http://localhost:3000/documentation
- **Swagger JSON**: http://localhost:3000/documentation/json

### Endpoints Principales

#### Autenticación

```
POST /auth/login     # Iniciar sesión
POST /auth/register  # Registrar usuario
POST /auth/refresh   # Refresh token
```

#### Usuarios

```
GET    /users        # Listar usuarios
GET    /users/:id    # Obtener usuario
PUT    /users/:id    # Actualizar usuario
DELETE /users/:id    # Eliminar usuario
```

## 🧪 Testing

### Tests Unitarios

```bash
npm run test
```

### Tests de Integración

```bash
npm run test:integration
```

### Coverage

```bash
npm run test:coverage
```

### Estructura de Tests

```typescript
// Ejemplo de test
describe('UserService', () => {
  it('should create user', async () => {
    const user = await userService.create({
      email: 'test@example.com',
      name: 'Test User',
    })

    expect(user.email).toBe('test@example.com')
  })
})
```

## 🔍 Logging

### Pino Logger

- Logs estructurados en JSON
- Diferentes niveles (debug, info, warn, error)
- Pretty printing en desarrollo

### Uso

```typescript
fastify.log.info({ userId: 123 }, 'User created')
fastify.log.error({ error }, 'Database connection failed')
```

## ⚡ Performance

### Optimizaciones

- Connection pooling de PostgreSQL
- Queries optimizadas con Prisma
- Caching cuando sea apropiado
- Rate limiting
- Compression

### Monitoreo

- Métricas de response time
- Health checks
- Database query performance

## 🔒 Seguridad

### Implementadas

- Helmet.js para headers de seguridad
- CORS configurado
- Rate limiting
- Input validation con Zod
- SQL injection prevention (Prisma)
- Password hashing con bcrypt

### Best Practices

- No logs de información sensible
- Validación de entrada siempre
- Principio de menor privilegio
- Secrets en variables de entorno

## 🚀 Deployment

### Build

```bash
npm run build
```

### Variables de Entorno (Producción)

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=super-secure-secret
PORT=3000
```

### Health Check

```
GET /health
```

## 🤝 Contribución

### Estándares de Código

- TypeScript estricto
- ESLint + Prettier
- Commits convencionales
- Tests para nuevas funcionalidades

### Flujo de Desarrollo

1. Crear feature branch
2. Desarrollar con TDD
3. Ejecutar tests y linting
4. Crear PR con template
5. Code review
6. Merge después de aprobación

## 📄 Licencia

MIT - ver el archivo [LICENSE](../../LICENSE) para detalles.

---

**Parte del proyecto**: Cervecería USC  
**Metodología**: P2P (Peer-to-Peer)  
**Universidad**: USC - Gestión de Proyectos TI
