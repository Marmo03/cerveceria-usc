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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ usuarios.length }}
            </p>
            <p class="text-gray-600">Total Usuarios</p>
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
              {{ usuariosActivos.length }}
            </p>
            <p class="text-gray-600">Activos</p>
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ contadorPorRol.ADMIN || 0 }}
            </p>
            <p class="text-gray-600">Admins</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-orange-100 text-orange-600">
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
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ contadorPorRol.OPERARIO || 0 }}
            </p>
            <p class="text-gray-600">Operarios</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-indigo-100 text-indigo-600">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
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
      <div class="bg-white rounded-lg shadow mb-6 p-6">
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
      <div class="bg-white rounded-lg shadow overflow-hidden">
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
                <th class="table-header">Usuario</th>
                <th class="table-header">Email</th>
                <th class="table-header">Rol</th>
                <th class="table-header">Estado</th>
                <th class="table-header">Fecha Registro</th>
                <th class="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="usuario in usuariosFiltrados"
                :key="usuario.id"
                class="hover:bg-gray-50"
              >
                <td class="table-cell">
                  <div class="flex items-center">
                    <div
                      class="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3"
                    >
                      <span class="text-white font-semibold">
                        {{ getInitials(usuario.firstName, usuario.lastName) }}
                      </span>
                    </div>
                    <div>
                      <div class="font-medium text-gray-900">
                        {{ usuario.firstName }} {{ usuario.lastName }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="table-cell text-gray-600">
                  {{ usuario.email }}
                </td>
                <td class="table-cell">
                  <span
                    class="badge"
                    :class="getRoleBadgeClass(usuario.role.name)"
                  >
                    {{ getRoleLabel(usuario.role.name) }}
                  </span>
                </td>
                <td class="table-cell">
                  <span
                    class="badge"
                    :class="usuario.isActive ? 'badge-success' : 'badge-error'"
                  >
                    {{ usuario.isActive ? "Activo" : "Inactivo" }}
                  </span>
                </td>
                <td class="table-cell text-gray-600">
                  {{ formatDate(new Date(usuario.createdAt)) }}
                </td>
                <td class="table-cell">
                  <div class="flex items-center space-x-2">
                    <button
                      @click="editarUsuario(usuario)"
                      class="btn-icon btn-icon-primary"
                      title="Editar usuario"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      @click="cambiarRol(usuario)"
                      class="btn-icon btn-icon-secondary"
                      title="Cambiar rol"
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
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </button>
                    <button
                      @click="cambiarContrasena(usuario)"
                      class="btn-icon btn-icon-warning"
                      title="Cambiar contraseña"
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
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="usuario.isActive"
                      @click="confirmarDesactivar(usuario)"
                      class="btn-icon btn-icon-danger"
                      title="Desactivar usuario"
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
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                      </svg>
                    </button>
                    <button
                      v-else
                      @click="activarUsuarioBtn(usuario)"
                      class="btn-icon btn-icon-success"
                      title="Activar usuario"
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
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

// Eliminar roles duplicados basados en el nombre del rol
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

const cambiarContrasena = async (usuario: Usuario) => {
  const nuevaContrasena = prompt(
    `Ingrese la nueva contraseña para ${usuario.firstName} ${usuario.lastName}:\n\n(Mínimo 6 caracteres)`
  );

  if (!nuevaContrasena) {
    return; // Usuario canceló
  }

  if (nuevaContrasena.length < 6) {
    toastStore.error('Contraseña inválida', 'La contraseña debe tener al menos 6 caracteres');
    return;
  }

  if (
    !confirm(
      `¿Confirmar cambio de contraseña para ${usuario.firstName} ${usuario.lastName}?`
    )
  ) {
    return;
  }

  try {
    await usuariosStore.cambiarContrasena(usuario.id, nuevaContrasena);
    toastStore.success('Contraseña actualizada', `Contraseña de ${usuario.firstName} ${usuario.lastName} actualizada exitosamente`);
  } catch (error: any) {
    toastStore.error('Error al cambiar contraseña', error.message || 'Error desconocido');
  }
};

const confirmarDesactivar = async (usuario: Usuario) => {
  if (
    confirm(
      `¿Está seguro de desactivar al usuario ${usuario.firstName} ${usuario.lastName}? Esta acción puede revertirse.`
    )
  ) {
    try {
      await usuariosStore.desactivarUsuario(usuario.id);
      toastStore.success('Usuario desactivado', 'El usuario ha sido desactivado exitosamente');
    } catch (error) {
      toastStore.error('Error al desactivar usuario');
    }
  }
};

const activarUsuarioBtn = async (usuario: Usuario) => {
  try {
    await usuariosStore.activarUsuario(usuario.id);
    toastStore.success('Usuario activado', 'El usuario ha sido activado exitosamente');
  } catch (error) {
    toastStore.error('Error al activar usuario');
  }
};

const onUsuarioCreado = () => {
  mostrarModalCrear.value = false;
};

const onUsuarioActualizado = () => {
  mostrarModalEditar.value = false;
  usuarioSeleccionado.value = null;
};

const onRolCambiado = async () => {
  console.log('✅ Rol cambiado, recargando usuarios...');
  await usuariosStore.init();
  console.log('✅ Usuarios recargados, cerrando modal');
  mostrarModalRol.value = false;
  usuarioSeleccionado.value = null;
};

// Lifecycle
onMounted(async () => {
  // Verificar que el usuario sea ADMIN
  if (!authStore.hasRole("ADMIN")) {
    alert("No tienes permisos para acceder a esta página");
    window.location.href = "/dashboard";
    return;
  }

  await usuariosStore.init();
});
</script>

<style scoped>
/* Estilos específicos para la página de gestión de usuarios */
</style>
