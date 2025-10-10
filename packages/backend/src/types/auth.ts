// Tipos personalizados para la aplicación
export interface AuthenticatedUser {
  userId: string
  email: string
  roleId: string
  roleName: string
}

export interface UserPayload {
  userId: string
  email: string
  roleId: string
  roleName: string
}