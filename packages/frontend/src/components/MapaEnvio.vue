<template>
  <div class="mapa-envio">
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Cargando mapa...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>
    
    <div v-else id="map" class="map-container"></div>
    
    <div v-if="!loading && coordenadas" class="map-info">
      <div class="info-item">
        <span class="icon">📍</span>
        <span class="label">Origen:</span>
        <span class="value">{{ origen?.nombre || 'No especificado' }}</span>
      </div>
      <div class="info-item">
        <span class="icon">📍</span>
        <span class="label">Destino:</span>
        <span class="value">{{ destino?.nombre || 'No especificado' }}</span>
      </div>
      <div v-if="distancia" class="info-item">
        <span class="icon">📏</span>
        <span class="label">Distancia aprox:</span>
        <span class="value">{{ distancia }} km</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix para iconos de Leaflet en Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

interface Props {
  origen?: {
    latitud: number
    longitud: number
    nombre?: string
  }
  destino?: {
    latitud: number
    longitud: number
    nombre?: string
  }
}

const props = defineProps<Props>()

const loading = ref(true)
const error = ref('')
const coordenadas = ref<any>(null)
const distancia = ref<number | null>(null)

let map: L.Map | null = null
let origenMarker: L.Marker | null = null
let destinoMarker: L.Marker | null = null
let routeLine: L.Polyline | null = null

// Calcular distancia entre dos puntos (fórmula de Haversine)
function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

function initMap() {
  try {
    if (!props.origen && !props.destino) {
      error.value = 'No hay coordenadas para mostrar'
      loading.value = false
      return
    }

    // Centro del mapa (Colombia por defecto o punto medio entre origen y destino)
    let centerLat = 4.6097 // Bogotá
    let centerLng = -74.0817
    let zoom = 6

    if (props.origen && props.destino) {
      centerLat = (props.origen.latitud + props.destino.latitud) / 2
      centerLng = (props.origen.longitud + props.destino.longitud) / 2
      zoom = 7
      
      // Calcular distancia
      distancia.value = calcularDistancia(
        props.origen.latitud,
        props.origen.longitud,
        props.destino.latitud,
        props.destino.longitud
      )
    } else if (props.origen) {
      centerLat = props.origen.latitud
      centerLng = props.origen.longitud
      zoom = 10
    } else if (props.destino) {
      centerLat = props.destino.latitud
      centerLng = props.destino.longitud
      zoom = 10
    }

    // Crear mapa
    map = L.map('map').setView([centerLat, centerLng], zoom)

    // Agregar capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    // Agregar marcador de origen
    if (props.origen) {
      const iconOrigen = L.icon({
        iconUrl: markerIcon,
        iconRetinaUrl: markerIcon2x,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      })

      origenMarker = L.marker([props.origen.latitud, props.origen.longitud], {
        icon: iconOrigen,
      })
        .addTo(map)
        .bindPopup(`<b>Origen</b><br>${props.origen.nombre || 'Punto de origen'}`)
    }

    // Agregar marcador de destino
    if (props.destino) {
      const iconDestino = L.icon({
        iconUrl: markerIcon,
        iconRetinaUrl: markerIcon2x,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      })

      destinoMarker = L.marker([props.destino.latitud, props.destino.longitud], {
        icon: iconDestino,
      })
        .addTo(map)
        .bindPopup(`<b>Destino</b><br>${props.destino.nombre || 'Punto de destino'}`)
    }

    // Dibujar línea entre origen y destino
    if (props.origen && props.destino) {
      routeLine = L.polyline(
        [
          [props.origen.latitud, props.origen.longitud],
          [props.destino.latitud, props.destino.longitud],
        ],
        {
          color: '#3b82f6',
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 10',
        }
      ).addTo(map)

      // Ajustar vista para que se vean ambos puntos
      const bounds = L.latLngBounds([
        [props.origen.latitud, props.origen.longitud],
        [props.destino.latitud, props.destino.longitud],
      ])
      map.fitBounds(bounds, { padding: [50, 50] })
    }

    coordenadas.value = { origen: props.origen, destino: props.destino }
    loading.value = false
  } catch (err: any) {
    error.value = 'Error al cargar el mapa: ' + err.message
    loading.value = false
  }
}

function updateMap() {
  if (map) {
    // Limpiar marcadores y líneas existentes
    if (origenMarker) map.removeLayer(origenMarker)
    if (destinoMarker) map.removeLayer(destinoMarker)
    if (routeLine) map.removeLayer(routeLine)

    // Reinicializar
    initMap()
  }
}

onMounted(async () => {
  await nextTick()
  setTimeout(() => {
    initMap()
  }, 100)
})

watch(() => [props.origen, props.destino], updateMap, { deep: true })
</script>

<style scoped>
.mapa-envio {
  position: relative;
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-container {
  width: 100%;
  height: 100%;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f3f4f6;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #fef2f2;
  color: #991b1b;
  padding: 20px;
  text-align: center;
}

.map-info {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-width: 300px;
  z-index: 1000;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .icon {
  font-size: 18px;
}

.info-item .label {
  font-weight: 600;
  color: #374151;
}

.info-item .value {
  color: #6b7280;
}
</style>
