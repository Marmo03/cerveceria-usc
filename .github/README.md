# 🍺 Cervecería USC - Plataforma de Cadena de Suministro

**Sistema completo de gestión de cadena de suministro para Cervecería USC con arquitectura API REST por capas, automatización RPA, Vue.js frontend y autenticación basada en roles.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Vue.js](https://img.shields.io/badge/Vue.js-3-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blueviolet.svg)](https://www.prisma.io/)

> **Estado Actual:** ✅ **Plataforma de cadena de suministro completa y funcional** con backend por capas, automatización RPA y frontend Vue.js implementados para optimizar los procesos de la Cervecería USC

---

## 🚀 **Setup Rápido (5 minutos)**

```bash
# 1. Clonar repositorio
git clone https://github.com/Marmo03/cerveceria-usc.git
cd cerveceria-usc
git checkout feat/fullstack-bootstrap

# 2. Instalar dependencias
npm install

# 3. Configurar base de datos
cd packages/backend
npx prisma migrate dev --name init
npm run db:seed

# 4. Ejecutar aplicación (2 terminales)
# Terminal 1:
cd packages/backend && npm run dev

# Terminal 2:
cd packages/frontend && npm run dev**🌐 Acceder:** http://localhost:5173

## 🛠️ **Stack Tecnológico Implementado**

### **Backend (Arquitectura Hexagonal)**

- **Node.js + Fastify** - API REST con TypeScript
- **Prisma ORM** - Gestión de base de datos PostgreSQL 16
- **JWT Authentication** - Autenticación con refresh tokens
- **Bcrypt** - Hashing seguro de contraseñas
- **Vitest** - Framework de testing con Given-When-Then

### **Frontend (Vue.js SPA)**

- **Vue.js 3 + TypeScript** - Framework progresivo moderno
- **Vite** - Build tool ultrarrápido
- **Pinia** - Gestión de estado reactivo
- **Vue Router** - Navegación con guards de autenticación
- **TailwindCSS** - Framework CSS utility-first
- **Axios** - Cliente HTTP con interceptors

### **Base de Datos**

- **PostgreSQL 16** - Base de datos relacional enterprise
- **Prisma Schema** - Modelado de datos type-safe
- **Migraciones** - Control de versiones de esquema
- **Seed Data** - Datos de prueba pre-poblados

### **Patrones de Diseño**

- 🏗️ **Hexagonal Architecture** - Independencia de frameworks
- 🎯 **Strategy Pattern** - Algoritmos de reabastecimiento
- ⛓️ **Chain of Responsibility** - Flujo de aprobaciones
- 👁️ **Observer Pattern** - Sistema de eventos para KPIs
- 📚 **Repository Pattern** - Abstracción de acceso a datos

## 🎯 **Estado Actual del Proyecto**

### ✅ **Completamente Implementado**

#### **🔐 Sistema de Roles**

| Rol           | Permisos                           | Páginas Accesibles                                    |
| ------------- | ---------------------------------- | ----------------------------------------------------- |
| **ADMIN**     | Todos los permisos                 | Todas las páginas                                     |
| **OPERARIO**  | Inventario, productos, solicitudes | Dashboard, Productos, Inventario, Solicitudes, Perfil |
| **APROBADOR** | Aprobar solicitudes, ver KPIs      | Dashboard, Solicitudes, KPIs, Perfil                  |
| **ANALISTA**  | KPIs, reportes, políticas          | Dashboard, Productos, KPIs, Perfil                    |

#### **📊 Módulos de Cadena de Suministro**

- 🏠 **Dashboard:** Resumen general de la cadena de suministro y métricas clave
- 📦 **Productos:** Gestión completa del catálogo de productos cerveceros
- 📊 **Inventario:** Control de stock, movimientos y alertas de reposición
- 📝 **Solicitudes:** Workflow automatizado de compras y aprobaciones
- 📈 **KPIs:** Indicadores de desempeño de la cadena de suministro
- 👤 **Perfil:** Gestión de usuarios y configuración del sistema
- 🚚 **Logística:** Seguimiento del estado del pedido y visualización de estadísticas de recepción

### **🔑 Usuarios de Prueba**

```javascript
// Todos con password: "123456"
admin@cerveceria-usc.edu.co      // Administrador completo
operario@cerveceria-usc.edu.co   // Gestión operativa
aprobador@cerveceria-usc.edu.co  // Aprobación de solicitudes
analista@cerveceria-usc.edu.co   // Análisis y reportes
```

## 📁 **Estructura del Proyecto**

```
cerveceria-usc/
├── packages/
│   ├── backend/              # API Node.js + Fastify
│   │   ├── prisma/           # Schema PostgreSQL + migraciones
│   │   ├── src/
│   │   │   ├── domain/       # Lógica de negocio pura
│   │   │   │   ├── entities.ts
│   │   │   │   ├── repositories.ts
│   │   │   │   ├── strategies/    # Strategy Pattern
│   │   │   │   ├── approvals/     # Chain of Responsibility
│   │   │   │   └── events/        # Observer Pattern
│   │   │   ├── services/     # Casos de uso de aplicación
│   │   │   ├── infra/        # Adaptadores de infraestructura
│   │   │   ├── controllers/  # Controladores HTTP
│   │   │   └── tests/        # Tests unitarios Given-When-Then
│   │   └── ejemplos-csv/     # Datos de prueba para importación
│   └── frontend/             # Aplicación Vue.js SPA
│       ├── src/
│       │   ├── pages/        # Páginas de la aplicación
│       │   ├── components/   # Componentes reutilizables
│       │   ├── stores/       # Estado global (Pinia)
│       │   ├── router/       # Configuración de rutas + guards
│       │   └── style.css     # Estilos globales + TailwindCSS
│       └── public/
├── docs/                     # Documentación del proyecto
└── SETUP.md                 # Guía detallada para colaboradores
```
## � **Guía para Colaboradores**

### **🌿 Workflow de Ramas**

#### **Estructura de Ramas**

```
main                     # Rama principal (protegida)
└── feat/fullstack-bootstrap  # Rama de desarrollo actual ✅
    ├── feature/nueva-funcionalidad
    ├── fix/correccion-bug
    └── refactor/mejora-codigo
```

#### **Para Nuevas Funcionalidades**

```bash
# 1. Actualizar rama base
git checkout feat/fullstack-bootstrap
git pull origin feat/fullstack-bootstrap

# 2. Crear rama de feature
git checkout -b feature/nombre-funcionalidad

# 3. Desarrollar y hacer commits
git add .
git commit -m "feat: descripción de la funcionalidad"

# 4. Push y crear PR
git push origin feature/nombre-funcionalidad
# Crear PR hacia feat/fullstack-bootstrap
```

### **🔒 Reglas de Colaboración**

#### **❌ NO Tocar Directamente:**

- `packages/backend/prisma/schema.prisma` (sin coordinación)
- `packages/backend/src/domain/entities.ts` (entidades core)
- `packages/frontend/src/stores/auth.ts` (autenticación)
- `packages/backend/prisma/seed.ts` (datos de prueba)

#### **✅ Safe para Modificar:**

- Nuevas páginas en `packages/frontend/src/pages/`
- Nuevos componentes en `packages/frontend/src/components/`
- Nuevos controladores en `packages/backend/src/controllers/`
- Nuevos casos de uso en `packages/backend/src/services/`
- Estilos en `packages/frontend/src/style.css`
- Tests en `packages/backend/src/tests/`

### **📝 Convenciones de Commits**

```bash
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: cambios de formato (no afectan lógica)
refactor: refactorización de código
test: agregar o modificar tests
chore: tareas de mantenimiento
```

## �️ **Scripts y Comandos de Desarrollo**

### **Backend Scripts** (desde `/packages/backend/`)

```bash
npm run dev          # Servidor desarrollo (http://localhost:3000)
npm run build        # Compilar TypeScript
npm run test         # Ejecutar tests unitarios Given-When-Then
npm run test:watch   # Tests en modo watch
npm run db:seed      # Popular base de datos con datos de prueba
npm run db:reset     # Resetear base de datos completamente
npm run db:studio    # Abrir Prisma Studio (GUI de BD)
npm run lint         # Verificar código con ESLint
npm run lint:fix     # Corregir problemas de lint automáticamente
```

### **Frontend Scripts** (desde `/packages/frontend/`)

```bash
npm run dev          # Servidor desarrollo (http://localhost:5173)
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Verificar código
npm run lint:fix     # Corregir lint
```

### **URLs de Desarrollo**

- **Frontend UI:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Prisma Studio:** http://localhost:5555 (después de `npm run db:studio`)

### **APIs Principales Implementadas**

```bash
# Autenticación
POST /api/auth/login     # Login con email/password
POST /api/auth/refresh   # Refresh token
GET  /api/auth/me        # Perfil del usuario actual

# Productos
GET    /api/productos              # Listar productos
POST   /api/productos              # Crear producto (ADMIN)
GET    /api/productos/:id          # Obtener producto específico
PUT    /api/productos/:id          # Actualizar producto (ADMIN)
DELETE /api/productos/:id          # Eliminar producto (ADMIN)

# Inventario
GET  /api/inventario/movimientos   # Listar movimientos
POST /api/inventario/entrada       # Registrar entrada (OPERARIO)
POST /api/inventario/salida        # Registrar salida (OPERARIO)
GET  /api/inventario/stock         # Estado actual de stock
```

## 🧪 **Testing y Calidad**

### **Tests Implementados**

```bash
cd packages/backend
npm run test

# Tests con patrón Given-When-Then
describe('CU-INV-01: Registrar salida', () => {
  it('Given stock 50, When salida 10, Then stock=40', async () => {
    // Given - Setup del escenario
    // When - Acción a probar
    // Then - Verificaciones y assertions
  })
})
```

### **Estructura de Tests**

- ✅ **Tests unitarios** para casos de uso
- ✅ **Mocks** para repositorios y servicios externos
- ✅ **Cobertura** de flujos principales
- ✅ **Validation testing** para DTOs y schemas

## 🔧 **Solución de Problemas Comunes**

### **Problemas de Setup**

```bash
# Error: Puerto ocupado
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process

# Error: Dependencias corruptas
rm -rf node_modules packages/*/node_modules package-lock.json
npm install

# Error: Base de datos corrupta
cd packages/backend
rm prisma/dev.db
npx prisma migrate dev --name reset
npm run db:seed
```

### **Problemas de Desarrollo**

```bash
# Error: TypeScript compilation
npx tsc --noEmit  # Verificar errores de tipos

# Error: Prisma Client desactualizado
cd packages/backend
npx prisma generate

# Error: ESLint/Prettier
npm run lint:fix  # Desde raíz o paquete específico
```

## 🏗️ **Arquitectura y Patrones Implementados**

### **Backend - Arquitectura Hexagonal**

```typescript
// Separación clara de responsabilidades
src/
├── domain/              # Lógica de negocio pura (sin dependencias externas)
│   ├── entities.ts      # Entidades del dominio
│   ├── repositories.ts  # Interfaces (contratos)
│   ├── strategies/      # Strategy Pattern para reabastecimiento
│   ├── approvals/       # Chain of Responsibility para aprobaciones
│   └── events/          # Observer Pattern para eventos y KPIs
├── services/            # Casos de uso de aplicación
│   ├── inventario-use-cases.ts      # CU-INV-01, CU-INV-02, etc.
│   ├── solicitudes-use-cases.ts     # CU-SC-01, CU-APR-01, etc.
│   ├── kpis-use-cases.ts           # CU-KPI-01, CU-KPI-02, etc.
│   └── reabastecimiento-use-cases.ts # CU-REB-01, etc.
├── infra/               # Adaptadores e infraestructura
│   ├── prisma/          # Implementaciones concretas de repositorios
│   └── adapters/        # Email, jobs, servicios externos
└── controllers/         # Controladores HTTP (capa de presentación)
```

### **Frontend - Vue.js SPA**

```typescript
// Arquitectura orientada a componentes
src/
├── pages/               # Páginas principales de la aplicación
│   ├── LoginPage.vue           # Autenticación
│   ├── DashboardPage.vue       # Resumen y métricas
│   ├── ProductosPage.vue       # Gestión de productos
│   ├── InventarioPage.vue      # Movimientos de inventario
│   ├── SolicitudesPage.vue     # Workflow de solicitudes
│   ├── KPIsPage.vue           # Indicadores y reportes
│   └── PerfilPage.vue         # Configuración de usuario
├── components/          # Componentes reutilizables
├── stores/              # Estado global con Pinia
│   └── auth.ts         # Autenticación, roles, permisos
├── router/              # Configuración de rutas con guards
└── style.css           # Estilos globales + TailwindCSS
```

### **Patrones de Diseño en Acción**

#### **🎯 Strategy Pattern - Algoritmos de Reabastecimiento**

```typescript
// Diferentes estrategias para calcular cuándo y cuánto comprar
interface EstrategiaReabastecimiento {
  calcular(producto: Producto): SugerenciaCompra;
}

class EOQStrategy implements EstrategiaReabastecimiento {
  /* Lote Económico */
}
class ManualStrategy implements EstrategiaReabastecimiento {
  /* Cantidad Fija */
}
```

#### **⛓️ Chain of Responsibility - Aprobaciones Multinivel**

```typescript
// Flujo de aprobación que pasa por diferentes niveles según el monto
class AprobadorOperativo extends BaseAprobador {
  /* < $1M */
}
class AprobadorGerencial extends BaseAprobador {
  /* $1M - $10M */
}
class AprobadorDirectivo extends BaseAprobador {
  /* > $10M */
}
```

#### **👁️ Observer Pattern - Sistema de Eventos para KPIs**

```typescript
// Los KPIs se actualizan automáticamente cuando ocurren eventos
class KPIObserver implements EventObserver {
  onInventarioActualizado(evento: InventarioActualizadoEvent) {
    // Recalcular rotación, fill rate, etc.
  }
}
```
## 📚 **Recursos Adicionales**

### **Documentación Técnica**

- **[SETUP.md](SETUP.md)** - Guía detallada de instalación y setup
- **Arquitectura Hexagonal** - Patrón implementado en el backend
- **Vue.js 3 Composition API** - Patrón usado en frontend
- **Prisma ORM** - Documentación oficial para queries

### **APIs y Schemas**

- **Swagger/OpenAPI** - Documentación automática de APIs (próximamente)
- **Prisma Studio** - GUI para explorar base de datos
- **Vue DevTools** - Extension para debugging del frontend

### **Herramientas Recomendadas**

- **VS Code** con extensiones: Vue, Prisma, TypeScript
- **Thunder Client / Postman** para testing de APIs
- **Prisma Studio** para gestión de base de datos
- **Vue DevTools** para debugging del estado

## 🤝 **Contribución y Colaboración**

### **Pull Request Process**

1. **Fork** el proyecto o crear rama desde `feat/fullstack-bootstrap`
2. **Desarrollar** siguiendo patrones establecidos
3. **Testing** - Agregar tests para nueva funcionalidad
4. **Commit** usando convenciones semánticas
5. **PR** hacia `feat/fullstack-bootstrap` con descripción detallada

### **Code Review Guidelines**

- ✅ **Funcionalidad** - Código cumple requisitos
- ✅ **Arquitectura** - Respeta patrones establecidos
- ✅ **Testing** - Incluye tests apropiados
- ✅ **Performance** - No degrada rendimiento
- ✅ **Security** - No introduce vulnerabilidades

### **Canales de Comunicación**

- **GitHub Issues** - Reportar bugs y solicitar features
- **PR Comments** - Discusiones técnicas específicas
- **Documentación** - Mantener README y SETUP actualizados

---

## 📄 **Información del Proyecto**

**Universidad:** USC - Gestión de Proyectos TI  
**Semestre:** 7 (2025)  
**Licencia:** MIT  
**Estado:** ✅ **Funcional completo** - Backend + Frontend implementados

### **Equipo de Desarrollo**

- **Lead Developer** - [@Marmo03](https://github.com/Marmo03)
- **Colaboradores** - [@Juanca666](https://github.com/Juanca666)
                      [@Kvn-cpu](https://github.com/Kvn-cpu)
---

## 🎉 **¡Bienvenido al Equipo!**

Este proyecto implementa una **arquitectura sólida y escalable** con patrones de diseño modernos. El código está **bien estructurado, documentado y testeado**.

**¡Cualquier duda sobre setup, arquitectura o implementación, no hesites en crear un issue o PR!**

**Happy Coding! 🚀🍺**
