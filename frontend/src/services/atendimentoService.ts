import { ApiError, apiClient } from './apiClient';
import type { AtendimentoApi, SolicitarAtendimentoRequest } from '../types/AtendimentoApi';

export const ASSUMIR_ATENDIMENTO_ENDPOINT_PENDENTE =
  'Endpoint para assumir atendimento ainda nao implementado no back-end.';

export const atendimentoService = {
  listarTodos: () => apiClient.get<AtendimentoApi[]>('/atendimentos'),
  listarSolicitados: () => apiClient.get<AtendimentoApi[]>('/atendimentos/solicitados'),
  listarPorVoluntario: (voluntarioId: number) =>
    apiClient.get<AtendimentoApi[]>(`/atendimentos/voluntario/${voluntarioId}`),
  listarPorBeneficiario: (beneficiarioId: number) =>
    apiClient.get<AtendimentoApi[]>(`/atendimentos/beneficiario/${beneficiarioId}`),
  buscarPorId: (id: number) => apiClient.get<AtendimentoApi>(`/atendimentos/${id}`),
  solicitar: (payload: SolicitarAtendimentoRequest) =>
    apiClient.post<AtendimentoApi>('/atendimentos/solicitar', payload),
  assumirAtendimento: (_atendimentoId: number, _voluntarioId: number): Promise<AtendimentoApi> => {
    // Depende do back-end expor: PUT /atendimentos/{atendimentoId}/assumir
    // Body recomendado: { "voluntarioId": 1 }
    return Promise.reject(new ApiError(ASSUMIR_ATENDIMENTO_ENDPOINT_PENDENTE, 501));
  },
};
