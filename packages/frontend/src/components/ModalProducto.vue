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
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full"
      >
        <form @submit.prevent="guardar">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900" id="modal-title">
                {{ producto?.id ? "Editar Producto" : "Nuevo Producto" }}
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

            <!-- Banner de ayuda -->
            <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg
                    class="h-5 w-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div class="ml-3">
                  <h4 class="text-sm font-medium text-blue-800">
                    Guía de llenado
                  </h4>
                  <div class="text-xs text-blue-700 mt-1">
                    Los campos marcados con * son obligatorios. Lee las
                    descripciones en gris debajo de cada campo para más
                    información.
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- SKU -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >SKU *</label
                >
                <p class="text-xs text-gray-500 mb-2">
                  Código único del producto. Ej: MP-001, PT-CERVEZA, EMP-BOT355
                </p>
                <input
                  v-model="form.sku"
                  type="text"
                  required
                  placeholder="Ej: PROD-001"
                  class="input-field"
                  :disabled="!!producto?.id"
                />
              </div>

              <!-- Nombre -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Nombre *</label
                >
                <p class="text-xs text-gray-500 mb-2">
                  Nombre descriptivo del producto
                </p>
                <input
                  v-model="form.nombre"
                  type="text"
                  required
                  placeholder="Nombre del producto"
                  class="input-field"
                />
              </div>

              <!-- Categoría -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Categoría *</label
                >
                <p class="text-xs text-gray-500 mb-2">
                  Materia Prima: Malta, Lúpulo, Levadura | Insumo: Químicos |
                  Producto Terminado: Cerveza | Empaque: Botellas, Etiquetas
                </p>
                <select v-model="form.categoria" required class="input-field">
                  <option value="">Seleccione...</option>
                  <option value="MATERIA_PRIMA">Materia Prima</option>
                  <option value="INSUMO">Insumo</option>
                  <option value="PRODUCTO_TERMINADO">Producto Terminado</option>
                  <option value="EMPAQUE">Empaque</option>
                </select>
              </div>

              <!-- Unidad -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Unidad de Medida *</label
                >
                <p class="text-xs text-gray-500 mb-2">
                  Unidad en la que se medirá el inventario
                </p>
                <select v-model="form.unidad" required class="input-field">
                  <option value="">Seleccione...</option>
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="L">Litros (L)</option>
                  <option value="unidades">Unidades</option>
                  <option value="cajas">Cajas</option>
                  <option value="m">Metros (m)</option>
                </select>
              </div>

              <!-- Stock Actual -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Stock Actual *</label
                >
                <p class="text-xs text-gray-500 mb-2">
                  Cantidad disponible actualmente en inventario
                </p>
                <input
                  v-model.number="form.stockActual"
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  class="input-field"
                />
              </div>

              <!-- Stock Mínimo -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Stock Mínimo *</label
                >
                <p class="text-xs text-gray-500 mb-2">
                  Nivel mínimo antes de generar alerta de reabastecimiento
                </p>
                <input
                  v-model.number="form.stockMin"
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  class="input-field"
                />
              </div>

              <!-- Costo -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Costo Unitario (COP) *</label
                >
                <p class="text-xs text-gray-500 mb-2">
                  Costo por unidad en pesos colombianos. Ej: 25000
                </p>
                <input
                  v-model.number="form.costo"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  class="input-field"
                />
              </div>

              <!-- Lead Time -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Tiempo de Entrega (días) *</label
                >
                <p class="text-xs text-gray-500 mb-2">
                  Días que tarda el proveedor en entregar. Ej: 7, 15, 30
                </p>
                <input
                  v-model.number="form.leadTime"
                  type="number"
                  min="1"
                  required
                  placeholder="7"
                  class="input-field"
                />
              </div>

              <!-- Proveedor (opcional) -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Proveedor (opcional)</label
                >
                <p class="text-xs text-gray-500 mb-2">
                  Selecciona el proveedor principal de este producto (puedes
                  dejarlo sin proveedor)
                </p>
                <select v-model="form.proveedorId" class="input-field">
                  <option value="">Sin proveedor</option>
                  <option
                    v-for="proveedor in proveedores"
                    :key="proveedor.id"
                    :value="proveedor.id"
                  >
                    {{ proveedor.nombre }}
                  </option>
                </select>
              </div>

              <!-- Estado Activo -->
              <div class="md:col-span-2">
                <label class="flex items-center">
                  <input
                    v-model="form.isActive"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span class="ml-2 text-sm text-gray-700"
                    >Producto activo</span
                  >
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
            <button type="submit" :disabled="loading" class="btn btn-primary">
              {{
                loading ? "Guardando..." : producto?.id ? "Actualizar" : "Crear"
              }}
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
import { ref, watch } from "vue";
import { useProductsStore } from "../stores/products";

interface Proveedor {
  id: string;
  nombre: string;
}

interface Producto {
  id?: string;
  sku: string;
  nombre: string;
  categoria: string;
  unidad: string;
  stockActual: number;
  stockMin: number;
  costo: number;
  leadTime: number;
  proveedorId?: string;
  isActive: boolean;
}

const props = defineProps<{
  modelValue: boolean;
  producto?: Producto | null;
  proveedores?: Proveedor[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const productsStore = useProductsStore();

const loading = ref(false);
const error = ref("");

const form = ref({
  sku: "",
  nombre: "",
  categoria: "",
  unidad: "",
  stockActual: 0,
  stockMin: 0,
  costo: 0,
  leadTime: 7,
  proveedorId: "",
  isActive: true,
});

// Declarar resetForm ANTES del watch
const resetForm = () => {
  form.value = {
    sku: "",
    nombre: "",
    categoria: "",
    unidad: "",
    stockActual: 0,
    stockMin: 0,
    costo: 0,
    leadTime: 7,
    proveedorId: "",
    isActive: true,
  };
  error.value = "";
};

watch(
  () => props.producto,
  (newProducto) => {
    if (newProducto) {
      form.value = {
        sku: newProducto.sku || "",
        nombre: newProducto.nombre || "",
        categoria: newProducto.categoria || "",
        unidad: newProducto.unidad || "",
        stockActual: newProducto.stockActual || 0,
        stockMin: newProducto.stockMin || 0,
        costo: newProducto.costo || 0,
        leadTime: newProducto.leadTime || 7,
        proveedorId: newProducto.proveedorId || "",
        isActive:
          newProducto.isActive !== undefined ? newProducto.isActive : true,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const cerrar = () => {
  if (!loading.value) {
    emit("update:modelValue", false);
    setTimeout(resetForm, 300);
  }
};

const guardar = async () => {
  loading.value = true;
  error.value = "";

  try {
    const data = {
      ...form.value,
      proveedorId:
        form.value.proveedorId && form.value.proveedorId !== ""
          ? form.value.proveedorId
          : undefined,
    };

    if (props.producto?.id) {
      await productsStore.updateProducto(props.producto.id, data);
      alert('✅ Producto actualizado exitosamente');
    } else {
      await productsStore.createProducto(data);
      alert('✅ Producto creado exitosamente');
    }

    emit("success");
    cerrar();
  } catch (err: any) {
    error.value =
      err.response?.data?.message ||
      err.message ||
      "Error al guardar el producto";
  } finally {
    loading.value = false;
  }
};
</script>
