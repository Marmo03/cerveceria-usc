<template>
  <div class="animate-pulse">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th
            v-for="i in columns"
            :key="i"
            class="px-6 py-3 text-left"
          >
            <div class="h-4 bg-gray-300 rounded w-3/4"></div>
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="i in rows" :key="i">
          <td
            v-for="j in columns"
            :key="j"
            class="px-6 py-4 whitespace-nowrap"
          >
            <div class="h-4 bg-gray-200 rounded" :class="getWidth(j)"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface Props {
  rows?: number
  columns?: number
}

const props = withDefaults(defineProps<Props>(), {
  rows: 5,
  columns: 6
})

const getWidth = (index: number) => {
  const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-2/3', 'w-1/2']
  return widths[index % widths.length]
}
</script>
