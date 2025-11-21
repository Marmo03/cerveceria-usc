<template>
  <AppLayout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Rastreo de Pedidos</h1>
          <p class="text-gray-600">
            Rastrea y monitorea los pedidos que llegan a la empresa
          </p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            @click="activeTab = 'tracking'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'tracking'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            🔍 Rastrear Pedido
          </button>
          <button
            @click="activeTab = 'estadisticas'"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'estadisticas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            📊 Estadísticas de Recepción
          </button>
        </nav>
      </div>

      <!-- Contenido de las tabs -->
      <div v-if="activeTab === 'tracking'">
        <TrackingTab />
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

// Componentes de tabs
import TrackingTab from "../components/logistics/TrackingTab.vue";
import EstadisticasTab from "../components/logistics/EstadisticasTab.vue";

const logisticsStore = useLogisticsStore();
const activeTab = ref<"tracking" | "estadisticas">("tracking");

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
