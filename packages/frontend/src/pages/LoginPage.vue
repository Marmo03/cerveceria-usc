<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100"
  >
    <div class="max-w-md w-full space-y-8 p-8">
      <!-- Logo y título -->
      <div class="text-center">
        <div
          class="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4"
        >
          <svg
            class="h-10 w-10 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
            />
          </svg>
        </div>
        <h2 class="text-3xl font-bold text-gray-900">Cervecería USC</h2>
        <p class="mt-2 text-sm text-gray-600">
          Sistema de Gestión de Inventario
        </p>
      </div>

      <!-- Formulario de login -->
      <div class="bg-white rounded-xl shadow-lg p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Correo Electrónico
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="input-field"
              placeholder="usuario@cerveceria-usc.edu.co"
              :disabled="authStore.isLoading"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Contraseña
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="input-field"
              placeholder="••••••••"
              :disabled="authStore.isLoading"
            />
          </div>

          <!-- Error message -->
          <div v-if="authStore.error" class="alert-error">
            {{ authStore.error }}
          </div>

          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full btn-primary flex items-center justify-center"
          >
            <svg
              v-if="authStore.isLoading"
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {{ authStore.isLoading ? "Iniciando sesión..." : "Iniciar Sesión" }}
          </button>
        </form>

        <!-- Credenciales de prueba -->
        <div class="mt-8 pt-6 border-t border-gray-200">
          <h3 class="text-sm font-medium text-gray-700 mb-3">
            Usuarios de Prueba:
          </h3>
          <div class="space-y-2 text-xs">
            <div
              class="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <span class="font-medium">Admin:</span>
              <button
                @click="
                  fillCredentials('admin@cerveceria-usc.edu.co', '123456')
                "
                class="text-blue-600 hover:text-blue-800"
              >
                admin@cerveceria-usc.edu.co
              </button>
            </div>
            <div
              class="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <span class="font-medium">Operario:</span>
              <button
                @click="
                  fillCredentials(
                    'operario@cerveceria-usc.edu.co',
                    '123456'
                  )
                "
                class="text-blue-600 hover:text-blue-800"
              >
                operario@cerveceria-usc.edu.co
              </button>
            </div>
            <div
              class="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <span class="font-medium">Aprobador:</span>
              <button
                @click="
                  fillCredentials(
                    'aprobador@cerveceria-usc.edu.co',
                    '123456'
                  )
                "
                class="text-blue-600 hover:text-blue-800"
              >
                aprobador@cerveceria-usc.edu.co
              </button>
            </div>
            <div
              class="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <span class="font-medium">Analista:</span>
              <button
                @click="
                  fillCredentials(
                    'analista@cerveceria-usc.edu.co',
                    '123456'
                  )
                "
                class="text-blue-600 hover:text-blue-800"
              >
                analista@cerveceria-usc.edu.co
              </button>
            </div>
            <p class="text-center text-gray-500 mt-2">
              Contraseña: password123
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  email: "",
  password: "",
});

const handleLogin = async () => {
  try {
    await authStore.login(form.value);
    router.push("/dashboard");
  } catch (error) {
    // Error ya manejado en el store
  }
};

const fillCredentials = (email: string, password: string) => {
  form.value.email = email;
  form.value.password = password;
};

onMounted(() => {
  // Limpiar errores previos
  authStore.error = null;
});
</script>
