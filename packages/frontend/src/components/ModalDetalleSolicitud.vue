<template>
  <div
    v-if="modelValue && solicitud"
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
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900" id="modal-title">
              Detalle de Solicitud #{{ solicitud.id }}
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

          <!-- Información General -->
          <div class="space-y-4">
            <!-- Estado -->
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700">Estado:</span>
                <span class="badge" :class="getEstadoClass(solicitud.estado)">
                  {{ getEstadoLabel(solicitud.estado) }}
                </span>
              </div>
            </div>

            <!-- Información básica -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Solicitante</label>
                <p class="mt-1 text-sm text-gray-900">
                  {{ solicitud.creadoPor?.firstName || 'N/A' }} {{ solicitud.creadoPor?.lastName || '' }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Fecha</label>
                <p class="mt-1 text-sm text-gray-900">
                  {{ formatDate(new Date(solicitud.createdAt)) }}
                </p>
              </div>
            </div>

            <!-- Producto -->
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 class="font-medium text-blue-900 mb-3">Producto</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-sm text-blue-700">Nombre:</span>
                  <span class="text-sm font-medium text-blue-900">{{ solicitud.producto?.nombre || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-blue-700">SKU:</span>
                  <span class="text-sm font-medium text-blue-900">{{ solicitud.producto?.sku || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-blue-700">Categoría:</span>
                  <span class="text-sm font-medium text-blue-900">{{ solicitud.producto?.categoria || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-blue-700">Costo Unitario:</span>
                  <span class="text-sm font-medium text-blue-900">${{ formatPrice(solicitud.producto?.costo || 0) }}</span>
                </div>
              </div>
            </div>

            <!-- Cantidad (editable para admin/aprobador en solicitudes aprobadas) -->
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="flex justify-between items-center">
                <label class="text-sm font-medium text-gray-700">Cantidad solicitada:</label>
                
                <div v-if="puedeEditarCantidad" class="flex items-center space-x-2">
                  <input
                    v-if="editandoCantidad"
                    v-model.number="nuevaCantidad"
                    type="number"
                    min="1"
                    class="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    @keyup.enter="guardarCantidad"
                    @keyup.esc="cancelarEdicion"
                  />
                  <span v-else class="text-sm font-bold text-gray-900">
                    {{ solicitud.cantidad }} {{ solicitud.producto?.unidad || 'unidad' }}
                  </span>
                  
                  <button
                    v-if="!editandoCantidad"
                    @click="iniciarEdicion"
                    class="btn-icon btn-icon-primary"
                    title="Editar cantidad"
                  >
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  
                  <div v-if="editandoCantidad" class="flex space-x-1">
                    <button
                      @click="guardarCantidad"
                      :disabled="guardando"
                      class="btn-icon btn-icon-success"
                      title="Guardar"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      @click="cancelarEdicion"
                      :disabled="guardando"
                      class="btn-icon btn-icon-error"
                      title="Cancelar"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <span v-else class="text-sm font-bold text-gray-900">
                  {{ solicitud.cantidad }} {{ solicitud.producto?.unidad || 'unidad' }}
                </span>
              </div>
            </div>

            <!-- Costo Total -->
            <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-green-700">Costo Total:</span>
                <span class="text-lg font-bold text-green-900">
                  ${{ formatPrice((solicitud.producto?.costo || 0) * solicitud.cantidad) }}
                </span>
              </div>
            </div>

            <!-- Justificación -->
            <div v-if="solicitud.justificacion">
              <label class="block text-sm font-medium text-gray-700 mb-1">Justificación</label>
              <p class="text-sm text-gray-900 p-3 bg-gray-50 rounded">
                {{ solicitud.justificacion }}
              </p>
            </div>

            <!-- Urgente -->
            <div v-if="solicitud.urgente" class="p-3 bg-red-50 border border-red-200 rounded">
              <div class="flex items-center">
                <svg class="h-5 w-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span class="text-sm font-medium text-red-800">Marcada como urgente</span>
              </div>
            </div>

            <!-- Error Message -->
            <div
              v-if="error"
              class="p-3 bg-red-50 border border-red-200 rounded"
            >
              <p class="text-sm text-red-600">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Botones -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
          <button
            type="button"
            @click="cerrar"
            class="btn btn-secondary"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAuthStore } from "../stores/auth";
import { useToastStore } from "../stores/toast";
import axios from "axios";

const props = defineProps<{
  modelValue: boolean;
  solicitud: any;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "updated"): void;
}>();

const authStore = useAuthStore();
const toastStore = useToastStore();

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001';

const editandoCantidad = ref(false);
const nuevaCantidad = ref(0);
const guardando = ref(false);
const error = ref("");

// Puede editar si es admin o aprobador Y la solicitud está pendiente
const puedeEditarCantidad = computed(() => {
  return authStore.hasAnyRole(['ADMIN', 'APROBADOR']) && 
         props.solicitud?.estado === 'PENDIENTE';
});

const getEstadoClass = (estado: string) => {
  const classes = {
    PENDIENTE: "badge-warning",
    EN_APROBACION: "badge-warning",
    APROBADA: "badge-success",
    RECHAZADA: "badge-error",
  };
  return classes[estado as keyof typeof classes] || "badge-secondary";
};

const getEstadoLabel = (estado: string) => {
  const labels = {
    PENDIENTE: "Pendiente",
    EN_APROBACION: "En Aprobación",
    APROBADA: "Aprobada",
    RECHAZADA: "Rechazada",
  };
  return labels[estado as keyof typeof labels] || estado;
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const iniciarEdicion = () => {
  nuevaCantidad.value = props.solicitud?.cantidad || 1;
  editandoCantidad.value = true;
  error.value = "";
};

const cancelarEdicion = () => {
  editandoCantidad.value = false;
  nuevaCantidad.value = 0;
  error.value = "";
};

const guardarCantidad = async () => {
  if (nuevaCantidad.value <= 0) {
    error.value = "La cantidad debe ser mayor a 0";
    return;
  }

  if (nuevaCantidad.value === props.solicitud?.cantidad) {
    cancelarEdicion();
    return;
  }

  guardando.value = true;
  error.value = "";

  try {
    const token = authStore.token;
    await axios.patch(
      `${API_URL}/solicitudes/${props.solicitud.id}/cantidad`,
      { cantidad: nuevaCantidad.value },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toastStore.success(
      'Cantidad actualizada',
      `Nueva cantidad: ${nuevaCantidad.value} ${props.solicitud.producto?.unidad || 'unidad'}`
    );

    // Actualizar el objeto localmente
    if (props.solicitud) {
      props.solicitud.cantidad = nuevaCantidad.value;
    }

    editandoCantidad.value = false;
    emit("updated");
  } catch (err: any) {
    console.error("Error al actualizar cantidad:", err);
    error.value =
      err.response?.data?.message ||
      err.message ||
      "Error al actualizar la cantidad";
  } finally {
    guardando.value = false;
  }
};

const cerrar = () => {
  if (!guardando.value) {
    cancelarEdicion();
    emit("update:modelValue", false);
  }
};

// Reset cuando cambia la solicitud
watch(
  () => props.solicitud,
  () => {
    cancelarEdicion();
    error.value = "";
  }
);
</script>
