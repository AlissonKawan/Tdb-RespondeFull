import { API_BASE_URL } from '../config/api';
import type { RelatarAtendimentoRequest, RelatarAtendimentoResponse } from '../types/AtendimentoApi';

async function extrairMensagemErro(response: Response) {
  const text = await response.text();
  if (!text.trim()) return 'Nao foi possivel enviar o relato. Tente novamente.';

  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    return String(data.mensagem ?? data.message ?? data.erro ?? data.error ?? data.detail ?? text);
  } catch {
    return text;
  }
}

export async function relatarAtendimento(payload: RelatarAtendimentoRequest): Promise<RelatarAtendimentoResponse | undefined> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/atendimentos/relatar`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Nao foi possivel conectar com a API. Verifique se o back-end esta rodando.');
  }

  if (!response.ok) {
    throw new Error(await extrairMensagemErro(response));
  }

  const text = await response.text();
  return text.trim() ? (JSON.parse(text) as RelatarAtendimentoResponse) : undefined;
}
