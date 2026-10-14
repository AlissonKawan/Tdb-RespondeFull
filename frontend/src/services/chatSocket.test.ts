import { afterEach, expect, it, vi } from 'vitest';
import { openChatSocket } from './chatSocket';
import { apiClient } from './apiClient';
vi.mock('./apiClient', () => ({ apiClient: { post: vi.fn() } }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
it('solicita ticket autenticado antes de abrir o chat', async () => {
  vi.mocked(apiClient.post).mockResolvedValue({ ticket: 'ticket-unico' });
  class MockWebSocket {
    url: string;

    constructor(url: string) {
      this.url = url;
    }
  }
  const socket = vi.fn(MockWebSocket);
  vi.stubGlobal('WebSocket', socket);
  await openChatSocket(12, 'cliente');
  expect(apiClient.post).toHaveBeenCalledWith('/auth/ws-ticket', { atendimentoId: 12 });
  expect(socket).toHaveBeenCalledWith(expect.stringContaining('/chat/12/cliente?ticket=ticket-unico'));
});
it('não abre conexão quando a sessão ou o vínculo é negado', async () => {
  vi.mocked(apiClient.post).mockRejectedValue(new Error('negado'));
  const socket = vi.fn(); vi.stubGlobal('WebSocket', socket);
  await expect(openChatSocket(12, 'cliente')).rejects.toThrow('negado');
  expect(socket).not.toHaveBeenCalled();
});
