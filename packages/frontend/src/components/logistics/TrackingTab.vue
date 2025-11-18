<template>
  <div class="space-y-6">
    <div class="card">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        🔍 Rastrear Envío
      </h3>
      <p class="text-sm text-gray-600 mb-4">
        Ingresa el número de guía para rastrear tu envío
      </p>

      <div class="flex gap-4">
        <input
          v-model="numeroGuia"
          type="text"
          placeholder="Ej: ENV-2025-001"
          class="input flex-1"
          @keyup.enter="trackEnvio"
        />
        <button
          @click="trackEnvio"
          :disabled="!numeroGuia || logisticsStore.loading"
          class="btn btn-primary"
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Buscar
        </button>
      </div>

      <!-- Error -->
      <div v-if="logisticsStore.error" class="mt-4 alert-error">
        {{ logisticsStore.error }}
      </div>
    </div>

    <!-- Resultado del tracking -->
    <div v-if="logisticsStore.currentEnvio" class="space-y-6">
      <!-- Información del envío -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">
            📦 {{ logisticsStore.currentEnvio.numeroGuia }}
          </h3>
          <span
            :class="[
              'badge badge-lg',
              getEstadoBadgeClass(logisticsStore.currentEnvio.estado),
            ]"
          >
            {{ getEstadoLabel(logisticsStore.currentEnvio.estado) }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">Transportista</p>
            <p class="font-medium">
              {{ logisticsStore.currentEnvio.transportista?.nombre }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Prioridad</p>
            <p class="font-medium">
              {{ logisticsStore.currentEnvio.prioridad }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Origen</p>
            <p class="font-medium">{{ logisticsStore.currentEnvio.origen }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Destino</p>
            <p class="font-medium">{{ logisticsStore.currentEnvio.destino }}</p>
          </div>
          <div v-if="logisticsStore.currentEnvio.fechaEnvio">
            <p class="text-sm text-gray-500">Fecha de Envío</p>
            <p class="font-medium">
              {{ formatDate(logisticsStore.currentEnvio.fechaEnvio) }}
            </p>
          </div>
          <div v-if="logisticsStore.currentEnvio.fechaEntregaEstimada">
            <p class="text-sm text-gray-500">Entrega Estimada</p>
            <p class="font-medium">
              {{ formatDate(logisticsStore.currentEnvio.fechaEntregaEstimada) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Historial de estados -->
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          📋 Historial de Tracking
        </h3>

        <div class="relative">
          <!-- Línea vertical -->
          <div
            class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"
            style="margin-left: -1px"
          ></div>

          <!-- Estados -->
          <div
            v-for="(estado, index) in sortedEstados"
            :key="estado.id"
            class="relative pl-10 pb-6 last:pb-0"
          >
            <!-- Punto indicador -->
            <div
              :class="[
                'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center',
                index === 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-600',
              ]"
            >
              <svg
                v-if="index === 0"
                class="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              <span v-else class="text-xs">{{
                sortedEstados.length - index
              }}</span>
            </div>

            <!-- Contenido -->
            <div
              :class="[
                'bg-gray-50 rounded-lg p-4',
                index === 0 ? 'border-2 border-blue-500' : '',
              ]"
            >
              <div class="flex items-center justify-between">
                <p class="font-semibold text-gray-900">
                  {{ getEstadoLabel(estado.estado) }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ formatDateTime(estado.createdAt) }}
                </p>
              </div>
              <p v-if="estado.ubicacion" class="text-sm text-gray-600 mt-1">
                📍 {{ estado.ubicacion }}
              </p>
              <p v-if="estado.descripcion" class="text-sm text-gray-600 mt-1">
                {{ estado.descripcion }}
              </p>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div
          v-if="!sortedEstados || sortedEstados.length === 0"
          class="text-center py-8 text-gray-500"
        >
          No hay historial de tracking disponible
        </div>
      </div>

      <!-- Productos -->
      <div
        v-if="
          logisticsStore.currentEnvio.productos &&
          logisticsStore.currentEnvio.productos.length > 0
        "
        class="card"
      >
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          📦 Productos en el Envío
        </h3>
        <div class="space-y-2">
          <div
            v-for="producto in logisticsStore.currentEnvio.productos"
            :key="producto.productoId"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p class="font-medium text-gray-900">
                {{ producto.producto?.nombre || "Producto" }}
              </p>
              <p class="text-sm text-gray-500">
                SKU: {{ producto.producto?.sku }}
              </p>
            </div>
            <p class="font-semibold text-blue-600">
              Cantidad: {{ producto.cantidad }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useLogisticsStore } from "../../stores/logistics";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const logisticsStore = useLogisticsStore();
const numeroGuia = ref("");

const sortedEstados = computed(() => {
  if (!logisticsStore.currentEnvio?.estados) return [];
  return [...logisticsStore.currentEnvio.estados].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
});

const trackEnvio = async () => {
  if (!numeroGuia.value.trim()) return;

  logisticsStore.clearError();
  try {
    await logisticsStore.trackEnvio(numeroGuia.value.trim());
  } catch (error) {
    console.error("Error al rastrear envío:", error);
  }
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

const formatDateTime = (date: string) => {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
};
</script>
