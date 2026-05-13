import { apiClient } from './apiClient';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types/auth';

export const authService = {
  register: (data: RegisterRequest) => apiClient.post<AuthUser>('/auth/register', data),
  login: (data: LoginRequest) => apiClient.post<AuthUser>('/auth/login', data),
};

