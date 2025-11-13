# 📘 Guía Completa de Desarrollo - Cervecería USC

> **Última actualización**: 12 de noviembre de 2025  
> **Versión**: 1.0.0  
> **Autor**: Equipo de Desarrollo Cervecería USC

---

## 📑 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Configuración del Entorno](#configuración-del-entorno)
5. [Estructura del Backend](#estructura-del-backend)
6. [Estructura del Frontend](#estructura-del-frontend)
7. [Base de Datos](#base-de-datos)
8. [Autenticación y Autorización](#autenticación-y-autorización)
9. [Guía de Desarrollo Backend](#guía-de-desarrollo-backend)
10. [Guía de Desarrollo Frontend](#guía-de-desarrollo-frontend)
11. [Convenciones de Código](#convenciones-de-código)
12. [Testing](#testing)
13. [Despliegue](#despliegue)
14. [Resolución de Problemas](#resolución-de-problemas)

---

## 🎯 Introducción

Este proyecto es una **plataforma web integral para la gestión de inventario, reabastecimiento y logística** de Cervecería USC. Implementa patrones de diseño empresariales y arquitecturas modernas para garantizar escalabilidad, mantenibilidad y rendimiento.

### Objetivos del Sistema

- **Gestión de Inventario**: Control completo de entradas, salidas y alertas de stock
- **Reabastecimiento Inteligente**: EOQ (Economic Order Quantity) y políticas manuales
- **Aprobaciones en Cadena**: Chain of Responsibility para solicitudes de compra
- **KPIs y Reportes**: Indicadores de desempeño en tiempo real
- **Logística**: Gestión de envíos, transportistas y trazabilidad
- **Gestión de Usuarios**: Sistema completo de roles y permisos

---

## 🏗️ Arquitectura del Proyecto

### Arquitectura General

```
┌─────────────────┐
│   Frontend      │
│   (Vue 3 SPA)   │
└────────┬────────┘
         │ HTTP/REST
         │ JWT Auth
┌────────▼────────┐
│   Backend API   │
│   (Fastify)     │
└────────┬────────┘
         │ Prisma ORM
┌────────▼────────┐
│   PostgreSQL    │
│   (Database)    │
└─────────────────┘
```

### Arquitectura Backend (Clean Architecture)

```
├── Presentation Layer (Controllers)
│   └── HTTP Request/Response
│
├── Application Layer (Use Cases)
│   └── Business Logic
│
├── Domain Layer (Entities)
│   └── Core Models
│
└── Infrastructure Layer (Repositories)
    └── Database Access
```

### Patrones de Diseño Implementados

1. **Strategy Pattern**: Políticas de reabastecimiento (EOQ vs Manual)
2. **Chain of Responsibility**: Flujo de aprobaciones multinivel
3. **Observer Pattern**: KPIs reactivos a cambios de inventario
4. **Repository Pattern**: Abstracción de acceso a datos
5. **DTO Pattern**: Validación con Zod schemas

---

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Node.js v20+
- **Framework**: Fastify 4.28.x
- **ORM**: Prisma 6.x
- **Base de Datos**: PostgreSQL 16
- **Autenticación**: JWT (jsonwebtoken)
- **Validación**: Zod 3.x
- **Hash de Contraseñas**: bcryptjs
- **TypeScript**: 5.x

### Frontend
- **Framework**: Vue 3.5+ (Composition API)
- **Build Tool**: Vite 5.4.x
- **State Management**: Pinia 2.x
- **HTTP Client**: Axios 1.7.x
- **Routing**: Vue Router 4.x
- **Estilos**: Tailwind CSS 3.x
- **TypeScript**: 5.x

### DevOps
- **Containerización**: Docker + Docker Compose
- **Version Control**: Git
- **Package Manager**: npm (workspaces)

---

## ⚙️ Configuración del Entorno

### Prerequisitos

```bash
# Versiones mínimas requeridas
Node.js >= 20.0.0
npm >= 10.0.0
Docker >= 24.0.0
PostgreSQL >= 16.0 (o usar Docker)
```

### Instalación Inicial

1. **Clonar el repositorio**
```bash
git clone https://github.com/Marmo03/cerveceria-usc.git
cd cerveceria-usc
```

2. **Instalar dependencias**
```bash
# Instalar todas las dependencias del monorepo
npm install
```

3. **Configurar variables de entorno**

**Backend** (`packages/backend/.env`):
```env
# Base de Datos
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cerveceria_usc?schema=public"

# JWT
JWT_SECRET="tu_clave_secreta_super_segura_aqui"

# Servidor
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL="http://localhost:5173"
```

**Frontend** (`packages/frontend/.env`):
```env
VITE_API_URL=http://localhost:3001
```

4. **Levantar base de datos (Docker)**
```bash
cd infra
docker-compose up -d
```

5. **Ejecutar migraciones de Prisma**
```bash
cd packages/backend
npm run db:migrate
npm run db:seed  # Datos de ejemplo
```

6. **Iniciar servidores de desarrollo**
```bash
# Terminal 1 - Backend
cd packages/backend
npm run dev

# Terminal 2 - Frontend
cd packages/frontend
npm run dev
```

### Usuarios de Prueba (Seed)

Después de ejecutar `npm run db:seed`:

| Email | Password | Rol |
|-------|----------|-----|
| admin@cerveceriausc.com | admin123 | ADMIN |
| operario@cerveceriausc.com | operario123 | OPERARIO |
| aprobador@cerveceriausc.com | aprobador123 | APROBADOR |
| analista@cerveceriausc.com | analista123 | ANALISTA |

---

## 🔧 Estructura del Backend

### Árbol de Directorios

```
packages/backend/
├── prisma/
│   ├── schema.prisma          # Modelo de datos
│   ├── migrations/            # Historial de migraciones
│   └── seed.ts                # Datos iniciales
│
├── src/
│   ├── server.ts              # Entry point
│   │
│   ├── controllers/           # Capa de presentación
│   │   ├── auth.ts            # Autenticación y login
│   │   ├── productos.ts       # CRUD de productos
│   │   ├── inventario.ts      # Movimientos de inventario
│   │   ├── solicitudes.ts     # Solicitudes de compra
│   │   ├── usuarios.ts        # Gestión de usuarios/roles
│   │   ├── reports.ts         # KPIs y reportes
│   │   └── sales.ts           # Importación de ventas
│   │
│   ├── middleware/            # Middleware de Fastify
│   │   └── auth.ts            # Verificación JWT y roles
│   │
│   ├── repositories/          # Acceso a base de datos
│   │   └── (por implementar)
│   │
│   ├── services/              # Lógica de negocio
│   │   └── (por implementar)
│   │
│   ├── schemas/               # Validación con Zod
│   │   └── (integrados en controllers)
│   │
│   ├── types/                 # Tipos TypeScript
│   │   └── auth.ts            # Tipos de autenticación
│   │
│   └── utils/                 # Utilidades
│       └── (helpers generales)
│
├── package.json
├── tsconfig.json
└── .env
```

### Convenciones de Controllers

Cada controller sigue esta estructura:

```typescript
import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

// 1. Schemas de validación (Zod)
const CreateSchema = z.object({
  campo: z.string().min(1, 'Campo requerido'),
  otro: z.number().positive()
})

type CreateBody = z.infer<typeof CreateSchema>

// 2. Plugin de Fastify
const miControllerRoutes: FastifyPluginAsync = async (fastify) => {
  
  // 3. Definición de rutas
  fastify.post<{ Body: CreateBody }>(
    '/ruta',
    {
      // Autenticación y autorización
      preHandler: [
        fastify.authenticate,
        fastify.requireRole(['ADMIN', 'OPERARIO'])
      ],
      
      // Documentación OpenAPI
      schema: {
        tags: ['MiController'],
        summary: 'Crear recurso',
        description: 'Descripción detallada',
        body: { /* Schema JSON */ },
        response: {
          201: { /* Schema de respuesta */ }
        }
      }
    },
    async (request, reply) => {
      try {
        // Validar datos
        const data = CreateSchema.parse(request.body)
        
        // Lógica de negocio
        const result = await fastify.prisma.model.create({
          data
        })
        
        // Respuesta exitosa
        return reply.status(201).send({
          success: true,
          data: result
        })
      } catch (error: any) {
        // Manejo de errores
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            success: false,
            error: 'Datos inválidos',
            details: error.errors
          })
        }
        
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          error: 'Error interno del servidor'
        })
      }
    }
  )
}

export default miControllerRoutes
```

### Tipos de IDs: CUID vs UUID

⚠️ **IMPORTANTE**: El schema de Prisma usa **CUID**, NO UUID.

```typescript
// ❌ INCORRECTO - No usar UUID
const schema = z.object({
  id: z.string().uuid()
})

// ✅ CORRECTO - Usar CUID
const schema = z.object({
  id: z.string().regex(/^c[a-z0-9]{24}$/i, 'ID debe ser un CUID válido')
})
```

**Formato CUID**:
- Empieza con 'c'
- 25 caracteres totales
- Ejemplo: `cmhwrrhul0000941fnn46ripy`

---

## 🎨 Estructura del Frontend

### Árbol de Directorios

```
packages/frontend/
├── src/
│   ├── assets/                # Recursos estáticos
│   │   └── styles/
│   │       └── main.css       # Tailwind + estilos globales
│   │
│   ├── components/            # Componentes reutilizables
│   │   ├── AppLayout.vue      # Layout principal con sidebar
│   │   ├── ModalProducto.vue  # Modal para productos
│   │   ├── ModalMovimiento.vue
│   │   ├── ModalSolicitud.vue
│   │   ├── ModalCrearUsuario.vue
│   │   ├── ModalEditarUsuario.vue
│   │   └── ModalCambiarRol.vue
│   │
│   ├── pages/                 # Vistas/Páginas
│   │   ├── LoginPage.vue
│   │   ├── DashboardPage.vue
│   │   ├── ProductosPage.vue
│   │   ├── InventarioPage.vue
│   │   ├── SolicitudesPage.vue
│   │   ├── GestionUsuariosPage.vue
│   │   └── ReportsPage.vue
│   │
│   ├── router/                # Vue Router
│   │   └── index.ts           # Rutas y guards
│   │
│   ├── stores/                # Pinia Stores
│   │   ├── auth.ts            # Autenticación
│   │   ├── products.ts        # Productos
│   │   ├── inventory.ts       # Inventario
│   │   ├── usuarios.ts        # Usuarios y roles
│   │   └── reports.ts         # KPIs y reportes
│   │
│   ├── App.vue                # Componente raíz
│   ├── main.ts                # Entry point
│   └── vite-env.d.ts          # Tipos de Vite
│
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── .env
```

### Convenciones de Componentes Vue

**Composition API con `<script setup>`**:

```vue
<template>
  <div class="mi-componente">
    <h1>{{ titulo }}</h1>
    <button @click="handleClick">{{ loading ? 'Cargando...' : 'Acción' }}</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMiStore } from '../stores/miStore'

// Props
interface Props {
  titulo: string
  opcional?: number
}
const props = withDefaults(defineProps<Props>(), {
  opcional: 0
})

// Emits
const emit = defineEmits<{
  (e: 'success'): void
  (e: 'error', message: string): void
}>()

// State
const loading = ref(false)
const data = ref<any[]>([])

// Store
const miStore = useMiStore()

// Computed
const itemsCount = computed(() => data.value.length)

// Methods
const handleClick = async () => {
  loading.value = true
  try {
    await miStore.fetchData()
    emit('success')
  } catch (error) {
    emit('error', 'Error al cargar datos')
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await handleClick()
})
</script>

<style scoped>
.mi-componente {
  @apply p-4 bg-white rounded-lg shadow;
}
</style>
```

### Convenciones de Pinia Stores

```typescript
import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Interfaces
export interface MiEntidad {
  id: string
  nombre: string
  activo: boolean
}

// State interface
interface MiStoreState {
  items: MiEntidad[]
  loading: boolean
  error: string | null
}

export const useMiStore = defineStore('miStore', {
  state: (): MiStoreState => ({
    items: [],
    loading: false,
    error: null
  }),

  getters: {
    itemsActivos: (state) => state.items.filter(i => i.activo),
    totalItems: (state) => state.items.length
  },

  actions: {
    async fetchItems() {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        const response = await axios.get(`${API_URL}/items`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        })
        
        this.items = response.data.data
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Error al cargar datos'
        console.error('Error fetching items:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createItem(data: Omit<MiEntidad, 'id'>) {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        const response = await axios.post(`${API_URL}/items`, data, {
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        })
        
        // Actualizar estado local
        this.items.push(response.data.data)
        
        return response.data
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Error al crear'
        throw error
      } finally {
        this.loading = false
      }
    },

    clearError() {
      this.error = null
    }
  }
})
```

---

## 🗄️ Base de Datos

### Modelo de Datos (Prisma Schema)

El schema está en `packages/backend/prisma/schema.prisma`.

**Dominios principales**:

1. **Usuarios y Roles**
   - `User`: Usuarios del sistema
   - `Role`: Roles (ADMIN, OPERARIO, APROBADOR, ANALISTA)

2. **Productos e Inventario**
   - `Producto`: Catálogo de productos
   - `Proveedor`: Proveedores
   - `MovimientoInventario`: Entradas/Salidas

3. **Reabastecimiento**
   - `PoliticaAbastecimiento`: EOQ o Manual
   - `SolicitudCompra`: Solicitudes de reabastecimiento
   - `Aprobacion`: Historial de aprobaciones

4. **Logística**
   - `Transportista`: Empresas de transporte
   - `Envio`: Envíos
   - `ProductoEnvio`: Productos en cada envío
   - `RutaEnvio`: Trazabilidad
   - `EstadoEnvio`: Historial de estados

5. **KPIs**
   - `Indicador`: Métricas calculadas
   - `Importacion`: Historial de importaciones CSV

### Migraciones

```bash
# Crear migración después de cambiar schema.prisma
npm run db:migrate

# Aplicar migraciones en producción
npm run db:deploy

# Ver estado de migraciones
npx prisma migrate status

# Resetear base de datos (¡SOLO DESARROLLO!)
npm run db:reset
```

### Prisma Client

```typescript
// Acceso a base de datos en controllers
const usuario = await fastify.prisma.user.findUnique({
  where: { id: usuarioId },
  include: {
    role: true
  }
})

// Crear con relación
const producto = await fastify.prisma.producto.create({
  data: {
    sku: 'PROD-001',
    nombre: 'Malta Pilsen',
    categoria: 'MATERIA_PRIMA',
    // ... otros campos
    proveedor: {
      connect: { id: proveedorId }
    }
  },
  include: {
    proveedor: true
  }
})

// Transacciones
await fastify.prisma.$transaction(async (prisma) => {
  await prisma.movimientoInventario.create({ /* ... */ })
  await prisma.producto.update({ /* actualizar stock */ })
})
```

---

## 🔐 Autenticación y Autorización

### Flujo de Autenticación

1. **Login** (`POST /api/auth/login`):
   - Usuario envía email + password
   - Backend valida con bcrypt
   - Retorna JWT token + datos de usuario

2. **Requests Autenticados**:
   - Cliente incluye header: `Authorization: Bearer <token>`
   - Middleware verifica y decodifica JWT
   - Agrega `request.currentUser` con datos del token

3. **Verificación de Roles**:
   - Middleware `requireRole(['ADMIN', 'OPERARIO'])`
   - Verifica que el usuario tenga uno de los roles permitidos

### JWT Middleware (Backend)

```typescript
// En src/middleware/auth.ts
fastify.decorate('authenticate', async function (request, reply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return reply.status(401).send({ error: 'No autorizado' })
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    request.currentUser = decoded
  } catch (error) {
    return reply.status(401).send({ error: 'Token inválido' })
  }
})

fastify.decorate('requireRole', function (allowedRoles: string[]) {
  return async function (request, reply) {
    if (!request.currentUser) {
      return reply.status(401).send({ error: 'No autenticado' })
    }
    
    const userRole = request.currentUser.role
    
    if (!allowedRoles.includes(userRole)) {
      return reply.status(403).send({ error: 'Permisos insuficientes' })
    }
  }
})
```

### Auth Store (Frontend)

```typescript
// En src/stores/auth.ts
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),

  actions: {
    async login(email: string, password: string) {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      })
      
      this.token = response.data.token
      this.user = response.data.user
      
      localStorage.setItem('token', this.token!)
      localStorage.setItem('user', JSON.stringify(this.user))
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    hasRole(role: string): boolean {
      return this.user?.role?.name === role
    }
  }
})
```

### Protección de Rutas (Frontend)

```typescript
// En src/router/index.ts
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.token) {
    // Redirigir a login si no está autenticado
    next('/login')
  } else if (to.meta.roles) {
    // Verificar rol
    const allowedRoles = to.meta.roles as string[]
    if (!allowedRoles.includes(authStore.user?.role?.name)) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    next()
  }
})
```

---

## 🔨 Guía de Desarrollo Backend

### Agregar un Nuevo Endpoint

**Ejemplo**: Crear endpoint para listar proveedores

1. **Crear/editar controller** (`src/controllers/proveedores.ts`):

```typescript
import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const proveedoresRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/proveedores
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Proveedores'],
        summary: 'Listar proveedores',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    nombre: { type: 'string' },
                    email: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const proveedores = await fastify.prisma.proveedor.findMany({
          where: { isActive: true },
          orderBy: { nombre: 'asc' }
        })
        
        return reply.send({
          success: true,
          data: proveedores
        })
      } catch (error: any) {
        request.log.error(error)
        return reply.status(500).send({
          success: false,
          error: 'Error al obtener proveedores'
        })
      }
    }
  )
}

export default proveedoresRoutes
```

2. **Registrar en server.ts**:

```typescript
import proveedoresRoutes from './controllers/proveedores'

// Dentro de fastify.register()
fastify.register(proveedoresRoutes, { prefix: '/api/proveedores' })
```

3. **Probar endpoint**:

```bash
curl -X GET http://localhost:3001/api/proveedores \
  -H "Authorization: Bearer <tu_token>"
```

### Validación con Zod

```typescript
// Schema reutilizable
const CreateProveedorSchema = z.object({
  nombre: z.string().min(2, 'Nombre muy corto'),
  email: z.string().email('Email inválido').optional(),
  telefono: z.string().regex(/^\+?[0-9]{10,}$/).optional()
})

type CreateProveedorBody = z.infer<typeof CreateProveedorSchema>

// Uso en endpoint
fastify.post<{ Body: CreateProveedorBody }>(
  '/',
  async (request, reply) => {
    try {
      const data = CreateProveedorSchema.parse(request.body)
      
      const proveedor = await fastify.prisma.proveedor.create({
        data
      })
      
      return reply.status(201).send({
        success: true,
        data: proveedor
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          success: false,
          error: 'Datos inválidos',
          details: error.errors
        })
      }
      // ... manejo de otros errores
    }
  }
)
```

### Manejo de Errores

```typescript
// Error personalizado
class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

// Handler global
fastify.setErrorHandler((error, request, reply) => {
  if (error instanceof NotFoundError) {
    return reply.status(404).send({
      success: false,
      error: error.message
    })
  }
  
  if (error.statusCode === 401) {
    return reply.status(401).send({
      success: false,
      error: 'No autorizado'
    })
  }
  
  request.log.error(error)
  return reply.status(500).send({
    success: false,
    error: 'Error interno del servidor'
  })
})
```

---

## 🎨 Guía de Desarrollo Frontend

### Crear una Nueva Página

**Ejemplo**: Página de Proveedores

1. **Crear store** (`src/stores/proveedores.ts`):

```typescript
import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from './auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface Proveedor {
  id: string
  nombre: string
  email?: string
  telefono?: string
  isActive: boolean
}

interface ProveedoresState {
  proveedores: Proveedor[]
  loading: boolean
  error: string | null
}

export const useProveedoresStore = defineStore('proveedores', {
  state: (): ProveedoresState => ({
    proveedores: [],
    loading: false,
    error: null
  }),

  getters: {
    proveedoresActivos: (state) => state.proveedores.filter(p => p.isActive)
  },

  actions: {
    async fetchProveedores() {
      this.loading = true
      this.error = null
      
      try {
        const authStore = useAuthStore()
        const response = await axios.get(`${API_URL}/proveedores`, {
          headers: { Authorization: `Bearer ${authStore.token}` }
        })
        
        this.proveedores = response.data.data
      } catch (error: any) {
        this.error = error.response?.data?.error || 'Error al cargar'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
```

2. **Crear página** (`src/pages/ProveedoresPage.vue`):

```vue
<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">Proveedores</h1>
      
      <div v-if="loading" class="text-center">
        <div class="spinner"></div>
        <p>Cargando...</p>
      </div>
      
      <div v-else-if="error" class="alert alert-error">
        {{ error }}
      </div>
      
      <div v-else>
        <table class="w-full">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="proveedor in proveedores" :key="proveedor.id">
              <td>{{ proveedor.nombre }}</td>
              <td>{{ proveedor.email || '-' }}</td>
              <td>{{ proveedor.telefono || '-' }}</td>
              <td>
                <button @click="editar(proveedor)">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useProveedoresStore } from '../stores/proveedores'
import AppLayout from '../components/AppLayout.vue'

const store = useProveedoresStore()

const proveedores = computed(() => store.proveedores)
const loading = computed(() => store.loading)
const error = computed(() => store.error)

const editar = (proveedor: any) => {
  // Lógica para editar
}

onMounted(async () => {
  await store.fetchProveedores()
})
</script>
```

3. **Agregar ruta** (`src/router/index.ts`):

```typescript
{
  path: '/proveedores',
  name: 'Proveedores',
  component: () => import('../pages/ProveedoresPage.vue'),
  meta: { requiresAuth: true, roles: ['ADMIN', 'OPERARIO'] }
}
```

4. **Agregar al sidebar** (`src/components/AppLayout.vue`):

```vue
<li>
  <router-link to="/proveedores" class="nav-link">
    <svg><!-- icono --></svg>
    Proveedores
  </router-link>
</li>
```

### Crear un Modal Reutilizable

```vue
<template>
  <div v-if="modelValue" class="fixed inset-0 z-50">
    <div class="fixed inset-0 bg-black bg-opacity-50" @click="cerrar"></div>
    
    <div class="modal-content">
      <form @submit.prevent="guardar">
        <h3>{{ titulo }}</h3>
        
        <slot></slot>
        
        <div class="modal-actions">
          <button type="button" @click="cerrar">Cancelar</button>
          <button type="submit" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue: boolean
  titulo: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit'): void
}>()

const loading = ref(false)

const cerrar = () => {
  if (!loading.value) {
    emit('update:modelValue', false)
  }
}

const guardar = async () => {
  loading.value = true
  try {
    emit('submit')
  } finally {
    loading.value = false
  }
}
</script>
```

---

## 📝 Convenciones de Código

### Nomenclatura

**Variables y Funciones**: camelCase
```typescript
const nombreUsuario = 'Juan'
function calcularTotal() { }
```

**Interfaces y Types**: PascalCase
```typescript
interface Usuario { }
type ProductoData = { }
```

**Constantes**: UPPER_SNAKE_CASE
```typescript
const API_URL = 'http://localhost:3001'
const MAX_ITEMS = 100
```

**Archivos**:
- Componentes Vue: PascalCase (`ModalProducto.vue`)
- Stores: camelCase (`products.ts`)
- Pages: PascalCase con sufijo (`DashboardPage.vue`)

### Estilos de Código

**TypeScript**:
- Siempre tipar parámetros y retornos
- Preferir interfaces sobre types para objetos
- Usar tipos genéricos cuando corresponda

```typescript
// ✅ Correcto
async function fetchData<T>(url: string): Promise<T> {
  const response = await axios.get<T>(url)
  return response.data
}

// ❌ Incorrecto
async function fetchData(url) {
  return await axios.get(url).then(r => r.data)
}
```

**Async/Await vs Promises**:
```typescript
// ✅ Preferir async/await
async function loadData() {
  try {
    const data = await store.fetchItems()
    return data
  } catch (error) {
    console.error(error)
  }
}

// ❌ Evitar .then()
function loadData() {
  return store.fetchItems()
    .then(data => data)
    .catch(error => console.error(error))
}
```

### Comentarios

```typescript
/**
 * Calcula el costo total de una solicitud de compra
 * 
 * @param solicitud - La solicitud de compra
 * @param incluirImpuestos - Si se deben incluir impuestos
 * @returns El costo total calculado
 */
function calcularCostoTotal(
  solicitud: SolicitudCompra,
  incluirImpuestos: boolean = true
): number {
  // Sumar costos base
  let total = solicitud.items.reduce((sum, item) => sum + item.costo, 0)
  
  // Aplicar impuestos si corresponde
  if (incluirImpuestos) {
    total *= 1.19 // IVA 19%
  }
  
  return total
}
```

---

## 🧪 Testing

### Backend Testing

Crear tests con Jest:

```typescript
// tests/controllers/productos.test.ts
import { test } from 'tap'
import { build } from '../helper'

test('GET /api/productos debe retornar lista de productos', async (t) => {
  const app = await build(t)
  
  const response = await app.inject({
    method: 'GET',
    url: '/api/productos',
    headers: {
      Authorization: `Bearer ${TEST_TOKEN}`
    }
  })
  
  t.equal(response.statusCode, 200)
  t.ok(response.json().success)
  t.ok(Array.isArray(response.json().data))
})
```

### Frontend Testing

Crear tests con Vitest:

```typescript
// tests/stores/products.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductsStore } from '@/stores/products'

describe('Products Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('debe cargar productos correctamente', async () => {
    const store = useProductsStore()
    await store.fetchProductos()
    
    expect(store.productos.length).toBeGreaterThan(0)
    expect(store.loading).toBe(false)
  })
})
```

---

## 🚀 Despliegue

### Variables de Entorno en Producción

**Backend**:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="clave_super_segura_aleatoria"
PORT=3001
NODE_ENV=production
FRONTEND_URL="https://app.cerveceriausc.com"
```

**Frontend**:
```env
VITE_API_URL=https://api.cerveceriausc.com
```

### Build para Producción

```bash
# Backend
cd packages/backend
npm run build
npm start

# Frontend
cd packages/frontend
npm run build
# Los archivos compilados estarán en dist/
```

### Docker (Producción)

```dockerfile
# Dockerfile para backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3001
CMD ["npm", "start"]
```

---

## 🛠️ Resolución de Problemas

### Error: "Network Error" al crear productos

**Causa**: Código duplicado en ModalProducto.vue  
**Solución**: Eliminar declaraciones duplicadas de `const form` y `const resetForm`

### Error 400: "ProductoId no es un UUID válido"

**Causa**: El schema usa CUID, no UUID  
**Solución**: Cambiar validación de `.uuid()` a `.regex(/^c[a-z0-9]{24}$/i)`

### Modal no se cierra después de guardar

**Causa**: Estado `loading` no se resetea  
**Solución**: Forzar `loading.value = false` en función `cerrar()`

### Roles duplicados en select

**Causa**: Backend retorna duplicados o frontend no filtra  
**Solución**: Agregar `distinct: ['name']` en Prisma query o filtro Set en frontend

### Token JWT expirado

**Causa**: Token venció o servidor reinició  
**Solución**: Implementar refresh tokens o reloguear usuario

---

## 📚 Recursos Adicionales

- [Documentación Fastify](https://www.fastify.io/)
- [Documentación Vue 3](https://vuejs.org/)
- [Documentación Prisma](https://www.prisma.io/docs)
- [Documentación Pinia](https://pinia.vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 👥 Equipo y Contribuciones

Para contribuir al proyecto:

1. Crear branch desde `develop`: `git checkout -b feature/mi-feature`
2. Hacer commits descriptivos: `git commit -m "feat: agregar endpoint de proveedores"`
3. Push y crear Pull Request
4. Esperar revisión de código

**Convenciones de Commits** (Conventional Commits):
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Tareas de mantenimiento

---

**¿Preguntas? Contacta al equipo de desarrollo**

*Última actualización: Noviembre 2025*
