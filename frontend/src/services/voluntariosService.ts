import { apiClient } from './apiClient';
import type { VoluntarioApi, VoluntarioRequestApi } from '../types/api';

export interface Voluntario {
  id: number;
  nome: string;
  usuario?: string;
  disponivel: boolean;
  acessoSigilo?: boolean;
  contaId?: number;
  statusAprovacao?: 'PENDENTE' | 'APROVADO' | 'RECUSADO';
  motivoVoluntariado?: string;
  especialidade?: {
    id: number;
    nome: string;
  };
}

export const voluntariosService = {
  listar: () => apiClient.get<VoluntarioApi[]>('/voluntarios'),
  buscarPorId: (id: number) => apiClient.get<VoluntarioApi>(`/voluntarios/${id}`),
  criar: (payload: VoluntarioRequestApi) => apiClient.post<VoluntarioApi>('/voluntarios', payload),
  atualizar: (id: number, payload: VoluntarioRequestApi) =>
    apiClient.put<VoluntarioApi>(`/voluntarios/${id}`, payload),
  excluir: (id: number) => apiClient.delete<void>(`/voluntarios/${id}`),
  listarPendentes: () => apiClient.get<Voluntario[]>('/voluntarios/pendentes'),
  aprovar: (id: number) => apiClient.put<void>(`/voluntarios/${id}/aprovar`),
};

export const getVoluntarios = voluntariosService.listar;
export const createVoluntario = voluntariosService.criar;
export const getVoluntariosPendentes = voluntariosService.listarPendentes;
export const aprovarVoluntario = voluntariosService.aprovar;
