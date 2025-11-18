<template>
  <div
    v-if="modelValue && usuario"
    class="fixed inset-0 z-50 overflow-y-auto"
    role="dialog"
    aria-modal="true"
  >
    <div class="flex items-center justify-center min-h-screen px-4">
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75"
        @click="cerrar"
      ></div>

      <div class="relative bg-white rounded-lg max-w-md w-full shadow-xl">
        <form @submit.prevent="guardar">
          <div class="p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-2">
              Cambiar Rol de Usuario
            </h3>
            <p class="text-sm text-gray-600 mb-4">
              {{ usuario.firstName }} {{ usuario.lastName }} ({{
                usuario.email
              }})
            </p>

            <div
              v-if="error"
              class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm"
            >
              {{ error }}
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Seleccionar nuevo rol:</label
              >
              <label
                v-for="role in roles"
                :key="role.id"
                class="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                :class="
                  nuevoRol === role.name
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                "
              >
                <input
                  type="radio"
                  v-model="nuevoRol"
                  :value="role.name"
                  class="mt-1 mr-3"
                  required
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-900">
                    {{ getRoleLabel(role.name) }}
                  </div>
                  <div class="text-xs text-gray-600">
                    {{ role.description }}
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div class="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            <button
              type="button"
              @click="cerrar"
              :disabled="loading"
              class="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="loading || nuevoRol === usuario.role.name"
              class="btn btn-primary"
            >
              {{ loading ? "Actualizando..." : "Cambiar Rol" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useUsuariosStore, type Usuario, type Role } from "../stores/usuarios";

const props = defineProps<{
  modelValue: boolean;
  usuario: Usuario | null;
  roles: Role[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const usuariosStore = useUsuariosStore();
const loading = ref(false);
const error = ref("");
const nuevoRol = ref("");

watch(
  () => props.usuario,
  (newUsuario) => {
    if (newUsuario) {
      nuevoRol.value = newUsuario.role.name;
    }
  },
  { immediate: true }
);

const getRoleLabel = (roleName: string) => {
  const labels: Record<string, string> = {
    ADMIN: "Administrador",
    OPERARIO: "Operario",
    APROBADOR: "Aprobador",
    ANALISTA: "Analista",
  };
  return labels[roleName] || roleName;
};

const cerrar = () => {
  // Forzar reset de loading sin importar el estado
  loading.value = false;
  error.value = "";
  emit("update:modelValue", false);
};

const guardar = async () => {
  if (!props.usuario) return;

  if (nuevoRol.value === props.usuario.role.name) {
    error.value = "El usuario ya tiene este rol";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    await usuariosStore.actualizarRol(props.usuario.id, nuevoRol.value);
    emit("success");
    emit("update:modelValue", false); // Cerrar el modal

    // Mostrar alerta después de cerrar
    setTimeout(() => {
      alert(`Rol cambiado exitosamente a ${getRoleLabel(nuevoRol.value)}`);
    }, 100);
  } catch (err: any) {
    error.value = err.response?.data?.error || "Error al cambiar rol";
  } finally {
    loading.value = false;
  }
};
</script>
