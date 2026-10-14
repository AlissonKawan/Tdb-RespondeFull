import type { ReactNode } from 'react';
import { useAuth } from '../../context/useAuth';
export default function SessionGate({ children }: { children: ReactNode }) {
  const { isLoading, authError } = useAuth();
  if (isLoading) return <div role="status" className="p-8 text-center">Validando sua sessão...</div>;
  if (authError) return <div role="alert" className="p-8 text-center">
    <p>{authError}</p>
    <button className="mt-4 text-blue-700 underline" onClick={() => window.location.reload()}>Tentar novamente</button>
  </div>;
  return <>{children}</>;
}
