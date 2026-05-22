import { API_BASE_URL } from '../config/api';
import type { ApiRequestOptions } from '../types/api';

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status = 0, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function friendlyMessage(status: number, path: string) {
  if (status === 400) return 'Dados invalidos. Confira os campos e tente novamente.';
  if (status === 401) return 'Credenciais invalidas ou sessao expirada.';
  if (status === 403) return 'Acesso negado ou conta ainda nao liberada.';
  if (status === 404) return 'Registro nao encontrado.';
  if (status === 409) return 'Registro em conflito. Verifique os dados enviados.';
  if (status >= 500) return 'Erro interno da API. Tente novamente em instantes.';
  return `Nao foi possivel concluir a chamada ${path}.`;
}

export async function extractErrorMessage(response: Response, fallback?: string) {
  const text = await response.text();
  if (!text.trim()) return fallback || friendlyMessage(response.status, response.url || 'da API');

  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    return String(data.mensagem ?? data.message ?? data.erro ?? data.error ?? data.detail ?? fallback ?? text);
  } catch {
    return text;
  }
}

export async function request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, ...requestOptions } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Nao foi possivel conectar com a API. Verifique se o back-end esta rodando.');
  }

  const text = await response.text();

  if (!response.ok) {
    let message = friendlyMessage(response.status, path);
    let details: unknown = text;

    if (text) {
      try {
        const data = JSON.parse(text) as Record<string, unknown>;
        details = data;
        message = String(data.mensagem ?? data.message ?? data.erro ?? data.error ?? data.detail ?? message);
      } catch {
        message = text;
      }
    }

    throw new ApiError(message, response.status, details);
  }

  if (!text.trim()) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('A API retornou um JSON invalido.', response.status, text);
  }
}

export const apiRequest = request;

export const apiClient = {
  get: <T>(path: string, options?: ApiRequestOptions) => {
    // Para evitar cache sem causar erro de CORS, usamos url params ou apenas 'cache: no-store' sem Headers extras.
    const urlSep = path.includes('?') ? '&' : '?';
    const noCachePath = `${path}${urlSep}t=${Date.now()}`;
    return request<T>(noCachePath, { ...options, method: 'GET' });
  },
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  del: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
