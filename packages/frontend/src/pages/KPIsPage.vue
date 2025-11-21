<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">KPIs y Reportes</h1>
            <p class="mt-2 text-gray-600">
              Análisis de métricas y rendimiento operacional
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
            
            <!-- Menú de exportación -->
            <div class="relative">
              <button 
                @click="showExportMenu = !showExportMenu"
                class="btn btn-primary flex items-center"
              >
                <svg
                  class="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Exportar Reporte
                <svg
                  class="h-4 w-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              
              <!-- Dropdown menu -->
              <div
                v-if="showExportMenu"
                class="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
              >
                <div class="py-1">
                  <button
                    @click="exportarExcel"
                    class="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800"
                  >
                    <svg class="h-5 w-5 mr-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M15.8,20H14L12,13.2L10,20H8.2L5.5,11H7.3L9,17L11,10H13L15,17L16.7,11H18.5L15.8,20Z" />
                    </svg>
                    <div class="text-left">
                      <div class="font-semibold">Exportar a Excel</div>
                      <div class="text-xs text-gray-500">Archivo .xlsx con múltiples hojas</div>
                    </div>
                  </button>
                  
                  <button
                    @click="exportarPDF"
                    class="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-800"
                  >
                    <svg class="h-5 w-5 mr-3 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M15.2,20H13.8L12,13.2L10.2,20H8.8L6.6,11H8.1L9.5,17.8L11.3,11H12.7L14.5,17.8L15.9,11H17.4L15.2,20Z" />
                    </svg>
                    <div class="text-left">
                      <div class="font-semibold">Exportar a PDF</div>
                      <div class="text-xs text-gray-500">Documento profesional con diseño</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros de período -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Período</label
              >
              <select
                v-model="selectedPeriod"
                @change="loadData"
                class="input-field"
              >
                <option value="all">Todos los datos</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="1y">Último año</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            <div v-if="selectedPeriod === 'custom'">
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Fecha Desde</label
              >
              <input
                v-model="customPeriod.from"
                type="date"
                class="input-field"
                @change="loadData"
              />
            </div>
            <div v-if="selectedPeriod === 'custom'">
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Fecha Hasta</label
              >
              <input
                v-model="customPeriod.to"
                type="date"
                class="input-field"
                @change="loadData"
              />
            </div>
            <div class="flex items-end">
              <button
                @click="refreshData"
                class="btn btn-secondary w-full"
                :disabled="loading"
              >
                <svg
                  class="h-4 w-4 mr-2"
                  :class="{ 'animate-spin': loading }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {{ loading ? 'Actualizando...' : 'Actualizar' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- KPIs principales -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ kpis.rotacionInventario.toFixed(2) }}
            </p>
            <p class="text-gray-600">Rotación de Inventario</p>
            <div class="flex items-center mt-2">
              <span :class="getTrendClass(kpis.rotacionInventario, 12)">
                <svg
                  class="h-4 w-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                {{ getTrendText(kpis.rotacionInventario, 12) }}
              </span>
            </div>
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ kpis.stockoutRate.toFixed(1) }}%
            </p>
            <p class="text-gray-600">Tasa de Desabastecimiento</p>
            <div class="flex items-center mt-2">
              <span :class="getTrendClass(kpis.stockoutRate, 5, true)">
                <svg
                  class="h-4 w-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
                {{ getTrendText(kpis.stockoutRate, 5, true) }}
              </span>
            </div>
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              ${{ formatPrice(kpis.costoInventario) }}
            </p>
            <p class="text-gray-600">Costo de Inventario</p>
            <div class="flex items-center mt-2">
              <span
                :class="getTrendClass(kpis.costoInventario, 45000000, true)"
              >
                <svg
                  class="h-4 w-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
                Optimizado
              </span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-purple-100 text-purple-600">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ kpis.tiempoAprobacion.toFixed(1) }}
            </p>
            <p class="text-gray-600">Tiempo Promedio Aprobación (días)</p>
            <div class="flex items-center mt-2">
              <span :class="getTrendClass(kpis.tiempoAprobacion, 3, true)">
                <svg
                  class="h-4 w-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
                Eficiente
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos y análisis -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Gráfico de movimientos -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            Movimientos de Inventario
          </h3>
          <div class="h-64">
            <InventoryMovementsChart v-if="chartDataMovements" :data="chartDataMovements" />
            <div v-else class="h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <div class="text-center">
                <svg
                  v-if="loading"
                  class="mx-auto h-12 w-12 text-gray-400 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg
                  v-else
                  class="mx-auto h-12 w-12 text-gray-400"
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
                <p class="mt-2 text-sm text-gray-500">
                  {{ loading ? 'Cargando datos...' : 'No hay movimientos en este período' }}
                </p>
                <p v-if="!loading" class="mt-1 text-xs text-gray-400">
                  Prueba seleccionar "Todos los datos" o un período diferente
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Gráfico de tendencias -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            Tendencia de Stock
          </h3>
          <div class="h-64">
            <StockTrendChart v-if="chartDataStock" :data="chartDataStock" />
            <div v-else class="h-full bg-gray-100 rounded-lg flex items-center justify-center">
              <div class="text-center">
                <svg
                  v-if="loading"
                  class="mx-auto h-12 w-12 text-gray-400 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg
                  v-else
                  class="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <p class="mt-2 text-sm text-gray-500">
                  {{ loading ? 'Cargando datos...' : 'No hay datos de tendencia en este período' }}
                </p>
                <p v-if="!loading" class="mt-1 text-xs text-gray-400">
                  Prueba seleccionar "Todos los datos" o un período diferente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de productos más rotados -->
      <div class="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            Productos con Mayor Rotación
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header">Producto</th>
                <th class="table-header">Categoría</th>
                <th class="table-header">Movimientos</th>
                <th class="table-header">Rotación</th>
                <th class="table-header">Stock Promedio</th>
                <th class="table-header">Valor Movido</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="topProducts.length === 0">
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                  No hay datos disponibles para el período seleccionado
                </td>
              </tr>
              <tr
                v-for="producto in topProducts"
                :key="producto.id"
                class="hover:bg-gray-50"
              >
                <td class="table-cell">
                  <div class="font-medium text-gray-900">
                    {{ producto.nombre }}
                  </div>
                  <div class="text-sm text-gray-500">{{ producto.codigo }}</div>
                </td>
                <td class="table-cell">{{ producto.categoria }}</td>
                <td class="table-cell">{{ producto.movimientos }}</td>
                <td class="table-cell">
                  <span
                    class="font-medium"
                    :class="getRotationClass(producto.rotacion)"
                  >
                    {{ producto.rotacion.toFixed(2) }}
                  </span>
                </td>
                <td class="table-cell">
                  {{ producto.stockActual }} {{ producto.unidad }}
                </td>
                <td class="table-cell font-medium">
                  ${{ formatPrice(producto.valorMovido) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Alertas y recomendaciones -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            Alertas y Recomendaciones
          </h3>
        </div>
        <div class="p-6">
          <div
            v-if="alerts.length === 0"
            class="text-center py-8 text-gray-500"
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="mt-2">No hay alertas en este momento</p>
            <p class="text-sm text-gray-400">
              Todo está funcionando correctamente
            </p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="alert in alerts"
              :key="alert.id"
              class="flex items-start p-4 rounded-lg"
              :class="getAlertClass(alert.type)"
            >
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5"
                  :class="getAlertIconClass(alert.type)"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    v-if="alert.type === 'warning'"
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                  <path
                    v-else-if="alert.type === 'info'"
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                  />
                  <path
                    v-else
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <h4
                  class="text-sm font-medium"
                  :class="getAlertTextClass(alert.type)"
                >
                  {{ alert.title }}
                </h4>
                <p class="mt-1 text-sm" :class="getAlertDescClass(alert.type)">
                  {{ alert.description }}
                </p>
                <div class="mt-2">
                  <button
                    @click="handleAlertAction(alert)"
                    class="text-sm font-medium underline hover:no-underline transition-all"
                    :class="getAlertLinkClass(alert.type)"
                  >
                    {{ alert.action }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useReportsStore } from "../stores/reports";
import AppLayout from "../components/AppLayout.vue";
import InventoryMovementsChart from "../components/charts/InventoryMovementsChart.vue";
import StockTrendChart from "../components/charts/StockTrendChart.vue";
import { exportarReporteExcel, exportarReportePDF } from "../services/exportReports";

const authStore = useAuthStore();
const reportsStore = useReportsStore();

// Estado reactivo
const selectedPeriod = ref("all");
const customPeriod = ref({
  from: "",
  to: "",
});
const showExportMenu = ref(false);

// Computed
const loading = computed(() => reportsStore.loading);
const kpis = computed(() => reportsStore.kpis);
const topProducts = computed(() => reportsStore.topProducts);
const movimientos = computed(() => reportsStore.movimientosTemporales);
const alerts = computed(() => reportsStore.alertas);

// Métodos
const loadData = async () => {
  const params: any = {};

  if (selectedPeriod.value === "custom") {
    if (customPeriod.value.from) {
      params.desde = new Date(customPeriod.value.from);
    }
    if (customPeriod.value.to) {
      params.hasta = new Date(customPeriod.value.to);
    }
  } else if (selectedPeriod.value !== "all") {
    // Si no es 'all', enviamos el período específico
    params.periodo = selectedPeriod.value;
  }
  // Si es 'all', no enviamos parámetros de fecha para obtener todo

  await reportsStore.fetchAllData(params);
};

const refreshData = async () => {
  try {
    await loadData();
    console.log('Datos actualizados correctamente');
  } catch (error) {
    console.error('Error al actualizar datos:', error);
  }
};

const exportarExcel = () => {
  showExportMenu.value = false;
  
  console.log('Exportando a Excel...')
  console.log('KPIs:', kpis.value)
  console.log('Top Products:', topProducts.value)
  console.log('Movimientos:', movimientos.value)
  console.log('Alertas:', alerts.value)
  
  const data = {
    kpis: kpis.value || {
      rotacionInventario: 0,
      stockoutRate: 0,
      costoInventario: 0,
      tiempoAprobacion: 0,
    },
    topProducts: topProducts.value || [],
    movimientos: movimientos.value || [],
    alertas: alerts.value || [],
  };
  
  try {
    exportarReporteExcel(data);
    console.log('Excel exportado exitosamente');
  } catch (error) {
    console.error('Error al exportar Excel:', error);
  }
};

const exportarPDF = () => {
  showExportMenu.value = false;
  
  console.log('Exportando a PDF...')
  console.log('KPIs:', kpis.value)
  console.log('Top Products:', topProducts.value)
  console.log('Movimientos:', movimientos.value)
  console.log('Alertas:', alerts.value)
  
  const data = {
    kpis: kpis.value || {
      rotacionInventario: 0,
      stockoutRate: 0,
      costoInventario: 0,
      tiempoAprobacion: 0,
    },
    topProducts: topProducts.value || [],
    movimientos: movimientos.value || [],
    alertas: alerts.value || [],
  };
  
  try {
    exportarReportePDF(data);
    console.log('PDF exportado exitosamente');
  } catch (error) {
    console.error('Error al exportar PDF:', error);
  }
};

const exportReport = () => {
  reportsStore.exportToCSV();
};

const getTrendClass = (current: number, target: number, inverse = false) => {
  const isGood = inverse ? current < target : current > target;
  return isGood ? "text-green-600" : "text-red-600";
};

const getTrendText = (current: number, target: number, inverse = false) => {
  const isGood = inverse ? current < target : current > target;
  return isGood ? "Bueno" : "Necesita atención";
};

const getRotationClass = (rotation: number) => {
  if (rotation >= 10) return "text-green-600";
  if (rotation >= 5) return "text-yellow-600";
  return "text-red-600";
};

const getAlertClass = (type: string) => {
  const classes = {
    warning: "bg-yellow-50 border border-yellow-200",
    info: "bg-blue-50 border border-blue-200",
    success: "bg-green-50 border border-green-200",
    error: "bg-red-50 border border-red-200",
  };
  return classes[type as keyof typeof classes] || classes.info;
};

const getAlertIconClass = (type: string) => {
  const classes = {
    warning: "text-yellow-600",
    info: "text-blue-600",
    success: "text-green-600",
    error: "text-red-600",
  };
  return classes[type as keyof typeof classes] || classes.info;
};

const getAlertTextClass = (type: string) => {
  const classes = {
    warning: "text-yellow-800",
    info: "text-blue-800",
    success: "text-green-800",
    error: "text-red-800",
  };
  return classes[type as keyof typeof classes] || classes.info;
};

const getAlertDescClass = (type: string) => {
  const classes = {
    warning: "text-yellow-700",
    info: "text-blue-700",
    success: "text-green-700",
    error: "text-red-700",
  };
  return classes[type as keyof typeof classes] || classes.info;
};

const getAlertLinkClass = (type: string) => {
  const classes = {
    warning: "text-yellow-800 hover:text-yellow-900",
    info: "text-blue-800 hover:text-blue-900",
    success: "text-green-800 hover:text-green-900",
    error: "text-red-800 hover:text-red-900",
  };
  return classes[type as keyof typeof classes] || classes.info;
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-CO").format(price);
};

// Computed para datos de gráficas
const chartDataMovements = computed(() => {
  if (!movimientos.value || movimientos.value.length === 0) return null;
  
  return {
    labels: movimientos.value.map(m => {
      const date = new Date(m.fecha);
      return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
    }),
    entradas: movimientos.value.map(m => m.entradas),
    salidas: movimientos.value.map(m => m.salidas),
  };
});

const chartDataStock = computed(() => {
  if (!movimientos.value || movimientos.value.length === 0) return null;
  
  // Calcular stock acumulado basado en movimientos
  let stockAcumulado = 0;
  const stockPorFecha = movimientos.value.map(m => {
    stockAcumulado += m.entradas - m.salidas;
    return stockAcumulado;
  });
  
  return {
    labels: movimientos.value.map(m => {
      const date = new Date(m.fecha);
      return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });
    }),
    values: stockPorFecha,
  };
});

const handleAlertAction = (alert: any) => {
  const action = alert.action.toLowerCase();
  
  // Detectar el tipo de acción basado en el texto del botón
  if (action.includes('productos') || action.includes('críticos') || action.includes('criticos')) {
    // Navegar a productos con filtro de stock bajo
    window.location.href = '/productos?filter=stock-bajo';
  } else if (action.includes('análisis') || action.includes('analisis')) {
    // Navegar a la sección de productos sin movimiento en la misma página
    const alertSection = document.querySelector('.bg-white.rounded-lg.shadow:last-child');
    if (alertSection) {
      alertSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // También podríamos mostrar más detalles o abrir un modal
    console.log('Mostrando análisis detallado para:', alert.title);
  } else {
    // Acción por defecto: scroll a la sección de alertas
    console.log('Acción de alerta:', alert.action, alert);
  }
};

onMounted(() => {
  loadData();
});
</script>
