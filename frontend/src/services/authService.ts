import { apiClient } from './apiClient';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth';

export const authService = {
  register: (data: RegisterRequest) => apiClient.post<AuthUser>('/auth/register', data),
  login: (data: LoginRequest) => apiClient.post<{ user: AuthUser; token: string; expiresAt: string }>('/auth/login', data),
  me: () => apiClient.get<AuthUser>('/auth/me'),
  logout: (options?: { keepalive?: boolean }) => apiClient.post<void>('/auth/logout', undefined, options),
};

