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
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              Editar Usuario
            </h3>

            <div
              v-if="error"
              class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm"
            >
              {{ error }}
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Email</label
                >
                <input
                  v-model="form.email"
                  type="email"
                  required
                  class="input-field"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Nombre</label
                  >
                  <input
                    v-model="form.firstName"
                    type="text"
                    required
                    class="input-field"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Apellido</label
                  >
                  <input
                    v-model="form.lastName"
                    type="text"
                    required
                    class="input-field"
                  />
                </div>
              </div>
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
            <button type="submit" :disabled="loading" class="btn btn-primary">
              {{ loading ? "Guardando..." : "Guardar" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useUsuariosStore, type Usuario } from "../stores/usuarios";

const props = defineProps<{
  modelValue: boolean;
  usuario: Usuario | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "success"): void;
}>();

const usuariosStore = useUsuariosStore();
const loading = ref(false);
const error = ref("");

const form = ref({
  email: "",
  firstName: "",
  lastName: "",
});

watch(
  () => props.usuario,
  (newUsuario) => {
    if (newUsuario) {
      form.value = {
        email: newUsuario.email,
        firstName: newUsuario.firstName,
        lastName: newUsuario.lastName,
      };
    }
  },
  { immediate: true }
);

const cerrar = () => {
  if (!loading.value) {
    emit("update:modelValue", false);
  }
};

const guardar = async () => {
  if (!props.usuario) return;

  loading.value = true;
  error.value = "";

  try {
    await usuariosStore.actualizarUsuario(props.usuario.id, form.value);
    alert("Usuario actualizado exitosamente");
    emit("success");
    cerrar(); // Cerrar el modal después del éxito
  } catch (err: any) {
    error.value = err.response?.data?.error || "Error al actualizar usuario";
  } finally {
    loading.value = false;
  }
};
</script>
