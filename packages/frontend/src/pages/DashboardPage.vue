<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header del Dashboard -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p class="text-gray-600">Bienvenido, {{ authStore.fullName }}</p>
        </div>
        <div class="text-sm text-gray-500">
          {{ currentDate }}
        </div>
      </div>

      <!-- Alertas importantes -->
      <div v-if="alerts.length > 0" class="space-y-2">
        <div
          v-for="alert in alerts"
          :key="alert.id"
          :class="['alert-warning', 'flex items-center justify-between']"
        >
          <div class="flex items-center">
            <svg class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            {{ alert.message }}
          </div>
          <button
            @click="dismissAlert(alert.id)"
            class="text-yellow-600 hover:text-yellow-800"
          >
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Tarjetas de resumen -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="card">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg
                class="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Productos</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ stats.totalProductos }}
              </p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-red-100 text-red-600">
              <svg
                class="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Stock Bajo</p>
              <p class="text-2xl font-bold text-gray-900">
                {{ stats.stockBajo }}
              </p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg
                class="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-3-3v6m-9 1V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">
                Solicitudes Pendientes
              </p>
              <p class="text-2xl font-bold text-gray-900">
                {{ stats.solicitudesPendientes }}
              </p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100 text-green-600">
              <svg
                class="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Valor Inventario</p>
              <p class="text-2xl font-bold text-gray-900">
                ${{ formatCurrency(stats.valorInventario) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos y tablas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Últimos movimientos -->
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Últimos Movimientos
          </h3>
          <div class="space-y-3">
            <div
              v-for="movimiento in ultimosMovimientos"
              :key="movimiento.id"
              class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center">
                <div
                  :class="[
                    'p-2 rounded-full mr-3',
                    movimiento.tipo === 'ENTRADA'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600',
                  ]"
                >
                  <svg
                    v-if="movimiento.tipo === 'ENTRADA'"
                    class="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <svg
                    v-else
                    class="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ movimiento.producto }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(movimiento.fecha) }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p
                  :class="[
                    'text-sm font-semibold',
                    movimiento.tipo === 'ENTRADA'
                      ? 'text-green-600'
                      : 'text-red-600',
                  ]"
                >
                  {{ movimiento.tipo === "ENTRADA" ? "+" : "-"
                  }}{{ movimiento.cantidad }}
                </p>
              </div>
            </div>
          </div>
          <div class="mt-4 text-center">
            <router-link
              to="/inventario"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todos los movimientos →
            </router-link>
          </div>
        </div>

        <!-- Productos con stock bajo -->
        <div class="card">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Productos con Stock Bajo
          </h3>
          <div class="space-y-3">
            <div
              v-for="producto in productosStockBajo"
              :key="producto.id"
              class="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ producto.nombre }}
                </p>
                <p class="text-xs text-gray-500">SKU: {{ producto.sku }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-red-600">
                  {{ producto.stockActual }}
                </p>
                <p class="text-xs text-gray-500">
                  Min: {{ producto.stockMin }}
                </p>
              </div>
            </div>
          </div>
          <div class="mt-4 text-center">
            <router-link
              to="/productos"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Gestionar productos →
            </router-link>
          </div>
        </div>
      </div>

      <!-- Acciones rápidas -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <router-link
            v-if="authStore.hasAnyRole(['ADMIN', 'OPERARIO'])"
            to="/inventario"
            class="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg
              class="h-8 w-8 text-gray-400 mb-2"
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
            <span class="text-sm font-medium text-gray-900"
              >Registrar Movimiento</span
            >
          </router-link>

          <router-link
            v-if="authStore.hasAnyRole(['ADMIN', 'OPERARIO'])"
            to="/productos"
            class="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg
              class="h-8 w-8 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span class="text-sm font-medium text-gray-900"
              >Nuevo Producto</span
            >
          </router-link>

          <router-link
            v-if="authStore.hasAnyRole(['ADMIN', 'OPERARIO', 'APROBADOR'])"
            to="/solicitudes"
            class="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg
              class="h-8 w-8 text-gray-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-3-3v6m-9 1V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <span class="text-sm font-medium text-gray-900"
              >Nueva Solicitud</span
            >
          </router-link>

          <router-link
            v-if="authStore.hasAnyRole(['ADMIN', 'ANALISTA'])"
            to="/kpis"
            class="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <svg
              class="h-8 w-8 text-gray-400 mb-2"
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
            <span class="text-sm font-medium text-gray-900">Ver KPIs</span>
          </router-link>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import AppLayout from "../components/AppLayout.vue";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const authStore = useAuthStore();

// Estado reactivo
const stats = ref({
  totalProductos: 0,
  stockBajo: 0,
  solicitudesPendientes: 0,
  valorInventario: 0,
});

const alerts = ref([
  {
    id: 1,
    message: "3 productos con stock crítico requieren atención inmediata",
    type: "warning",
  },
]);

const ultimosMovimientos = ref([
  {
    id: 1,
    producto: "Malta Base Pilsner",
    tipo: "SALIDA",
    cantidad: 50,
    fecha: new Date(),
  },
  {
    id: 2,
    producto: "Lúpulo Cascade",
    tipo: "ENTRADA",
    cantidad: 200,
    fecha: new Date(Date.now() - 3600000),
  },
]);

const productosStockBajo = ref([
  {
    id: 1,
    nombre: "Etiquetas Cerveza Artesanal",
    sku: "ETIQ-001",
    stockActual: 15,
    stockMin: 100,
  },
  {
    id: 2,
    nombre: "Levadura Ale US-05",
    sku: "LEVAD-001",
    stockActual: 8,
    stockMin: 20,
  },
]);

const currentDate = ref("");

// Métodos
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date: Date): string => {
  return format(date, "dd/MM/yyyy HH:mm", { locale: es });
};

const dismissAlert = (id: number) => {
  alerts.value = alerts.value.filter((alert) => alert.id !== id);
};

const loadDashboardData = async () => {
  // TODO: Cargar datos reales desde la API
  stats.value = {
    totalProductos: 25,
    stockBajo: 3,
    solicitudesPendientes: 2,
    valorInventario: 45000,
  };
};

onMounted(async () => {
  currentDate.value = format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", {
    locale: es,
  });
  await loadDashboardData();
});
</script>
