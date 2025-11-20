<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- Overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="cerrar"></div>

      <!-- Modal -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <div class="bg-white px-6 pt-5 pb-4">
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">
              Importar {{ tipo === 'productos' ? 'Productos' : 'Movimientos de Inventario' }}
            </h3>
            <button @click="cerrar" class="text-gray-400 hover:text-gray-500">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Instrucciones -->
          <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 class="text-sm font-medium text-blue-900 mb-2">📋 Formato requerido</h4>
            <div v-if="tipo === 'productos'" class="text-sm text-blue-800">
              <p class="mb-2">El archivo debe contener las siguientes columnas:</p>
              <ul class="list-disc list-inside space-y-1">
                <li><strong>sku</strong>: Código único del producto (requerido)</li>
                <li><strong>nombre</strong>: Nombre del producto (requerido)</li>
                <li><strong>categoria</strong>: Categoría (requerido)</li>
                <li><strong>unidad</strong>: Unidad de medida (ej: L, KG, UND) (requerido)</li>
                <li><strong>stockActual</strong>: Stock actual (número, opcional)</li>
                <li><strong>stockMin</strong>: Stock mínimo (número, opcional)</li>
                <li><strong>costo</strong>: Costo unitario (número, requerido)</li>
                <li><strong>leadTime</strong>: Tiempo de entrega en días (número, opcional)</li>
              </ul>
            </div>
            <div v-else class="text-sm text-blue-800">
              <p class="mb-2">El archivo debe contener las siguientes columnas:</p>
              <ul class="list-disc list-inside space-y-1">
                <li><strong>sku</strong>: Código del producto (requerido)</li>
                <li><strong>tipo</strong>: ENTRADA o SALIDA (requerido)</li>
                <li><strong>cantidad</strong>: Cantidad del movimiento (número, requerido)</li>
                <li><strong>comentario</strong>: Motivo del movimiento (opcional)</li>
                <li><strong>referencia</strong>: Referencia externa (opcional)</li>
              </ul>
            </div>
            <div class="mt-3">
              <button
                @click="descargarPlantilla"
                class="text-sm text-blue-700 hover:text-blue-900 underline"
              >
                📥 Descargar plantilla de ejemplo
              </button>
            </div>
          </div>

          <!-- Selector de archivo -->
          <div class="mb-4">
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
                  <p v-if="archivo" class="mt-2 text-sm font-medium text-green-600">
                    ✓ {{ archivo.name }}
                  </p>
                </div>
                <input type="file" class="hidden" accept=".csv,.xlsx,.xls" @change="seleccionarArchivo" />
              </label>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {{ error }}
          </div>

          <!-- Resultados de la importación -->
          <div v-if="resultado" class="mb-4 p-4 bg-green-50 border border-green-200 rounded">
            <h4 class="text-sm font-medium text-green-900 mb-2">✅ Importación completada</h4>
            <div class="text-sm text-green-800">
              <p>✓ Registros procesados: {{ resultado.procesados }}</p>
              <p>✓ Registros exitosos: {{ resultado.exitosos }}</p>
              <p v-if="resultado.errores > 0" class="text-red-700">✗ Errores: {{ resultado.errores }}</p>
            </div>
            <div v-if="resultado.detalleErrores && resultado.detalleErrores.length > 0" class="mt-3">
              <p class="text-sm font-medium text-red-800 mb-1">Errores encontrados:</p>
              <ul class="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                <li v-for="(err, i) in resultado.detalleErrores" :key="i">
                  Línea {{ err.linea }}: {{ err.error }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
          <button
            @click="importar"
            :disabled="!archivo || loading"
            class="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? 'Importando...' : 'Importar' }}
          </button>
          <button
            @click="cerrar"
            type="button"
            :disabled="loading"
            class="mt-3 w-full sm:mt-0 sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';

const props = defineProps<{
  modelValue: boolean;
  tipo: 'productos' | 'movimientos';
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const authStore = useAuthStore();
const toastStore = useToastStore();
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

const archivo = ref<File | null>(null);
const loading = ref(false);
const error = ref('');
const resultado = ref<any>(null);

const seleccionarArchivo = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    archivo.value = target.files[0];
    error.value = '';
    resultado.value = null;
  }
};

const descargarPlantilla = () => {
  let csvContent = '';
  
  if (props.tipo === 'productos') {
    csvContent = 'sku,nombre,categoria,unidad,stockActual,stockMin,costo,leadTime\n';
    csvContent += 'PROD001,Cerveza Lager 330ml,Bebidas,UND,100,20,2500,7\n';
    csvContent += 'PROD002,Malta Premium 500g,Materias Primas,KG,50,10,15000,15\n';
    csvContent += 'PROD003,Botella Vidrio 330ml,Envases,UND,500,100,800,5\n';
  } else {
    csvContent = 'sku,tipo,cantidad,comentario,referencia\n';
    csvContent += 'PROD001,ENTRADA,50,Compra proveedor,PO-2024-001\n';
    csvContent += 'PROD002,SALIDA,10,Producción lote 45,PROD-045\n';
    csvContent += 'PROD003,ENTRADA,200,Reposición stock,PO-2024-002\n';
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `plantilla_${props.tipo}.csv`;
  link.click();
};

const importar = async () => {
  if (!archivo.value) {
    error.value = 'Debe seleccionar un archivo';
    return;
  }

  loading.value = true;
  error.value = '';
  resultado.value = null;

  try {
    const formData = new FormData();
    formData.append('file', archivo.value);

    const endpoint = props.tipo === 'productos' 
      ? '/productos/importar' 
      : '/inventario/importar-movimientos';

    const response = await axios.post(
      `${API_URL}${endpoint}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authStore.token}`,
        },
      }
    );

    resultado.value = response.data;
    
    if (response.data.exitosos > 0) {
      toastStore.success(
        'Importación exitosa',
        `${response.data.exitosos} registros importados correctamente`
      );
      emit('success');
    }

    if (response.data.errores > 0) {
      toastStore.warning(
        'Importación con errores',
        `${response.data.errores} registros fallaron. Revise el detalle.`
      );
    }
  } catch (err: any) {
    console.error('Error al importar:', err);
    error.value = err.response?.data?.error || err.message || 'Error al importar el archivo';
    toastStore.error('Error al importar', error.value);
  } finally {
    loading.value = false;
  }
};

const cerrar = () => {
  if (!loading.value) {
    archivo.value = null;
    error.value = '';
    resultado.value = null;
    emit('update:modelValue', false);
  }
};
</script>
