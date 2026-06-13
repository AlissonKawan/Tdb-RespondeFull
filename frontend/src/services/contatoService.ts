import { apiClient } from './apiClient';

export interface MensagemContatoRequest {
  nome: string;
  email: string;
  mensagem: string;
}

export interface MensagemContatoResponse {
  id: number;
  nome: string;
  email: string;
  mensagem: string;
  dataEnvio: string;
  classificacaoIA: string;
  lida: boolean;
}

export const contatoService = {
  enviarMensagem: async (data: MensagemContatoRequest): Promise<MensagemContatoResponse> => {
    return apiClient.post<MensagemContatoResponse>('/contato', data);
  },

  listarMensagens: async (): Promise<MensagemContatoResponse[]> => {
    return apiClient.get<MensagemContatoResponse[]>('/contato');
  },
};
