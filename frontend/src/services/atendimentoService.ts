import { apiClient } from './apiClient';
import type { AtendimentoApi, SolicitarAtendimentoRequest } from '../types/AtendimentoApi';

export const atendimentoService = {
  listarTodos: () => apiClient.get<AtendimentoApi[]>('/atendimentos'),
  listarSolicitados: () => apiClient.get<AtendimentoApi[]>('/atendimentos/solicitados'),
  listarPorVoluntario: (voluntarioId: number) =>
    apiClient.get<AtendimentoApi[]>(`/atendimentos/voluntario/${voluntarioId}`),
  listarPorBeneficiario: (beneficiarioId: number) =>
    apiClient.get<AtendimentoApi[]>(`/atendimentos/beneficiario/${beneficiarioId}`),
  listarPorContaBeneficiario: (contaId: number) =>
    apiClient.get<AtendimentoApi[]>(`/atendimentos/beneficiario/conta/${contaId}`),
  buscarPorId: (id: number) => apiClient.get<AtendimentoApi>(`/atendimentos/${id}`),
  solicitar: (payload: SolicitarAtendimentoRequest) =>
    apiClient.post<AtendimentoApi>('/atendimentos/solicitar', payload),
  assumirAtendimento: (atendimentoId: number, voluntarioId: number) =>
    apiClient.put<AtendimentoApi>(`/atendimentos/${atendimentoId}/assumir`, { voluntarioId }),
  atualizarStatusPrioridade: (atendimentoId: number, payload: { status?: string; prioridade?: number }) =>
    apiClient.put<AtendimentoApi>(`/atendimentos/${atendimentoId}/status-prioridade`, payload),
  atualizarCheckin: (id: number, statusCheckin: string) =>
    apiClient.put<AtendimentoApi>(`/atendimentos/${id}/checkin`, { statusCheckin }),
};
