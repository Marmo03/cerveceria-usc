<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="cerrar"
      ></div>

      <!-- Modal -->
      <div
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        <form @submit.prevent="guardar">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900" id="modal-title">
                Nueva Solicitud de Compra
              </h3>
              <button
                type="button"
                @click="cerrar"
                class="text-gray-400 hover:text-gray-500"
              >
                <svg
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div class="space-y-4">
              <!-- Producto -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Producto *</label
                >
                <select
                  v-model="form.productoId"
                  required
                  class="input-field"
                  @change="onProductoChange"
                >
                  <option value="">Seleccione un producto...</option>
                  <option
                    v-for="producto in productos"
                    :key="producto.id"
                    :value="producto.id"
                  >
                    {{ producto.nombre }} ({{ producto.sku }})
                  </option>
                </select>
              </div>

              <!-- Info del Producto -->
              <div
                v-if="productoSeleccionado"
                class="p-3 bg-blue-50 border border-blue-200 rounded"
              >
                <div class="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p class="text-blue-600 font-medium">Stock actual:</p>
                    <p class="text-blue-800">
                      {{ productoSeleccionado.stockActual }}
                      {{ productoSeleccionado.unidad }}
                    </p>
                  </div>
                  <div>
                    <p class="text-blue-600 font-medium">Stock mínimo:</p>
                    <p class="text-blue-800">
                      {{ productoSeleccionado.stockMin }}
                      {{ productoSeleccionado.unidad }}
                    </p>
                  </div>
                  <div>
                    <p class="text-blue-600 font-medium">Lead time:</p>
                    <p class="text-blue-800">
                      {{ productoSeleccionado.leadTime }} días
                    </p>
                  </div>
                  <div>
                    <p class="text-blue-600 font-medium">Costo unitario:</p>
                    <p class="text-blue-800">
                      ${{ formatPrice(productoSeleccionado.costo) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Cantidad -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Cantidad *</label
                >
                <input
                  v-model.number="form.cantidad"
                  type="number"
                  min="1"
                  required
                  placeholder="Ingrese la cantidad a solicitar"
                  class="input-field"
                />
              </div>

              <!-- Costo Total -->
              <div
                v-if="productoSeleccionado && form.cantidad > 0"
                class="p-3 bg-gray-50 rounded"
              >
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-700"
                    >Costo total estimado:</span
                  >
                  <span class="text-lg font-bold text-gray-900">
                    ${{
                      formatPrice(productoSeleccionado.costo * form.cantidad)
                    }}
                  </span>
                </div>
              </div>

              <!-- Justificación -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Justificación (opcional)</label
                >
                <textarea
                  v-model="form.justificacion"
                  rows="3"
                  placeholder="Describa el motivo de la solicitud..."
                  class="input-field"
                ></textarea>
              </div>

              <!-- Urgente -->
              <div>
                <label class="flex items-center">
                  <input
                    v-model="form.urgente"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700">
                    Marcar como urgente
                  </span>
                </label>
              </div>
            </div>

            <!-- Error Message -->
            <div
              v-if="error"
              class="mt-4 p-3 bg-red-50 border border-red-200 rounded"
            >
              <p class="text-sm text-red-600">{{ error }}</p>
            </div>
          </div>

          <!-- Botones -->
          <div
            class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2"
          >
            <button
              type="submit"
              :disabled="loading || !formularioValido"
              class="btn btn-primary"
              :class="{
                'opacity-50 cursor-not-allowed': loading || !formularioValido,
              }"
            >
              {{ loading ? "Creando..." : "Crear Solicitud" }}
            </button>
            <button
              type="button"
              @click="cerrar"
              :disabled="loading"
              class="btn btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useProductsStore } from "../stores/products";
import { useAuthStore } from "../stores/auth";
import { useToastStore } from "../stores/toast";
import axios from "axios";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const productsStore = useProductsStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const loading = ref(false);
const error = ref("");

const form = ref({
  productoId: "",
  cantidad: 1,
  justificacion: "",
  urgente: false,
});

const productos = computed(() => productsStore.productosActivos);

const productoSeleccionado = computed(() => {
  return productos.value.find((p) => p.id === form.value.productoId);
});

const formularioValido = computed(() => {
  return form.value.productoId && form.value.cantidad > 0;
});

const onProductoChange = () => {
  // Reset cantidad cuando cambia el producto
  if (!form.value.cantidad || form.value.cantidad < 1) {
    form.value.cantidad = 1;
  }
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const resetForm = () => {
  form.value = {
    productoId: "",
    cantidad: 1,
    justificacion: "",
    urgente: false,
  };
  error.value = "";
};

const cerrar = () => {
  if (!loading.value) {
    emit("update:modelValue", false);
    setTimeout(resetForm, 300);
  }
};

const guardar = async () => {
  if (!formularioValido.value) return;

  loading.value = true;
  error.value = "";

  try {
    const token = authStore.token;
    await axios.post(
      `${API_URL}/solicitudes`,
      {
        productoId: form.value.productoId,
        cantidad: form.value.cantidad,
        justificacion: form.value.justificacion || undefined,
        urgente: form.value.urgente,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    toastStore.success(
      'Solicitud creada exitosamente',
      `Producto: ${productoSeleccionado.value?.nombre} - Cantidad: ${form.value.cantidad}`
    );
    
    // Solo emitir success, el padre cerrará el modal después de recargar
    emit("success");
  } catch (err: any) {
    error.value =
      err.response?.data?.message ||
      err.message ||
      "Error al crear la solicitud";
  } finally {
    loading.value = false;
  }
};

// Cargar productos cuando se abre el modal
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && productos.value.length === 0) {
      await productsStore.fetchProductos();
    }
  }
);
</script>
