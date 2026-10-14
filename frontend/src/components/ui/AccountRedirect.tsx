import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import type { TipoUsuario } from '../../types/auth';
export function portalFor(role: TipoUsuario) {
  return role === 'ADMIN' ? '/admin' : role === 'VOLUNTARIO' ? '/portal-voluntario' : '/portal-beneficiario';
}
export function AccountRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? portalFor(user.tipoUsuario) : '/login'} replace />;
}
export function GuestOnly() {
  const { user } = useAuth();
  return user ? <AccountRedirect /> : <Outlet />;
}
