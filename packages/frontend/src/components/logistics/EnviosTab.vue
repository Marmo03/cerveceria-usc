<template>
  <div class="space-y-6">
    <!-- Filtros -->
    <div class="card">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-64">
          <input
            v-model="filters.search"
            type="text"
            placeholder="Buscar por número de guía..."
            class="input w-full"
            @input="applyFilters"
          />
        </div>
        <select v-model="filters.estado" @change="applyFilters" class="input">
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PREPARACION">En Preparación</option>
          <option value="EN_TRANSITO">En Tránsito</option>
          <option value="EN_ADUANA">En Aduana</option>
          <option value="EN_ENTREGA">En Entrega</option>
          <option value="ENTREGADO">Entregado</option>
          <option value="CANCELADO">Cancelado</option>
          <option value="DEVUELTO">Devuelto</option>
        </select>
        <select
          v-model="filters.prioridad"
          @change="applyFilters"
          class="input"
        >
          <option value="">Todas las prioridades</option>
          <option value="ALTA">Alta</option>
          <option value="NORMAL">Normal</option>
          <option value="BAJA">Baja</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="logisticsStore.loading" class="text-center py-12">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
      ></div>
      <p class="mt-2 text-gray-600">Cargando envíos...</p>
    </div>

    <!-- Error -->
    <div v-else-if="logisticsStore.error" class="alert-error">
      {{ logisticsStore.error }}
    </div>

    <!-- Lista de envíos -->
    <div v-else-if="logisticsStore.envios.length > 0" class="space-y-4">
      <div
        v-for="envio in logisticsStore.envios"
        :key="envio.id"
        class="card hover:shadow-lg transition-shadow cursor-pointer"
        @click="selectEnvio(envio)"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <span class="text-lg font-bold text-gray-900">
                📦 {{ envio.numeroGuia }}
              </span>
              <span :class="['badge', getEstadoBadgeClass(envio.estado)]">
                {{ getEstadoLabel(envio.estado) }}
              </span>
              <span :class="['badge', getPrioridadBadgeClass(envio.prioridad)]">
                {{ envio.prioridad }}
              </span>
            </div>
            <div class="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <span
                >🚚
                {{ envio.transportista?.nombre || "Sin transportista" }}</span
              >
              <span>📍 {{ envio.origen }} → {{ envio.destino }}</span>
              <span v-if="envio.fechaEntregaEstimada">
                📅 Entrega: {{ formatDate(envio.fechaEntregaEstimada) }}
              </span>
            </div>
          </div>
          <div class="text-right">
            <p v-if="envio.costoEnvio" class="text-lg font-bold text-gray-900">
              ${{ formatCurrency(envio.costoEnvio) }}
            </p>
            <p class="text-sm text-gray-500">
              {{ formatDate(envio.createdAt) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="card text-center py-12">
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
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No hay envíos</h3>
      <p class="mt-1 text-sm text-gray-500">Comienza creando un nuevo envío</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useLogisticsStore } from "../../stores/logistics";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const logisticsStore = useLogisticsStore();

const filters = reactive({
  search: "",
  estado: "",
  prioridad: "",
});

const applyFilters = async () => {
  await logisticsStore.fetchEnvios({
    search: filters.search || undefined,
    estado: filters.estado || undefined,
    prioridad: filters.prioridad || undefined,
  });
};

const selectEnvio = (envio: any) => {
  // TODO: Abrir modal con detalles del envío
  console.log("Envío seleccionado:", envio);
  alert(
    `Detalles del envío ${envio.numeroGuia}\nEstado: ${envio.estado}\nOrigen: ${envio.origen}\nDestino: ${envio.destino}`
  );
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

const getPrioridadBadgeClass = (prioridad: string) => {
  const classes: Record<string, string> = {
    ALTA: "badge-error",
    NORMAL: "badge-secondary",
    BAJA: "badge-info",
  };
  return classes[prioridad] || "badge-secondary";
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

const formatDate = (date: string) => {
  return format(new Date(date), "dd/MM/yyyy", { locale: es });
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};
</script>
