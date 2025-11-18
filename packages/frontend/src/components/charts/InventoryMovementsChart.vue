<template>
  <div class="chart-container">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

interface Props {
  data: {
    labels: string[];
    entradas: number[];
    salidas: number[];
  };
}

const props = defineProps<Props>();

const chartData = computed(() => ({
  labels: props.data.labels,
  datasets: [
    {
      label: 'Entradas',
      backgroundColor: '#10b981',
      data: props.data.entradas,
      borderRadius: 4,
    },
    {
      label: 'Salidas',
      backgroundColor: '#ef4444',
      data: props.data.salidas,
      borderRadius: 4,
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
    },
  },
}));
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 100%;
  width: 100%;
}
</style>
