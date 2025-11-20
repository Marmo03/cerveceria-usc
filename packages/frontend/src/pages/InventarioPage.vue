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
      <CardSkeleton v-if="loading" :count="4" :columns="4" />
      
      <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4.5c-.77-.834-1.964-.834-2.732 0L3.732 16c-.77.834.192 3 1.732 3z"
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
                      {{ movimiento.producto?.nombre || "Producto" }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ movimiento.producto?.sku || movimiento.productoId }}
                    </div>
                  </td>
                  <td class="table-cell">
                    <span class="badge" :class="getTipoClass(movimiento.tipo)">
                      {{ movimiento.tipo }}
                    </span>
                  </td>
                  <td class="table-cell">
                    <span :class="getCantidadClass(movimiento.tipo)">
                      {{ formatCantidad(movimiento.cantidad, movimiento.tipo) }}
                      {{ movimiento.producto?.unidad || "und" }}
                    </span>
                  </td>
                  <td class="table-cell">{{ movimiento.comentario || "-" }}</td>
                  <td class="table-cell">
                    {{ movimiento.usuario?.firstName || "Sistema" }}
                  </td>
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
                  v-for="item in productsStore.productos"
                  :key="item.id"
                  class="hover:bg-gray-50"
                >
                  <td class="table-cell">
                    <div class="font-medium text-gray-900">
                      {{ item.nombre }}
                    </div>
                    <div class="text-sm text-gray-500">{{ item.sku }}</div>
                  </td>
                  <td class="table-cell">{{ item.categoria }}</td>
                  <td class="table-cell">
                    <span
                      :class="getStockClass(item.stockActual, item.stockMin)"
                    >
                      {{ item.stockActual }} {{ item.unidad }}
                    </span>
                  </td>
                  <td class="table-cell">
                    {{ item.stockMin }} {{ item.unidad }}
                  </td>
                  <td class="table-cell">
                    <span
                      class="badge"
                      :class="
                        getStockStatusClass(item.stockActual, item.stockMin)
                      "
                    >
                      {{ getStockStatus(item.stockActual, item.stockMin) }}
                    </span>
                  </td>
                  <td class="table-cell">
                    <div v-if="ultimosMovimientosPorProducto.get(item.id)" class="text-sm">
                      <span :class="[
                        'font-medium',
                        ultimosMovimientosPorProducto.get(item.id).tipo === 'ENTRADA' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      ]">
                        {{ ultimosMovimientosPorProducto.get(item.id).tipo === 'ENTRADA' ? '+' : '-' }}
                        {{ ultimosMovimientosPorProducto.get(item.id).cantidad }}
                      </span>
                      <div class="text-xs text-gray-500 mt-1">
                        {{ formatDate(ultimosMovimientosPorProducto.get(item.id).fecha) }}
                      </div>
                    </div>
                    <div v-else class="text-sm text-gray-400">Sin movimientos</div>
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

    <!-- Modal de Movimiento -->
    <ModalMovimiento
      v-model="showMovimientoModal"
      @success="onMovimientoRegistrado"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useInventoryStore } from "../stores/inventory";
import { useProductsStore } from "../stores/products";
import AppLayout from "../components/AppLayout.vue";
import ModalMovimiento from "../components/ModalMovimiento.vue";
import TableSkeleton from "../components/TableSkeleton.vue";
import CardSkeleton from "../components/CardSkeleton.vue";

const authStore = useAuthStore();
const inventoryStore = useInventoryStore();
const productsStore = useProductsStore();

// Estado reactivo
const loading = computed(() => inventoryStore.loading);
const showMovimientoModal = ref(false);
const activeTab = ref("movimientos");

// Computed properties desde el store
const movimientos = computed(() => inventoryStore.movimientos);
const alertas = computed(() => inventoryStore.alertas);
const resumen = computed(() => inventoryStore.resumen);

// Filtros del formulario de movimiento
const nuevoMovimiento = ref({
  productoId: "",
  tipo: "ENTRADA" as "ENTRADA" | "SALIDA",
  cantidad: 0,
  comentario: "",
});

// Filtros
const filters = ref({
  producto: "",
  tipo: "",
  fechaDesde: "",
  fechaHasta: "",
});

// Movimientos filtrados - simplificado, el filtrado se hace en el store
const filteredMovimientos = computed(() => {
  console.log('📋 Computed filteredMovimientos ejecutándose. Total en store:', inventoryStore.movimientos.length);
  console.log('📋 Movimientos:', inventoryStore.movimientos);
  return inventoryStore.movimientos;
});

// Computed para obtener último movimiento de cada producto
const ultimosMovimientosPorProducto = computed(() => {
  const movimientosPorProducto = new Map<string, any>();
  
  // Ordenar movimientos por fecha (más reciente primero)
  const movimientosOrdenados = [...inventoryStore.movimientos].sort((a, b) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
  
  // Guardar solo el más reciente de cada producto
  for (const mov of movimientosOrdenados) {
    if (!movimientosPorProducto.has(mov.productoId)) {
      movimientosPorProducto.set(mov.productoId, mov);
    }
  }
  
  return movimientosPorProducto;
});

// Estadísticas basadas en el store
const stats = computed(() => ({
  totalMovimientos: inventoryStore.movimientos.length,
  entradas: inventoryStore.movimientosEntrada.length,
  salidas: inventoryStore.movimientosSalida.length,
  alertas: inventoryStore.alertas.length,
}));

// Métodos
const loadInventoryData = async () => {
  console.log('🔄 loadInventoryData: Iniciando carga de datos...');
  await Promise.all([
    inventoryStore.fetchMovimientos(),
    inventoryStore.fetchAlertas(),
    inventoryStore.fetchResumen(),
    productsStore.fetchProductos(),
  ]);
  console.log('✅ loadInventoryData: Datos cargados. Movimientos:', inventoryStore.movimientos.length);
  console.log('📊 Movimientos en store:', inventoryStore.movimientos);
};

const registrarMovimiento = async () => {
  try {
    await inventoryStore.registrarMovimiento(nuevoMovimiento.value);
    showMovimientoModal.value = false;
    nuevoMovimiento.value = {
      productoId: "",
      tipo: "ENTRADA",
      cantidad: 0,
      comentario: "",
    };
    await loadInventoryData();
  } catch (error) {
    console.error("Error al registrar movimiento:", error);
    alert("Error al registrar el movimiento");
  }
};

const resetFilters = async () => {
  filters.value = {
    producto: "",
    tipo: "",
    fechaDesde: "",
    fechaHasta: "",
  };
  inventoryStore.clearFiltros();
  await inventoryStore.fetchMovimientos();
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

const formatDate = (dateString: string | Date) => {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatTime = (dateString: string | Date) => {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
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

const onMovimientoRegistrado = async () => {
  console.log('✅ Movimiento registrado, recargando datos...');
  // Recargar datos después de registrar un movimiento
  await loadInventoryData();
  console.log('✅ Datos recargados. Movimientos actuales:', inventoryStore.movimientos.length);
  // Cerrar modal después de recargar
  showMovimientoModal.value = false;
};

onMounted(async () => {
  await loadInventoryData();
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
