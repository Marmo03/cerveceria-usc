<template>
  <div class="cotizar-envio-tab">
    <!-- Formulario de Cotización -->
    <div class="form-section">
      <h2 class="section-title">Cotizar Envío</h2>
      <p class="section-description">
        Ingresa los detalles del envío para obtener cotizaciones de Servientrega
      </p>

      <div class="form-grid">
        <!-- Ciudad de Origen -->
        <div class="form-group">
          <label for="ciudad-origen">Ciudad de Origen *</label>
          <div class="autocomplete-container">
            <input
              id="ciudad-origen"
              v-model="origenQuery"
              @input="handleOrigenInput"
              @focus="showOrigenDropdown = true"
              type="text"
              placeholder="Ej: Bogotá"
              class="form-input"
              :disabled="loading"
            />
            <div v-if="showOrigenDropdown && origenCiudades.length > 0" class="autocomplete-dropdown">
              <button
                v-for="ciudad in origenCiudades"
                :key="ciudad.id"
                @click="selectOrigen(ciudad)"
                class="autocomplete-item"
                type="button"
              >
                <span class="ciudad-nombre">{{ ciudad.nombre }}</span>
                <span v-if="ciudad.departamento" class="ciudad-departamento">
                  {{ ciudad.departamento }}
                </span>
              </button>
            </div>
            <div v-if="loadingOrigen" class="autocomplete-loading">
              Buscando ciudades...
            </div>
          </div>
          <div v-if="selectedOrigen" class="selected-value">
            ✓ {{ selectedOrigen.nombre }}
            <button @click="clearOrigen" class="clear-btn" type="button">✕</button>
          </div>
        </div>

        <!-- Ciudad de Destino -->
        <div class="form-group">
          <label for="ciudad-destino">Ciudad de Destino *</label>
          <div class="autocomplete-container">
            <input
              id="ciudad-destino"
              v-model="destinoQuery"
              @input="handleDestinoInput"
              @focus="showDestinoDropdown = true"
              type="text"
              placeholder="Ej: Medellín"
              class="form-input"
              :disabled="!selectedOrigen || loading"
            />
            <div v-if="showDestinoDropdown && destinoCiudades.length > 0" class="autocomplete-dropdown">
              <button
                v-for="ciudad in destinoCiudades"
                :key="ciudad.id"
                @click="selectDestino(ciudad)"
                class="autocomplete-item"
                type="button"
              >
                <span class="ciudad-nombre">{{ ciudad.nombre }}</span>
                <span v-if="ciudad.departamento" class="ciudad-departamento">
                  {{ ciudad.departamento }}
                </span>
              </button>
            </div>
            <div v-if="loadingDestino" class="autocomplete-loading">
              Buscando ciudades...
            </div>
          </div>
          <div v-if="selectedDestino" class="selected-value">
            ✓ {{ selectedDestino.nombre }}
            <button @click="clearDestino" class="clear-btn" type="button">✕</button>
          </div>
          <p v-if="!selectedOrigen" class="helper-text">
            Primero selecciona la ciudad de origen
          </p>
        </div>

        <!-- Peso -->
        <div class="form-group">
          <label for="peso">Peso (kg) *</label>
          <input
            id="peso"
            v-model.number="formData.peso"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="Ej: 5.5"
            class="form-input"
            :disabled="loading"
          />
        </div>

        <!-- Dimensiones -->
        <div class="form-group">
          <label>Dimensiones (cm) *</label>
          <div class="dimension-inputs">
            <input
              v-model.number="formData.largo"
              type="number"
              min="1"
              placeholder="Largo"
              class="form-input"
              :disabled="loading"
            />
            <span class="dimension-separator">×</span>
            <input
              v-model.number="formData.alto"
              type="number"
              min="1"
              placeholder="Alto"
              class="form-input"
              :disabled="loading"
            />
            <span class="dimension-separator">×</span>
            <input
              v-model.number="formData.ancho"
              type="number"
              min="1"
              placeholder="Ancho"
              class="form-input"
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Valor Declarado -->
        <div class="form-group full-width">
          <label for="valor-declarado">Valor Declarado (COP) *</label>
          <input
            id="valor-declarado"
            v-model.number="formData.valorDeclarado"
            type="number"
            min="0"
            step="1000"
            placeholder="Ej: 100000"
            class="form-input"
            :disabled="loading"
          />
          <p class="helper-text">Valor del contenido del paquete para seguro</p>
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="action-buttons">
        <button
          @click="cotizar"
          :disabled="!canCotizar || loading"
          class="btn-primary"
          type="button"
        >
          <span v-if="loading">⏳ Cotizando...</span>
          <span v-else>💰 Cotizar Envío</span>
        </button>
        <button
          v-if="cotizaciones.length > 0"
          @click="clearResults"
          class="btn-secondary"
          type="button"
        >
          🗑️ Limpiar
        </button>
      </div>

      <!-- Mensajes de Error -->
      <div v-if="error" class="error-message">
        <span class="error-icon">⚠️</span>
        <span>{{ error }}</span>
        <button @click="error = ''" class="error-close">✕</button>
      </div>
    </div>

    <!-- Resultados de Cotización -->
    <div v-if="cotizaciones.length > 0" class="results-section">
      <h3 class="results-title">📊 Opciones de Envío Disponibles</h3>
      <div class="cotizaciones-grid">
        <div
          v-for="(cotizacion, index) in cotizaciones"
          :key="index"
          class="cotizacion-card"
        >
          <div class="cotizacion-header">
            <h4>{{ cotizacion.producto || 'Servicio Estándar' }}</h4>
          </div>
          <div class="cotizacion-body">
            <div class="cotizacion-item">
              <span class="item-label">💵 Costo:</span>
              <span class="item-value">
                ${{ cotizacion.costoEnvio?.toLocaleString('es-CO') }}
              </span>
            </div>
            <div class="cotizacion-item">
              <span class="item-label">⏱️ Tiempo estimado:</span>
              <span class="item-value">{{ cotizacion.tiempoEstimado }}</span>
            </div>
            <div v-if="cotizacion.medioTransporte" class="cotizacion-item">
              <span class="item-label">🚚 Transporte:</span>
              <span class="item-value">{{ cotizacion.medioTransporte }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensaje cuando no hay resultados -->
    <div v-else-if="!loading && formSubmitted" class="empty-state">
      <p>No se encontraron cotizaciones disponibles para esta ruta.</p>
      <p class="empty-state-hint">
        Verifica que las ciudades y dimensiones sean correctas.
      </p>
    </div>

    <!-- Mapa de Ruta -->
    <div v-if="origenCoords && destinoCoords" class="map-section">
      <h3 class="map-title">🗺️ Visualización de Ruta</h3>
      <MapaEnvio :origen="origenCoords" :destino="destinoCoords" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import MapaEnvio from '../MapaEnvio.vue'
import {
  buscarCiudadesOrigen,
  buscarCiudadesDestino,
  cotizarEnvio,
  geocodificarDireccion,
  type Ciudad,
  type Cotizacion,
} from '../../services/servientrega'

// Estado del formulario
const formData = ref({
  peso: null as number | null,
  largo: null as number | null,
  alto: null as number | null,
  ancho: null as number | null,
  valorDeclarado: null as number | null,
})

// Estado de ciudades
const origenQuery = ref('')
const destinoQuery = ref('')
const origenCiudades = ref<Ciudad[]>([])
const destinoCiudades = ref<Ciudad[]>([])
const selectedOrigen = ref<Ciudad | null>(null)
const selectedDestino = ref<Ciudad | null>(null)
const showOrigenDropdown = ref(false)
const showDestinoDropdown = ref(false)

// Estado de coordenadas para el mapa
const origenCoords = ref<{ latitud: number; longitud: number; nombre: string } | null>(null)
const destinoCoords = ref<{ latitud: number; longitud: number; nombre: string } | null>(null)

// Estado de cotizaciones
const cotizaciones = ref<Cotizacion[]>([])

// Estado de UI
const loading = ref(false)
const loadingOrigen = ref(false)
const loadingDestino = ref(false)
const error = ref('')
const formSubmitted = ref(false)

// Debounce timer
let origenTimer: ReturnType<typeof setTimeout> | null = null
let destinoTimer: ReturnType<typeof setTimeout> | null = null

// Computed: ¿Puede cotizar?
const canCotizar = computed(() => {
  return (
    selectedOrigen.value &&
    selectedDestino.value &&
    formData.value.peso &&
    formData.value.peso > 0 &&
    formData.value.largo &&
    formData.value.largo > 0 &&
    formData.value.alto &&
    formData.value.alto > 0 &&
    formData.value.ancho &&
    formData.value.ancho > 0 &&
    formData.value.valorDeclarado !== null &&
    formData.value.valorDeclarado >= 0
  )
})

// Mapeo de ciudades principales a coordenadas (fallback si geocoding falla)
const CITY_COORDS: Record<string, { latitud: number; longitud: number }> = {
  'Bogotá': { latitud: 4.6097, longitud: -74.0817 },
  'Medellín': { latitud: 6.2442, longitud: -75.5812 },
  'Cali': { latitud: 3.4516, longitud: -76.532 },
  'Barranquilla': { latitud: 10.9685, longitud: -74.7813 },
  'Cartagena': { latitud: 10.3910, longitud: -75.4794 },
  'Bucaramanga': { latitud: 7.1193, longitud: -73.1227 },
  'Pereira': { latitud: 4.8087, longitud: -75.6906 },
  'Santa Marta': { latitud: 11.2408, longitud: -74.1990 },
  'Cúcuta': { latitud: 7.8939, longitud: -72.5078 },
  'Ibagué': { latitud: 4.4389, longitud: -75.2322 },
}

// Handlers de autocomplete
const handleOrigenInput = () => {
  if (origenTimer) clearTimeout(origenTimer)
  
  if (origenQuery.value.length < 2) {
    origenCiudades.value = []
    return
  }

  loadingOrigen.value = true
  origenTimer = setTimeout(async () => {
    try {
      const ciudades = await buscarCiudadesOrigen(origenQuery.value)
      origenCiudades.value = ciudades
      showOrigenDropdown.value = true
    } catch (err) {
      console.error('Error buscando ciudades origen:', err)
      origenCiudades.value = []
    } finally {
      loadingOrigen.value = false
    }
  }, 300)
}

const handleDestinoInput = () => {
  if (!selectedOrigen.value) return
  
  if (destinoTimer) clearTimeout(destinoTimer)
  
  if (destinoQuery.value.length < 2) {
    destinoCiudades.value = []
    return
  }

  loadingDestino.value = true
  destinoTimer = setTimeout(async () => {
    try {
      const ciudades = await buscarCiudadesDestino(
        selectedOrigen.value!.id,
        destinoQuery.value
      )
      destinoCiudades.value = ciudades
      showDestinoDropdown.value = true
    } catch (err) {
      console.error('Error buscando ciudades destino:', err)
      destinoCiudades.value = []
    } finally {
      loadingDestino.value = false
    }
  }, 300)
}

// Selección de ciudades
const selectOrigen = async (ciudad: Ciudad) => {
  selectedOrigen.value = ciudad
  origenQuery.value = ciudad.nombre
  origenCiudades.value = []
  showOrigenDropdown.value = false
  
  // Intentar geocodificar
  await geocodificarCiudad(ciudad, 'origen')
  
  // Limpiar destino si había uno seleccionado
  if (selectedDestino.value) {
    clearDestino()
  }
}

const selectDestino = async (ciudad: Ciudad) => {
  selectedDestino.value = ciudad
  destinoQuery.value = ciudad.nombre
  destinoCiudades.value = []
  showDestinoDropdown.value = false
  
  // Intentar geocodificar
  await geocodificarCiudad(ciudad, 'destino')
}

const clearOrigen = () => {
  selectedOrigen.value = null
  origenQuery.value = ''
  origenCoords.value = null
  clearDestino()
}

const clearDestino = () => {
  selectedDestino.value = null
  destinoQuery.value = ''
  destinoCoords.value = null
}

// Geocodificación de ciudades
const geocodificarCiudad = async (ciudad: Ciudad, tipo: 'origen' | 'destino') => {
  try {
    // Intentar primero con el mapeo estático
    const staticCoords = CITY_COORDS[ciudad.nombre]
    if (staticCoords) {
      const coords = {
        latitud: staticCoords.latitud,
        longitud: staticCoords.longitud,
        nombre: ciudad.nombre,
      }
      if (tipo === 'origen') {
        origenCoords.value = coords
      } else {
        destinoCoords.value = coords
      }
      return
    }

    // Si no está en el mapeo, intentar geocoding
    const direccion = `${ciudad.nombre}, Colombia`
    const resultado = await geocodificarDireccion(direccion)
    
    if (resultado) {
      const coords = {
        latitud: resultado.latitud,
        longitud: resultado.longitud,
        nombre: ciudad.nombre,
      }
      if (tipo === 'origen') {
        origenCoords.value = coords
      } else {
        destinoCoords.value = coords
      }
    }
  } catch (err) {
    console.error(`Error geocodificando ${tipo}:`, err)
  }
}

// Cotizar envío
const cotizar = async () => {
  if (!canCotizar.value) return

  loading.value = true
  error.value = ''
  formSubmitted.value = true

  try {
    const resultado = await cotizarEnvio({
      idCiudadOrigen: selectedOrigen.value!.id,
      idCiudadDestino: selectedDestino.value!.id,
      largo: formData.value.largo!,
      alto: formData.value.alto!,
      ancho: formData.value.ancho!,
      peso: formData.value.peso!,
      valorDeclarado: formData.value.valorDeclarado!,
    })

    cotizaciones.value = resultado

    if (resultado.length === 0) {
      error.value = 'No se encontraron cotizaciones para esta ruta. Verifica los datos ingresados.'
    }
  } catch (err: any) {
    error.value = err.message || 'Error al obtener cotizaciones. Por favor intenta nuevamente.'
    console.error('Error al cotizar:', err)
  } finally {
    loading.value = false
  }
}

// Limpiar resultados
const clearResults = () => {
  cotizaciones.value = []
  formSubmitted.value = false
  error.value = ''
}

// Cerrar dropdowns al hacer click fuera
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.autocomplete-container')) {
      showOrigenDropdown.value = false
      showDestinoDropdown.value = false
    }
  })
}
</script>

<style scoped>
.cotizar-envio-tab {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

/* Form Section */
.form-section {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.section-description {
  color: #6b7280;
  margin-bottom: 32px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

label {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

/* Autocomplete */
.autocomplete-container {
  position: relative;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 240px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.autocomplete-item {
  width: 100%;
  padding: 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.15s;
}

.autocomplete-item:hover {
  background-color: #f3f4f6;
}

.ciudad-nombre {
  font-weight: 500;
  color: #1f2937;
}

.ciudad-departamento {
  font-size: 12px;
  color: #6b7280;
}

.autocomplete-loading {
  padding: 12px;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
}

.selected-value {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #1e40af;
  font-size: 14px;
}

.clear-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 16px;
  padding: 0 4px;
  transition: color 0.15s;
}

.clear-btn:hover {
  color: #ef4444;
}

.helper-text {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

/* Dimensiones */
.dimension-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dimension-separator {
  color: #9ca3af;
  font-weight: 500;
}

/* Botones */
.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-start;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  margin-top: 16px;
}

.error-icon {
  font-size: 20px;
}

.error-close {
  margin-left: auto;
  background: none;
  border: none;
  color: #991b1b;
  cursor: pointer;
  font-size: 18px;
  padding: 0 4px;
}

/* Results Section */
.results-section {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
}

.results-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
}

.cotizaciones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.cotizacion-card {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.2s;
}

.cotizacion-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.cotizacion-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  padding: 16px;
  color: white;
}

.cotizacion-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.cotizacion-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cotizacion-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-label {
  color: #6b7280;
  font-size: 14px;
}

.item-value {
  color: #1f2937;
  font-weight: 600;
  font-size: 16px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
  background: white;
  border-radius: 12px;
  margin-bottom: 32px;
}

.empty-state-hint {
  font-size: 14px;
  margin-top: 8px;
}

/* Map Section */
.map-section {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.map-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .cotizar-envio-tab {
    padding: 16px;
  }

  .form-section,
  .results-section,
  .map-section {
    padding: 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .dimension-inputs {
    flex-direction: column;
  }

  .dimension-separator {
    display: none;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
