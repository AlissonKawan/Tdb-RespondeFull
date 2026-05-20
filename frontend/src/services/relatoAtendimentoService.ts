import { apiClient } from './apiClient';
import type { RelatarAtendimentoRequest, RelatarAtendimentoResponse } from '../types/AtendimentoApi';

export async function relatarAtendimento(payload: RelatarAtendimentoRequest): Promise<RelatarAtendimentoResponse | undefined> {
  return apiClient.post<RelatarAtendimentoResponse>('/atendimentos/relatar', payload);
}
