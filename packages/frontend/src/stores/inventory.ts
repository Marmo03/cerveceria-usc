/**
 * Store de Inventario
 *
 * Gestiona el estado y las operaciones del módulo de inventario.
 * Incluye registro de movimientos (entradas/salidas), consulta de historial,
 * resumen de inventario y alertas de stock bajo.
 *
 * Funcionalidades:
 * - Registrar movimientos de entrada y salida
 * - Consultar historial de movimientos con filtros
 * - Obtener resumen de inventario (estadísticas generales)
 * - Ver alertas de productos con stock bajo
 * - Validación de stock suficiente para salidas
 *
 * @module stores/inventory
 */

import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Interfaces

export interface Movimiento {
  id: string;
  productoId: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  fecha: string;
  usuarioId: string;
  comentario?: string;
  referencia?: string;
  createdAt: string;
  producto?: {
    id: string;
    sku: string;
    nombre: string;
    categoria: string;
    unidad: string;
  };
  usuario?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface RegistrarMovimientoData {
  productoId: string;
  tipo: "ENTRADA" | "SALIDA";
  cantidad: number;
  comentario?: string;
  referencia?: string;
}

export interface FiltrosMovimientos {
  productoId?: string;
  tipo?: "ENTRADA" | "SALIDA";
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface ResumenInventario {
  totalProductos: number;
  productosActivos: number;
  productosStockBajo: number;
  valorTotalInventario: number;
  ultimosMovimientos: Array<{
    id: string;
    productoNombre: string;
    productoSku: string;
    tipo: "ENTRADA" | "SALIDA";
    cantidad: number;
    fecha: string;
    comentario?: string;
    referencia?: string;
  }>;
}

export interface AlertaStock {
  productoId: string;
  sku: string;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  prioridad: "ALTA" | "MEDIA" | "BAJA";
  diasSinStock: number;
  leadTime: number;
}

export interface ResumenAlertas {
  totalAlertas: number;
  alertasAlta: number;
  alertasMedia: number;
  alertasBaja: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Estado del Store
interface InventoryState {
  movimientos: Movimiento[];
  resumen: ResumenInventario | null;
  alertas: AlertaStock[];
  resumenAlertas: ResumenAlertas | null;
  loading: boolean;
  error: string | null;
  filtros: FiltrosMovimientos;
  pagination: Pagination | null;
}

export const useInventoryStore = defineStore("inventory", {
  state: (): InventoryState => ({
    movimientos: [],
    resumen: null,
    alertas: [],
    resumenAlertas: null,
    loading: false,
    error: null,
    filtros: {
      page: 1,
      limit: 20,
    },
    pagination: null,
  }),

  getters: {
    /**
     * Filtra movimientos de entrada
     */
    movimientosEntrada: (state) => {
      return state.movimientos.filter((m) => m.tipo === "ENTRADA");
    },

    /**
     * Filtra movimientos de salida
     */
    movimientosSalida: (state) => {
      return state.movimientos.filter((m) => m.tipo === "SALIDA");
    },

    /**
     * Alertas de prioridad alta
     */
    alertasAlta: (state) => {
      return state.alertas.filter((a) => a.prioridad === "ALTA");
    },

    /**
     * Alertas de prioridad media
     */
    alertasMedia: (state) => {
      return state.alertas.filter((a) => a.prioridad === "MEDIA");
    },

    /**
     * Verifica si hay alertas críticas
     */
    tieneAlertasCriticas: (state) => {
      return state.alertas.some((a) => a.prioridad === "ALTA");
    },

    /**
     * Total de movimientos cargados
     */
    totalMovimientos: (state) => {
      return state.pagination?.total || state.movimientos.length;
    },
  },

  actions: {
    /**
     * Registra un nuevo movimiento de inventario
     */
    async registrarMovimiento(data: RegistrarMovimientoData) {
      this.loading = true;
      this.error = null;

      try {
        // Validación adicional antes de enviar
        console.log("🔍 [STORE] Validando datos antes de enviar:", data);

        if (!data.productoId || data.productoId.trim() === "") {
          const errorMsg = "ProductoId está vacío o inválido";
          console.error("❌ [STORE] " + errorMsg);
          throw new Error(errorMsg);
        }

        // Validar formato UUID
        // UUID tiene formato: 8-4-4-4-12 caracteres hexadecimales
        // Ejemplo: 68e688fd-2b3e-4ae1-9694-59fe768c856d
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(data.productoId)) {
          const errorMsg = `ProductoId no es un UUID válido: "${data.productoId}"`;
          console.error("❌ [STORE] " + errorMsg);
          throw new Error(errorMsg);
        }

        console.log("✅ [STORE] Datos válidos, enviando al backend...");

        const authStore = useAuthStore();

        const response = await axios.post(
          `${API_URL}/inventario/movimientos`,
          data,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        console.log("✅ [STORE] Respuesta del backend:", response.data);

        // Recargar movimientos después de registrar
        await this.fetchMovimientos();

        // Recargar resumen para actualizar estadísticas
        await this.fetchResumen();

        return response.data;
      } catch (error: any) {
        this.error =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Error al registrar movimiento";
        console.error("❌ [STORE] Error registrando movimiento:", error);
        console.error("❌ [STORE] Response completa:", error.response);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Obtiene el historial de movimientos con filtros
     */
    async fetchMovimientos(filtros?: FiltrosMovimientos) {
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
          `${API_URL}/inventario/movimientos?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        this.movimientos = response.data.data;
        this.pagination = response.data.pagination;
      } catch (error: any) {
        this.error =
          error.response?.data?.error || "Error al obtener movimientos";
        console.error("Error fetching movimientos:", error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Obtiene el resumen general del inventario
     */
    async fetchResumen() {
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();

        const response = await axios.get(`${API_URL}/inventario/resumen`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        this.resumen = response.data.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || "Error al obtener resumen";
        console.error("Error fetching resumen:", error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Obtiene las alertas de stock bajo
     */
    async fetchAlertas() {
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();

        const response = await axios.get(`${API_URL}/inventario/alertas`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        this.alertas = response.data.data.alertas;
        this.resumenAlertas = response.data.data.resumen;
      } catch (error: any) {
        this.error = error.response?.data?.error || "Error al obtener alertas";
        console.error("Error fetching alertas:", error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Filtra movimientos por producto
     */
    async filtrarPorProducto(productoId: string) {
      this.filtros.productoId = productoId;
      this.filtros.page = 1;
      await this.fetchMovimientos();
    },

    /**
     * Filtra movimientos por tipo (ENTRADA/SALIDA)
     */
    async filtrarPorTipo(tipo: "ENTRADA" | "SALIDA") {
      this.filtros.tipo = tipo;
      this.filtros.page = 1;
      await this.fetchMovimientos();
    },

    /**
     * Filtra movimientos por rango de fechas
     */
    async filtrarPorFechas(fechaDesde: string, fechaHasta: string) {
      this.filtros.fechaDesde = fechaDesde;
      this.filtros.fechaHasta = fechaHasta;
      this.filtros.page = 1;
      await this.fetchMovimientos();
    },

    /**
     * Cambia de página en la paginación
     */
    async changePage(page: number) {
      this.filtros.page = page;
      await this.fetchMovimientos();
    },

    /**
     * Cambia el límite de resultados por página
     */
    async changeLimit(limit: number) {
      this.filtros.limit = limit;
      this.filtros.page = 1;
      await this.fetchMovimientos();
    },

    /**
     * Limpia todos los filtros
     */
    async clearFiltros() {
      this.filtros = {
        page: 1,
        limit: 20,
      };
      await this.fetchMovimientos();
    },

    /**
     * Registra una entrada de inventario (atajo)
     */
    async registrarEntrada(
      productoId: string,
      cantidad: number,
      comentario?: string,
      referencia?: string
    ) {
      return this.registrarMovimiento({
        productoId,
        tipo: "ENTRADA",
        cantidad,
        comentario,
        referencia,
      });
    },

    /**
     * Registra una salida de inventario (atajo)
     */
    async registrarSalida(
      productoId: string,
      cantidad: number,
      comentario?: string,
      referencia?: string
    ) {
      return this.registrarMovimiento({
        productoId,
        tipo: "SALIDA",
        cantidad,
        comentario,
        referencia,
      });
    },

    /**
     * Limpia el error actual
     */
    clearError() {
      this.error = null;
    },

    /**
     * Refresca todos los datos del inventario
     */
    async refreshAll() {
      await Promise.all([
        this.fetchMovimientos(),
        this.fetchResumen(),
        this.fetchAlertas(),
      ]);
    },
  },
});
