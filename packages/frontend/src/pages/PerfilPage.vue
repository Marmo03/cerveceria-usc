<template>
  <AppLayout>
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Mi Perfil</h1>
            <p class="mt-2 text-gray-600">
              Gestiona tu información personal y configuración de cuenta
            </p>
          </div>
          <button @click="$router.push('/dashboard')" class="btn btn-secondary">
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
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Cargando perfil...</p>
      </div>

      <!-- Error -->
      <div v-else-if="loadError" class="text-center py-12">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <svg class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Error al cargar el perfil</h3>
          <p class="text-sm text-gray-600 mb-4">No se pudo conectar con el servidor</p>
          <button @click="loadProfile" class="btn btn-primary">
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reintentar
          </button>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Información del usuario -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="text-center">
              <!-- Avatar -->
              <div
                class="mx-auto h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center mb-4"
              >
                <span class="text-2xl font-bold text-white">
                  {{ getInitials(userProfile.firstName, userProfile.lastName) }}
                </span>
              </div>

              <h2 class="text-xl font-bold text-gray-900">
                {{ userProfile.firstName }} {{ userProfile.lastName }}
              </h2>
              <p class="text-gray-600">{{ userProfile.position }}</p>
              <p class="text-sm text-gray-500">{{ userProfile.department }}</p>

              <!-- Badge de rol -->
              <div class="mt-4">
                <span class="badge badge-primary">{{ userProfile.role }}</span>
              </div>

              <!-- Estadísticas del usuario -->
              <div class="mt-6 border-t pt-4">
                <div class="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p class="text-2xl font-bold text-gray-900">
                      {{ userStats.solicitudes }}
                    </p>
                    <p class="text-sm text-gray-600">Solicitudes</p>
                  </div>
                  <div>
                    <p class="text-2xl font-bold text-gray-900">
                      {{ userStats.aprobaciones }}
                    </p>
                    <p class="text-sm text-gray-600">Aprobaciones</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actividad reciente -->
          <div class="bg-white rounded-lg shadow p-6 mt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              Actividad Reciente
            </h3>
            
            <!-- Sin actividad -->
            <div v-if="recentActivity.length === 0" class="text-center py-8">
              <p class="text-gray-500 text-sm">No hay actividad reciente</p>
            </div>

            <!-- Lista de actividades -->
            <div v-else class="space-y-3">
              <div
                v-for="activity in recentActivity"
                :key="activity.id"
                class="flex items-start"
              >
                <div class="flex-shrink-0">
                  <div
                    class="h-8 w-8 rounded-full flex items-center justify-center"
                    :class="getActivityIconClass(activity.type)"
                  >
                    <svg
                      class="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        v-if="activity.type === 'solicitud'"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-3-3v6m-9 1V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      />
                      <path
                        v-else-if="activity.type === 'aprobacion'"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                      <path
                        v-else
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </div>
                </div>
                <div class="ml-3 flex-1">
                  <p class="text-sm font-medium text-gray-900">
                    {{ activity.title }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ activity.description }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ formatRelativeTime(activity.date) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Formulario de edición -->
        <div class="lg:col-span-2">
          <form @submit.prevent="saveProfile" class="space-y-6">
            <!-- Información personal -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Información Personal
              </h3>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Nombre</label
                  >
                  <input
                    v-model="userProfile.firstName"
                    type="text"
                    class="input-field"
                    :disabled="!editMode"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Apellido</label
                  >
                  <input
                    v-model="userProfile.lastName"
                    type="text"
                    class="input-field"
                    :disabled="!editMode"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Email</label
                  >
                  <input
                    v-model="userProfile.email"
                    type="email"
                    class="input-field"
                    :disabled="!editMode"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Teléfono</label
                  >
                  <input
                    v-model="userProfile.phone"
                    type="tel"
                    class="input-field"
                    :disabled="!editMode"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Cargo</label
                  >
                  <input
                    v-model="userProfile.position"
                    type="text"
                    class="input-field"
                    :disabled="!editMode"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Departamento</label
                  >
                  <select
                    v-model="userProfile.department"
                    class="input-field"
                    :disabled="!editMode"
                  >
                    <option value="Producción">Producción</option>
                    <option value="Calidad">Calidad</option>
                    <option value="Logística">Logística</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Administración">Administración</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Configuración de notificaciones -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Configuración de Notificaciones
              </h3>

              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">
                      Alertas de stock bajo
                    </h4>
                    <p class="text-sm text-gray-500">
                      Recibir notificaciones cuando productos tengan stock
                      crítico
                    </p>
                  </div>
                  <input
                    v-model="notifications.stockAlerts"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 rounded border-gray-300"
                    :disabled="!editMode"
                  />
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">
                      Solicitudes pendientes
                    </h4>
                    <p class="text-sm text-gray-500">
                      Notificaciones sobre solicitudes que requieren aprobación
                    </p>
                  </div>
                  <input
                    v-model="notifications.pendingRequests"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 rounded border-gray-300"
                    :disabled="!editMode"
                  />
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">
                      Reportes semanales
                    </h4>
                    <p class="text-sm text-gray-500">
                      Recibir resumen semanal de KPIs y métricas
                    </p>
                  </div>
                  <input
                    v-model="notifications.weeklyReports"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 rounded border-gray-300"
                    :disabled="!editMode"
                  />
                </div>
              </div>
            </div>

            <!-- Cambio de contraseña -->
            <div class="bg-white rounded-lg shadow p-6" v-if="editMode">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                Cambiar Contraseña
              </h3>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Contraseña actual</label
                  >
                  <input
                    v-model="passwordForm.current"
                    type="password"
                    class="input-field"
                    placeholder="Ingresa tu contraseña actual"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Nueva contraseña</label
                  >
                  <input
                    v-model="passwordForm.new"
                    type="password"
                    class="input-field"
                    placeholder="Ingresa tu nueva contraseña"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Confirmar contraseña</label
                  >
                  <input
                    v-model="passwordForm.confirm"
                    type="password"
                    class="input-field"
                    placeholder="Confirma tu nueva contraseña"
                  />
                </div>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="flex justify-end space-x-3">
              <button
                v-if="!editMode"
                @click="toggleEditMode"
                type="button"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Editar Perfil
              </button>

              <template v-if="editMode">
                <button
                  @click="cancelEdit"
                  type="button"
                  class="btn btn-secondary"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="saving"
                >
                  <svg
                    v-if="saving"
                    class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {{ saving ? "Guardando..." : "Guardar Cambios" }}
                </button>
              </template>
            </div>
          </form>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import AppLayout from "../components/AppLayout.vue";
import axios from "axios";

const authStore = useAuthStore();

// Estado reactivo
const editMode = ref(false);
const saving = ref(false);
const loading = ref(true);
const loadError = ref(false);

// Perfil del usuario
const userProfile = reactive({
  id: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  position: "",
  department: "",
  role: "",
  isActive: true,
});

// Copia original para cancelar cambios
let originalProfile = { ...userProfile };

// Configuración de notificaciones
const notifications = reactive({
  stockAlerts: true,
  pendingRequests: true,
  weeklyReports: false,
});

// Formulario de cambio de contraseña
const passwordForm = reactive({
  current: "",
  new: "",
  confirm: "",
});

// Estadísticas del usuario
const userStats = ref({
  solicitudes: 0,
  aprobaciones: 0,
});

// Actividad reciente
const recentActivity = ref<any[]>([]);

// Métodos
const loadProfile = async () => {
  try {
    loading.value = true;
    loadError.value = false;

    // Cargar perfil
    const profileResponse = await axios.get("/usuarios/perfil");
    if (profileResponse.data.success) {
      const data = profileResponse.data.data;
      Object.assign(userProfile, {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || "",
        position: data.position || "",
        department: data.department || "",
        role: data.role.description || data.role.name,
        isActive: data.isActive,
      });

      userStats.value = data.stats;

      // Guardar copia original
      originalProfile = { ...userProfile };
    }

    // Cargar actividad reciente
    const activityResponse = await axios.get("/usuarios/perfil/actividad", {
      params: { limit: 10 },
    });
    if (activityResponse.data.success) {
      recentActivity.value = activityResponse.data.data.map((item: any) => ({
        ...item,
        date: new Date(item.date),
      }));
    }
  } catch (error: any) {
    console.error("Error cargando perfil:", error);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
};

const toggleEditMode = () => {
  editMode.value = true;
};

const cancelEdit = () => {
  // Restaurar valores originales
  Object.assign(userProfile, originalProfile);

  // Limpiar formulario de contraseña
  passwordForm.current = "";
  passwordForm.new = "";
  passwordForm.confirm = "";

  editMode.value = false;
};

const saveProfile = async () => {
  saving.value = true;

  try {
    // Validar cambio de contraseña si se proporcionó
    if (passwordForm.current || passwordForm.new || passwordForm.confirm) {
      if (!passwordForm.current) {
        alert("Debes ingresar tu contraseña actual");
        saving.value = false;
        return;
      }

      if (passwordForm.new !== passwordForm.confirm) {
        alert("Las contraseñas nuevas no coinciden");
        saving.value = false;
        return;
      }

      if (passwordForm.new.length < 6) {
        alert("La nueva contraseña debe tener al menos 6 caracteres");
        saving.value = false;
        return;
      }

      // Cambiar contraseña
      const passwordResponse = await axios.put("/usuarios/perfil/password", {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new,
      });

      if (!passwordResponse.data.success) {
        alert(passwordResponse.data.error || "Error al cambiar contraseña");
        saving.value = false;
        return;
      }
    }

    // Actualizar perfil
    const profileResponse = await axios.put("/usuarios/perfil", {
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      phone: userProfile.phone || null,
      position: userProfile.position || null,
      department: userProfile.department || null,
    });

    if (profileResponse.data.success) {
      // Actualizar copia original
      originalProfile = { ...userProfile };

      // Limpiar formulario de contraseña
      passwordForm.current = "";
      passwordForm.new = "";
      passwordForm.confirm = "";

      editMode.value = false;

      alert("Perfil actualizado correctamente");

      // Recargar perfil para obtener datos actualizados
      await loadProfile();
    } else {
      alert(profileResponse.data.error || "Error al actualizar perfil");
    }
  } catch (error: any) {
    console.error("Error guardando perfil:", error);
    
    if (error.response?.data?.error) {
      alert(error.response.data.error);
    } else {
      alert("Error al guardar el perfil");
    }
  } finally {
    saving.value = false;
  }
};

const getInitials = (firstName: string, lastName: string) => {
  if (!firstName || !lastName) return "??";
  return `${firstName.charAt(0)}${lastName.charAt(0)}`;
};

const getActivityIconClass = (type: string) => {
  const classes = {
    solicitud: "bg-blue-100 text-blue-600",
    aprobacion: "bg-green-100 text-green-600",
    inventario: "bg-purple-100 text-purple-600",
  };
  return classes[type as keyof typeof classes] || classes.inventario;
};

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
  return `Hace ${Math.ceil(diffDays / 30)} meses`;
};

onMounted(() => {
  loadProfile();
});
</script>
