import { defineStore } from "pinia";
import axios from "axios";

// Tipos para el módulo de logística
export interface Transportista {
  id: string;
  nombre: string;
  contacto: string;
  email: string;
  telefono: string;
  tipoServicio: "TERRESTRE" | "AEREO" | "MARITIMO" | "MULTIMODAL";
  costoBase: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductoEnvio {
  productoId: string;
  cantidad: number;
  observaciones?: string;
  producto?: {
    id: string;
    nombre: string;
    sku: string;
  };
}

export interface Envio {
  id: string;
  numeroGuia: string;
  solicitudCompraId?: string;
  transportistaId: string;
  origen: string;
  destino: string;
  estado:
    | "PENDIENTE"
    | "EN_PREPARACION"
    | "EN_TRANSITO"
    | "EN_ADUANA"
    | "EN_ENTREGA"
    | "ENTREGADO"
    | "CANCELADO"
    | "DEVUELTO";
  prioridad: "ALTA" | "NORMAL" | "BAJA";
  costoEnvio?: number;
  costoSeguro?: number;
  costoAduanero?: number;
  pesoTotal?: number;
  volumenTotal?: number;
  observaciones?: string;
  fechaEnvio?: string;
  fechaEntregaEstimada?: string;
  fechaEntregaReal?: string;
  metadataJSON?: string;
  createdAt: string;
  updatedAt: string;
  transportista?: Transportista;
  productos?: ProductoEnvio[];
  rutas?: RutaEnvio[];
  estados?: EstadoEnvio[];
}

export interface RutaEnvio {
  id: string;
  envioId: string;
  secuencia: number;
  ubicacion: string;
  descripcion?: string;
  fechaLlegada?: string;
  fechaSalida?: string;
  createdAt: string;
}

export interface EstadoEnvio {
  id: string;
  envioId: string;
  estado: string;
  ubicacion?: string;
  descripcion?: string;
  createdAt: string;
}

export interface EnvioStats {
  totalEnvios: number;
  porEstado: Record<string, number>;
  costoTotal: number;
  tiempoPromedioEntrega: number;
}

export interface TransportistaStats {
  totalEnvios: number;
  enviosEntregados: number;
  enviosEnTransito: number;
  tasaExito: number;
  costoPromedio: number;
}

export const useLogisticsStore = defineStore("logistics", {
  state: () => ({
    transportistas: [] as Transportista[],
    envios: [] as Envio[],
    currentEnvio: null as Envio | null,
    currentTransportista: null as Transportista | null,
    enviosStats: null as EnvioStats | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    transportistasActivos: (state) =>
      state.transportistas.filter((t) => t.isActive),

    enviosPorEstado: (state) => (estado: string) =>
      state.envios.filter((e) => e.estado === estado),

    enviosRecientes: (state) =>
      [...state.envios]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 10),
  },

  actions: {
    // ==================== TRANSPORTISTAS ====================
    async fetchTransportistas() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get("/logistics/transportistas");
        this.transportistas = response.data.data;
      } catch (error: any) {
        this.error =
          error.response?.data?.message || "Error al cargar transportistas";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createTransportista(
      data: Omit<Transportista, "id" | "createdAt" | "updatedAt">
    ) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post("/logistics/transportistas", data);
        this.transportistas.push(response.data.data);
        return response.data.data;
      } catch (error: any) {
        this.error =
          error.response?.data?.message || "Error al crear transportista";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateTransportista(id: string, data: Partial<Transportista>) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.patch(
          `/logistics/transportistas/${id}`,
          data
        );
        const index = this.transportistas.findIndex((t) => t.id === id);
        if (index !== -1) {
          this.transportistas[index] = response.data.data;
        }
        return response.data.data;
      } catch (error: any) {
        this.error =
          error.response?.data?.message || "Error al actualizar transportista";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteTransportista(id: string) {
      this.loading = true;
      this.error = null;
      try {
        await axios.delete(`/logistics/transportistas/${id}`);
        this.transportistas = this.transportistas.filter((t) => t.id !== id);
      } catch (error: any) {
        this.error =
          error.response?.data?.message || "Error al eliminar transportista";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // ==================== ENVÍOS ====================
    async fetchEnvios(filters?: {
      estado?: string;
      prioridad?: string;
      transportistaId?: string;
      search?: string;
    }) {
      this.loading = true;
      this.error = null;
      try {
        const params = new URLSearchParams();
        if (filters?.estado) params.append("estado", filters.estado);
        if (filters?.prioridad) params.append("prioridad", filters.prioridad);
        if (filters?.transportistaId)
          params.append("transportistaId", filters.transportistaId);
        if (filters?.search) params.append("search", filters.search);

        const response = await axios.get(
          `/logistics/envios?${params.toString()}`
        );
        this.envios = response.data.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || "Error al cargar envíos";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchEnvioById(id: string) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(`/logistics/envios/${id}`);
        this.currentEnvio = response.data.data;
        return response.data.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || "Error al cargar envío";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async trackEnvio(numeroGuia: string) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(
          `/logistics/envios/tracking/${numeroGuia}`
        );
        this.currentEnvio = response.data.data;
        return response.data.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || "Envío no encontrado";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createEnvio(data: {
      numeroGuia: string;
      transportistaId: string;
      origen: string;
      destino: string;
      prioridad: "ALTA" | "NORMAL" | "BAJA";
      productos: ProductoEnvio[];
      solicitudCompraId?: string;
      costoEnvio?: number;
      costoSeguro?: number;
      pesoTotal?: number;
      volumenTotal?: number;
      observaciones?: string;
      fechaEntregaEstimada?: string;
    }) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post("/logistics/envios", data);
        this.envios.unshift(response.data.data);
        return response.data.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || "Error al crear envío";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateEnvio(id: string, data: Partial<Envio>) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.patch(`/logistics/envios/${id}`, data);
        const index = this.envios.findIndex((e) => e.id === id);
        if (index !== -1) {
          this.envios[index] = response.data.data;
        }
        if (this.currentEnvio?.id === id) {
          this.currentEnvio = response.data.data;
        }
        return response.data.data;
      } catch (error: any) {
        this.error =
          error.response?.data?.message || "Error al actualizar envío";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async cancelarEnvio(id: string, motivo?: string) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post(`/logistics/envios/${id}/cancelar`, {
          motivo,
        });
        const index = this.envios.findIndex((e) => e.id === id);
        if (index !== -1) {
          this.envios[index] = response.data.data;
        }
        if (this.currentEnvio?.id === id) {
          this.currentEnvio = response.data.data;
        }
        return response.data.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || "Error al cancelar envío";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteEnvio(id: string) {
      this.loading = true;
      this.error = null;
      try {
        await axios.delete(`/logistics/envios/${id}`);
        this.envios = this.envios.filter((e) => e.id !== id);
        if (this.currentEnvio?.id === id) {
          this.currentEnvio = null;
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || "Error al eliminar envío";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // ==================== ESTADOS ====================
    async addEstadoEnvio(
      envioId: string,
      data: {
        estado: string;
        ubicacion?: string;
        descripcion?: string;
      }
    ) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post(
          `/logistics/envios/${envioId}/estados`,
          data
        );

        // Actualizar el envío actual con el nuevo estado
        if (this.currentEnvio?.id === envioId) {
          this.currentEnvio.estado = data.estado as any;
          if (!this.currentEnvio.estados) {
            this.currentEnvio.estados = [];
          }
          this.currentEnvio.estados.push(response.data.data);
        }

        // Actualizar en la lista de envíos
        const index = this.envios.findIndex((e) => e.id === envioId);
        if (index !== -1) {
          this.envios[index].estado = data.estado as any;
        }

        return response.data.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || "Error al agregar estado";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // ==================== RUTAS ====================
    async addRutaEnvio(
      envioId: string,
      data: {
        secuencia: number;
        ubicacion: string;
        descripcion?: string;
        fechaLlegada?: string;
        fechaSalida?: string;
      }
    ) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post(
          `/logistics/envios/${envioId}/rutas`,
          data
        );

        if (this.currentEnvio?.id === envioId) {
          if (!this.currentEnvio.rutas) {
            this.currentEnvio.rutas = [];
          }
          this.currentEnvio.rutas.push(response.data.data);
        }

        return response.data.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || "Error al agregar ruta";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // ==================== ESTADÍSTICAS ====================
    async fetchEnviosStats() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get("/logistics/stats/envios");
        this.enviosStats = response.data.data;
        return response.data.data;
      } catch (error: any) {
        this.error =
          error.response?.data?.message || "Error al cargar estadísticas";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchTransportistaStats(transportistaId: string) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(
          `/logistics/stats/transportistas?transportistaId=${transportistaId}`
        );
        return response.data.data;
      } catch (error: any) {
        this.error =
          error.response?.data?.message ||
          "Error al cargar estadísticas del transportista";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // ==================== UTILIDADES ====================
    clearError() {
      this.error = null;
    },

    clearCurrentEnvio() {
      this.currentEnvio = null;
    },
  },
});
