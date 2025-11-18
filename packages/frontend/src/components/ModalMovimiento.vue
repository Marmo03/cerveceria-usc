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
                Registrar Movimiento de Inventario
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
              <!-- Tipo de Movimiento -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Tipo de Movimiento *</label
                >
                <div class="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    @click="form.tipo = 'ENTRADA'"
                    :class="[
                      'p-4 border-2 rounded-lg text-center transition-all',
                      form.tipo === 'ENTRADA'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-green-300',
                    ]"
                  >
                    <svg
                      class="h-8 w-8 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span class="font-medium">ENTRADA</span>
                    <p class="text-xs mt-1">Agregar al inventario</p>
                  </button>

                  <button
                    type="button"
                    @click="form.tipo = 'SALIDA'"
                    :class="[
                      'p-4 border-2 rounded-lg text-center transition-all',
                      form.tipo === 'SALIDA'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-red-300',
                    ]"
                  >
                    <svg
                      class="h-8 w-8 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M20 12H4"
                      />
                    </svg>
                    <span class="font-medium">SALIDA</span>
                    <p class="text-xs mt-1">Retirar del inventario</p>
                  </button>
                </div>
              </div>

              <!-- Producto -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Producto *</label
                >
                <select
                  v-model="form.productoId"
                  required
                  class="input-field"
                  :class="{ 'border-red-500': !form.productoId && error }"
                  @change="onProductoChange"
                >
                  <option value="" disabled>Seleccione un producto...</option>
                  <option
                    v-for="producto in productos"
                    :key="producto.id"
                    :value="producto.id"
                  >
                    {{ producto.nombre }} ({{ producto.sku }}) - Stock:
                    {{ producto.stockActual }} {{ producto.unidad }}
                  </option>
                </select>
                <p
                  v-if="!form.productoId && error"
                  class="mt-1 text-xs text-red-600"
                >
                  Debe seleccionar un producto
                </p>
              </div>

              <!-- Stock Actual (Info) -->
              <div
                v-if="productoSeleccionado"
                class="p-3 bg-blue-50 border border-blue-200 rounded"
              >
                <p class="text-sm text-blue-800">
                  <strong>Stock actual:</strong>
                  {{ productoSeleccionado.stockActual }}
                  {{ productoSeleccionado.unidad }}
                </p>
                <p class="text-sm text-blue-600 mt-1">
                  Stock mínimo: {{ productoSeleccionado.stockMin }}
                  {{ productoSeleccionado.unidad }}
                </p>
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
                  :max="
                    form.tipo === 'SALIDA' && productoSeleccionado
                      ? productoSeleccionado.stockActual
                      : undefined
                  "
                  required
                  placeholder="Ingrese la cantidad"
                  class="input-field"
                />
                <p
                  v-if="form.tipo === 'SALIDA' && productoSeleccionado"
                  class="text-xs text-gray-500 mt-1"
                >
                  Máximo disponible: {{ productoSeleccionado.stockActual }}
                </p>
              </div>

              <!-- Comentario -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Comentario / Motivo</label
                >
                <textarea
                  v-model="form.comentario"
                  rows="3"
                  placeholder="Describa el motivo del movimiento..."
                  class="input-field"
                ></textarea>
              </div>

              <!-- Referencia -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Referencia (opcional)</label
                >
                <input
                  v-model="form.referencia"
                  type="text"
                  placeholder="Ej: Orden de compra #1234"
                  class="input-field"
                />
              </div>
            </div>

            <!-- Warning para SALIDA -->
            <div
              v-if="
                form.tipo === 'SALIDA' &&
                productoSeleccionado &&
                form.cantidad > productoSeleccionado.stockActual
              "
              class="mt-4 p-3 bg-red-50 border border-red-200 rounded"
            >
              <p class="text-sm text-red-600">
                ⚠️ La cantidad solicitada excede el stock disponible
              </p>
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
              {{ loading ? "Registrando..." : "Registrar Movimiento" }}
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
import { useInventoryStore } from "../stores/inventory";
import { useProductsStore } from "../stores/products";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const inventoryStore = useInventoryStore();
const productsStore = useProductsStore();

const loading = ref(false);
const error = ref("");

const form = ref({
  tipo: "ENTRADA" as "ENTRADA" | "SALIDA",
  productoId: "",
  cantidad: 1,
  comentario: "",
  referencia: "",
});

const productos = computed(() => productsStore.productosActivos);

const productoSeleccionado = computed(() => {
  return productos.value.find((p) => p.id === form.value.productoId);
});

const formularioValido = computed(() => {
  // Validar que productoId no esté vacío y sea un UUID válido
  if (!form.value.productoId || form.value.productoId.trim() === "")
    return false;

  // Validar que cantidad sea mayor a 0
  if (!form.value.cantidad || form.value.cantidad <= 0) return false;

  // Validar stock suficiente para salidas
  if (form.value.tipo === "SALIDA" && productoSeleccionado.value) {
    return form.value.cantidad <= productoSeleccionado.value.stockActual;
  }

  return true;
});

const onProductoChange = () => {
  console.log("📦 [MODAL] Producto seleccionado:", form.value.productoId);
  console.log("📦 [MODAL] Tipo de dato:", typeof form.value.productoId);
  console.log("📦 [MODAL] Longitud:", form.value.productoId?.length);

  // Buscar el producto completo
  const producto = productos.value.find((p) => p.id === form.value.productoId);
  if (producto) {
    console.log(
      "✅ [MODAL] Producto encontrado:",
      producto.nombre,
      producto.sku
    );
  } else {
    console.warn("⚠️ [MODAL] Producto no encontrado en la lista");
  }

  // Reset cantidad cuando cambia el producto
  form.value.cantidad = 1;
};

const resetForm = () => {
  form.value = {
    tipo: "ENTRADA",
    productoId: "",
    cantidad: 1,
    comentario: "",
    referencia: "",
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
  // Validación adicional antes de enviar
  if (!formularioValido.value) {
    error.value = "Por favor complete todos los campos requeridos";
    return;
  }

  // Validación explícita del productoId
  if (!form.value.productoId || form.value.productoId.trim() === "") {
    error.value = "Debe seleccionar un producto";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    console.log("=== REGISTRANDO MOVIMIENTO ===");
    console.log("Datos a enviar:", {
      productoId: form.value.productoId,
      tipo: form.value.tipo,
      cantidad: form.value.cantidad,
      comentario: form.value.comentario,
      referencia: form.value.referencia,
    });

    await inventoryStore.registrarMovimiento({
      productoId: form.value.productoId,
      tipo: form.value.tipo,
      cantidad: form.value.cantidad,
      comentario: form.value.comentario || undefined,
      referencia: form.value.referencia || undefined,
    });

    console.log("✅ Movimiento registrado exitosamente");
    emit("success");
    cerrar();
  } catch (err: any) {
    console.error("❌ ERROR al registrar movimiento:", err);
    console.error("Response:", err.response);
    console.error("Data:", err.response?.data);

    error.value =
      err.response?.data?.message ||
      err.message ||
      "Error al registrar el movimiento";
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
