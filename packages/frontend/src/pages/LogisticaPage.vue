<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between border-b-4 border-gray-300">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Logística y Envíos</h1>
          <p class="text-gray-600">
            Gestión de transportistas, envíos y tracking
          </p>
        </div>
        <button
          v-if="activeTab === 'envios'"
          @click="openCreateEnvioModal"
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Nuevo Envío
        </button>
        <button
          v-else-if="activeTab === 'transportistas'"
          @click="openCreateTransportistaModal"
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Nuevo Transportista
        </button>
      </div>

      <!-- Tabs -->
      <div class="border-b-4 border-blue-400">
        <nav class="-mb-px flex space-x-8">
          <button
            @click="activeTab = 'envios'"
            :class="[
              'py-4 px-1 border-b-4 font-medium text-sm',
              activeTab === 'envios'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            📦 Envíos
          </button>
          <button
            @click="activeTab = 'tracking'"
            :class="[
              'py-4 px-1 border-b-4 font-medium text-sm',
              activeTab === 'tracking'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            🔍 Tracking
          </button>
          <button
            @click="activeTab = 'transportistas'"
            :class="[
              'py-4 px-1 border-b-4 font-medium text-sm',
              activeTab === 'transportistas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            🚚 Transportistas
          </button>
          <button
            @click="activeTab = 'estadisticas'"
            :class="[
              'py-4 px-1 border-b-4 font-medium text-sm',
              activeTab === 'estadisticas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            📊 Estadísticas
          </button>
        </nav>
      </div>

      <!-- Contenido de las tabs -->
      <div v-if="activeTab === 'envios'">
        <EnviosTab />
      </div>

      <div v-if="activeTab === 'tracking'">
        <TrackingTab />
      </div>

      <div v-if="activeTab === 'transportistas'">
        <TransportistasTab />
      </div>

      <div v-if="activeTab === 'estadisticas'">
        <EstadisticasTab />
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import AppLayout from "../components/AppLayout.vue";
import { useLogisticsStore } from "../stores/logistics";

// Componentes de tabs (definidos inline por simplicidad)
import EnviosTab from "../components/logistics/EnviosTab.vue";
import TrackingTab from "../components/logistics/TrackingTab.vue";
import TransportistasTab from "../components/logistics/TransportistasTab.vue";
import EstadisticasTab from "../components/logistics/EstadisticasTab.vue";

const logisticsStore = useLogisticsStore();
const activeTab = ref<
  "envios" | "tracking" | "transportistas" | "estadisticas"
>("envios");

const openCreateEnvioModal = () => {
  // TODO: Implementar modal de creación
  alert("Funcionalidad en desarrollo: Crear nuevo envío");
};

const openCreateTransportistaModal = () => {
  // TODO: Implementar modal de creación
  alert("Funcionalidad en desarrollo: Crear nuevo transportista");
};

onMounted(async () => {
  // Cargar datos iniciales
  try {
    await Promise.all([
      logisticsStore.fetchEnvios(),
      logisticsStore.fetchTransportistas(),
    ]);
  } catch (error) {
    console.error("Error al cargar datos de logística:", error);
  }
});
</script>