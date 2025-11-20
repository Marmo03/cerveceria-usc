<template>
  <div
    v-if="modelValue"
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
        class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        <form @submit.prevent="guardar">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-medium text-gray-900" id="modal-title">
                Crear Nuevo Usuario
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

            <!-- Banner informativo -->
            <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex">
                <svg
                  class="h-5 w-5 text-blue-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p class="text-xs text-blue-700">
                  El nuevo usuario recibirá una contraseña temporal que deberá
                  cambiar en su primer inicio de sesión.
                </p>
              </div>
            </div>

            <div
              v-if="error"
              class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
            >
              {{ error }}
            </div>

            <div class="space-y-4">
              <!-- Email -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Email *</label
                >
                <input
                  v-model="form.email"
                  type="email"
                  required
                  placeholder="usuario@cerveceria-usc.edu.co"
                  class="input-field"
                />
              </div>

              <!-- Nombre y Apellido -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Nombre *</label
                  >
                  <input
                    v-model="form.firstName"
                    type="text"
                    required
                    placeholder="Juan"
                    class="input-field"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Apellido *</label
                  >
                  <input
                    v-model="form.lastName"
                    type="text"
                    required
                    placeholder="Pérez"
                    class="input-field"
                  />
                </div>
              </div>

              <!-- Rol -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Rol *</label
                >
                <div class="space-y-2">
                  <label
                    v-for="role in roles"
                    :key="role.id"
                    class="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                    :class="
                      form.roleName === role.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    "
                  >
                    <input
                      type="radio"
                      v-model="form.roleName"
                      :value="role.name"
                      class="mt-1 mr-3"
                      required
                    />
                    <div class="flex-1">
                      <div class="font-medium text-gray-900">
                        {{ getRoleLabel(role.name) }}
                      </div>
                      <div class="text-sm text-gray-600">
                        {{ role.description }}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Contraseña opcional -->
              <div>
                <label class="flex items-center mb-2">
                  <input
                    type="checkbox"
                    v-model="usarPasswordPersonalizada"
                    class="mr-2"
                  />
                  <span class="text-sm font-medium text-gray-700"
                    >Establecer contraseña personalizada</span
                  >
                </label>

                <input
                  v-if="usarPasswordPersonalizada"
                  v-model="form.password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  minlength="6"
                  class="input-field"
                />
                <p v-else class="text-xs text-gray-500">
                  Se generará una contraseña temporal automáticamente
                </p>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              :disabled="loading"
              class="btn btn-primary w-full sm:w-auto sm:ml-3"
            >
              <span v-if="loading">
                <svg
                  class="animate-spin h-4 w-4 mr-2 inline-block"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
                Creando...
              </span>
              <span v-else>Crear Usuario</span>
            </button>
            <button
              type="button"
              @click="cerrar"
              :disabled="loading"
              class="btn btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { useUsuariosStore, type Role } from "../stores/usuarios";
import { useToastStore } from "../stores/toast";

const props = defineProps<{
  modelValue: boolean;
  roles: Role[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const usuariosStore = useUsuariosStore();
const toastStore = useToastStore();

const loading = ref(false);
const error = ref("");
const usarPasswordPersonalizada = ref(false);

const form = ref({
  email: "",
  firstName: "",
  lastName: "",
  roleName: "" as "ADMIN" | "OPERARIO" | "APROBADOR" | "ANALISTA" | "",
  password: "",
});

const getRoleLabel = (roleName: string) => {
  const labels: Record<string, string> = {
    ADMIN: "Administrador",
    OPERARIO: "Operario",
    APROBADOR: "Aprobador",
    ANALISTA: "Analista",
  };
  return labels[roleName] || roleName;
};

const resetForm = () => {
  form.value = {
    email: "",
    firstName: "",
    lastName: "",
    roleName: "",
    password: "",
  };
  usarPasswordPersonalizada.value = false;
  error.value = "";
};

const cerrar = () => {
  if (!loading.value) {
    emit("update:modelValue", false);
    setTimeout(resetForm, 300);
  }
};

const guardar = async () => {
  if (!form.value.roleName) {
    error.value = "Debes seleccionar un rol";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const data: any = {
      email: form.value.email,
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      roleName: form.value.roleName,
    };

    if (usarPasswordPersonalizada.value && form.value.password) {
      data.password = form.value.password;
    }

    const result = await usuariosStore.crearUsuario(data);

    // Mostrar la contraseña temporal si se generó una
    if (result.message && result.message.includes("contraseña temporal")) {
      toastStore.warning(
        'Usuario creado con contraseña temporal',
        result.message,
        8000
      );
    } else {
      toastStore.success(
        'Usuario creado exitosamente',
        `${data.firstName} ${data.lastName}`
      );
    }

    // Solo emitir success, el padre cerrará el modal
    emit("success");
  } catch (err: any) {
    error.value =
      err.response?.data?.error || err.message || "Error al crear el usuario";
  } finally {
    loading.value = false;
  }
};

// Watch para limpiar el password si se desactiva la opción
watch(usarPasswordPersonalizada, (newValue) => {
  if (!newValue) {
    form.value.password = "";
  }
});
</script>
