/**
 * Store de Gestión de Usuarios y Roles
 *
 * Maneja el estado y las operaciones para la gestión de usuarios,
 * asignación de roles y permisos (solo para ADMIN)
 */

import { defineStore } from "pinia";
import axios from "axios";
import { useAuthStore } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Interfaces
export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface Usuario {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  role: Role;
}

export interface CrearUsuarioData {
  email: string;
  firstName: string;
  lastName: string;
  roleName: "ADMIN" | "OPERARIO" | "APROBADOR" | "ANALISTA";
  password?: string;
}

export interface ActualizarUsuarioData {
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
}

interface UsuariosState {
  usuarios: Usuario[];
  roles: Role[];
  loading: boolean;
  error: string | null;
}

export const useUsuariosStore = defineStore("usuarios", {
  state: (): UsuariosState => ({
    usuarios: [],
    roles: [],
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Usuarios activos
     */
    usuariosActivos: (state) => {
      return state.usuarios.filter((u) => u.isActive);
    },

    /**
     * Usuarios inactivos
     */
    usuariosInactivos: (state) => {
      return state.usuarios.filter((u) => !u.isActive);
    },

    /**
     * Usuarios agrupados por rol
     */
    usuariosPorRol: (state) => {
      const grupos: Record<string, Usuario[]> = {};

      state.usuarios.forEach((usuario) => {
        const roleName = usuario.role.name;
        if (!grupos[roleName]) {
          grupos[roleName] = [];
        }
        grupos[roleName].push(usuario);
      });

      return grupos;
    },

    /**
     * Total de usuarios por cada rol
     */
    contadorPorRol: (state) => {
      const contador: Record<string, number> = {};

      state.usuarios.forEach((usuario) => {
        const roleName = usuario.role.name;
        contador[roleName] = (contador[roleName] || 0) + 1;
      });

      return contador;
    },
  },

  actions: {
    /**
     * Obtener todos los usuarios
     */
    async fetchUsuarios() {
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const response = await axios.get(`${API_URL}/usuarios`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        this.usuarios = response.data.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || "Error al cargar usuarios";
        console.error("Error fetching usuarios:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Obtener roles disponibles
     */
    async fetchRoles() {
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const response = await axios.get(`${API_URL}/usuarios/roles`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        this.roles = response.data.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || "Error al cargar roles";
        console.error("Error fetching roles:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Crear nuevo usuario
     */
    async crearUsuario(data: CrearUsuarioData) {
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const response = await axios.post(`${API_URL}/usuarios`, data, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        // Recargar lista de usuarios
        await this.fetchUsuarios();

        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || "Error al crear usuario";
        console.error("Error creating usuario:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Actualizar rol de un usuario
     */
    async actualizarRol(usuarioId: string, roleName: string) {
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const response = await axios.patch(
          `${API_URL}/usuarios/${usuarioId}/rol`,
          { roleName },
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        // Actualizar en el estado local
        const index = this.usuarios.findIndex((u) => u.id === usuarioId);
        if (index !== -1) {
          this.usuarios[index] = response.data.data;
        }

        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.error || "Error al actualizar rol";
        console.error("Error updating rol:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Actualizar información de un usuario
     */
    async actualizarUsuario(usuarioId: string, data: ActualizarUsuarioData) {
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const response = await axios.patch(
          `${API_URL}/usuarios/${usuarioId}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${authStore.token}`,
            },
          }
        );

        // Actualizar en el estado local
        const index = this.usuarios.findIndex((u) => u.id === usuarioId);
        if (index !== -1) {
          this.usuarios[index] = response.data.data;
        }

        return response.data;
      } catch (error: any) {
        this.error =
          error.response?.data?.error || "Error al actualizar usuario";
        console.error("Error updating usuario:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Desactivar usuario
     */
    async desactivarUsuario(usuarioId: string) {
      this.loading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        await axios.delete(`${API_URL}/usuarios/${usuarioId}`, {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        });

        // Actualizar en el estado local
        const index = this.usuarios.findIndex((u) => u.id === usuarioId);
        if (index !== -1) {
          this.usuarios[index].isActive = false;
        }
      } catch (error: any) {
        this.error =
          error.response?.data?.error || "Error al desactivar usuario";
        console.error("Error desactivating usuario:", error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Activar usuario
     */
    async activarUsuario(usuarioId: string) {
      return this.actualizarUsuario(usuarioId, { isActive: true });
    },

    /**
     * Buscar usuario por email
     */
    buscarPorEmail(email: string): Usuario | undefined {
      return this.usuarios.find((u) =>
        u.email.toLowerCase().includes(email.toLowerCase())
      );
    },

    /**
     * Obtener usuarios por rol
     */
    obtenerPorRol(roleName: string): Usuario[] {
      return this.usuarios.filter(
        (u) => u.role.name.toUpperCase() === roleName.toUpperCase()
      );
    },

    /**
     * Limpiar error
     */
    clearError() {
      this.error = null;
    },

    /**
     * Inicializar datos (cargar usuarios y roles)
     */
    async init() {
      await Promise.all([this.fetchUsuarios(), this.fetchRoles()]);
    },
  },
});
