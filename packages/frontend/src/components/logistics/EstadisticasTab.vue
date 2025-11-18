<template>
  <div class="space-y-6">
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Total Envíos</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ stats.totalEnvios || logisticsStore.envios.length }}
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Entregados</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ stats.porEstado?.ENTREGADO || enviosPorEstado("ENTREGADO") }}
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">En Tránsito</p>
            <p class="text-2xl font-bold text-gray-900">
              {{
                stats.porEstado?.EN_TRANSITO || enviosPorEstado("EN_TRANSITO")
              }}
            </p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-purple-100 text-purple-600">
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Costo Total</p>
            <p class="text-2xl font-bold text-gray-900">
              ${{ formatCurrency(stats.costoTotal || calcularCostoTotal()) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Distribución por estado -->
    <div class="card">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        📊 Distribución por Estado
      </h3>
      <div class="space-y-3">
        <div
          v-for="(count, estado) in estadosDistribution"
          :key="estado"
          class="flex items-center"
        >
          <div class="flex-1">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-gray-700">
                {{ getEstadoLabel(estado) }}
              </span>
              <span class="text-sm text-gray-500">{{ count }} envíos</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                :class="['h-2 rounded-full', getEstadoBarClass(estado)]"
                :style="{ width: `${getPercentage(count)}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transportistas más utilizados -->
    <div class="card">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        🚚 Transportistas Activos
      </h3>
      <div class="space-y-3">
        <div
          v-for="transportista in logisticsStore.transportistasActivos.slice(
            0,
            5
          )"
          :key="transportista.id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div>
            <p class="font-medium text-gray-900">{{ transportista.nombre }}</p>
            <p class="text-sm text-gray-500">
              {{ getTipoServicioLabel(transportista.tipoServicio) }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-blue-600">
              ${{ formatCurrency(transportista.costoBase) }}
            </p>
            <p class="text-xs text-gray-500">Costo base</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Envíos recientes -->
    <div class="card">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        📦 Envíos Recientes
      </h3>
      <div class="space-y-2">
        <div
          v-for="envio in logisticsStore.enviosRecientes.slice(0, 5)"
          :key="envio.id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div class="flex-1">
            <p class="font-medium text-gray-900">{{ envio.numeroGuia }}</p>
            <p class="text-sm text-gray-500">
              {{ envio.origen }} → {{ envio.destino }}
            </p>
          </div>
          <span :class="['badge', getEstadoBadgeClass(envio.estado)]">
            {{ getEstadoLabel(envio.estado) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useLogisticsStore } from "../../stores/logistics";

const logisticsStore = useLogisticsStore();

const stats = ref({
  totalEnvios: 0,
  porEstado: {} as Record<string, number>,
  costoTotal: 0,
  tiempoPromedioEntrega: 0,
});

const estadosDistribution = computed(() => {
  const distribution: Record<string, number> = {};
  logisticsStore.envios.forEach((envio) => {
    distribution[envio.estado] = (distribution[envio.estado] || 0) + 1;
  });
  return distribution;
});

const enviosPorEstado = (estado: string) => {
  return logisticsStore.envios.filter((e) => e.estado === estado).length;
};

const calcularCostoTotal = () => {
  return logisticsStore.envios.reduce(
    (total, envio) => total + (envio.costoEnvio || 0),
    0
  );
};

const getPercentage = (count: number) => {
  const total = logisticsStore.envios.length;
  return total > 0 ? (count / total) * 100 : 0;
};

const getEstadoLabel = (estado: string) => {
  const labels: Record<string, string> = {
    PENDIENTE: "Pendiente",
    EN_PREPARACION: "En Preparación",
    EN_TRANSITO: "En Tránsito",
    EN_ADUANA: "En Aduana",
    EN_ENTREGA: "En Entrega",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado",
    DEVUELTO: "Devuelto",
  };
  return labels[estado] || estado;
};

const getEstadoBadgeClass = (estado: string) => {
  const classes: Record<string, string> = {
    PENDIENTE: "badge-warning",
    EN_PREPARACION: "badge-info",
    EN_TRANSITO: "badge-primary",
    EN_ADUANA: "badge-warning",
    EN_ENTREGA: "badge-info",
    ENTREGADO: "badge-success",
    CANCELADO: "badge-error",
    DEVUELTO: "badge-warning",
  };
  return classes[estado] || "badge-secondary";
};

const getEstadoBarClass = (estado: string) => {
  const classes: Record<string, string> = {
    PENDIENTE: "bg-yellow-500",
    EN_PREPARACION: "bg-blue-400",
    EN_TRANSITO: "bg-blue-600",
    EN_ADUANA: "bg-orange-500",
    EN_ENTREGA: "bg-indigo-500",
    ENTREGADO: "bg-green-500",
    CANCELADO: "bg-red-500",
    DEVUELTO: "bg-orange-600",
  };
  return classes[estado] || "bg-gray-400";
};

const getTipoServicioLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    TERRESTRE: "Terrestre",
    AEREO: "Aéreo",
    MARITIMO: "Marítimo",
    MULTIMODAL: "Multimodal",
  };
  return labels[tipo] || tipo;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

onMounted(async () => {
  try {
    const statsData = await logisticsStore.fetchEnviosStats();
    if (statsData) {
      stats.value = statsData;
    }
  } catch (error) {
    console.error("Error al cargar estadísticas:", error);
  }
});
</script>
