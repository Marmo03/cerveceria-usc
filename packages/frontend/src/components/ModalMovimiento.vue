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

          <!-- Tabs -->
          <div class="border-b border-gray-200 mb-4">
            <nav class="-mb-px flex space-x-8">
              <button
                type="button"
                @click="activeTab = 'manual'"
                :class="[
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                  activeTab === 'manual'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                Registro Manual
              </button>
              <button
                type="button"
                @click="activeTab = 'importar'"
                :class="[
                  'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
                  activeTab === 'importar'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]"
              >
                Importar Masivo
              </button>
            </nav>
          </div>

          <!-- Contenido Manual -->
          <form v-show="activeTab === 'manual'" @submit.prevent="guardar" class="space-y-4">
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
          </form>

          <!-- Contenido Importación -->
          <div v-show="activeTab === 'importar'" class="space-y-4">
              <!-- Tipo de Movimiento para Import -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Tipo de Movimiento *</label
                >
                <div class="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    @click="tipoImportacion = 'ENTRADA'"
                    :class="[
                      'p-4 border-2 rounded-lg text-center transition-all',
                      tipoImportacion === 'ENTRADA'
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
                    @click="tipoImportacion = 'SALIDA'"
                    :class="[
                      'p-4 border-2 rounded-lg text-center transition-all',
                      tipoImportacion === 'SALIDA'
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
                    <p class="text-xs mt-1">Quitar del inventario</p>
                  </button>
                </div>
              </div>

              <!-- Instrucciones -->
              <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 class="text-sm font-medium text-blue-900 mb-2">📋 Formato requerido</h4>
                <div class="text-sm text-blue-800">
                  <p class="mb-2">El archivo debe contener las siguientes columnas:</p>
                  <ul class="list-disc list-inside space-y-1">
                    <li><strong>sku</strong>: Código del producto (requerido)</li>
                    <li><strong>cantidad</strong>: Cantidad del movimiento (número, requerido)</li>
                    <li><strong>comentario</strong>: Motivo del movimiento (opcional)</li>
                    <li><strong>referencia</strong>: Referencia externa (opcional)</li>
                  </ul>
                </div>
                <div class="mt-3">
                  <button
                    type="button"
                    @click="descargarPlantillaMovimientos"
                    class="text-sm text-blue-700 hover:text-blue-900 underline"
                  >
                    📥 Descargar plantilla de ejemplo
                  </button>
                </div>
              </div>

              <!-- Selector de archivo -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar archivo (CSV o Excel)
                </label>
                <div class="flex items-center justify-center w-full">
                  <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div class="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg class="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p class="mb-2 text-sm text-gray-500">
                        <span class="font-semibold">Click para seleccionar</span> o arrastra el archivo
                      </p>
                      <p class="text-xs text-gray-500">CSV o Excel (.xlsx, .xls)</p>
                      <p v-if="archivoImport" class="mt-2 text-sm font-medium text-green-600">
                        ✓ {{ archivoImport.name }}
                      </p>
                    </div>
                    <input type="file" class="hidden" accept=".csv,.xlsx,.xls" @change="seleccionarArchivoImport" />
                  </label>
                </div>
              </div>

              <!-- Resultados -->
              <div v-if="resultadoImport" class="p-4 bg-green-50 border border-green-200 rounded">
                <h4 class="text-sm font-medium text-green-900 mb-2">✅ Importación completada</h4>
                <div class="text-sm text-green-800">
                  <p>✓ Registros procesados: {{ resultadoImport.procesados }}</p>
                  <p>✓ Registros exitosos: {{ resultadoImport.exitosos }}</p>
                  <p v-if="resultadoImport.errores > 0" class="text-red-700">✗ Errores: {{ resultadoImport.errores }}</p>
                </div>
                <div v-if="resultadoImport.detalleErrores && resultadoImport.detalleErrores.length > 0" class="mt-3">
                  <p class="text-sm font-medium text-red-800 mb-1">Errores encontrados:</p>
                  <ul class="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    <li v-for="(err, i) in resultadoImport.detalleErrores" :key="i">
                      Línea {{ err.linea }}: {{ err.error }}
                    </li>
                  </ul>
              </div>
            </div>
          </div>

          <!-- Botones -->
          <div
            class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2"
          >
            <button
              v-if="activeTab === 'manual'"
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
              v-if="activeTab === 'importar'"
              type="button"
              @click="importarMovimientos"
              :disabled="loadingImport || !archivoImport"
              class="btn btn-primary"
              :class="{
                'opacity-50 cursor-not-allowed': loadingImport || !archivoImport,
              }"
            >
              {{ loadingImport ? "Importando..." : "Importar Movimientos" }}
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useInventoryStore } from "../stores/inventory";
import { useProductsStore } from "../stores/products";
import { useToastStore } from "../stores/toast";
import { useAuthStore } from "../stores/auth";
import axios from "axios";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const inventoryStore = useInventoryStore();
const productsStore = useProductsStore();
const toastStore = useToastStore();
const authStore = useAuthStore();
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

const loading = ref(false);
const error = ref("");
const activeTab = ref<'manual' | 'importar'>('manual');

// Variables para importación
const tipoImportacion = ref<'ENTRADA' | 'SALIDA'>('ENTRADA');
const archivoImport = ref<File | null>(null);
const loadingImport = ref(false);
const resultadoImport = ref<any>(null);

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
  
  // Reset variables de importación
  activeTab.value = 'manual';
  tipoImportacion.value = 'ENTRADA';
  archivoImport.value = null;
  resultadoImport.value = null;
  loadingImport.value = false;
};

const cerrar = () => {
  console.log('🔄 Cerrando ModalMovimiento, loading:', loading.value);
  // Siempre permitir cerrar, independiente del estado de loading
  loading.value = false;
  emit("update:modelValue", false);
  setTimeout(resetForm, 300);
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
    
    toastStore.success(
      'Movimiento registrado exitosamente',
      `${form.value.tipo} de ${form.value.cantidad} unidades de ${productoSeleccionado.value?.nombre}`
    );
    
    // Solo emitir success, el padre cerrará el modal después de recargar
    emit("success");
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

// Funciones para importación masiva
const seleccionarArchivoImport = (event: Event) => {
  const target = event.target as HTMLInputElement;
  archivoImport.value = target.files?.[0] || null;
  resultadoImport.value = null; // Limpiar resultados previos
};

const descargarPlantillaMovimientos = () => {
  const tipo = tipoImportacion.value;
  let csvContent = 'sku,cantidad,comentario,referencia\n';
  
  if (tipo === 'ENTRADA') {
    csvContent += 'PROD001,50,Compra a proveedor XYZ,PO-2024-001\n';
    csvContent += 'PROD002,30,Reposición stock mínimo,REP-045\n';
    csvContent += 'PROD003,100,Producción lote 123,PROD-123\n';
  } else {
    csvContent += 'PROD001,20,Venta cliente ABC,VTA-2024-001\n';
    csvContent += 'PROD002,15,Consumo producción,CONS-045\n';
    csvContent += 'PROD003,10,Merma por vencimiento,MER-2024-001\n';
  }
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `plantilla_movimientos_${tipo}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const importarMovimientos = async () => {
  if (!archivoImport.value) {
    toastStore.warning('Archivo requerido', 'Por favor seleccione un archivo para importar');
    return;
  }
  
  loadingImport.value = true;
  error.value = '';
  
  try {
    const formData = new FormData();
    formData.append('file', archivoImport.value);
    formData.append('tipo', tipoImportacion.value);
    
    const response = await axios.post(
      `${API_URL}/inventario/importar-movimientos`,
      formData,
      { 
        headers: { 
          'Content-Type': 'multipart/form-data'
        } 
      }
    );
    
    resultadoImport.value = response.data;
    
    if (response.data.exitosos > 0) {
      const mensaje = `${response.data.exitosos} movimiento(s) de ${tipoImportacion.value} registrado(s)`;
      toastStore.success('Importación exitosa', mensaje);
      emit('success'); // Trigger parent to reload data
    }
    
    if (response.data.errores > 0) {
      toastStore.warning(
        'Importación con errores', 
        `${response.data.errores} registro(s) fallaron. Revise los detalles.`
      );
    }
  } catch (err: any) {
    console.error('Error al importar movimientos:', err);
    error.value = err.response?.data?.error || 'Error al importar movimientos';
    toastStore.error('Error al importar', error.value);
  } finally {
    loadingImport.value = false;
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
