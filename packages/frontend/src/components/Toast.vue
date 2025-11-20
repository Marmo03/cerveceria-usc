<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="visible"
      :class="[
        'fixed bottom-4 right-4 z-50 max-w-sm w-full shadow-lg rounded-lg pointer-events-auto overflow-hidden',
        typeClasses[type]
      ]"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <!-- Success Icon -->
            <svg
              v-if="type === 'success'"
              class="h-6 w-6 text-green-400"
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
            <!-- Error Icon -->
            <svg
              v-else-if="type === 'error'"
              class="h-6 w-6 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <!-- Warning Icon -->
            <svg
              v-else-if="type === 'warning'"
              class="h-6 w-6 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <!-- Info Icon -->
            <svg
              v-else
              class="h-6 w-6 text-blue-400"
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
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">{{ title }}</p>
            <p v-if="message" class="mt-1 text-sm text-gray-500">{{ message }}</p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              @click="close"
              class="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span class="sr-only">Cerrar</span>
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <!-- Progress bar -->
      <div
        v-if="!persistent"
        class="h-1 bg-gray-200"
      >
        <div
          :class="[
            'h-full transition-all ease-linear',
            progressBarClasses[type]
          ]"
          :style="{ width: progressWidth + '%' }"
        ></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Props {
  type?: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  duration: 4000,
  persistent: false
})

const emit = defineEmits<{
  close: []
}>()

const visible = ref(true)
const progressWidth = ref(100)

const typeClasses = {
  success: 'bg-white border-l-4 border-green-500',
  error: 'bg-white border-l-4 border-red-500',
  warning: 'bg-white border-l-4 border-yellow-500',
  info: 'bg-white border-l-4 border-blue-500'
}

const progressBarClasses = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500'
}

let timeoutId: ReturnType<typeof setTimeout> | null = null
let intervalId: ReturnType<typeof setInterval> | null = null

const close = () => {
  visible.value = false
  if (timeoutId) clearTimeout(timeoutId)
  if (intervalId) clearInterval(intervalId)
  setTimeout(() => emit('close'), 300) // Wait for transition
}

onMounted(() => {
  if (!props.persistent && props.duration > 0) {
    // Progress bar animation
    const steps = 50
    const stepDuration = props.duration / steps
    let currentStep = 0

    intervalId = setInterval(() => {
      currentStep++
      progressWidth.value = 100 - (currentStep / steps) * 100
      
      if (currentStep >= steps) {
        if (intervalId) clearInterval(intervalId)
      }
    }, stepDuration)

    // Auto close
    timeoutId = setTimeout(() => {
      close()
    }, props.duration)
  }
})
</script>
