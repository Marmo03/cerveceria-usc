import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

// Importar páginas
import LoginPage from "../pages/LoginPage.vue";
import DashboardPage from "../pages/DashboardPage.vue";
import ProductosPage from "../pages/ProductosPage.vue";
import InventarioPage from "../pages/InventarioPage.vue";
import SolicitudesPage from "../pages/SolicitudesPage.vue";
import KPIsPage from "../pages/KPIsPage.vue";
import PerfilPage from "../pages/PerfilPage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: "/dashboard",
    },
    {
      path: "/login",
      name: "Login",
      component: LoginPage,
      meta: { requiresAuth: false },
    },
    {
      path: "/dashboard",
      name: "Dashboard",
      component: DashboardPage,
      meta: { requiresAuth: true },
    },
    {
      path: "/productos",
      name: "Productos",
      component: ProductosPage,
      meta: {
        requiresAuth: true,
        roles: ["ADMIN", "OPERARIO", "ANALISTA"],
      },
    },
    {
      path: "/inventario",
      name: "Inventario",
      component: InventarioPage,
      meta: {
        requiresAuth: true,
        roles: ["ADMIN", "OPERARIO"],
      },
    },
    {
      path: "/solicitudes",
      name: "Solicitudes",
      component: SolicitudesPage,
      meta: {
        requiresAuth: true,
        roles: ["ADMIN", "OPERARIO", "APROBADOR"],
      },
    },
    {
      path: "/kpis",
      name: "KPIs",
      component: KPIsPage,
      meta: {
        requiresAuth: true,
        roles: ["ADMIN", "ANALISTA"],
      },
    },
    {
      path: "/perfil",
      name: "Perfil",
      component: PerfilPage,
      meta: { requiresAuth: true },
    },
  ],
});

// Guard de navegación para autenticación
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Verificar si la ruta requiere autenticación
  if (to.meta.requiresAuth) {
    // Verificar si el usuario está autenticado
    if (!authStore.isAuthenticated) {
      next("/login");
      return;
    }

    // Verificar roles si se especifican
    if (to.meta.roles && Array.isArray(to.meta.roles)) {
      if (!authStore.hasAnyRole(to.meta.roles as string[])) {
        // Usuario no tiene permisos, redirigir al dashboard
        next("/dashboard");
        return;
      }
    }
  } else if (to.name === "Login" && authStore.isAuthenticated) {
    // Usuario ya autenticado tratando de ir al login
    next("/dashboard");
    return;
  }

  next();
});

export default router;
