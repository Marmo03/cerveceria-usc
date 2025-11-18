import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";
import { useAuthStore } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export interface KPIs {
  rotacionInventario: number;
  stockoutRate: number;
  costoInventario: number;
  tiempoAprobacion: number;
}

export interface TopProduct {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  unidad: string;
  movimientos: number;
  cantidadMovida: number;
  rotacion: number;
  stockActual: number;
  valorMovido: number;
}

export interface MovimientoTemporal {
  fecha: string;
  entradas: number;
  salidas: number;
}

export interface Alerta {
  id: string;
  type: "warning" | "info" | "success" | "error";
  title: string;
  description: string;
  action: string;
}

export const useReportsStore = defineStore("reports", () => {
  const authStore = useAuthStore();

  // Estado
  const kpis = ref<KPIs>({
    rotacionInventario: 0,
    stockoutRate: 0,
    costoInventario: 0,
    tiempoAprobacion: 0,
  });

  const topProducts = ref<TopProduct[]>([]);
  const movimientosTemporales = ref<MovimientoTemporal[]>([]);
  const alertas = ref<Alerta[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Métodos
  const fetchKPIs = async (params?: {
    desde?: Date;
    hasta?: Date;
    periodo?: "7d" | "30d" | "90d" | "1y";
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/reports/kpis`, {
        params,
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      });

      if (response.data.success) {
        kpis.value = response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || "Error al cargar KPIs";
      console.error("Error fetching KPIs:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchTopProducts = async (params?: {
    desde?: Date;
    hasta?: Date;
    periodo?: "7d" | "30d" | "90d" | "1y";
    limit?: number;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/reports/top-products`, {
        params,
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      });

      if (response.data.success) {
        topProducts.value = response.data.data;
      }
    } catch (err: any) {
      error.value =
        err.response?.data?.message || "Error al cargar productos top";
      console.error("Error fetching top products:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchMovimientosTemporales = async (params?: {
    desde?: Date;
    hasta?: Date;
    periodo?: "7d" | "30d" | "90d" | "1y";
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(
        `${API_URL}/reports/movimientos-temporales`,
        {
          params,
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );

      if (response.data.success) {
        movimientosTemporales.value = response.data.data;
      }
    } catch (err: any) {
      error.value =
        err.response?.data?.message || "Error al cargar movimientos";
      console.error("Error fetching movimientos temporales:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchAlertas = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/reports/alertas`, {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      });

      if (response.data.success) {
        alertas.value = response.data.data;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || "Error al cargar alertas";
      console.error("Error fetching alertas:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchAllData = async (params?: {
    desde?: Date;
    hasta?: Date;
    periodo?: "7d" | "30d" | "90d" | "1y";
  }) => {
    loading.value = true;
    try {
      await Promise.all([
        fetchKPIs(params),
        fetchTopProducts(params),
        fetchMovimientosTemporales(params),
        fetchAlertas(),
      ]);
    } finally {
      loading.value = false;
    }
  };

  const exportToCSV = () => {
    const fecha = new Date();
    const fechaStr = `${fecha.getDate().toString().padStart(2, "0")}/${(fecha.getMonth() + 1).toString().padStart(2, "0")}/${fecha.getFullYear()}`;

    // Header del reporte
    const header = [
      "==========================================================",
      "CERVECERIA USC - REPORTE DE INDICADORES DE DESEMPENO (KPIs)",
      "==========================================================",
      `Fecha de Generacion: ${fechaStr}`,
      `Generado por: ${useAuthStore().user?.firstName || "Sistema"} ${useAuthStore().user?.lastName || ""}`,
      "",
      "==========================================================",
      "1. INDICADORES PRINCIPALES",
      "==========================================================",
      "",
    ].join("\n");

    // KPIs principales
    const kpisSection = [
      "Metrica,Valor,Unidad",
      `Rotacion de Inventario,${kpis.value.rotacionInventario.toFixed(2)},veces`,
      `Tasa de Desabastecimiento,${kpis.value.stockoutRate.toFixed(2)},%`,
      `Costo Total de Inventario,${new Intl.NumberFormat("es-CO").format(kpis.value.costoInventario)},COP`,
      `Tiempo Promedio de Aprobacion,${kpis.value.tiempoAprobacion.toFixed(2)},dias`,
      "",
      "==========================================================",
      "2. PRODUCTOS CON MAYOR ROTACION",
      "==========================================================",
      "",
    ].join("\n");

    // Top Products
    const productsHeader =
      "Codigo,Nombre,Categoria,Movimientos,Rotacion,Stock Actual,Unidad,Valor Movido (COP)";

    const productsData = topProducts.value
      .map((p, index) => {
        const nombre = p.nombre.replace(/,/g, " ");
        return [
          p.codigo,
          `"${nombre}"`,
          p.categoria.replace(/_/g, " "),
          p.movimientos,
          p.rotacion.toFixed(2),
          p.stockActual,
          p.unidad,
          new Intl.NumberFormat("es-CO").format(p.valorMovido),
        ].join(",");
      })
      .join("\n");

    // Estadísticas adicionales
    const stats = [
      "",
      "==========================================================",
      "3. ESTADISTICAS GENERALES",
      "==========================================================",
      "",
      `Total de productos analizados,${topProducts.value.length}`,
      `Total movimientos registrados,${topProducts.value.reduce((sum, p) => sum + p.movimientos, 0)}`,
      `Valor total movido (COP),${new Intl.NumberFormat("es-CO").format(topProducts.value.reduce((sum, p) => sum + p.valorMovido, 0))}`,
      "",
      "==========================================================",
      "NOTAS:",
      "- Rotacion de Inventario: Numero de veces que el inventario se vende y repone",
      "- Tasa de Desabastecimiento: Porcentaje de productos por debajo del stock minimo",
      "- Los valores estan calculados basados en el periodo seleccionado",
      "==========================================================",
    ].join("\n");

    const fullCSV = `${header}${kpisSection}${productsHeader}\n${productsData}${stats}`;

    // Descargar archivo
    const blob = new Blob([fullCSV], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte-kpis-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    // Estado
    kpis,
    topProducts,
    movimientosTemporales,
    alertas,
    loading,
    error,
    // Métodos
    fetchKPIs,
    fetchTopProducts,
    fetchMovimientosTemporales,
    fetchAlertas,
    fetchAllData,
    exportToCSV,
  };
});
