<template>
  <div class="fixed bottom-0 right-0 z-50 p-4 space-y-4 pointer-events-none">
    <Toast
      v-for="toast in toasts"
      :key="toast.id"
      :type="toast.type"
      :title="toast.title"
      :message="toast.message"
      :duration="toast.duration"
      :persistent="toast.persistent"
      @close="removeToast(toast.id)"
      class="pointer-events-auto"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Toast from './Toast.vue'
import { useToastStore } from '../stores/toast'

const toastStore = useToastStore()

const toasts = computed(() => toastStore.toasts)

const removeToast = (id: string) => {
  toastStore.removeToast(id)
}
</script>
