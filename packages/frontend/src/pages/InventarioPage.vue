<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              Gestión de Inventario
            </h1>
            <p class="mt-2 text-gray-600">
              Controla los movimientos y stock de productos
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="$router.push('/dashboard')"
              class="btn btn-secondary"
            >
              <svg
                class="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Volver al Dashboard
            </button>
            <button
              v-if="authStore.hasAnyRole(['ADMIN', 'OPERARIO'])"
              @click="showMovimientoModal = true"
              class="btn btn-primary"
            >
              <svg
                class="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Registrar Movimiento
            </button>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Producto</label
              >
              <input
                v-model="filters.producto"
                type="text"
                placeholder="Buscar producto..."
                class="input-field"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Tipo de Movimiento</label
              >
              <select v-model="filters.tipo" class="input-field">
                <option value="">Todos</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SALIDA">Salida</option>
                <option value="AJUSTE">Ajuste</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Fecha Desde</label
              >
              <input
                v-model="filters.fechaDesde"
                type="date"
                class="input-field"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Fecha Hasta</label
              >
              <input
                v-model="filters.fechaHasta"
                type="date"
                class="input-field"
              />
            </div>
            <div class="flex items-end">
              <button @click="resetFilters" class="btn btn-secondary w-full">
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Resumen de Stock -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="stat-card">
          <div class="stat-icon bg-blue-100 text-blue-600">
            <svg
              class="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ stats.totalMovimientos }}
            </p>
            <p class="text-gray-600">Total Movimientos</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-green-100 text-green-600">
            <svg
              class="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 11l5-5m0 0l5 5m-5-5v12"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ stats.entradas }}</p>
            <p class="text-gray-600">Entradas Hoy</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-red-100 text-red-600">
            <svg
              class="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 13l-5 5m0 0l-5-5m5 5V6"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ stats.salidas }}</p>
            <p class="text-gray-600">Salidas Hoy</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-yellow-100 text-yellow-600">
            <svg
              class="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ stats.alertas }}</p>
            <p class="text-gray-600">Alertas Stock</p>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="mb-6">
        <nav class="flex space-x-8">
          <button
            @click="activeTab = 'movimientos'"
            :class="[
              'tab',
              activeTab === 'movimientos' ? 'tab-active' : 'tab-inactive',
            ]"
          >
            Movimientos Recientes
          </button>
          <button
            @click="activeTab = 'stock'"
            :class="[
              'tab',
              activeTab === 'stock' ? 'tab-active' : 'tab-inactive',
            ]"
          >
            Estado de Stock
          </button>
        </nav>
      </div>

      <!-- Contenido de tabs -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <!-- Tab Movimientos -->
        <div v-if="activeTab === 'movimientos'">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">
              Movimientos de Inventario
            </h3>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="table-header">Fecha</th>
                  <th class="table-header">Producto</th>
                  <th class="table-header">Tipo</th>
                  <th class="table-header">Cantidad</th>
                  <th class="table-header">Motivo</th>
                  <th class="table-header">Usuario</th>
                  <th class="table-header">Estado</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="movimiento in filteredMovimientos"
                  :key="movimiento.id"
                  class="hover:bg-gray-50"
                >
                  <td class="table-cell">
                    <div class="text-sm text-gray-900">
                      {{ formatDate(movimiento.fecha) }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ formatTime(movimiento.fecha) }}
                    </div>
                  </td>
                  <td class="table-cell">
                    <div class="font-medium text-gray-900">
                      {{ movimiento.producto }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ movimiento.codigoProducto }}
                    </div>
                  </td>
                  <td class="table-cell">
                    <span class="badge" :class="getTipoClass(movimiento.tipo)">
                      {{ movimiento.tipo }}
                    </span>
                  </td>
                  <td class="table-cell">
                    <span :class="getCantidadClass(movimiento.tipo)">
                      {{
                        formatCantidad(movimiento.cantidad, movimiento.tipo)
                      }}
                      {{ movimiento.unidad }}
                    </span>
                  </td>
                  <td class="table-cell">{{ movimiento.motivo }}</td>
                  <td class="table-cell">{{ movimiento.usuario }}</td>
                  <td class="table-cell">
                    <span class="badge badge-success">Completado</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tab Stock -->
        <div v-if="activeTab === 'stock'">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">
              Estado Actual de Stock
            </h3>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="table-header">Producto</th>
                  <th class="table-header">Categoría</th>
                  <th class="table-header">Stock Actual</th>
                  <th class="table-header">Stock Mínimo</th>
                  <th class="table-header">Estado</th>
                  <th class="table-header">Último Movimiento</th>
                  <th class="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="item in stockItems"
                  :key="item.id"
                  class="hover:bg-gray-50"
                >
                  <td class="table-cell">
                    <div class="font-medium text-gray-900">
                      {{ item.nombre }}
                    </div>
                    <div class="text-sm text-gray-500">{{ item.codigo }}</div>
                  </td>
                  <td class="table-cell">{{ item.categoria }}</td>
                  <td class="table-cell">
                    <span
                      :class="getStockClass(item.stockActual, item.stockMinimo)"
                    >
                      {{ item.stockActual }} {{ item.unidad }}
                    </span>
                  </td>
                  <td class="table-cell">
                    {{ item.stockMinimo }} {{ item.unidad }}
                  </td>
                  <td class="table-cell">
                    <span
                      class="badge"
                      :class="
                        getStockStatusClass(item.stockActual, item.stockMinimo)
                      "
                    >
                      {{ getStockStatus(item.stockActual, item.stockMinimo) }}
                    </span>
                  </td>
                  <td class="table-cell">
                    <div class="text-sm text-gray-900">
                      {{ formatDate(item.ultimoMovimiento) }}
                    </div>
                  </td>
                  <td class="table-cell">
                    <button
                      @click="ajustarStock(item)"
                      class="btn-icon btn-icon-secondary"
                      title="Ajustar stock"
                    >
                      <svg
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="spinner"></div>
          <span class="ml-2 text-gray-600">Cargando inventario...</span>
        </div>

        <!-- Empty state -->
        <div
          v-if="
            !loading &&
            activeTab === 'movimientos' &&
            filteredMovimientos.length === 0
          "
          class="text-center py-12"
        >
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">
            No hay movimientos
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            No se encontraron movimientos con los filtros aplicados.
          </p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import AppLayout from "../components/AppLayout.vue";

const authStore = useAuthStore();

// Estado reactivo
const loading = ref(false);
const showMovimientoModal = ref(false);
const activeTab = ref("movimientos");

// Datos de ejemplo
const movimientos = ref([
  {
    id: 1,
    fecha: new Date("2024-01-15T10:30:00"),
    producto: "Malta Pilsner",
    codigoProducto: "MP001",
    tipo: "ENTRADA",
    cantidad: 100,
    unidad: "kg",
    motivo: "Compra a proveedor XYZ",
    usuario: "Juan Pérez",
  },
  {
    id: 2,
    fecha: new Date("2024-01-15T14:15:00"),
    producto: "Lúpulo Cascade",
    codigoProducto: "MP002",
    tipo: "SALIDA",
    cantidad: 5,
    unidad: "kg",
    motivo: "Producción lote IPA-001",
    usuario: "María García",
  },
  {
    id: 3,
    fecha: new Date("2024-01-15T16:45:00"),
    producto: "Botella 355ml",
    codigoProducto: "EMP001",
    tipo: "ENTRADA",
    cantidad: 500,
    unidad: "unidades",
    motivo: "Recepción pedido 2024-001",
    usuario: "Carlos López",
  },
]);

const stockItems = ref([
  {
    id: 1,
    codigo: "MP001",
    nombre: "Malta Pilsner",
    categoria: "Materia Prima",
    stockActual: 500,
    stockMinimo: 100,
    unidad: "kg",
    ultimoMovimiento: new Date("2024-01-15T10:30:00"),
  },
  {
    id: 2,
    codigo: "MP002",
    nombre: "Lúpulo Cascade",
    categoria: "Materia Prima",
    stockActual: 25,
    stockMinimo: 50,
    unidad: "kg",
    ultimoMovimiento: new Date("2024-01-15T14:15:00"),
  },
  {
    id: 3,
    codigo: "PT001",
    nombre: "Cerveza IPA",
    categoria: "Producto Terminado",
    stockActual: 200,
    stockMinimo: 50,
    unidad: "unidades",
    ultimoMovimiento: new Date("2024-01-14T09:00:00"),
  },
]);

// Filtros
const filters = ref({
  producto: "",
  tipo: "",
  fechaDesde: "",
  fechaHasta: "",
});

// Movimientos filtrados
const filteredMovimientos = computed(() => {
  return movimientos.value.filter((movimiento) => {
    const matchesProducto =
      !filters.value.producto ||
      movimiento.producto
        .toLowerCase()
        .includes(filters.value.producto.toLowerCase()) ||
      movimiento.codigoProducto
        .toLowerCase()
        .includes(filters.value.producto.toLowerCase());

    const matchesTipo =
      !filters.value.tipo || movimiento.tipo === filters.value.tipo;

    const matchesFecha =
      (!filters.value.fechaDesde ||
        movimiento.fecha >= new Date(filters.value.fechaDesde)) &&
      (!filters.value.fechaHasta ||
        movimiento.fecha <= new Date(filters.value.fechaHasta));

    return matchesProducto && matchesTipo && matchesFecha;
  });
});

// Estadísticas
const stats = computed(() => ({
  totalMovimientos: movimientos.value.length,
  entradas: movimientos.value.filter(
    (m) => m.tipo === "ENTRADA" && isToday(m.fecha)
  ).length,
  salidas: movimientos.value.filter(
    (m) => m.tipo === "SALIDA" && isToday(m.fecha)
  ).length,
  alertas: stockItems.value.filter((s) => s.stockActual <= s.stockMinimo)
    .length,
}));

// Métodos
const resetFilters = () => {
  filters.value = {
    producto: "",
    tipo: "",
    fechaDesde: "",
    fechaHasta: "",
  };
};

const getTipoClass = (tipo: string) => {
  const classes = {
    ENTRADA: "badge-success",
    SALIDA: "badge-error",
    AJUSTE: "badge-warning",
    TRANSFERENCIA: "badge-info",
  };
  return classes[tipo as keyof typeof classes] || "badge-secondary";
};

const getCantidadClass = (tipo: string) => {
  return tipo === "ENTRADA"
    ? "text-green-600 font-semibold"
    : tipo === "SALIDA"
      ? "text-red-600 font-semibold"
      : "text-gray-900";
};

const getStockClass = (actual: number, minimo: number) => {
  if (actual <= minimo) return "text-red-600 font-semibold";
  if (actual <= minimo * 1.2) return "text-yellow-600 font-semibold";
  return "text-gray-900";
};

const getStockStatusClass = (actual: number, minimo: number) => {
  if (actual <= minimo) return "badge-error";
  if (actual <= minimo * 1.2) return "badge-warning";
  return "badge-success";
};

const getStockStatus = (actual: number, minimo: number) => {
  if (actual <= minimo) return "Crítico";
  if (actual <= minimo * 1.2) return "Bajo";
  return "Normal";
};

const formatCantidad = (cantidad: number, tipo: string) => {
  const prefix = tipo === "ENTRADA" ? "+" : tipo === "SALIDA" ? "-" : "";
  return `${prefix}${cantidad}`;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const ajustarStock = (item: any) => {
  console.log("Ajustar stock:", item);
  // TODO: Implementar modal de ajuste de stock
};

onMounted(() => {
  // TODO: Cargar datos desde API
});
</script>

<style scoped>
.tab {
  @apply px-1 py-4 text-sm font-medium border-b-2 transition-colors duration-200;
}

.tab-active {
  @apply text-blue-600 border-blue-600;
}

.tab-inactive {
  @apply text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300;
}
</style>
