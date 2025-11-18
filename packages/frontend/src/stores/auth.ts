import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axios from "axios";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const useAuthStore = defineStore("auth", () => {
  // Estado
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem("auth_token"));
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Restaurar usuario desde localStorage al inicializar
  const storedUser = localStorage.getItem("auth_user");
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser);
    } catch (e) {
      console.error("Error parsing stored user:", e);
      localStorage.removeItem("auth_user");
    }
  }

  // Getters computados
  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const fullName = computed(() => {
    if (!user.value) return "";
    return `${user.value.firstName} ${user.value.lastName}`;
  });

  const hasRole = (role: string): boolean => {
    if (!user.value) return false;
    return user.value.roleName.toUpperCase() === role.toUpperCase();
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!user.value) return false;
    const userRoleUpper = user.value.roleName.toUpperCase();
    return roles.some((role) => role.toUpperCase() === userRoleUpper);
  };

  const hasPermission = (permission: string): boolean => {
    return user.value?.permissions.includes(permission) ?? false;
  };

  // Configurar axios con token
  const setupAxiosInterceptor = () => {
    axios.defaults.baseURL =
      import.meta.env.VITE_API_URL || "http://localhost:3001/api";

    // Request interceptor para agregar token
    axios.interceptors.request.use(
      (config) => {
        if (token.value) {
          config.headers.Authorization = `Bearer ${token.value}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor para manejar errores de auth
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          logout();
        }
        return Promise.reject(error);
      }
    );
  };

  // Acciones
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      console.log("Intentando login con:", credentials.email);
      console.log("URL de la API:", axios.defaults.baseURL);

      const response = await axios.post("/auth/login", credentials);

      console.log("Respuesta del servidor:", response.data);

      if (response.data.success) {
        const { token: authToken, user: userData } = response.data;

        // Guardar token y usuario
        token.value = authToken;

        // Manejar permisos de forma segura
        let permissions: string[] = [];
        if (userData.role.permissions) {
          if (typeof userData.role.permissions === "string") {
            try {
              permissions = Object.values(
                JSON.parse(userData.role.permissions)
              ).flat() as string[];
            } catch (e) {
              console.warn("Error parsing permissions:", e);
              permissions = [];
            }
          } else if (typeof userData.role.permissions === "object") {
            permissions = Object.values(
              userData.role.permissions
            ).flat() as string[];
          }
        }

        user.value = {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          roleName: userData.role.name,
          permissions: permissions,
        };

        // Persistir token y usuario en localStorage
        localStorage.setItem("auth_token", authToken);
        localStorage.setItem("auth_user", JSON.stringify(user.value));

        // Configurar axios
        setupAxiosInterceptor();

        console.log("Login exitoso, usuario guardado:", user.value);
      } else {
        throw new Error(response.data.message || "Error de autenticación");
      }
    } catch (err: any) {
      console.error("Error en login:", err);
      console.error("Error details:", err.response);

      if (err.code === "ECONNREFUSED" || err.code === "ERR_NETWORK") {
        error.value =
          "No se puede conectar al servidor. Verifica que esté funcionando.";
      } else if (err.response?.status === 401) {
        error.value = "Credenciales incorrectas";
      } else {
        error.value =
          err.response?.data?.message || err.message || "Error de conexión";
      }
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = (): void => {
    // Limpiar estado
    user.value = null;
    token.value = null;
    error.value = null;

    // Remover de localStorage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");

    // Redirigir al login
    window.location.href = "/login";
  };

  const checkAuth = async (): Promise<void> => {
    if (!token.value) return;

    try {
      const response = await axios.get("/auth/me");

      if (response.data.success) {
        const userData = response.data.user;
        user.value = {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          roleName: userData.role.name,
          permissions: userData.role.permissions || [],
        };
      } else {
        logout();
      }
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      logout();
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const response = await axios.post("/auth/refresh");

      if (response.data.success) {
        token.value = response.data.data.token;
        localStorage.setItem("auth_token", response.data.data.token);
      } else {
        logout();
      }
    } catch (error) {
      console.error("Error renovando token:", error);
      logout();
    }
  };

  // Configurar axios desde el inicio
  setupAxiosInterceptor();

  return {
    // Estado
    user,
    token,
    isLoading,
    error,

    // Getters
    isAuthenticated,
    fullName,

    // Métodos
    hasRole,
    hasAnyRole,
    hasPermission,
    login,
    logout,
    checkAuth,
    refreshToken,
  };
});
