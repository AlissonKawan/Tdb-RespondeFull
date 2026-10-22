import { API_BASE_URL } from '../config/api';
import { apiClient, ApiError, extractErrorMessage } from './apiClient';
import { AUTH_EXPIRED, readSession } from './session';
import type { Mensagem, MensagemRequest } from '../types/AtendimentoApi';

interface UploadMidiaResponse {
  arquivoUrl: string;
  mimeType: string;
}

function urlDaApi(path: string) {
  const baseUrl = new URL(API_BASE_URL, window.location.origin);
  const url = /^https?:\/\//i.test(path)
    ? new URL(path)
    : new URL(`${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, window.location.origin);
  if (url.origin !== baseUrl.origin) {
    throw new ApiError('Endereço de mídia inválido.');
  }
  return url.toString();
}

async function fetchAutenticado(path: string, options?: RequestInit) {
  const token = readSession()?.token;
  const response = await fetch(urlDaApi(path), {
    ...options,
    headers: {
      ...options?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401 && token && readSession()?.token === token) {
    window.dispatchEvent(new Event(AUTH_EXPIRED));
  }
  return response;
}

export const mensagensService = {
  getMensagensAtendimento: (atendimentoId: number) =>
    apiClient.get<Mensagem[]>(`/atendimentos/${atendimentoId}/mensagens`),
  enviarMensagem: (atendimentoId: number, payload: MensagemRequest) =>
    apiClient.post<Mensagem>(`/atendimentos/${atendimentoId}/mensagens`, payload),
  uploadMidia: async (atendimentoId: number, file: File | Blob, extensao?: string): Promise<UploadMidiaResponse> => {
    const formData = new FormData();
    const nomeArquivo = file instanceof File ? file.name : `audio.${extensao ?? 'webm'}`;
    formData.append('file', file, nomeArquivo);
    formData.append('atendimentoId', String(atendimentoId));

    let response: Response;
    try {
      response = await fetchAutenticado('/mensagens/upload', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
    } catch {
      throw new ApiError('Não foi possível enviar o arquivo. Verifique sua conexão.');
    }

    if (!response.ok) {
      throw new ApiError(await extractErrorMessage(response, 'Não foi possível enviar o arquivo.'), response.status);
    }
    return response.json() as Promise<UploadMidiaResponse>;
  },
  carregarMidia: async (arquivoUrl: string): Promise<Blob> => {
    let response: Response;
    try {
      response = await fetchAutenticado(arquivoUrl, { headers: { Accept: 'image/*,audio/*' } });
    } catch {
      throw new ApiError('Não foi possível carregar a mídia. Verifique sua conexão.');
    }
    if (!response.ok) {
      throw new ApiError(await extractErrorMessage(response, 'Não foi possível carregar a mídia.'), response.status);
    }
    return response.blob();
  },
};

