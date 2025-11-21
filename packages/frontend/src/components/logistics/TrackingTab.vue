<template>
  <div class="max-w-4xl mx-auto space-y-6 py-6">
    <!-- Formulario de búsqueda -->
    <div class="card">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          🔍 Rastrear Pedido
        </h2>
        <p class="text-gray-600">
          Ingresa el número de guía de Servientrega para conocer el estado de tu pedido
        </p>
      </div>

      <div class="max-w-xl mx-auto">
        <div class="relative">
          <input
            v-model="numeroGuia"
            type="text"
            placeholder="Ingresa el número de guía (Ej: 123456789)"
            class="w-full px-4 py-3 pr-24 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            @keyup.enter="rastrearPedido"
            :disabled="loading"
          />
          <button
            @click="rastrearPedido"
            :disabled="!numeroGuia.trim() || loading"
            class="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {{ loading ? '⏳' : '→' }}
          </button>
        </div>
        
        <p class="text-sm text-gray-500 mt-2 text-center">
          Presiona Enter o haz clic en → para buscar
        </p>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="card bg-red-50 border-2 border-red-200">
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <svg class="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="flex-1">
          <h3 class="text-sm font-medium text-red-800">Error al rastrear</h3>
          <p class="text-sm text-red-700 mt-1">{{ error }}</p>
        </div>
        <button @click="error = ''" class="text-red-600 hover:text-red-800">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Resultados del rastreo -->
    <div v-if="trackingInfo" class="space-y-6">
      <!-- Estado actual -->
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-xl font-bold text-gray-900">
              📦 Guía: {{ trackingInfo.numeroGuia }}
            </h3>
            <p class="text-sm text-gray-500 mt-1">Servientrega</p>
          </div>
          <span :class="[
            'px-4 py-2 rounded-full text-sm font-semibold',
            getEstadoClasses(trackingInfo.estado)
          ]">
            {{ trackingInfo.estado }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">📍 Origen</p>
            <p class="font-semibold text-gray-900">{{ trackingInfo.origen || 'No disponible' }}</p>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">📍 Destino</p>
            <p class="font-semibold text-gray-900">{{ trackingInfo.destino || 'No disponible' }}</p>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">📅 Fecha estimada</p>
            <p class="font-semibold text-gray-900">{{ trackingInfo.fechaEstimada || 'Por confirmar' }}</p>
          </div>
        </div>

        <div v-if="trackingInfo.mensaje" class="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <p class="text-sm text-blue-900">
            <strong>Mensaje de Servientrega:</strong> {{ trackingInfo.mensaje }}
          </p>
        </div>
      </div>

      <!-- Historial de movimientos -->
      <div class="card" v-if="trackingInfo.historial && trackingInfo.historial.length > 0">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">
          📋 Historial de Movimientos
        </h3>

        <div class="relative">
          <!-- Línea de tiempo -->
          <div class="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200"></div>

          <!-- Eventos -->
          <div class="space-y-6">
            <div
              v-for="(evento, index) in trackingInfo.historial"
              :key="index"
              class="relative pl-12"
            >
              <!-- Punto en la línea -->
              <div :class="[
                'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center',
                index === 0 ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-300 text-gray-600'
              ]">
                <span class="text-xs font-bold">{{ index + 1 }}</span>
              </div>

              <!-- Contenido del evento -->
              <div :class="[
                'bg-white border-2 rounded-lg p-4',
                index === 0 ? 'border-blue-500 shadow-md' : 'border-gray-200'
              ]">
                <div class="flex justify-between items-start mb-2">
                  <h4 class="font-semibold text-gray-900">{{ evento.estado || evento.descripcion }}</h4>
                  <span class="text-sm text-gray-500">{{ evento.fecha || evento.fechaHora }}</span>
                </div>
                <p v-if="evento.ubicacion" class="text-sm text-gray-600">
                  📍 {{ evento.ubicacion }}
                </p>
                <p v-if="evento.observaciones" class="text-sm text-gray-600 mt-1">
                  {{ evento.observaciones }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Información adicional -->
      <div v-if="trackingInfo.detalles" class="card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          ℹ️ Información Adicional
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div v-if="trackingInfo.detalles.remitente">
            <p class="text-gray-600">Remitente:</p>
            <p class="font-medium text-gray-900">{{ trackingInfo.detalles.remitente }}</p>
          </div>
          <div v-if="trackingInfo.detalles.destinatario">
            <p class="text-gray-600">Destinatario:</p>
            <p class="font-medium text-gray-900">{{ trackingInfo.detalles.destinatario }}</p>
          </div>
          <div v-if="trackingInfo.detalles.peso">
            <p class="text-gray-600">Peso:</p>
            <p class="font-medium text-gray-900">{{ trackingInfo.detalles.peso }} kg</p>
          </div>
          <div v-if="trackingInfo.detalles.unidades">
            <p class="text-gray-600">Unidades:</p>
            <p class="font-medium text-gray-900">{{ trackingInfo.detalles.unidades }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!trackingInfo && !loading && !error" class="text-center py-12">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        Ingresa un número de guía
      </h3>
      <p class="text-gray-500 max-w-md mx-auto">
        Introduce el número de guía de Servientrega en el campo de búsqueda para ver el estado actual y el historial completo de tu pedido.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { rastrearEnvio, validarNumeroGuia, type TrackingResponse } from '../../services/servientregaTracking'

const numeroGuia = ref('')
const loading = ref(false)
const error = ref('')
const trackingInfo = ref<TrackingResponse | null>(null)

const rastrearPedido = async () => {
  const guiaLimpia = numeroGuia.value.trim()
  
  if (!guiaLimpia) {
    error.value = 'Por favor ingresa un número de guía'
    return
  }

  // Validar formato básico
  if (!validarNumeroGuia(guiaLimpia)) {
    error.value = 'El formato del número de guía no es válido. Debe tener entre 8 y 15 caracteres.'
    return
  }

  loading.value = true
  error.value = ''
  trackingInfo.value = null

  try {
    const resultado = await rastrearEnvio(guiaLimpia)
    trackingInfo.value = resultado
  } catch (err: any) {
    console.error('Error al rastrear pedido:', err)
    error.value = err.message || 'Error al conectar con Servientrega. Por favor intenta nuevamente.'
  } finally {
    loading.value = false
  }
}

const getEstadoClasses = (estado: string) => {
  const upperEstado = estado?.toUpperCase() || ''
  
  if (upperEstado.includes('ENTREGADO')) {
    return 'bg-green-100 text-green-800'
  } else if (upperEstado.includes('TRÁNSITO') || upperEstado.includes('TRANSITO')) {
    return 'bg-blue-100 text-blue-800'
  } else if (upperEstado.includes('PENDIENTE') || upperEstado.includes('PROCESO')) {
    return 'bg-yellow-100 text-yellow-800'
  } else if (upperEstado.includes('RETENIDO') || upperEstado.includes('NOVEDAD')) {
    return 'bg-orange-100 text-orange-800'
  } else if (upperEstado.includes('CANCELADO') || upperEstado.includes('DEVUELTO')) {
    return 'bg-red-100 text-red-800'
  }
  
  return 'bg-gray-100 text-gray-800'
}
</script>

<style scoped>
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>