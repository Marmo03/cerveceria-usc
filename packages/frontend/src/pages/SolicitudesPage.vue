<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              Solicitudes de Compra
            </h1>
            <p class="mt-2 text-gray-600">
              Gestiona las solicitudes de compra y aprobaciones
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="$router.push('/dashboard')"
              class="btn btn-secondary"
            >
              <svg
                class="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Volver al Dashboard
            </button>
            
            <!-- Botón de exportar productos aprobados -->
            <div class="relative">
              <button 
                @click="showExportMenuAprobados = !showExportMenuAprobados"
                class="btn btn-success flex items-center"
                :disabled="solicitudesAprobadas.length === 0"
              >
                <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar Aprobados
                <svg class="h-4 w-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div
                v-if="showExportMenuAprobados"
                class="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
              >
                <div class="py-1">
                  <button
                    @click="exportarAprobadosExcel"
                    class="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800"
                  >
                    <svg class="h-5 w-5 mr-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M15.8,20H14L12,13.2L10,20H8.2L5.5,11H7.3L9,17L11,10H13L15,17L16.7,11H18.5L15.8,20Z" />
                    </svg>
                    <div class="text-left">
                      <div class="font-semibold">Exportar a Excel</div>
                      <div class="text-xs text-gray-500">Lista de productos aprobados</div>
                    </div>
                  </button>
                  
                  <button
                    @click="exportarAprobadosPDF"
                    class="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-800"
                  >
                    <svg class="h-5 w-5 mr-3 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M15.2,20H13.8L12,13.2L10.2,20H8.8L6.6,11H8.1L9.5,17.8L11.3,11H12.7L14.5,17.8L15.9,11H17.4L15.2,20Z" />
                    </svg>
                    <div class="text-left">
                      <div class="font-semibold">Exportar a PDF</div>
                      <div class="text-xs text-gray-500">Documento para pedido</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            <button
              v-if="authStore.hasAnyRole(['ADMIN', 'OPERARIO'])"
              @click="showCreateModal = true"
              class="btn btn-primary"
            >
              <svg
                class="h-4 w-4 mr-2"
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
              Nueva Solicitud
            </button>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >ID</label
              >
              <input
                v-model="filters.id"
                type="text"
                placeholder="Buscar por ID..."
                class="input-field"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Estado</label
              >
              <select v-model="filters.estado" class="input-field">
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_APROBACION">En Aprobación</option>
                <option value="APROBADA">Aprobada</option>
                <option value="RECHAZADA">Rechazada</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Solicitante</label
              >
              <input
                v-model="filters.solicitante"
                type="text"
                placeholder="Buscar solicitante..."
                class="input-field"
              />
            </div>
            <div class="flex items-end">
              <button @click="resetFilters" class="btn btn-secondary w-full">
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="stat-card">
          <div class="stat-icon bg-blue-100 text-blue-600">
            <svg
              class="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-3-3v6m-9 1V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
            <p class="text-gray-600">Total Solicitudes</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-yellow-100 text-yellow-600">
            <svg
              class="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ stats.pendientes }}
            </p>
            <p class="text-gray-600">Pendientes</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-green-100 text-green-600">
            <svg
              class="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ stats.aprobadas }}
            </p>
            <p class="text-gray-600">Aprobadas</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-purple-100 text-purple-600">
            <svg
              class="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              ${{ formatPrice(stats.montoTotal) }}
            </p>
            <p class="text-gray-600">Monto Total</p>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="mb-6">
        <nav class="flex space-x-8">
          <button
            @click="activeTab = 'todas'"
            :class="[
              'tab',
              activeTab === 'todas' ? 'tab-active' : 'tab-inactive',
            ]"
          >
            Todas las Solicitudes
          </button>
          <button
            v-if="authStore.hasAnyRole(['ADMIN', 'APROBADOR'])"
            @click="activeTab = 'aprobacion'"
            :class="[
              'tab',
              activeTab === 'aprobacion' ? 'tab-active' : 'tab-inactive',
            ]"
          >
            Pendientes de Aprobación
            <span
              v-if="stats.pendientesAprobacion > 0"
              class="ml-2 badge badge-warning"
            >
              {{ stats.pendientesAprobacion }}
            </span>
          </button>
          <button
            @click="activeTab = 'mis-solicitudes'"
            :class="[
              'tab',
              activeTab === 'mis-solicitudes' ? 'tab-active' : 'tab-inactive',
            ]"
          >
            Mis Solicitudes
          </button>
        </nav>
      </div>

      <!-- Tabla de solicitudes -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">
            {{ getTabTitle() }}
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header">ID</th>
                <th class="table-header">Fecha</th>
                <th class="table-header">Solicitante</th>
                <th class="table-header">Producto</th>
                <th class="table-header">Cantidad</th>
                <th class="table-header">Costo Total</th>
                <th class="table-header">Estado</th>
                <th class="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="solicitud in filteredSolicitudes"
                :key="solicitud.id"
                class="hover:bg-gray-50"
              >
                <td class="table-cell font-medium text-blue-600">
                  <button
                    @click="viewSolicitud(solicitud)"
                    class="hover:underline font-mono text-xs"
                    :title="solicitud.id"
                  >
                    #{{ solicitud.id.substring(0, 8).toUpperCase() }}
                  </button>
                </td>
                <td class="table-cell">
                  <div class="text-sm text-gray-900">
                    {{ formatDate(new Date(solicitud.createdAt)) }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ formatTime(new Date(solicitud.createdAt)) }}
                  </div>
                </td>
                <td class="table-cell">
                  <div class="flex items-center">
                    <div
                      class="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center mr-3"
                    >
                      <span class="text-xs font-medium text-gray-700">
                        {{
                          getInitials(
                            solicitud.creadoPor?.firstName +
                              " " +
                              solicitud.creadoPor?.lastName
                          )
                        }}
                      </span>
                    </div>
                    <div>
                      <div class="font-medium text-gray-900">
                        {{ solicitud.creadoPor?.firstName }}
                        {{ solicitud.creadoPor?.lastName }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ solicitud.creadoPor?.email }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="table-cell">
                  <div class="max-w-xs">
                    <div class="font-medium text-gray-900">
                      {{ solicitud.producto?.nombre || "N/A" }}
                    </div>
                    <div class="text-sm text-gray-500">
                      SKU: {{ solicitud.producto?.sku || "N/A" }}
                    </div>
                  </div>
                </td>
                <td class="table-cell font-medium">
                  {{ solicitud.cantidad }}
                  {{ solicitud.producto?.unidad || "" }}
                </td>
                <td class="table-cell font-medium">
                  ${{
                    formatPrice(
                      (solicitud.producto?.costo || 0) * solicitud.cantidad
                    )
                  }}
                </td>
                <td class="table-cell">
                  <span class="badge" :class="getEstadoClass(solicitud.estado)">
                    {{ getEstadoLabel(solicitud.estado) }}
                  </span>
                  <div
                    v-if="solicitud.urgente"
                    class="text-xs text-red-600 font-medium mt-1"
                  >
                    ⚠️ Urgente
                  </div>
                </td>
                <td class="table-cell">
                  <div class="flex items-center space-x-2">
                    <button
                      @click="viewSolicitud(solicitud)"
                      class="btn-icon btn-icon-primary"
                      title="Ver detalles"
                    >
                      <svg
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="canApprove(solicitud)"
                      @click="approveSolicitud(solicitud)"
                      class="btn-icon btn-icon-success"
                      title="Aprobar"
                    >
                      <svg
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="canReject(solicitud)"
                      @click="rejectSolicitud(solicitud)"
                      class="btn-icon btn-icon-error"
                      title="Rechazar"
                    >
                      <svg
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="spinner"></div>
          <span class="ml-2 text-gray-600">Cargando solicitudes...</span>
        </div>

        <!-- Empty state -->
        <div
          v-if="!loading && filteredSolicitudes.length === 0"
          class="text-center py-12"
        >
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
              d="M9 12h6m-3-3v6m-9 1V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">
            No hay solicitudes
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            No se encontraron solicitudes con los filtros aplicados.
          </p>
        </div>
      </div>
    </div>

    <!-- Modal de Solicitud -->
    <ModalSolicitud v-model="showCreateModal" @success="onSolicitudCreada" />
    
    <!-- Modal de Detalle de Solicitud -->
    <ModalDetalleSolicitud 
      v-model="showDetailModal" 
      :solicitud="solicitudSeleccionada"
      @updated="cargarSolicitudes"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import { useToastStore } from "../stores/toast";
import AppLayout from "../components/AppLayout.vue";
import ModalSolicitud from "../components/ModalSolicitud.vue";
import ModalDetalleSolicitud from "../components/ModalDetalleSolicitud.vue";
import axios from "axios";
import { exportarProductosAprobadosExcel, exportarProductosAprobadosPDF, type SolicitudAprobada } from "../services/exportSolicitudes";

const authStore = useAuthStore();
const toastStore = useToastStore();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Estado reactivo
const loading = ref(false);
const showCreateModal = ref(false);
const showDetailModal = ref(false);
const solicitudSeleccionada = ref<any>(null);
const showExportMenuAprobados = ref(false);
const activeTab = ref("todas");

// Datos de solicitudes desde API
const solicitudes = ref<any[]>([]);

// Filtros
const filters = ref({
  id: "",
  estado: "",
  solicitante: "",
});

// Solicitudes filtradas según tab activo
const filteredSolicitudes = computed(() => {
  let filtered = solicitudes.value;

  // Filtrar por tab
  if (activeTab.value === "aprobacion") {
    filtered = filtered.filter((s) =>
      ["PENDIENTE", "EN_REVISION"].includes(s.estado)
    );
  } else if (activeTab.value === "mis-solicitudes") {
    // Filtrar por usuario actual
    const userId = authStore.user?.id;
    filtered = filtered.filter((s) => s.creadoPorId === userId);
  }

  // Aplicar filtros adicionales
  return filtered.filter((solicitud) => {
    const matchesId =
      !filters.value.id || solicitud.id.toString().includes(filters.value.id);

    const matchesEstado =
      !filters.value.estado || solicitud.estado === filters.value.estado;

    const matchesSolicitante =
      !filters.value.solicitante ||
      (solicitud.creadoPor?.firstName + " " + solicitud.creadoPor?.lastName)
        .toLowerCase()
        .includes(filters.value.solicitante.toLowerCase());

    return matchesId && matchesEstado && matchesSolicitante;
  });
});

// Estadísticas
const stats = computed(() => ({
  total: solicitudes.value.length,
  pendientes: solicitudes.value.filter((s) => s.estado === "PENDIENTE").length,
  aprobadas: solicitudes.value.filter((s) => s.estado === "APROBADA").length,
  pendientesAprobacion: solicitudes.value.filter(
    (s) => s.estado === "EN_APROBACION"
  ).length,
  montoTotal: solicitudes.value.reduce(
    (sum, s) => sum + (s.producto?.costo || 0) * (s.cantidad || 0),
    0
  ),
}));

// Métodos
const resetFilters = () => {
  filters.value = {
    id: "",
    estado: "",
    solicitante: "",
  };
};

const getTabTitle = () => {
  if (activeTab.value === "todas") return "Todas las Solicitudes";
  if (activeTab.value === "aprobacion") return "Pendientes de Aprobación";
  if (activeTab.value === "mis-solicitudes") return "Mis Solicitudes";
  return "";
};

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

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .substring(0, 2);
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-CO").format(price);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const canApprove = (solicitud: any) => {
  return (
    authStore.hasAnyRole(["ADMIN", "APROBADOR"]) &&
    (solicitud.estado === "EN_APROBACION" || solicitud.estado === "PENDIENTE")
  );
};

const canReject = (solicitud: any) => {
  return (
    authStore.hasAnyRole(["ADMIN", "APROBADOR"]) &&
    (solicitud.estado === "EN_APROBACION" || solicitud.estado === "PENDIENTE")
  );
};

const cargarSolicitudes = async () => {
  loading.value = true;
  try {
    const token = authStore.token;
    const response = await axios.get(`${API_URL}/solicitudes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    solicitudes.value = response.data;
  } catch (error: any) {
    console.error("Error al cargar solicitudes:", error);
    alert(
      "Error al cargar las solicitudes: " +
        (error.response?.data?.message || error.message)
    );
  } finally {
    loading.value = false;
  }
};

const onSolicitudCreada = async () => {
  await cargarSolicitudes();
  // Cerrar modal manualmente después de recargar
  showCreateModal.value = false;
};

const viewSolicitud = (solicitud: any) => {
  solicitudSeleccionada.value = solicitud;
  showDetailModal.value = true;
};

const approveSolicitud = async (solicitud: any) => {
  if (
    !confirm(
      `¿Está seguro de aprobar la solicitud de ${solicitud.cantidad} unidades de ${solicitud.producto?.nombre}?`
    )
  ) {
    return;
  }

  loading.value = true;
  try {
    const token = authStore.token;
    const response = await axios.patch(
      `${API_URL}/solicitudes/${solicitud.id}/aprobar`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ Solicitud aprobada:', response.data);
    toastStore.success(
      'Solicitud aprobada exitosamente',
      `${solicitud.cantidad} unidades de ${solicitud.producto?.nombre}`
    );
    await cargarSolicitudes();
  } catch (error: any) {
    console.error("❌ Error al aprobar solicitud:", error);
    console.error("❌ Response data:", error.response?.data);
    console.error("❌ Status:", error.response?.status);
    
    let errorMsg = 'Error desconocido';
    if (error.response?.status === 403) {
      errorMsg = 'No tienes permisos para aprobar solicitudes. Se requiere rol ADMIN o APROBADOR.';
    } else if (error.response?.status === 401) {
      errorMsg = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
    } else {
      errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
    }
    
    toastStore.error(
      'Error al aprobar la solicitud',
      errorMsg
    );
  } finally {
    loading.value = false;
  }
};

const rejectSolicitud = async (solicitud: any) => {
  const motivo = prompt("Ingrese el motivo del rechazo:");
  if (!motivo || motivo.trim() === "") {
    toastStore.warning('Rechazo cancelado', 'Debe proporcionar un motivo para rechazar');
    return;
  }

  loading.value = true;
  try {
    const token = authStore.token;
    console.log('🔄 Rechazando solicitud:', solicitud.id);
    console.log('📝 Datos a enviar:', { comentario: motivo });
    
    await axios.patch(
      `${API_URL}/solicitudes/${solicitud.id}/rechazar`,
      { comentario: motivo },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    toastStore.success('Solicitud rechazada exitosamente', `Producto: ${solicitud.producto?.nombre}`);
    await cargarSolicitudes();
  } catch (error: any) {
    console.error("❌ Error al rechazar solicitud:", error);
    console.error("❌ Response:", error.response?.data);
    
    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
    toastStore.error(
      'Error al rechazar la solicitud',
      errorMsg
    );
  } finally {
    loading.value = false;
  }
};

// Computed para solicitudes aprobadas (para exportación)
const solicitudesAprobadas = computed<SolicitudAprobada[]>(() => {
  return solicitudes.value
    .filter(s => s.estado === 'APROBADA')
    .map(s => ({
      id: s.id.toString(),
      fecha: formatDate(new Date(s.createdAt)),
      solicitante: s.creadoPor 
        ? `${s.creadoPor.firstName || ''} ${s.creadoPor.lastName || ''}`.trim() 
        : 'N/A',
      productos: [{
        codigo: s.producto?.codigo || 'N/A',
        nombre: s.producto?.nombre || 'N/A',
        categoria: s.producto?.categoria || 'N/A',
        cantidad: s.cantidad || 0,
        unidad: s.producto?.unidad || 'unidad',
        precioUnitario: s.producto?.costo || 0,
        subtotal: (s.cantidad || 0) * (s.producto?.costo || 0),
        proveedor: s.producto?.proveedor || 'N/A',
        notas: s.observacion || ''
      }],
      total: (s.cantidad || 0) * (s.producto?.costo || 0)
    }));
});

// Funciones de exportación
const exportarAprobadosExcel = () => {
  showExportMenuAprobados.value = false;
  if (solicitudesAprobadas.value.length === 0) {
    toastStore.warning('Sin datos', 'No hay solicitudes aprobadas para exportar');
    return;
  }
  exportarProductosAprobadosExcel(solicitudesAprobadas.value);
  toastStore.success('Excel generado', 'El archivo se ha descargado correctamente');
};

const exportarAprobadosPDF = () => {
  showExportMenuAprobados.value = false;
  if (solicitudesAprobadas.value.length === 0) {
    toastStore.warning('Sin datos', 'No hay solicitudes aprobadas para exportar');
    return;
  }
  exportarProductosAprobadosPDF(solicitudesAprobadas.value);
  toastStore.success('PDF generado', 'El archivo se ha descargado correctamente');
};

onMounted(async () => {
  await cargarSolicitudes();
});
</script>

<style scoped>
.tab {
  @apply px-1 py-4 text-sm font-medium border-b-2 transition-colors duration-200;
}

.tab-active {
  @apply text-blue-600 border-blue-600;
}

.tab-inactive {
  @apply text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300;
}
</style>
