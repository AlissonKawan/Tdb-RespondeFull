import { API_BASE_URL } from '../config/api';
import { apiClient } from './apiClient';
export async function openChatSocket(atendimentoId: number, clientId: string): Promise<WebSocket> {
  const { ticket } = await apiClient.post<{ ticket: string }>('/auth/ws-ticket', { atendimentoId });
  const base = API_BASE_URL.replace(/\/$/, '').replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  // Ticket de uso único (30s); a credencial da sessão nunca entra na URL.
  return new WebSocket(`${base}/chat/${atendimentoId}/${encodeURIComponent(clientId)}?ticket=${encodeURIComponent(ticket)}`);
}
