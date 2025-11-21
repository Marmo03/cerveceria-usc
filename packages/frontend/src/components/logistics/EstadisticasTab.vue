<template>
  <div class="space-y-6">
    <!-- Título y descripción -->
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        📊 Estadísticas de Recepción
      </h2>
      <p class="text-gray-600">
        Monitorea y analiza los pedidos que llegan a la empresa
      </p>
    </div>

    <!-- Tarjetas de resumen -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card hover-lift">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-blue-100 text-blue-600">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Pedidos Totales</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ stats.totalPedidos || logisticsStore.envios.length }}
            </p>
          </div>
        </div>
      </div>

      <div class="card hover-lift">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-green-100 text-green-600">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Recibidos</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ stats.pedidosRecibidos || pedidosPorEstado('ENTREGADO') }}
            </p>
          </div>
        </div>
      </div>

      <div class="card hover-lift">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">En Camino</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ stats.pedidosEnCamino || pedidosPorEstado('EN_TRANSITO') }}
            </p>
          </div>
        </div>
      </div>

      <div class="card hover-lift">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-purple-100 text-purple-600">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500">Pendientes</p>
            <p class="text-2xl font-bold text-gray-900">
              {{ stats.pedidosPendientes || pedidosPorEstado('PENDIENTE') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Distribución por estado -->
    <div class="card">
      <h3 class="text-lg font-semibold text-gray-900 mb-6">
        📦 Estado de los Pedidos
      </h3>
      <div class="space-y-4">
        <div v-for="(count, estado) in estadosDistribution" :key="estado">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <span :class="['w-3 h-3 rounded-full', getEstadoDotClass(estado)]"></span>
              <span class="text-sm font-medium text-gray-700">
                {{ getEstadoLabel(estado) }}
              </span>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-sm text-gray-500">{{ count }} pedidos</span>
              <span class="text-sm font-semibold text-gray-900">
                {{ getPercentage(count) }}%
              </span>
            </div>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div
              :class="['h-2.5 rounded-full transition-all duration-500', getEstadoBarClass(estado)]"
              :style="{ width: `${getPercentage(count)}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="Object.keys(estadosDistribution).length === 0" class="text-center py-8">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="mt-2 text-sm text-gray-500">No hay pedidos registrados aún</p>
      </div>
    </div>

    <!-- Pedidos recientes -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">
          🕒 Pedidos Recientes
        </h3>
        <span class="text-sm text-gray-500">
          Últimos {{ Math.min(5, logisticsStore.enviosRecientes.length) }} pedidos
        </span>
      </div>

      <div class="space-y-3">
        <div
          v-for="pedido in logisticsStore.enviosRecientes.slice(0, 5)"
          :key="pedido.id"
          class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-1">
              <p class="font-medium text-gray-900">{{ pedido.numeroGuia }}</p>
              <span :class="['px-2 py-1 text-xs font-medium rounded-full', getEstadoBadgeClass(pedido.estado)]">
                {{ getEstadoLabel(pedido.estado) }}
              </span>
            </div>
            <p class="text-sm text-gray-500">
              De: {{ pedido.origen || 'Proveedor' }}
            </p>
            <p v-if="pedido.fechaEnvio" class="text-xs text-gray-400 mt-1">
              {{ formatDate(pedido.fechaEnvio) }}
            </p>
          </div>
          <button
            @click="verDetalle(pedido.numeroGuia)"
            class="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
          >
            Ver detalle →
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="logisticsStore.enviosRecientes.length === 0" class="text-center py-8">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p class="mt-2 text-sm text-gray-500">No hay pedidos recientes para mostrar</p>
      </div>
    </div>

    <!-- Información adicional -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Tiempo promedio de entrega -->
      <div class="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
        <div class="flex items-start gap-4">
          <div class="p-3 bg-white rounded-lg">
            <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-blue-900">Tiempo Promedio de Entrega</p>
            <p class="text-3xl font-bold text-blue-700 mt-2">
              {{ stats.tiempoPromedioEntrega || calcularTiempoPromedio() }} días
            </p>
            <p class="text-xs text-blue-600 mt-1">Basado en pedidos entregados</p>
          </div>
        </div>
      </div>

      <!-- Tasa de recepción -->
      <div class="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
        <div class="flex items-start gap-4">
          <div class="p-3 bg-white rounded-lg">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-green-900">Tasa de Recepción Exitosa</p>
            <p class="text-3xl font-bold text-green-700 mt-2">
              {{ calcularTasaRecepcion() }}%
            </p>
            <p class="text-xs text-green-600 mt-1">Pedidos recibidos vs. totales</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLogisticsStore } from '../../stores/logistics'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'vue-router'

const logisticsStore = useLogisticsStore()
const router = useRouter()

const stats = ref({
  totalPedidos: 0,
  pedidosRecibidos: 0,
  pedidosEnCamino: 0,
  pedidosPendientes: 0,
  tiempoPromedioEntrega: 0,
})

const estadosDistribution = computed(() => {
  const distribution: Record<string, number> = {}
  logisticsStore.envios.forEach((envio) => {
    distribution[envio.estado] = (distribution[envio.estado] || 0) + 1
  })
  return distribution
})

const pedidosPorEstado = (estado: string) => {
  return logisticsStore.envios.filter((e) => e.estado === estado).length
}

const getPercentage = (count: number) => {
  const total = logisticsStore.envios.length
  return total > 0 ? Math.round((count / total) * 100) : 0
}

const calcularTiempoPromedio = (): number => {
  const pedidosEntregados = logisticsStore.envios.filter(
    (e) => e.estado === 'ENTREGADO' && e.fechaEnvio && e.fechaEntregaReal
  )

  if (pedidosEntregados.length === 0) return 0

  const totalDias = pedidosEntregados.reduce((sum, pedido) => {
    const inicio = new Date(pedido.fechaEnvio!).getTime()
    const fin = new Date(pedido.fechaEntregaReal!).getTime()
    const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24))
    return sum + dias
  }, 0)

  return Math.round(totalDias / pedidosEntregados.length)
}

const calcularTasaRecepcion = (): number => {
  const total = logisticsStore.envios.length
  if (total === 0) return 100

  const recibidos = pedidosPorEstado('ENTREGADO')
  return Math.round((recibidos / total) * 100)
}

const getEstadoLabel = (estado: string) => {
  const labels: Record<string, string> = {
    PENDIENTE: 'Pendiente de envío',
    EN_PREPARACION: 'En preparación',
    EN_TRANSITO: 'En camino',
    EN_ADUANA: 'En aduana',
    EN_ENTREGA: 'En entrega',
    ENTREGADO: 'Recibido',
    CANCELADO: 'Cancelado',
    DEVUELTO: 'Devuelto',
  }
  return labels[estado] || estado
}

const getEstadoBadgeClass = (estado: string) => {
  const classes: Record<string, string> = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    EN_PREPARACION: 'bg-blue-100 text-blue-800',
    EN_TRANSITO: 'bg-blue-200 text-blue-900',
    EN_ADUANA: 'bg-orange-100 text-orange-800',
    EN_ENTREGA: 'bg-indigo-100 text-indigo-800',
    ENTREGADO: 'bg-green-100 text-green-800',
    CANCELADO: 'bg-red-100 text-red-800',
    DEVUELTO: 'bg-orange-100 text-orange-800',
  }
  return classes[estado] || 'bg-gray-100 text-gray-800'
}

const getEstadoBarClass = (estado: string) => {
  const classes: Record<string, string> = {
    PENDIENTE: 'bg-yellow-500',
    EN_PREPARACION: 'bg-blue-400',
    EN_TRANSITO: 'bg-blue-600',
    EN_ADUANA: 'bg-orange-500',
    EN_ENTREGA: 'bg-indigo-500',
    ENTREGADO: 'bg-green-500',
    CANCELADO: 'bg-red-500',
    DEVUELTO: 'bg-orange-600',
  }
  return classes[estado] || 'bg-gray-400'
}

const getEstadoDotClass = (estado: string) => {
  const classes: Record<string, string> = {
    PENDIENTE: 'bg-yellow-500',
    EN_PREPARACION: 'bg-blue-400',
    EN_TRANSITO: 'bg-blue-600',
    EN_ADUANA: 'bg-orange-500',
    EN_ENTREGA: 'bg-indigo-500',
    ENTREGADO: 'bg-green-500',
    CANCELADO: 'bg-red-500',
    DEVUELTO: 'bg-orange-600',
  }
  return classes[estado] || 'bg-gray-400'
}

const formatDate = (date: string) => {
  return format(new Date(date), "dd/MM/yyyy 'a las' HH:mm", { locale: es })
}

const verDetalle = (numeroGuia: string) => {
  // Cambiar al tab de tracking y buscar el pedido
  router.push({ query: { tab: 'tracking', guia: numeroGuia } })
}

onMounted(async () => {
  try {
    const statsData = await logisticsStore.fetchEnviosStats()
    if (statsData) {
      stats.value = {
        totalPedidos: statsData.totalEnvios || 0,
        pedidosRecibidos: statsData.porEstado?.ENTREGADO || 0,
        pedidosEnCamino: statsData.porEstado?.EN_TRANSITO || 0,
        pedidosPendientes: statsData.porEstado?.PENDIENTE || 0,
        tiempoPromedioEntrega: statsData.tiempoPromedioEntrega || 0,
      }
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error)
  }
})
</script>

<style scoped>
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.hover-lift {
  transition: transform 0.2s, box-shadow 0.2s;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>