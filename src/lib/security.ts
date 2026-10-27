/**
 * Control de Accesos Basado en Roles (RBAC) y Validación de Propiedad (ID Matching)
 */

export type UserRole = 'user' | 'admin';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  loggedIn: boolean;
  role: UserRole;
  acceptedTermsAt: string;
}

export interface OwnedResource {
  id: string;
  ownerId: string;
}

/**
 * Verifica si un usuario tiene sesión activa para rutas privadas (/mis-gastos).
 */
export function canAccessPrivateRoute(user: SessionUser | null): boolean {
  return Boolean(user && user.loggedIn && user.id);
}

/**
 * Verifica si un usuario tiene rol de administrador para rutas restringidas (/admin).
 */
export function canAccessAdminRoute(user: SessionUser | null): boolean {
  return Boolean(user && user.loggedIn && user.role === 'admin');
}

/**
 * Validación de Propiedad (ID Matching):
 * Garantiza que un registro de gasto o meta pertenezca exclusivamente al usuario autenticado.
 */
export function verifyResourceOwnership<T extends OwnedResource>(
  resource: T | null | undefined,
  user: SessionUser | null
): boolean {
  if (!resource || !user || !user.loggedIn) return false;
  return resource.ownerId === user.id;
}

/**
 * Filtra una colección de recursos devolviendo únicamente aquellos que pertenecen al usuario autenticado.
 */
export function filterOwnedResources<T extends OwnedResource>(
  resources: T[],
  user: SessionUser | null
): T[] {
  if (!user || !user.loggedIn) return [];
  return resources.filter((item) => item.ownerId === user.id);
}
