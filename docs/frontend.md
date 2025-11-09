# Frontend

## Documentación del Frontend

El frontend de la aplicación está desarrollado con Vue.js 3, utilizando el Composition API y arquitectura basada en componentes. La interfaz está optimizada para proporcionar una experiencia de usuario fluida y responsiva.

## Tecnologías del Frontend

- **Vue.js 3.3.8** - Framework progresivo para interfaces de usuario
- **Vite 5.0** - Build tool ultrarrápido para desarrollo
- **Pinia 2.1.7** - State management moderno para Vue
- **Vue Router 4.2.5** - Enrutamiento con guards de autenticación
- **TailwindCSS 3.3.6** - Framework CSS utility-first
- **Axios 1.6.2** - Cliente HTTP con interceptors

## Estructura del Proyecto

```
packages/frontend/
├── src/
│   ├── pages/           # Páginas de la aplicación
│   │   ├── LoginPage.vue
│   │   ├── DashboardPage.vue
│   │   ├── ProductsPage.vue
│   │   ├── InventoryPage.vue
│   │   ├── PurchaseRequestsPage.vue
│   │   ├── LogisticsPage.vue
│   │   ├── KPIsPage.vue
│   │   └── ProfilePage.vue
│   ├── components/      # Componentes reutilizables
│   │   ├── layout/
│   │   ├── forms/
│   │   └── ui/
│   ├── stores/          # Stores de Pinia
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── inventory.ts
│   │   └── logistics.ts
│   ├── router/          # Configuración de rutas
│   │   └── index.ts
│   ├── services/        # Servicios API
│   │   └── api.ts
│   └── utils/           # Utilidades y helpers
```

## Páginas Principales

### LoginPage.vue

Página de inicio de sesión del sistema.

**Funcionalidades:**

- Formulario de autenticación con validación
- Manejo de errores de credenciales
- Redirección automática después del login
- Almacenamiento seguro del token JWT

**Componentes utilizados:**

- Input de email con validación
- Input de contraseña con toggle de visibilidad
- Botón de submit con loading state
- Mensajes de error

**Store:** `useAuthStore()`

### DashboardPage.vue

Panel de control principal con métricas del sistema.

**Funcionalidades:**

- Vista general de KPIs en tiempo real
- Gráficos de inventario
- Resumen de solicitudes pendientes
- Alertas de stock bajo
- Envíos en tránsito

**Widgets incluidos:**

- Tarjetas de métricas (total productos, stock bajo, solicitudes pendientes)
- Gráfico de rotación de inventario
- Lista de productos con stock bajo
- Timeline de envíos recientes

**Stores:** `useInventoryStore()`, `usePurchaseRequestsStore()`, `useLogisticsStore()`

### ProductsPage.vue

Gestión completa del catálogo de productos.

**Funcionalidades:**

- Tabla de productos con búsqueda y filtros
- Crear nuevo producto
- Editar producto existente
- Eliminar producto (soft delete)
- Paginación de resultados
- Exportar a CSV

**Componentes:**

- `ProductTable` - Tabla de productos
- `ProductForm` - Formulario de producto
- `SearchBar` - Barra de búsqueda
- `FilterPanel` - Panel de filtros

**Store:** `useProductsStore()`

**Ejemplo de uso:**

```vue
<template>
  <div class="products-page">
    <SearchBar v-model="searchTerm" />
    <FilterPanel v-model:filters="filters" />
    <ProductTable
      :products="filteredProducts"
      @edit="handleEdit"
      @delete="handleDelete"
    />
    <ProductForm
      v-if="showForm"
      :product="selectedProduct"
      @save="handleSave"
      @cancel="closeForm"
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useProductsStore } from "@/stores/products";

const productsStore = useProductsStore();
const searchTerm = ref("");
const filters = ref({});
const showForm = ref(false);
const selectedProduct = ref(null);

const filteredProducts = computed(() => {
  return productsStore.products.filter((product) => {
    // Lógica de filtrado
  });
});

const handleEdit = (product) => {
  selectedProduct.value = product;
  showForm.value = true;
};

const handleSave = async (productData) => {
  await productsStore.saveProduct(productData);
  showForm.value = false;
};
</script>
```

### InventoryPage.vue

Control de inventario y movimientos de stock.

**Funcionalidades:**

- Registro de movimientos (entrada/salida)
- Historial de movimientos con filtros
- Visualización de stock actual
- Alertas de reorden
- Gráficos de tendencias

**Componentes:**

- `MovementForm` - Formulario de movimientos
- `MovementHistory` - Historial de movimientos
- `StockLevelChart` - Gráfico de niveles de stock
- `ReorderAlerts` - Alertas de reorden

**Store:** `useInventoryStore()`

**Flujo de registro de movimiento:**

1. Usuario selecciona tipo de movimiento (entrada/salida)
2. Selecciona producto del catálogo
3. Ingresa cantidad y motivo
4. Sistema valida disponibilidad (para salidas)
5. Registra movimiento en base de datos
6. Actualiza stock actual del producto
7. Dispara cálculo de KPIs

### PurchaseRequestsPage.vue

Gestión de solicitudes de compra y aprobaciones.

**Funcionalidades:**

- Crear nueva solicitud de compra
- Ver solicitudes propias
- Aprobar/rechazar solicitudes (según rol)
- Ver flujo de aprobaciones
- Tracking de estado

**Componentes:**

- `RequestForm` - Formulario de solicitud
- `RequestList` - Lista de solicitudes
- `ApprovalFlow` - Visualización del flujo
- `RequestDetails` - Detalles de solicitud

**Store:** `usePurchaseRequestsStore()`

**Estados de solicitud:**

- BORRADOR - Solicitud en creación
- EN_APROBACION - En proceso de aprobación
- APROBADA - Aprobada por todos los niveles
- RECHAZADA - Rechazada por algún aprobador
- CANCELADA - Cancelada por el creador

### LogisticsPage.vue

Seguimiento de envíos y logística.

**Funcionalidades:**

- Ver envíos activos
- Crear nuevo envío
- Actualizar estado de envío
- Tracking en tiempo real
- Visualización de rutas

**Componentes:**

- `ShipmentList` - Lista de envíos
- `ShipmentForm` - Formulario de envío
- `TrackingTimeline` - Timeline de tracking
- `RouteMap` - Mapa de ruta (futuro)

**Store:** `useLogisticsStore()`

**Timeline de estados:**

```
PENDIENTE → EN_PREPARACION → EN_TRANSITO → EN_ENTREGA → ENTREGADO
```

### KPIsPage.vue

Visualización de indicadores clave de rendimiento.

**Funcionalidades:**

- Dashboard de KPIs
- Gráficos interactivos
- Filtros por período
- Exportar reportes
- Comparativas históricas

**KPIs mostrados:**

- Rotación de inventario
- Fill rate (tasa de cumplimiento)
- Tiempo promedio de aprobación
- Tasa de entregas a tiempo
- Costo de inventario

**Componentes:**

- `KPICard` - Tarjeta de KPI individual
- `TrendChart` - Gráfico de tendencias
- `ComparisonChart` - Gráfico comparativo
- `PeriodSelector` - Selector de período

**Store:** `useKPIsStore()`

### ProfilePage.vue

Gestión de perfil de usuario.

**Funcionalidades:**

- Ver información personal
- Cambiar contraseña
- Configuración de notificaciones
- Ver actividad reciente

**Store:** `useAuthStore()`

## Sistema de Stores (Pinia)

### authStore

Gestiona la autenticación y autorización.

```typescript
export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    token: localStorage.getItem("token"),
    isAuthenticated: false,
  }),

  actions: {
    async login(credentials) {
      const response = await api.post("/auth/login", credentials);
      this.token = response.data.token;
      this.user = response.data.user;
      this.isAuthenticated = true;
      localStorage.setItem("token", this.token);
    },

    logout() {
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;
      localStorage.removeItem("token");
    },

    async fetchProfile() {
      const response = await api.get("/auth/profile");
      this.user = response.data.user;
    },
  },

  getters: {
    hasRole: (state) => (roleName) => {
      return state.user?.role?.name === roleName;
    },

    hasPermission: (state) => (permission) => {
      return state.user?.role?.permissions?.[permission] === true;
    },
  },
});
```

### productsStore

Gestiona el catálogo de productos.

```typescript
export const useProductsStore = defineStore("products", {
  state: () => ({
    products: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchProducts() {
      this.loading = true;
      try {
        const response = await api.get("/products");
        this.products = response.data.products;
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    async createProduct(productData) {
      const response = await api.post("/products", productData);
      this.products.push(response.data.product);
    },

    async updateProduct(id, productData) {
      const response = await api.put(`/products/${id}`, productData);
      const index = this.products.findIndex((p) => p.id === id);
      if (index !== -1) {
        this.products[index] = response.data.product;
      }
    },

    async deleteProduct(id) {
      await api.delete(`/products/${id}`);
      this.products = this.products.filter((p) => p.id !== id);
    },
  },

  getters: {
    activeProducts: (state) => {
      return state.products.filter((p) => p.isActive);
    },

    lowStockProducts: (state) => {
      return state.products.filter((p) => p.currentStock <= p.reorderPoint);
    },
  },
});
```

## Routing y Guards

### Configuración de Rutas

```typescript
const routes = [
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { requiresAuth: false },
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/products",
    name: "Products",
    component: ProductsPage,
    meta: {
      requiresAuth: true,
      requiredRole: "OPERARIO",
    },
  },
  // ... más rutas
];
```

### Navigation Guards

```typescript
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next("/login");
  } else if (to.meta.requiredRole && !authStore.hasRole(to.meta.requiredRole)) {
    next("/dashboard");
  } else {
    next();
  }
});
```

## Servicios API

### Configuración de Axios

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000,
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
      router.push("/login");
    }
    return Promise.reject(error);
  },
);

export default api;
```

## Componentes Reutilizables

- **Button** - Botón con variantes y loading state
- **Input** - Campo de entrada con validación
- **Select** - Selector dropdown
- **Modal** - Modal genérico
- **Table** - Tabla con sorting y paginación
- **Card** - Tarjeta de contenido
- **Badge** - Etiqueta de estado
- **Alert** - Mensajes de alerta
- **Loading** - Indicador de carga
- **Pagination** - Componente de paginación

## Estilos y Tema

El proyecto utiliza Tailwind CSS con configuración personalizada:

**Colores principales:**

- Primary: Azul (#3B82F6)
- Secondary: Gris (#6B7280)
- Success: Verde (#10B981)
- Warning: Amarillo (#F59E0B)
- Danger: Rojo (#EF4444)

**Breakpoints:**

- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px

## Buenas Prácticas Implementadas

1. **Composition API** - Uso de `<script setup>` para código más limpio
2. **TypeScript** - Tipado estático en stores y composables
3. **Error Handling** - Manejo centralizado de errores
4. **Loading States** - Estados de carga en operaciones asíncronas
5. **Optimización** - Lazy loading de componentes y rutas
6. **Responsive Design** - Diseño adaptable a todos los dispositivos
7. **Accessibility** - Etiquetas ARIA y navegación por teclado

Esta arquitectura de frontend proporciona una base sólida, mantenible y escalable para la aplicación.
