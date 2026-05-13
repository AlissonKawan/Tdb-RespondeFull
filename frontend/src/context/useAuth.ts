// src/context/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from './authContextInstance';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}