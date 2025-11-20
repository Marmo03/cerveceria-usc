/**
 * Store de Productos
 *
 * Gestiona el estado y las operaciones CRUD del catálogo de productos.
 * Se integra con la API REST del backend (/api/productos).
 *
 * Funcionalidades:
 * - Listar productos con filtros (categoría, estado, stock bajo, búsqueda)
 * - Obtener detalle de producto individual
 * - Crear nuevo producto
 * - Actualizar producto existente
 * - Eliminar producto (soft delete)
 * - Gestión de políticas de reabastecimiento
 * - Paginación de resultados
 *
 * @module stores/products
 */

import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";
import { useToastStore } from "./toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Interfaz de Producto
export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  unidad: string;
  costo: number;
  stockActual: number;
  stockMin: number;
  leadTime: number;
  isActive: boolean;
  proveedorId?: string;
  proveedor?: {
    id: string;
    nombre: string;
    email: string;
    telefono?: string;
  };
  politicaAbastecimiento?: {
    estrategia: "EOQ" | "MANUAL";
    rop: number;
    stockSeguridad: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Interfaz de Política de Abastecimiento
export interface PoliticaAbastecimiento {
  id: string;
  productoId: string;
  estrategia: "EOQ" | "MANUAL";
  rop: number;
  stockSeguridad: number;
  parametrosJSON?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Interfaz de Filtros
export interface FiltrosProductos {
  categoria?: string;
  isActive?: boolean;
  stockBajo?: boolean;
  proveedorId?: string;
  busqueda?: string;
  page?: number;
  limit?: number;
}

// Interfaz de Paginación
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Interfaz del Estado del Store
interface ProductsState {
  productos: Producto[];
  productoActual: Producto | null;
  loading: boolean;
  error: string | null;
  filtros: FiltrosProductos;
  pagination: Pagination;
}

export const useProductsStore = defineStore("products", {
  state: (): ProductsState => ({
    productos: [],
    productoActual: null,
    loading: false,
    error: null,
    filtros: {
      page: 1,
      limit: 20,
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0,
    },
  }),

  getters: {
    /**
     * Filtra productos activos
     */
    productosActivos: (state) => {
      return state.productos.filter((p) => p.isActive);
    },

    /**
     * Filtra productos con stock bajo
     */
    productosStockBajo: (state) => {
      return state.productos.filter((p) => p.stockActual <= p.stockMin);
    },

    /**
     * Agrupa productos por categoría
     */
    productosPorCategoria: (state) => {
      const grupos: Record<string, Producto[]> = {};
      state.productos.forEach((producto) => {
        if (!grupos[producto.categoria]) {
          grupos[producto.categoria] = [];
        }
        grupos[producto.categoria].push(producto);
      });
      return grupos;
    },

    /**
     * Verifica si hay productos
     */
    tieneProductos: (state) => {
      return state.productos.length > 0;
    },
  },

  actions: {
    /**
     * Obtiene lista de productos con filtros opcionales
     */
    async fetchProductos(filtros?: FiltrosProductos) {
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();

        // Actualizar filtros si se proporcionan
        if (filtros) {
          this.filtros = { ...this.filtros, ...filtros };
        }

        // Construir query params
        const params = new URLSearchParams();
        Object.entries(this.filtros).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });

        const response = await axios.get(
          `${API_URL}/productos?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        this.productos = response.data.productos;
        this.pagination = response.data.pagination;
      } catch (error: any) {
        this.error =
          error.response?.data?.message || "Error al obtener productos";
        console.error("Error fetching productos:", error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Obtiene un producto por ID
     */
    async fetchProductoById(id: string) {
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const response = await axios.get(`${API_URL}/productos/${id}`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });
        this.productoActual = response.data;
        return response.data;
      } catch (error: any) {
        this.error =
          error.response?.data?.message || "Error al obtener producto";
        console.error("Error fetching producto:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Crea un nuevo producto
     */
    async createProducto(
      data: Omit<Producto, "id" | "createdAt" | "updatedAt" | "isActive">
    ) {
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();

        console.log("=== CREANDO PRODUCTO ===");
        console.log("Datos a enviar:", data);
        console.log("Token presente:", !!authStore.token);
        console.log("API URL:", `${API_URL}/productos`);

        const response = await axios.post(`${API_URL}/productos`, data, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        console.log("✅ Producto creado exitosamente:", response.data);

        const toastStore = useToastStore();
        toastStore.success('Producto creado exitosamente');

        // Recargar la lista de productos después de crear
        await this.fetchProductos();

        return response.data;
      } catch (error: any) {
        console.error("❌ ERROR AL CREAR PRODUCTO:");
        console.error("Error completo:", error);
        console.error("Response:", error.response);
        console.error("Response data:", error.response?.data);
        console.error("Status:", error.response?.status);
        console.error("Message:", error.message);

        this.error = error.response?.data?.message || "Error al crear producto";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Actualiza un producto existente
     */
    async updateProducto(id: string, data: Partial<Producto>) {
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const response = await axios.put(`${API_URL}/productos/${id}`, data, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        // Actualizar en la lista local
        const index = this.productos.findIndex((p) => p.id === id);
        if (index !== -1) {
          // Recargar el producto actualizado
          await this.fetchProductoById(id);
          if (this.productoActual) {
            this.productos[index] = this.productoActual;
          }
        }

        const toastStore = useToastStore();
        toastStore.success('Producto actualizado exitosamente');

        return response.data;
      } catch (error: any) {
        this.error =
          error.response?.data?.message || "Error al actualizar producto";
        console.error("Error updating producto:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Elimina un producto (soft delete)
     */
    async deleteProducto(id: string) {
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        await axios.delete(`${API_URL}/productos/${id}`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        // Eliminar de la lista local
        this.productos = this.productos.filter((p) => p.id !== id);
      } catch (error: any) {
        this.error =
          error.response?.data?.message || "Error al eliminar producto";
        console.error("Error deleting producto:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Obtiene la política de abastecimiento de un producto
     */
    async fetchPoliticaAbastecimiento(productoId: string) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get(
          `${API_URL}/productos/${productoId}/politica`
        );
        return response.data;
      } catch (error: any) {
        // No es un error crítico si no tiene política
        if (error.response?.status === 404) {
          return null;
        }
        this.error =
          error.response?.data?.message || "Error al obtener política";
        console.error("Error fetching politica:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Crea o actualiza la política de abastecimiento
     */
    async savePoliticaAbastecimiento(
      productoId: string,
      data: Omit<
        PoliticaAbastecimiento,
        "id" | "productoId" | "createdAt" | "updatedAt"
      >
    ) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.post(
          `${API_URL}/productos/${productoId}/politica`,
          data
        );
        return response.data;
      } catch (error: any) {
        this.error =
          error.response?.data?.message || "Error al guardar política";
        console.error("Error saving politica:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Cambia de página en la paginación
     */
    async changePage(page: number) {
      this.filtros.page = page;
      await this.fetchProductos();
    },

    /**
     * Cambia el límite de resultados por página
     */
    async changeLimit(limit: number) {
      this.filtros.limit = limit;
      this.filtros.page = 1; // Resetear a la primera página
      await this.fetchProductos();
    },

    /**
     * Limpia los filtros y recarga
     */
    async clearFiltros() {
      this.filtros = {
        page: 1,
        limit: 20,
      };
      await this.fetchProductos();
    },

    /**
     * Busca productos por texto
     */
    async buscarProductos(busqueda: string) {
      this.filtros.busqueda = busqueda;
      this.filtros.page = 1;
      await this.fetchProductos();
    },

    /**
     * Filtra por categoría
     */
    async filtrarPorCategoria(categoria: string) {
      this.filtros.categoria = categoria;
      this.filtros.page = 1;
      await this.fetchProductos();
    },

    /**
     * Filtra productos con stock bajo
     */
    async filtrarStockBajo() {
      this.filtros.stockBajo = true;
      this.filtros.page = 1;
      await this.fetchProductos();
    },

    /**
     * Limpia el producto actual
     */
    clearProductoActual() {
      this.productoActual = null;
    },

    /**
     * Limpia el error
     */
    clearError() {
      this.error = null;
    },
  },
});
