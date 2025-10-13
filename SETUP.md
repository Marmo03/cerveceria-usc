# 🍺 Cervecería USC - Guía de Setup

Sistema de gestión de inventario RPA para Cervecería USC con arquitectura hexagonal y frontend Vue.js.

## 🚀 Setup Rápido para Colaboradores

### Requisitos Previos

- **Node.js** v18.0.0 o superior
- **npm** v8.0.0 o superior
- **Git** (cualquier versión reciente)

```bash
# Verificar versiones
node --version && npm --version && git --version
```

### 1️⃣ Clonar y Preparar

```bash
git clone https://github.com/Marmo03/cerveceria-usc.git
cd cerveceria-usc
git checkout feat/fullstack-bootstrap
```

### 2️⃣ Instalar Dependencias

```bash
# Desde la raíz del proyecto (instala backend + frontend)
npm install
```

### 3️⃣ Configurar Base de Datos

```bash
cd packages/backend

# Generar base de datos SQLite y aplicar migraciones
npx prisma migrate dev --name init

# Poblar con datos de prueba (usuarios, productos, etc.)
npm run db:seed
```

### 4️⃣ Ejecutar Aplicación

**Terminal 1 - Backend API:**

```bash
cd packages/backend
npm run dev
```

🌐 Backend corriendo en: http://localhost:3000

**Terminal 2 - Frontend UI:**

```bash
cd packages/frontend
npm run dev
```

🌐 Frontend corriendo en: http://localhost:5173

### 5️⃣ Acceder al Sistema

**URL:** http://localhost:5173

**Usuarios de Prueba:**
| Email | Password | Rol |
|-------|----------|-----|
| `admin@cerveceria-usc.edu.co` | `123456` | Administrador |
| `operario@cerveceria-usc.edu.co` | `123456` | Operario |
| `aprobador@cerveceria-usc.edu.co` | `123456` | Aprobador |
| `analista@cerveceria-usc.edu.co` | `123456` | Analista |

## 🏗️ Arquitectura del Proyecto

```
cerveceria-usc/
├── packages/
│   ├── backend/          # API Node.js + Fastify
│   │   ├── prisma/       # Base de datos SQLite
│   │   ├── src/
│   │   │   ├── domain/   # Entidades y lógica de negocio
│   │   │   ├── services/ # Casos de uso
│   │   │   └── infra/    # Adaptadores e infraestructura
│   │   └── tests/        # Tests unitarios
│   └── frontend/         # Aplicación Vue.js
│       ├── src/
│       │   ├── pages/    # Páginas de la aplicación
│       │   ├── stores/   # Estado global (Pinia)
│       │   └── router/   # Navegación
│       └── public/
└── docs/                 # Documentación
```

## 🛠️ Scripts Disponibles

### Backend

```bash
cd packages/backend

npm run dev          # Servidor de desarrollo
npm run build        # Compilar para producción
npm run test         # Ejecutar tests
npm run db:seed      # Popular base de datos
npm run db:reset     # Resetear base de datos
```

### Frontend

```bash
cd packages/frontend

npm run dev          # Servidor de desarrollo
npm run build        # Compilar para producción
npm run preview      # Preview build de producción
```

## 🔧 Solución de Problemas

### Error de puerto ocupado

```bash
# Si el puerto 3000 está ocupado (backend)
PORT=3001 npm run dev

# Si el puerto 5173 está ocupado (frontend)
npm run dev -- --port 5174
```

### Problemas con la base de datos

```bash
cd packages/backend

# Resetear completamente la base de datos
npm run db:reset

# Regenerar la base de datos
npx prisma migrate dev --name reset
npm run db:seed
```

### Problemas con dependencias

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules packages/*/node_modules
npm install
```

## 📚 Funcionalidades Principales

- 🔐 **Autenticación:** JWT con roles (Admin, Operario, Aprobador, Analista)
- 📦 **Gestión de Productos:** CRUD completo con categorías
- 📊 **Inventario:** Movimientos de entrada/salida, alertas de stock
- 📝 **Solicitudes:** Workflow de aprobación multinivel
- 📈 **KPIs:** Dashboard con métricas e indicadores
- 👤 **Perfil:** Gestión de usuario y configuración

## 🏛️ Patrones de Diseño Implementados

- **Hexagonal Architecture:** Separación clara entre dominio e infraestructura
- **Strategy Pattern:** Algoritmos de reabastecimiento intercambiables
- **Chain of Responsibility:** Flujo de aprobaciones multinivel
- **Observer Pattern:** Sistema de eventos para KPIs
- **Repository Pattern:** Abstracción de acceso a datos

## 🧪 Testing

```bash
cd packages/backend
npm run test

# Tests implementados:
# - Given-When-Then para casos de uso
# - Tests unitarios de servicios
# - Mocks para repositorios
```

## 📞 Soporte

Si tienes problemas con el setup:

1. Verifica que tienes las versiones correctas de Node.js y npm
2. Asegúrate de estar en la rama `feat/fullstack-bootstrap`
3. Ejecuta los comandos desde los directorios correctos
4. Revisa que los puertos 3000 y 5173 estén disponibles

---

**¡Happy Coding! 🚀**
