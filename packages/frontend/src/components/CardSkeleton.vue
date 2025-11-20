<template>
  <div class="animate-pulse">
    <div class="grid" :class="gridClass">
      <div
        v-for="i in count"
        :key="i"
        class="bg-white rounded-lg shadow p-6"
      >
        <!-- Icon placeholder -->
        <div class="flex items-center mb-4">
          <div class="h-12 w-12 bg-gray-300 rounded-full"></div>
          <div class="ml-4 flex-1">
            <div class="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <!-- Content placeholder -->
        <div class="space-y-3">
          <div class="h-3 bg-gray-200 rounded"></div>
          <div class="h-3 bg-gray-200 rounded w-5/6"></div>
          <div class="h-3 bg-gray-200 rounded w-4/5"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  count?: number
  columns?: 2 | 3 | 4
}

const props = withDefaults(defineProps<Props>(), {
  count: 4,
  columns: 4
})

const gridClass = computed(() => {
  const classes = {
    2: 'grid-cols-1 md:grid-cols-2 gap-6',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
  }
  return classes[props.columns]
})
</script>
