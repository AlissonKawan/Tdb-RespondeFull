import { useEffect, useState, type ReactNode } from 'react';
import { authService } from '../services/authService';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth';
import { AuthContext } from './authContextInstance';

const STORAGE_KEY = 'tdb_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login = async (data: LoginRequest) => {
    const loggedUser = await authService.login(data);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (data: RegisterRequest) => {
    return authService.register(data);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user),
        isVoluntario: user?.tipoUsuario === 'VOLUNTARIO',
        isBeneficiario: user?.tipoUsuario === 'BENEFICIARIO',
        isAdmin: user?.tipoUsuario === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

