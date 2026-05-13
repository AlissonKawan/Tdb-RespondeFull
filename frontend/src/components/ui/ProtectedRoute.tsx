// src/components/ui/ProtectedRoute.tsx
// Redireciona para /login se não estiver logado.
// Se "requireVoluntario" for true, bloqueia beneficiários.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import type { TipoUsuario } from '../../types/auth';

interface Props {
  children: React.ReactNode;
  requireVoluntario?: boolean;
  allowedRoles?: TipoUsuario[];
}

function ProtectedRoute({ children, requireVoluntario = false, allowedRoles }: Props) {
  const { user, isVoluntario, isAdmin } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (requireVoluntario && !isVoluntario && !isAdmin) return <Navigate to="/portal-beneficiario" replace />;
  if (allowedRoles && !allowedRoles.includes(user.tipoUsuario)) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export default ProtectedRoute;
