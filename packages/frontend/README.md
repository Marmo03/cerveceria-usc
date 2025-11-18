# 🖥️ Frontend - Cervecería USC

Aplicación frontend desarrollada con Vue.js 3, Vite y TypeScript para el sistema de gestión de Cervecería USC.

## 🛠️ Stack Tecnológico

- **Vue.js 3** - Framework progresivo con Composition API
- **Vite** - Build tool rápido y moderno
- **TypeScript** - Tipado estático
- **Vue Router** - Enrutamiento SPA
- **Pinia** - Gestión de estado
- **Tailwind CSS** - Framework CSS utility-first
- **Vitest** - Testing framework
- **Playwright** - Tests E2E

## 🚀 Desarrollo

### Prerrequisitos

- Node.js >= 18.0.0
- npm >= 9.0.0

### Instalación

```bash
# Desde la raíz del monorepo
npm install

# O específicamente para frontend
npm install -w packages/frontend

# ⚠️ IMPORTANTE: Instalar dependencias de ESLint (requerido para commits)
cd packages/frontend
npm install --save-dev eslint-plugin-vue vue-eslint-parser
```

> **Nota para colaboradores**: El proyecto usa `husky` y `lint-staged` para validar código antes de cada commit. Asegúrate de tener instaladas las dependencias de ESLint o los commits fallarán.

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run dev:frontend     # Desde la raíz del monorepo

# Build
npm run build           # Build para producción
npm run preview         # Preview del build

# Testing
npm run test            # Tests unitarios
npm run test:coverage   # Tests con coverage
npm run test:ui         # UI de testing
npm run test:e2e        # Tests end-to-end
npm run test:e2e:ui     # UI para tests E2E

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
packages/frontend/
├── public/             # Archivos estáticos
├── src/
│   ├── assets/        # Assets (imágenes, iconos, etc.)
│   ├── components/    # Componentes reutilizables
│   │   ├── ui/       # Componentes base de UI
│   │   └── features/ # Componentes específicos de funcionalidad
│   ├── views/        # Páginas/Vistas
│   ├── router/       # Configuración de rutas
│   ├── stores/       # Stores de Pinia
│   ├── composables/  # Composables de Vue
│   ├── utils/        # Utilidades
│   ├── types/        # Tipos TypeScript
│   ├── api/          # Cliente API y servicios
│   └── styles/       # Estilos globales
├── tests/
│   ├── unit/         # Tests unitarios
│   ├── integration/  # Tests de integración
│   └── e2e/          # Tests end-to-end
└── ...archivos de configuración
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env.local` basado en `.env.example`:

```env
VITE_API_URL=http://localhost:3000
VITE_N8N_URL=http://localhost:5678
```

### Tailwind CSS

El proyecto usa Tailwind CSS para estilos. La configuración está en `tailwind.config.js`.

### ESLint y Prettier

- ESLint configurado para Vue.js + TypeScript
- Prettier para formateo de código
- Integración con VS Code

## ⚡ Funcionalidades Principales

### 🏠 Dashboard

- Vista general del sistema
- Métricas y estadísticas
- Accesos rápidos

### 👤 Autenticación

- Login/logout
- Gestión de sesiones
- Protección de rutas

### 📊 Gestión de Cervecería

- [Funcionalidades específicas del dominio]

## 🧪 Testing

### Tests Unitarios

```bash
npm run test           # Ejecutar tests
npm run test:coverage  # Con coverage
npm run test:ui        # Interfaz visual
```

### Tests E2E

```bash
npm run test:e2e       # Ejecutar tests E2E
npm run test:e2e:ui    # Con interfaz visual
```

## 🎨 Guía de Estilo

### Componentes

- Usar Composition API
- Componentes Single File Components (.vue)
- Props con TypeScript interfaces
- Emits tipados

### Convenciones de Nomenclatura

- Componentes: PascalCase
- Archivos: kebab-case
- Variables: camelCase
- Constantes: SCREAMING_SNAKE_CASE

### Estructura de Componentes

```vue
<template>
  <!-- Template aquí -->
</template>

<script setup lang="ts">
// Imports
// Props interface
// Emits interface
// Composables
// Reactive data
// Computed
// Methods
// Lifecycle hooks
</script>

<style scoped>
/* Estilos componente-específicos */
</style>
```

## 🔗 Integración con Backend

### API Client

- Axios configurado con interceptors
- Manejo de errores centralizado
- Tipos TypeScript para requests/responses

### Estado Global

- Pinia para gestión de estado
- Stores modulares por funcionalidad
- Persistencia cuando es necesaria

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints de Tailwind CSS
- Testing en múltiples dispositivos

## 🚀 Deployment

### Build para Producción

```bash
npm run build
```

El build se genera en `dist/` y está listo para servir desde cualquier servidor web estático.

### Variables de Entorno

Configurar variables según el entorno:

- `VITE_API_URL`: URL de la API backend
- `VITE_N8N_URL`: URL de n8n para integraciones

## 🤝 Contribución

1. Seguir convenciones de código establecidas
2. Escribir tests para nuevas funcionalidades
3. Documentar componentes complejos
4. Usar commits convencionales
5. Crear PRs siguiendo el template

## 📄 Licencia

MIT - ver el archivo [LICENSE](../../LICENSE) para detalles.

---

**Parte del proyecto**: Cervecería USC  
**Metodología**: P2P (Peer-to-Peer)  
**Universidad**: USC - Gestión de Proyectos TI
