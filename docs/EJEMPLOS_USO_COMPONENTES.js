// ========================================
// 🎯 GUÍA RÁPIDA DE USO - NUEVOS COMPONENTES
// ========================================

// ========================================
// 1. TOAST NOTIFICATIONS
// ========================================

// En cualquier componente Vue:
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()

// Éxito (verde) - 4 segundos
toast.success('Producto creado', 'El producto fue agregado al catálogo')

// Error (rojo) - 6 segundos
toast.error('Error de conexión', 'No se pudo guardar los cambios')

// Advertencia (amarillo) - 5 segundos
toast.warning('Stock bajo', 'Malta Premium tiene solo 10 unidades')

// Información (azul) - 4 segundos
toast.info('Nueva actualización', 'Hay características nuevas disponibles')

// ========================================
// 2. MODAL DE CONFIRMACIÓN
// ========================================

// En tu template:
/*
<template>
  <button @click="showConfirm = true">Eliminar Producto</button>
  
  <ModalConfirm
    v-model="showConfirm"
    type="danger"
    title="¿Eliminar producto?"
    message="Esta acción no se puede deshacer. El producto será eliminado permanentemente del catálogo."
    confirm-text="Sí, eliminar"
    cancel-text="Cancelar"
    @confirm="handleDelete"
    @cancel="handleCancel"
  />
</template>
*/

// En tu script:
import { ref } from 'vue'
import ModalConfirm from '@/components/ModalConfirm.vue'

const showConfirm = ref(false)

const handleDelete = async () => {
  // Tu lógica aquí
  await deleteProduct()
  showConfirm.value = false
}

const handleCancel = () => {
  console.log('Usuario canceló')
}

// ========================================
// 3. SKELETONS DE CARGA
// ========================================

// Para tablas:
/*
<template>
  <TableSkeleton v-if="loading" :rows="10" :columns="8" />
  
  <table v-else class="min-w-full">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</template>
*/

import TableSkeleton from '@/components/TableSkeleton.vue'

// Para grids de tarjetas:
/*
<template>
  <CardSkeleton v-if="loading" :count="4" :columns="4" />
  
  <div v-else class="grid grid-cols-4 gap-6">
    <div class="card">...</div>
    <div class="card">...</div>
  </div>
</template>
*/

import CardSkeleton from '@/components/CardSkeleton.vue'

// ========================================
// 4. PAGINACIÓN
// ========================================

/*
<template>
  <Pagination
    v-if="!loading && items.length > 0"
    :current-page="currentPage"
    :total-pages="Math.ceil(totalItems / itemsPerPage)"
    :total="totalItems"
    :per-page="itemsPerPage"
    @previous="currentPage--"
    @next="currentPage++"
    @goto="(page) => currentPage = page"
  />
</template>
*/

import Pagination from '@/components/Pagination.vue'
import { ref } from 'vue'

const currentPage = ref(1)
const itemsPerPage = ref(20)
const totalItems = ref(156)

// ========================================
// EJEMPLO COMPLETO: PÁGINA CON TOAST + SKELETON + PAGINACIÓN
// ========================================

/*
<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold">Mis Productos</h1>
      
      <!-- Skeleton mientras carga -->
      <TableSkeleton v-if="loading" :rows="10" :columns="6" />
      
      <!-- Tabla real -->
      <table v-else class="min-w-full">
        <thead>...</thead>
        <tbody>
          <tr v-for="producto in productos" :key="producto.id">
            <td>{{ producto.nombre }}</td>
            <td>
              <button @click="showDeleteModal(producto)">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Paginación -->
      <Pagination
        v-if="!loading && productos.length > 0"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total="totalItems"
        :per-page="itemsPerPage"
        @previous="loadPage(currentPage - 1)"
        @next="loadPage(currentPage + 1)"
        @goto="loadPage"
      />
      
      <!-- Modal de confirmación -->
      <ModalConfirm
        v-model="showConfirm"
        type="danger"
        title="¿Eliminar producto?"
        :message="`¿Estás seguro de eliminar ${selectedProduct?.nombre}?`"
        @confirm="deleteProduct"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToastStore } from '@/stores/toast'
import AppLayout from '@/components/AppLayout.vue'
import TableSkeleton from '@/components/TableSkeleton.vue'
import Pagination from '@/components/Pagination.vue'
import ModalConfirm from '@/components/ModalConfirm.vue'

const toast = useToastStore()

const loading = ref(true)
const productos = ref([])
const showConfirm = ref(false)
const selectedProduct = ref(null)

const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const itemsPerPage = ref(20)

const loadPage = async (page: number) => {
  loading.value = true
  try {
    const response = await fetch(`/api/productos?page=${page}&limit=${itemsPerPage.value}`)
    const data = await response.json()
    
    productos.value = data.productos
    currentPage.value = data.pagination.page
    totalPages.value = data.pagination.pages
    totalItems.value = data.pagination.total
    
  } catch (error) {
    toast.error('Error al cargar productos', error.message)
  } finally {
    loading.value = false
  }
}

const showDeleteModal = (producto: any) => {
  selectedProduct.value = producto
  showConfirm.value = true
}

const deleteProduct = async () => {
  try {
    await fetch(`/api/productos/${selectedProduct.value.id}`, {
      method: 'DELETE'
    })
    
    toast.success(
      'Producto eliminado',
      `${selectedProduct.value.nombre} fue eliminado del catálogo`
    )
    
    await loadPage(currentPage.value)
    
  } catch (error) {
    toast.error('Error al eliminar', error.message)
  } finally {
    showConfirm.value = false
    selectedProduct.value = null
  }
}

onMounted(() => {
  loadPage(1)
})
</script>
*/

// ========================================
// TIPS Y MEJORES PRÁCTICAS
// ========================================

/*
1. TOAST:
   - Usa success para operaciones completadas (CRUD)
   - Usa error para fallos de API o validación
   - Usa warning para alertas no críticas
   - Usa info para notificaciones generales

2. MODAL CONFIRM:
   - type="danger" → Eliminar, acciones destructivas
   - type="warning" → Cambios importantes, advertencias
   - type="info" → Confirmaciones generales

3. SKELETONS:
   - Usa TableSkeleton para tablas de datos
   - Usa CardSkeleton para grids de tarjetas/stats
   - Siempre envuelve con v-if/v-else

4. PAGINACIÓN:
   - Siempre muestra solo si hay datos (!loading && items.length > 0)
   - Usa v-if para evitar renderizado innecesario
   - Sincroniza con backend (página, límite, total)
*/

// ========================================
// ESTILOS PERSONALIZADOS (OPCIONAL)
// ========================================

/*
// En tu componente, puedes personalizar algunos estilos:

// Toast personalizado (duración)
toast.addToast({
  type: 'success',
  title: 'Guardado',
  message: 'Cambios aplicados',
  duration: 10000,  // 10 segundos
  persistent: false // true = no auto-cierra
})

// ModalConfirm con textos personalizados
<ModalConfirm
  v-model="show"
  type="danger"
  title="¿Continuar?"
  message="Esta acción es irreversible"
  confirm-text="Sí, estoy seguro"
  cancel-text="No, volver atrás"
  @confirm="handleConfirm"
/>
*/

// ========================================
// ¡FIN DE LA GUÍA! 🎉
// ========================================
