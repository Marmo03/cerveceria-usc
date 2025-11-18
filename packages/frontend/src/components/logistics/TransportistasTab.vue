<template>
  <div class="space-y-6">
    <!-- Loading -->
    <div v-if="logisticsStore.loading" class="text-center py-12">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
      ></div>
      <p class="mt-2 text-gray-600">Cargando transportistas...</p>
    </div>

    <!-- Error -->
    <div v-else-if="logisticsStore.error" class="alert-error">
      {{ logisticsStore.error }}
    </div>

    <!-- Lista de transportistas -->
    <div
      v-else-if="logisticsStore.transportistas.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="transportista in logisticsStore.transportistas"
        :key="transportista.id"
        class="card hover:shadow-lg transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-bold text-gray-900">
                🚚 {{ transportista.nombre }}
              </h3>
              <span
                v-if="!transportista.isActive"
                class="badge badge-error badge-sm"
              >
                Inactivo
              </span>
            </div>

            <div class="mt-3 space-y-2 text-sm">
              <div class="flex items-center text-gray-600">
                <svg
                  class="h-4 w-4 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {{ transportista.contacto }}
              </div>

              <div class="flex items-center text-gray-600">
                <svg
                  class="h-4 w-4 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                {{ transportista.email }}
              </div>

              <div class="flex items-center text-gray-600">
                <svg
                  class="h-4 w-4 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {{ transportista.telefono }}
              </div>

              <div class="mt-3 pt-3 border-t border-gray-200">
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">Tipo de Servicio</span>
                  <span
                    :class="[
                      'badge badge-sm',
                      getTipoServicioBadgeClass(transportista.tipoServicio),
                    ]"
                  >
                    {{ getTipoServicioLabel(transportista.tipoServicio) }}
                  </span>
                </div>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-gray-500">Costo Base</span>
                  <span class="font-bold text-blue-600">
                    ${{ formatCurrency(transportista.costoBase) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200 flex gap-2">
          <button
            @click="editTransportista(transportista)"
            class="btn btn-sm btn-secondary flex-1"
          >
            Editar
          </button>
          <button
            v-if="transportista.isActive"
            @click="toggleTransportista(transportista)"
            class="btn btn-sm btn-outline-error"
          >
            Desactivar
          </button>
          <button
            v-else
            @click="toggleTransportista(transportista)"
            class="btn btn-sm btn-outline-success"
          >
            Activar
          </button>
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
          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
        />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">
        No hay transportistas
      </h3>
      <p class="mt-1 text-sm text-gray-500">
        Comienza agregando un nuevo transportista
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLogisticsStore, type Transportista } from "../../stores/logistics";

const logisticsStore = useLogisticsStore();

const getTipoServicioBadgeClass = (tipo: string) => {
  const classes: Record<string, string> = {
    TERRESTRE: "badge-primary",
    AEREO: "badge-info",
    MARITIMO: "badge-success",
    MULTIMODAL: "badge-warning",
  };
  return classes[tipo] || "badge-secondary";
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

const editTransportista = (transportista: Transportista) => {
  // TODO: Abrir modal de edición
  alert(`Editar transportista: ${transportista.nombre}`);
};

const toggleTransportista = async (transportista: Transportista) => {
  const action = transportista.isActive ? "desactivar" : "activar";
  if (confirm(`¿Está seguro de ${action} este transportista?`)) {
    try {
      await logisticsStore.updateTransportista(transportista.id, {
        isActive: !transportista.isActive,
      });
    } catch (error) {
      console.error("Error al actualizar transportista:", error);
    }
  }
};
</script>
