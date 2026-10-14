import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { authService } from '../services/authService';
import { ApiError } from '../services/apiClient';
import { AUTH_EXPIRED, clearSession, readSession, saveSession } from '../services/session';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth';
import { AuthContext } from './authContextInstance';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const generation = useRef(0);
  const reset = useCallback(() => {
    generation.current++;
    clearSession();
    setUser(null);
    setAuthError('');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    localStorage.removeItem('tdb_auth_user');
    let cancelled = false;
    const validate = async () => {
      const current = generation.current;
      const token = readSession()?.token;
      if (!token) { setIsLoading(false); return; }
      try {
        const verified = await authService.me();
        if (!cancelled && current === generation.current && readSession()?.token === token) {
          setUser(verified);
          setAuthError('');
        }
      } catch (error) {
        if (cancelled || current !== generation.current) return;
        if (error instanceof ApiError && error.status === 401) reset();
        else {
          setUser(null);
          setAuthError('Não foi possível validar sua sessão. Verifique a conexão e tente novamente.');
        }
      } finally {
        if (!cancelled && current === generation.current) setIsLoading(false);
      }
    };
    void validate();
    const focus = () => { void validate(); };
    window.addEventListener(AUTH_EXPIRED, reset);
    window.addEventListener('focus', focus);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_EXPIRED, reset);
      window.removeEventListener('focus', focus);
    };
  }, [reset]);

  useEffect(() => {
    if (!user) return;
    const expiresAt = Date.parse(readSession()?.expiresAt || '');
    if (!Number.isFinite(expiresAt)) { reset(); return; }
    const timer = window.setTimeout(reset, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [user, reset]);

  const login = async (data: LoginRequest) => {
    const result = await authService.login(data);
    generation.current++;
    saveSession(result);
    setUser(result.user);
    setAuthError('');
    setIsLoading(false);
    return result.user;
  };
  const logout = () => {
    // request() captura a credencial antes da limpeza local.
    void authService.logout().catch(() => {});
    reset();
  };
  const register = (data: RegisterRequest) => authService.register(data);
  return <AuthContext.Provider value={{ user, login, register, logout, isLoading, authError,
    isAuthenticated: Boolean(user), isVoluntario: user?.tipoUsuario === 'VOLUNTARIO',
    isBeneficiario: user?.tipoUsuario === 'BENEFICIARIO', isAdmin: user?.tipoUsuario === 'ADMIN',
  }}>{children}</AuthContext.Provider>;
}
