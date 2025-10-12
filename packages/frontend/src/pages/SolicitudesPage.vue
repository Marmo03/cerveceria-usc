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
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Número</label
              >
              <input
                v-model="filters.numero"
                type="text"
                placeholder="Buscar por número..."
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
                <option value="EN_REVISION">En Revisión</option>
                <option value="APROBADA">Aprobada</option>
                <option value="RECHAZADA">Rechazada</option>
                <option value="COMPLETADA">Completada</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Prioridad</label
              >
              <select v-model="filters.prioridad" class="input-field">
                <option value="">Todas</option>
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
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
                <th class="table-header">Número</th>
                <th class="table-header">Fecha</th>
                <th class="table-header">Solicitante</th>
                <th class="table-header">Descripción</th>
                <th class="table-header">Monto</th>
                <th class="table-header">Prioridad</th>
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
                    class="hover:underline"
                  >
                    {{ solicitud.numero }}
                  </button>
                </td>
                <td class="table-cell">
                  <div class="text-sm text-gray-900">
                    {{ formatDate(solicitud.fecha) }}
                  </div>
                  <div class="text-sm text-gray-500">
                    {{ formatTime(solicitud.fecha) }}
                  </div>
                </td>
                <td class="table-cell">
                  <div class="flex items-center">
                    <div
                      class="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center mr-3"
                    >
                      <span class="text-xs font-medium text-gray-700">
                        {{ getInitials(solicitud.solicitante) }}
                      </span>
                    </div>
                    <div>
                      <div class="font-medium text-gray-900">
                        {{ solicitud.solicitante }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ solicitud.departamento }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="table-cell">
                  <div class="max-w-xs">
                    <div class="font-medium text-gray-900 truncate">
                      {{ solicitud.descripcion }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ solicitud.itemsCount }} items
                    </div>
                  </div>
                </td>
                <td class="table-cell font-medium">
                  ${{ formatPrice(solicitud.montoTotal) }}
                </td>
                <td class="table-cell">
                  <span
                    class="badge"
                    :class="getPrioridadClass(solicitud.prioridad)"
                  >
                    {{ solicitud.prioridad }}
                  </span>
                </td>
                <td class="table-cell">
                  <span class="badge" :class="getEstadoClass(solicitud.estado)">
                    {{ getEstadoLabel(solicitud.estado) }}
                  </span>
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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import AppLayout from "../components/AppLayout.vue";

const authStore = useAuthStore();

// Estado reactivo
const loading = ref(false);
const showCreateModal = ref(false);
const activeTab = ref("todas");

// Datos de ejemplo
const solicitudes = ref([
  {
    id: 1,
    numero: "SC-2024-001",
    fecha: new Date("2024-01-15T10:00:00"),
    solicitante: "Juan Pérez",
    departamento: "Producción",
    descripcion: "Materias primas para producción mensual",
    itemsCount: 5,
    montoTotal: 2500000,
    prioridad: "ALTA",
    estado: "PENDIENTE",
  },
  {
    id: 2,
    numero: "SC-2024-002",
    fecha: new Date("2024-01-14T14:30:00"),
    solicitante: "María García",
    departamento: "Calidad",
    descripcion: "Equipos de laboratorio",
    itemsCount: 3,
    montoTotal: 1200000,
    prioridad: "MEDIA",
    estado: "EN_REVISION",
  },
  {
    id: 3,
    numero: "SC-2024-003",
    fecha: new Date("2024-01-13T09:15:00"),
    solicitante: "Carlos López",
    departamento: "Logística",
    descripcion: "Material de empaque",
    itemsCount: 8,
    montoTotal: 800000,
    prioridad: "BAJA",
    estado: "APROBADA",
  },
  {
    id: 4,
    numero: "SC-2024-004",
    fecha: new Date("2024-01-12T16:45:00"),
    solicitante: "Ana Rodríguez",
    departamento: "Mantenimiento",
    descripcion: "Repuestos urgentes para línea 2",
    itemsCount: 2,
    montoTotal: 3500000,
    prioridad: "CRITICA",
    estado: "COMPLETADA",
  },
]);

// Filtros
const filters = ref({
  numero: "",
  estado: "",
  prioridad: "",
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
    // TODO: Filtrar por usuario actual
    filtered = filtered.filter((s) => s.solicitante === "Juan Pérez");
  }

  // Aplicar filtros adicionales
  return filtered.filter((solicitud) => {
    const matchesNumero =
      !filters.value.numero ||
      solicitud.numero
        .toLowerCase()
        .includes(filters.value.numero.toLowerCase());

    const matchesEstado =
      !filters.value.estado || solicitud.estado === filters.value.estado;

    const matchesPrioridad =
      !filters.value.prioridad ||
      solicitud.prioridad === filters.value.prioridad;

    const matchesSolicitante =
      !filters.value.solicitante ||
      solicitud.solicitante
        .toLowerCase()
        .includes(filters.value.solicitante.toLowerCase());

    return (
      matchesNumero && matchesEstado && matchesPrioridad && matchesSolicitante
    );
  });
});

// Estadísticas
const stats = computed(() => ({
  total: solicitudes.value.length,
  pendientes: solicitudes.value.filter((s) => s.estado === "PENDIENTE").length,
  aprobadas: solicitudes.value.filter((s) => s.estado === "APROBADA").length,
  pendientesAprobacion: solicitudes.value.filter((s) =>
    ["PENDIENTE", "EN_REVISION"].includes(s.estado)
  ).length,
  montoTotal: solicitudes.value.reduce((sum, s) => sum + s.montoTotal, 0),
}));

// Métodos
const resetFilters = () => {
  filters.value = {
    numero: "",
    estado: "",
    prioridad: "",
    solicitante: "",
  };
};

const getTabTitle = () => {
  if (activeTab.value === "todas") return "Todas las Solicitudes";
  if (activeTab.value === "aprobacion") return "Pendientes de Aprobación";
  if (activeTab.value === "mis-solicitudes") return "Mis Solicitudes";
  return "";
};

const getPrioridadClass = (prioridad: string) => {
  const classes = {
    BAJA: "badge-secondary",
    MEDIA: "badge-info",
    ALTA: "badge-warning",
    CRITICA: "badge-error",
  };
  return classes[prioridad as keyof typeof classes] || "badge-secondary";
};

const getEstadoClass = (estado: string) => {
  const classes = {
    PENDIENTE: "badge-warning",
    EN_REVISION: "badge-info",
    APROBADA: "badge-success",
    RECHAZADA: "badge-error",
    COMPLETADA: "badge-secondary",
  };
  return classes[estado as keyof typeof classes] || "badge-secondary";
};

const getEstadoLabel = (estado: string) => {
  const labels = {
    PENDIENTE: "Pendiente",
    EN_REVISION: "En Revisión",
    APROBADA: "Aprobada",
    RECHAZADA: "Rechazada",
    COMPLETADA: "Completada",
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
    ["PENDIENTE", "EN_REVISION"].includes(solicitud.estado)
  );
};

const canReject = (solicitud: any) => {
  return (
    authStore.hasAnyRole(["ADMIN", "APROBADOR"]) &&
    ["PENDIENTE", "EN_REVISION"].includes(solicitud.estado)
  );
};

const viewSolicitud = (solicitud: any) => {
  console.log("Ver solicitud:", solicitud);
  // TODO: Implementar modal de detalles
};

const approveSolicitud = (solicitud: any) => {
  console.log("Aprobar solicitud:", solicitud);
  // TODO: Implementar aprobación
};

const rejectSolicitud = (solicitud: any) => {
  console.log("Rechazar solicitud:", solicitud);
  // TODO: Implementar rechazo
};

onMounted(() => {
  // TODO: Cargar datos desde API
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
