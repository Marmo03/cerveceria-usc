<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <div
      class="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col"
      :class="{ '-translate-x-full': !sidebarOpen }"
    >
      <!-- Logo -->
      <div class="flex items-center h-16 px-4 bg-blue-600">
        <div class="flex items-center w-full">
          <img 
            src="/logo-cerveria.jpg" 
            alt="Cervecería USACA Logo" 
            class="h-10 w-10 object-contain mr-3 flex-shrink-0 bg-white rounded-lg p-0.5"
          />
          <div class="flex flex-col min-w-0">
            <span class="text-lg font-bold text-white truncate"
              >Cervecería USC</span
            >
            <span class="text-xs text-blue-100 truncate"
              >Cadena de Suministro</span
            >
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="mt-8">
        <div class="px-3">
          <ul class="space-y-1">
            <!-- Dashboard -->
            <li>
              <router-link
                to="/dashboard"
                class="nav-link"
                active-class="nav-link-active"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 5a2 2 0 012-2h2a2 2 0 012 2v2H8V5z"
                  />
                </svg>
                Dashboard
              </router-link>
            </li>

            <!-- Productos -->
            <li v-if="authStore.hasAnyRole(['ADMIN', 'OPERARIO', 'ANALISTA'])">
              <router-link
                to="/productos"
                class="nav-link"
                active-class="nav-link-active"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Productos
              </router-link>
            </li>

            <!-- Inventario -->
            <li v-if="authStore.hasAnyRole(['ADMIN', 'OPERARIO'])">
              <router-link
                to="/inventario"
                class="nav-link"
                active-class="nav-link-active"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                Inventario
              </router-link>
            </li>

            <!-- Solicitudes -->
            <li v-if="authStore.hasAnyRole(['ADMIN', 'OPERARIO', 'APROBADOR'])">
              <router-link
                to="/solicitudes"
                class="nav-link"
                active-class="nav-link-active"
              >
                <svg
                  class="h-5 w-5"
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
                Solicitudes
                <span
                  v-if="pendingRequests > 0"
                  class="ml-auto badge badge-warning"
                >
                  {{ pendingRequests }}
                </span>
              </router-link>
            </li>

            <!-- Gestión de Usuarios (solo ADMIN) -->
            <li v-if="authStore.hasRole('ADMIN')">
              <router-link
                to="/usuarios"
                class="nav-link"
                active-class="nav-link-active"
              >
                <svg
                  class="h-5 w-5"
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
                Gestión de Usuarios
              </router-link>
            </li>

            <!-- Logística -->
            <li v-if="authStore.hasAnyRole(['ADMIN', 'OPERARIO', 'ANALISTA'])">
              <router-link
                to="/logistica"
                class="nav-link"
                active-class="nav-link-active"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                  />
                </svg>
                Logística
              </router-link>
            </li>

            <!-- KPIs -->
            <li v-if="authStore.hasAnyRole(['ADMIN', 'ANALISTA'])">
              <router-link
                to="/kpis"
                class="nav-link"
                active-class="nav-link-active"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                KPIs y Reportes
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Sección inferior del menú -->
        <div class="mt-8 pt-8 border-t border-gray-200 px-3">
          <ul class="space-y-1">
            <li>
              <router-link
                to="/perfil"
                class="nav-link"
                active-class="nav-link-active"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Perfil
              </router-link>
            </li>
          </ul>
        </div>
      </nav>
    </div>

    <!-- Overlay para móviles -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
      @click="sidebarOpen = false"
    ></div>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top bar -->
      <header class="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div class="px-4 sm:px-6 lg:px-8 max-w-full">
          <div class="flex items-center justify-between h-16 min-w-0">
            <!-- Menu button para móviles -->
            <button
              @click="sidebarOpen = !sidebarOpen"
              class="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg
                class="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <!-- Breadcrumb -->
            <nav class="hidden lg:flex flex-1 min-w-0">
              <ol class="flex items-center space-x-2 min-w-0">
                <li class="flex-shrink-0">
                  <router-link
                    to="/dashboard"
                    class="text-gray-400 hover:text-gray-500 text-sm"
                  >
                    Dashboard
                  </router-link>
                </li>
                <li
                  v-if="$route.name !== 'Dashboard'"
                  class="flex items-center min-w-0"
                >
                  <svg
                    class="flex-shrink-0 h-4 w-4 text-gray-300 mx-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span class="text-gray-500 text-sm truncate">{{
                    $route.name
                  }}</span>
                </li>
              </ol>
            </nav>

            <!-- User menu -->
            <div class="flex items-center space-x-2 flex-shrink-0">
              <!-- Notificaciones -->
              <button
                class="p-2 text-gray-400 hover:text-gray-500 hidden sm:block"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 17h5l-5-5v5zM4 3h12l-7 7-5-7z"
                  />
                </svg>
              </button>

              <!-- User dropdown -->
              <div class="relative">
                <button
                  @click="userMenuOpen = !userMenuOpen"
                  class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
                >
                  <div
                    class="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <span class="text-white font-medium text-xs">
                      {{ authStore.user?.firstName?.charAt(0) || ""
                      }}{{ authStore.user?.lastName?.charAt(0) || "" }}
                    </span>
                  </div>
                  <span
                    class="ml-2 text-gray-700 font-medium hidden md:block truncate max-w-24"
                  >
                    {{ authStore.fullName }}
                  </span>
                  <svg
                    class="ml-1 h-4 w-4 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <!-- Dropdown menu -->
                <div
                  v-if="userMenuOpen"
                  class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                  @click.away="userMenuOpen = false"
                >
                  <div class="px-4 py-2 text-sm text-gray-700 border-b">
                    <p class="font-medium">{{ authStore.fullName }}</p>
                    <p class="text-gray-500">{{ authStore.user?.roleName }}</p>
                  </div>
                  <router-link
                    to="/perfil"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="userMenuOpen = false"
                  >
                    Mi Perfil
                  </router-link>
                  <button
                    @click="handleLogout"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-hidden">
        <div
          class="h-full overflow-y-auto px-4 py-4 sm:px-6 lg:px-8 page-container container-responsive"
        >
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import axios from "axios";

const authStore = useAuthStore();
const router = useRouter();

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const sidebarOpen = ref(false);
const userMenuOpen = ref(false);
const pendingRequests = ref(0);

// Solo cargar solicitudes pendientes si el usuario tiene el rol adecuado
const shouldLoadRequests = computed(() =>
  authStore.hasAnyRole(["ADMIN", "OPERARIO", "APROBADOR"])
);

const loadPendingRequests = async () => {
  if (!shouldLoadRequests.value) return;

  try {
    const response = await axios.get(`${API_URL}/solicitudes`, {
      params: { estado: "EN_APROBACION" },
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    pendingRequests.value = response.data.solicitudes?.length || 0;
  } catch (error) {
    console.error("Error al cargar solicitudes pendientes:", error);
    pendingRequests.value = 0;
  }
};

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};

onMounted(() => {
  loadPendingRequests();
  // Recargar cada 5 minutos
  setInterval(loadPendingRequests, 300000);
});
</script>

<style scoped>
.nav-link {
  @apply flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200;
}

.nav-link-active {
  @apply bg-blue-100 text-blue-700;
}

.nav-link svg {
  @apply mr-3 flex-shrink-0;
}
</style>
