# Documentación Cervecería USC

## 📋 Descripción del Proyecto

Sistema de gestión de cadena de suministro para Cervecería USC. La aplicación permite gestionar el inventario de productos, procesar solicitudes de compra con flujos de aprobación multinivel, controlar la logística de envíos y generar indicadores clave de rendimiento (KPIs) en tiempo real.

## 🎯 Objetivo

Desarrollar una plataforma web completa que automatice y optimice los procesos de la cadena de suministro de una cervecería, desde la gestión de inventario hasta el tracking de envíos, implementando algoritmos de reabastecimiento inteligente y un sistema de aprobaciones jerárquico.

## 🛠️ Tecnologías Utilizadas

### Frontend

- **Vue.js 3** - Framework JavaScript progresivo para construir interfaces de usuario
- **Vite** - Build tool para desarrollo rápido
- **Pinia** - Gestión de estado reactivo
- **TailwindCSS** - Framework CSS utility-first
- **Vue Router** - Enrutamiento con protección de rutas

### Backend

- **Node.js + Fastify** - Framework web rápido y minimalista
- **Prisma ORM** - Herramienta de mapeo objeto-relacional
- **JWT** - Autenticación basada en tokens
- **Bcrypt** - Encriptación de contraseñas

### Base de Datos

- **PostgreSQL 16** - Sistema de base de datos relacional

## ⚙️ Instalación

### Prerrequisitos

- Node.js 18+
- PostgreSQL 16
- npm o pnpm

### Pasos

1. **Clonar el repositorio**

```bash
git clone https://github.com/Marmo03/cerveceria-usc.git
cd cerveceria-usc
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env` en `packages/backend/`:

```bash
DATABASE_URL="postgresql://cerveceria_user:cerveceria2024!@localhost:5432/cerveceria_usc"
JWT_SECRET="super-secret-jwt-key-for-cerveceria-usc-marmo-development-2024"
PORT=3000
```

4. **Configurar base de datos**

```bash
cd packages/backend
npx prisma migrate dev
npm run db:seed
```

5. **Ejecutar la aplicación**

Terminal 1 - Backend:

```bash
cd packages/backend
npm run dev
```

Terminal 2 - Frontend:

```bash
cd packages/frontend
npm run dev
```

## 👥 Usuarios de Prueba

| Email                    | Contraseña   | Rol           |
| ------------------------ | ------------ | ------------- |
| admin@cerveceria.com     | admin123     | Administrador |
| operario@cerveceria.com  | operario123  | Operario      |
| aprobador@cerveceria.com | aprobador123 | Aprobador     |
| analista@cerveceria.com  | analista123  | Analista      |

## 📱 Módulos del Sistema

- **Dashboard** - Vista general con métricas clave
- **Productos** - Gestión de catálogo de productos
- **Inventario** - Control de stock y movimientos
- **Solicitudes de Compra** - Creación y aprobación de pedidos
- **Logística** - Seguimiento de envíos y rutas
- **KPIs** - Indicadores de rendimiento en tiempo real
- **Perfil** - Gestión de cuenta de usuario

## 🔐 Roles y Permisos

- **Administrador** - Acceso completo al sistema
- **Operario** - Gestión de inventario y productos
- **Aprobador** - Revisión y aprobación de solicitudes
- **Analista** - Consulta de datos y reportes

## 📚 Documentación

- [Arquitectura](architecture.md) - Estructura técnica de la aplicación
- [API's](apis.md) - Endpoints y servicios REST
- [Controladores Backend](controladores-backend.md) - Lógica de negocio
- [Base de Datos](base-de-datos.md) - Modelos y esquema
- [Frontend](frontend.md) - Componentes y páginas

## 🚀 Estado del Proyecto

✅ Sistema completamente funcional
✅ 15 tablas de base de datos
✅ 50+ endpoints API REST
✅ 30+ componentes Vue.js
✅ Arquitectura hexagonal implementada
✅ Sistema de autenticación JWT
✅ Flujo de aprobaciones multinivel
✅ Algoritmos de reabastecimiento (EOQ, Just-in-Time, Fixed Quantity)

## 📄 Licencia

MIT License - Proyecto Universitario USC 2024
