<template>
  <div class="min-h-screen flex items-center bg-gray-50">
    
     <div class="w-full md:w-2/5 lg:w-1/3 flex flex-col justify-center px-10 py-8 bg-white shadow-md rounded-r-lg">
     
      <div class="flex items-center mb-8 -mt-6">
        <div class="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mr-3 shadow-sm">
          <svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
        </div>
        <div>
          <div class="font-semibold text-lg leading-tight">Cervecería USC</div>
          <div class="text-sm text-gray-400">Sistema de Gestión de Inventario</div>
        </div>
      </div>

     
      <div class="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
        <form class="space-y-4" @submit.prevent="handleLogin">
          <div>
            <label for="email" class="block text-xs font-medium text-gray-500 mb-1">
              Correo Electrónico
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="usuario@cerveceria-usc.edu.co"
              :disabled="authStore.isLoading"
            />
          </div>

          <div>
            <label for="password" class="block text-xs font-medium text-gray-500 mb-1">
              Contraseña
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                type="password"
                required
                class="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="••••••••"
                :disabled="authStore.isLoading"
              />
             
            </div>
          </div>

          <div v-if="authStore.error" class="text-sm text-red-600 pt-1">
            {{ authStore.error }}
          </div>

          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-semibold hover:bg-blue-700 transition-shadow flex items-center justify-center"
          >
            <svg
              v-if="authStore.isLoading"
              class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {{ authStore.isLoading ? "Iniciando sesión..." : "Iniciar Sesión" }}
          </button>
        </form>

        <!-- Credenciales de prueba -->
        <div class="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-600">
          <h3 class="text-sm font-medium text-gray-700 mb-3">Usuarios de Prueba:</h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="font-medium">Admin:</span>
              <button class="text-blue-600 hover:text-blue-800 text-xs" @click="fillCredentials('admin@cerveceria-usc.edu.co', '123456')">
                admin@cerveceria-usc.edu.co
              </button>
            </div>
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="font-medium">Operario:</span>
              <button class="text-blue-600 hover:text-blue-800 text-xs" @click="fillCredentials('operario@cerveceria-usc.edu.co', '123456')">
                operario@cerveceria-usc.edu.co
              </button>
            </div>
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="font-medium">Aprobador:</span>
              <button class="text-blue-600 hover:text-blue-800 text-xs" @click="fillCredentials('aprobador@cerveceria-usc.edu.co', '123456')">
                aprobador@cerveceria-usc.edu.co
              </button>
            </div>
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="font-medium">Analista:</span>
              <button class="text-blue-600 hover:text-blue-800 text-xs" @click="fillCredentials('analista@cerveceria-usc.edu.co', '123456')">
                analista@cerveceria-usc.edu.co
              </button>
            </div>
            <p class="text-center text-gray-400 mt-3">Contraseña: password123</p>
          </div>
        </div>
      </div>
    </div>

    
    <div class="hidden md:block flex-1 h-screen">
      <img src="/Cervecera-Usaca.jpg" alt="Cerveceria" class="object-cover w-full h-full" />
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
  
  }
};

const fillCredentials = (email: string, password: string) => {
  form.value.email = email;
  form.value.password = password;
};

onMounted(() => {
  
  authStore.error = null;
});
</script>

<style scoped>

@media (min-width: 768px) {
  
  input[type="email"],
  input[type="password"] {
    padding-top: 0.45rem;
    padding-bottom: 0.45rem;
  }
}

div.bg-white.rounded-lg {
  box-shadow: 0 6px 20px rgba(16, 24, 40, 0.06);
}
</style>  