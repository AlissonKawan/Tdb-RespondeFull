import { createContext } from 'react';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth';

export interface AuthContextType {
  user: AuthUser | null;
  login: (data: LoginRequest) => Promise<AuthUser>;
  register: (data: RegisterRequest) => Promise<AuthUser>;
  logout: () => void;
  isAuthenticated: boolean;
  isVoluntario: boolean;
  isBeneficiario: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

