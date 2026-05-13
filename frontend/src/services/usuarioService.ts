import { apiClient } from './apiClient';
import type { AuthUser } from '../types/auth';

export const usuarioService = {
  listar: () => apiClient.get<AuthUser[]>('/usuarios'),
  buscarPorId: (id: number) => apiClient.get<AuthUser>(`/usuarios/${id}`),
  atualizar: (id: number, data: Partial<Omit<AuthUser, 'id'>>) =>
    apiClient.put<AuthUser>(`/usuarios/${id}`, data),
  excluir: (id: number) => apiClient.del<void>(`/usuarios/${id}`),
};

