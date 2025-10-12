<template>
  <AppLayout>
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">
              Gestión de Productos
            </h1>
            <p class="mt-2 text-gray-600">
              Administra el catálogo de productos de la cervecería
            </p>
          </div>
          <div class="flex space-x-3">
            <button
              @click="$router.push('/dashboard')"
              class="btn btn-secondary"
            >
              <svg
                class="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Volver al Dashboard
            </button>
            <button
              v-if="authStore.hasAnyRole(['ADMIN'])"
              @click="showCreateModal = true"
              class="btn btn-primary"
            >
              <svg
                class="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Nuevo Producto
            </button>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Búsqueda</label
              >
              <input
                v-model="filters.search"
                type="text"
                placeholder="Buscar productos..."
                class="input-field"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Categoría</label
              >
              <select v-model="filters.categoria" class="input-field">
                <option value="">Todas las categorías</option>
                <option value="MATERIA_PRIMA">Materia Prima</option>
                <option value="INSUMO">Insumo</option>
                <option value="PRODUCTO_TERMINADO">Producto Terminado</option>
                <option value="EMPAQUE">Empaque</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Estado</label
              >
              <select v-model="filters.activo" class="input-field">
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
            <div class="flex items-end">
              <button @click="resetFilters" class="btn btn-secondary w-full">
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="stat-card">
          <div class="stat-icon bg-blue-100 text-blue-600">
            <svg
              class="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ stats.total }}</p>
            <p class="text-gray-600">Total Productos</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-green-100 text-green-600">
            <svg
              class="h-8 w-8"
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
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">{{ stats.activos }}</p>
            <p class="text-gray-600">Productos Activos</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-yellow-100 text-yellow-600">
            <svg
              class="h-8 w-8"
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
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ stats.stockBajo }}
            </p>
            <p class="text-gray-600">Stock Bajo</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon bg-purple-100 text-purple-600">
            <svg
              class="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900">
              {{ stats.categorias }}
            </p>
            <p class="text-gray-600">Categorías</p>
          </div>
        </div>
      </div>

      <!-- Tabla de productos -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Lista de Productos</h3>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header">Código</th>
                <th class="table-header">Nombre</th>
                <th class="table-header">Categoría</th>
                <th class="table-header">Stock Actual</th>
                <th class="table-header">Stock Mínimo</th>
                <th class="table-header">Precio</th>
                <th class="table-header">Estado</th>
                <th class="table-header">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="producto in filteredProductos"
                :key="producto.id"
                class="hover:bg-gray-50"
              >
                <td class="table-cell font-medium text-gray-900">
                  {{ producto.codigo }}
                </td>
                <td class="table-cell">
                  <div>
                    <div class="font-medium text-gray-900">
                      {{ producto.nombre }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ producto.descripcion }}
                    </div>
                  </div>
                </td>
                <td class="table-cell">
                  <span
                    class="badge"
                    :class="getCategoriaClass(producto.categoria)"
                  >
                    {{ getCategoriaLabel(producto.categoria) }}
                  </span>
                </td>
                <td class="table-cell">
                  <span
                    :class="
                      getStockClass(producto.stockActual, producto.stockMinimo)
                    "
                  >
                    {{ producto.stockActual }} {{ producto.unidadMedida }}
                  </span>
                </td>
                <td class="table-cell">
                  {{ producto.stockMinimo }} {{ producto.unidadMedida }}
                </td>
                <td class="table-cell">${{ formatPrice(producto.precio) }}</td>
                <td class="table-cell">
                  <span
                    class="badge"
                    :class="producto.activo ? 'badge-success' : 'badge-error'"
                  >
                    {{ producto.activo ? "Activo" : "Inactivo" }}
                  </span>
                </td>
                <td class="table-cell">
                  <div class="flex items-center space-x-2">
                    <button
                      @click="viewProduct(producto)"
                      class="btn-icon btn-icon-primary"
                      title="Ver detalles"
                    >
                      <svg
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="authStore.hasAnyRole(['ADMIN'])"
                      @click="editProduct(producto)"
                      class="btn-icon btn-icon-secondary"
                      title="Editar"
                    >
                      <svg
                        class="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="spinner"></div>
          <span class="ml-2 text-gray-600">Cargando productos...</span>
        </div>

        <!-- Empty state -->
        <div
          v-if="!loading && filteredProductos.length === 0"
          class="text-center py-12"
        >
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">
            No hay productos
          </h3>
          <p class="mt-1 text-sm text-gray-500">
            No se encontraron productos con los filtros aplicados.
          </p>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import AppLayout from "../components/AppLayout.vue";

const authStore = useAuthStore();

// Estado reactivo
const loading = ref(false);
const showCreateModal = ref(false);
const productos = ref([
  {
    id: 1,
    codigo: "MP001",
    nombre: "Malta Pilsner",
    descripcion: "Malta base para cervezas ligeras",
    categoria: "MATERIA_PRIMA",
    stockActual: 500,
    stockMinimo: 100,
    precio: 2500,
    unidadMedida: "kg",
    activo: true,
  },
  {
    id: 2,
    codigo: "MP002",
    nombre: "Lúpulo Cascade",
    descripcion: "Lúpulo aromático americano",
    categoria: "MATERIA_PRIMA",
    stockActual: 25,
    stockMinimo: 50,
    precio: 15000,
    unidadMedida: "kg",
    activo: true,
  },
  {
    id: 3,
    codigo: "PT001",
    nombre: "Cerveza IPA",
    descripcion: "India Pale Ale artesanal",
    categoria: "PRODUCTO_TERMINADO",
    stockActual: 200,
    stockMinimo: 50,
    precio: 8500,
    unidadMedida: "unidades",
    activo: true,
  },
  {
    id: 4,
    codigo: "EMP001",
    nombre: "Botella 355ml",
    descripción: "Botella ámbar para cerveza",
    categoria: "EMPAQUE",
    stockActual: 1000,
    stockMinimo: 500,
    precio: 450,
    unidadMedida: "unidades",
    activo: true,
  },
]);

// Filtros
const filters = ref({
  search: "",
  categoria: "",
  activo: "",
});

// Productos filtrados
const filteredProductos = computed(() => {
  return productos.value.filter((producto) => {
    const matchesSearch =
      !filters.value.search ||
      producto.nombre
        .toLowerCase()
        .includes(filters.value.search.toLowerCase()) ||
      producto.codigo
        .toLowerCase()
        .includes(filters.value.search.toLowerCase());

    const matchesCategoria =
      !filters.value.categoria ||
      producto.categoria === filters.value.categoria;

    const matchesActivo =
      !filters.value.activo ||
      producto.activo.toString() === filters.value.activo;

    return matchesSearch && matchesCategoria && matchesActivo;
  });
});

// Estadísticas
const stats = computed(() => ({
  total: productos.value.length,
  activos: productos.value.filter((p) => p.activo).length,
  stockBajo: productos.value.filter((p) => p.stockActual <= p.stockMinimo)
    .length,
  categorias: new Set(productos.value.map((p) => p.categoria)).size,
}));

// Métodos
const resetFilters = () => {
  filters.value = {
    search: "",
    categoria: "",
    activo: "",
  };
};

const getCategoriaClass = (categoria: string) => {
  const classes = {
    MATERIA_PRIMA: "badge-primary",
    INSUMO: "badge-secondary",
    PRODUCTO_TERMINADO: "badge-success",
    EMPAQUE: "badge-warning",
  };
  return classes[categoria as keyof typeof classes] || "badge-secondary";
};

const getCategoriaLabel = (categoria: string) => {
  const labels = {
    MATERIA_PRIMA: "Materia Prima",
    INSUMO: "Insumo",
    PRODUCTO_TERMINADO: "Producto Terminado",
    EMPAQUE: "Empaque",
  };
  return labels[categoria as keyof typeof labels] || categoria;
};

const getStockClass = (actual: number, minimo: number) => {
  if (actual <= minimo) return "text-red-600 font-semibold";
  if (actual <= minimo * 1.2) return "text-yellow-600 font-semibold";
  return "text-gray-900";
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-CO").format(price);
};

const viewProduct = (producto: any) => {
  console.log("Ver producto:", producto);
  // TODO: Implementar modal de detalles
};

const editProduct = (producto: any) => {
  console.log("Editar producto:", producto);
  // TODO: Implementar modal de edición
};

onMounted(() => {
  // TODO: Cargar productos desde API
});
</script>
