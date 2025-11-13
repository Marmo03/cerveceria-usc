<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto py-12">
      <h1 class="text-3xl font-bold text-gray-900">
        Página de Productos - Test
      </h1>
      <p class="mt-4 text-gray-600">Esta es una versión de prueba simple</p>

      <div v-if="loading" class="mt-8 text-center">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"
        ></div>
        <p class="mt-4 text-gray-600">Cargando productos...</p>
      </div>

      <div v-else-if="error" class="mt-8 bg-red-50 p-6 rounded-lg">
        <p class="text-red-800">Error: {{ error }}</p>
      </div>

      <div v-else class="mt-8 bg-white p-6 rounded-lg shadow">
        <p>Token presente: {{ authStore.token ? "Sí" : "No" }}</p>
        <p>Usuario: {{ authStore.user?.email || "No disponible" }}</p>
        <p>Productos en store: {{ productsStore.productos?.length || 0 }}</p>

        <div v-if="productsStore.productos?.length > 0" class="mt-6">
          <h2 class="text-xl font-semibold mb-4">Lista de Productos:</h2>
          <ul class="space-y-2">
            <li
              v-for="producto in productsStore.productos.slice(0, 5)"
              :key="producto.id"
              class="border-b pb-2"
            >
              <strong>{{ producto.sku }}</strong> - {{ producto.nombre }}
              <span class="text-sm text-gray-600"
                >(Stock: {{ producto.stockActual }})</span
              >
            </li>
          </ul>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useProductsStore } from "../stores/products";
import AppLayout from "../components/AppLayout.vue";

const authStore = useAuthStore();
const productsStore = useProductsStore();
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  console.log("=== ProductosPageTest montado ===");
  console.log("Auth token:", authStore.token);
  console.log("User:", authStore.user);

  try {
    await productsStore.fetchProductos();
    console.log("Productos cargados:", productsStore.productos);
  } catch (err: any) {
    console.error("Error al cargar productos:", err);
    error.value = err.message || "Error desconocido";
  } finally {
    loading.value = false;
  }
});
</script>
