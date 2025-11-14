<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              Gestión de Usuarios y Roles
            </h1>
            <p class="mt-2 text-gray-600">
              Administra usuarios del sistema y asigna roles y permisos
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
              Volver
            </button>
            <button @click="mostrarModalCrear = true" class="btn btn-primary">
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Nuevo Usuario
            </button>
          </div>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <div class="stat-card border-4 border-blue-400 rounded-lg bg-white shadow-lg">
          <div class="stat-icon bg-blue-100 text-blue-600">
            <svg><!-- ... --></svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ usuarios.length }}
            </p>
            <p class="text-gray-600">Total Usuarios</p>
          </div>
        </div>
        <div class="stat-card border-4 border-green-400 rounded-lg bg-white shadow-lg">
          <div class="stat-icon bg-green-100 text-green-600">
            <svg><!-- ... --></svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ usuariosActivos.length }}
            </p>
            <p class="text-gray-600">Activos</p>
          </div>
        </div>
        <div class="stat-card border-4 border-purple-400 rounded-lg bg-white shadow-lg">
          <div class="stat-icon bg-purple-100 text-purple-600">
            <svg><!-- ... --></svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ contadorPorRol.ADMIN || 0 }}
            </p>
            <p class="text-gray-600">Admins</p>
          </div>
        </div>
        <div class="stat-card border-4 border-orange-400 rounded-lg bg-white shadow-lg">
          <div class="stat-icon bg-orange-100 text-orange-600">
            <svg><!-- ... --></svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ contadorPorRol.OPERARIO || 0 }}
            </p>
            <p class="text-gray-600">Operarios</p>
          </div>
        </div>
        <div class="stat-card border-4 border-indigo-400 rounded-lg bg-white shadow-lg">
          <div class="stat-icon bg-indigo-100 text-indigo-600">
            <svg><!-- ... --></svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ contadorPorRol.APROBADOR || 0 }}
            </p>
            <p class="text-gray-600">Aprobadores</p>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-lg shadow mb-6 p-6 border-4 border-blue-400">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Buscar por nombre o email</label
            >
            <input
              v-model="busqueda"
              type="text"
              placeholder="Buscar usuario..."
              class="input-field"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Filtrar por rol</label
            >
            <select v-model="filtroRol" class="input-field">
              <option value="">Todos los roles</option>
              <option value="ADMIN">Admin</option>
              <option value="OPERARIO">Operario</option>
              <option value="APROBADOR">Aprobador</option>
              <option value="ANALISTA">Analista</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Estado</label
            >
            <select v-model="filtroEstado" class="input-field">
              <option value="">Todos</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Tabla de usuarios -->
      <div class="bg-white rounded-lg shadow overflow-hidden border-4 border-gray-400">
        <div v-if="loading" class="p-8 text-center">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          ></div>
          <p class="mt-2 text-gray-600">Cargando usuarios...</p>
        </div>

        <div v-else-if="error" class="p-8 text-center text-red-600">
          {{ error }}
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header border-b-2 border-gray-400">Usuario</th>
                <th class="table-header border-b-2 border-gray-400">Email</th>
                <th class="table-header border-b-2 border-gray-400">Rol</th>
                <th class="table-header border-b-2 border-gray-400">Estado</th>
                <th class="table-header border-b-2 border-gray-400">Fecha Registro</th>
                <th class="table-header border-b-2 border-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="usuario in usuariosFiltrados"
                :key="usuario.id"
                class="hover:bg-gray-50"
              >
                <!-- ...contenido de cada usuario igual como lo tienes ahora... -->
              </tr>
            </tbody>
          </table>

          <div
            v-if="usuariosFiltrados.length === 0"
            class="p-8 text-center text-gray-500"
          >
            No se encontraron usuarios que coincidan con los filtros.
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Crear Usuario -->
    <ModalCrearUsuario
      v-model="mostrarModalCrear"
      :roles="roles"
      @success="onUsuarioCreado"
    />

    <!-- Modal Editar Usuario -->
    <ModalEditarUsuario
      v-model="mostrarModalEditar"
      :usuario="usuarioSeleccionado"
      @success="onUsuarioActualizado"
    />

    <!-- Modal Cambiar Rol -->
    <ModalCambiarRol
      v-model="mostrarModalRol"
      :usuario="usuarioSeleccionado"
      :roles="roles"
      @success="onRolCambiado"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import AppLayout from "../components/AppLayout.vue";
import ModalCrearUsuario from "../components/ModalCrearUsuario.vue";
import ModalEditarUsuario from "../components/ModalEditarUsuario.vue";
import ModalCambiarRol from "../components/ModalCambiarRol.vue";
import { useUsuariosStore } from "../stores/usuarios";
import { useAuthStore } from "../stores/auth";
import { Usuario } from "../stores/usuarios";

const usuariosStore = useUsuariosStore();
const authStore = useAuthStore();

// Estado
const busqueda = ref("");
const filtroRol = ref("");
const filtroEstado = ref("");
const mostrarModalCrear = ref(false);
const mostrarModalEditar = ref(false);
const mostrarModalRol = ref(false);
const usuarioSeleccionado = ref<Usuario | null>(null);

// Computed
const usuarios = computed(() => usuariosStore.usuarios);

const roles = computed(() => {
  const vistos = new Set<string>();
  return usuariosStore.roles.filter((role) => {
    if (vistos.has(role.name)) {
      return false;
    }
    vistos.add(role.name);
    return true;
  });
});

const loading = computed(() => usuariosStore.loading);
const error = computed(() => usuariosStore.error);
const usuariosActivos = computed(() => usuariosStore.usuariosActivos);
const contadorPorRol = computed(() => usuariosStore.contadorPorRol);

const usuariosFiltrados = computed(() => {
  let resultado = usuarios.value;

  // Filtro de búsqueda
  if (busqueda.value) {
    const termino = busqueda.value.toLowerCase();
    resultado = resultado.filter(
      (u) =>
        u.firstName.toLowerCase().includes(termino) ||
        u.lastName.toLowerCase().includes(termino) ||
        u.email.toLowerCase().includes(termino)
    );
  }

  // Filtro por rol
  if (filtroRol.value) {
    resultado = resultado.filter((u) => u.role.name === filtroRol.value);
  }

  // Filtro por estado
  if (filtroEstado.value === "activos") {
    resultado = resultado.filter((u) => u.isActive);
  } else if (filtroEstado.value === "inactivos") {
    resultado = resultado.filter((u) => !u.isActive);
  }

  return resultado;
});

// Métodos
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const getRoleBadgeClass = (roleName: string) => {
  const classes: Record<string, string> = {
    ADMIN: "badge-error",
    OPERARIO: "badge-warning",
    APROBADOR: "badge-success",
    ANALISTA: "badge-info",
  };
  return classes[roleName] || "badge-secondary";
};

const getRoleLabel = (roleName: string) => {
  const labels: Record<string, string> = {
    ADMIN: "Administrador",
    OPERARIO: "Operario",
    APROBADOR: "Aprobador",
    ANALISTA: "Analista",
  };
  return labels[roleName] || roleName;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const editarUsuario = (usuario: Usuario) => {
  usuarioSeleccionado.value = usuario;
  mostrarModalEditar.value = true;
};

const cambiarRol = (usuario: Usuario) => {
  usuarioSeleccionado.value = usuario;
  mostrarModalRol.value = true;
};

const confirmarDesactivar = async (usuario: Usuario) => {
  if (
    confirm(
      `¿Está seguro de desactivar al usuario ${usuario.firstName} ${usuario.lastName}? Esta acción puede revertirse.`
    )
  ) {
    try {
      await usuariosStore.desactivarUsuario(usuario.id);
      alert("Usuario desactivado exitosamente");
    } catch (error) {
      alert("Error al desactivar usuario");
    }
  }
};

const activarUsuarioBtn = async (usuario: Usuario) => {
  try {
    await usuariosStore.activarUsuario(usuario.id);
    alert("Usuario activado exitosamente");
  } catch (error) {
    alert("Error al activar usuario");
  }
};

const onUsuarioCreado = () => {
  mostrarModalCrear.value = false;
};

const onUsuarioActualizado = () => {
  mostrarModalEditar.value = false;
  usuarioSeleccionado.value = null;
};

const onRolCambiado = () => {
  mostrarModalRol.value = false;
  usuarioSeleccionado.value = null;
};

onMounted(async () => {
  if (!authStore.hasRole("ADMIN")) {
    alert("No tienes permisos para acceder a esta página");
    window.location.href = "/dashboard";
    return;
  }

  await usuariosStore.init();
});
</script>

<style scoped>
/* Puedes agregar estilos específicos aquí */
</style>