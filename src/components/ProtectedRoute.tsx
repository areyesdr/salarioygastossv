import { Navigate, Outlet } from 'react-router-dom';

export interface ProtectedRouteProps {
  isAllowed: boolean;
  redirectTo?: string;
}

export const ProtectedRoute = ({ isAllowed, redirectTo = '/login' }: ProtectedRouteProps) => {
  // Si el usuario no cumple la condición (no está logueado o no tiene rol), se le deniega el acceso
  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si cumple, renderiza la página interna de forma segura
  return <Outlet />;
};
