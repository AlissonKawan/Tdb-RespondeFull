import { apiClient } from './apiClient';
import type { Mensagem, MensagemRequest } from '../types/AtendimentoApi';

export const mensagensService = {
  getMensagensAtendimento: (atendimentoId: number) =>
    apiClient.get<Mensagem[]>(`/atendimentos/${atendimentoId}/mensagens`),
  enviarMensagem: (atendimentoId: number, payload: MensagemRequest) =>
    apiClient.post<Mensagem>(`/atendimentos/${atendimentoId}/mensagens`, payload),
};

