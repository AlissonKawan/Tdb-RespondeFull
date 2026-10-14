import type { ReactNode } from 'react';
import { useAuth } from '../../context/useAuth';
import { LoadingState } from './FeedbackState';
export default function SessionGate({ children }: { children: ReactNode }) {
  const { isLoading, authError } = useAuth();
  if (isLoading) return <div className="min-h-dvh bg-background p-6 md:p-10"><LoadingState title="Validando sua sessão..." count={3} /></div>;
  if (authError) return <div role="alert" className="p-8 text-center">
    <p>{authError}</p>
    <button className="mt-4 text-blue-700 underline" onClick={() => window.location.reload()}>Tentar novamente</button>
  </div>;
  return <>{children}</>;
}
