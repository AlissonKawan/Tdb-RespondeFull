import { describe, it, expect, vi } from 'vitest';
import { contatoService } from './contatoService';
import { apiClient } from './apiClient';

vi.mock('./apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('contatoService', () => {
  it('deve enviar uma mensagem com sucesso', async () => {
    const mockRequest = { nome: 'João', email: 'joao@teste.com', mensagem: 'Olá' };
    const mockResponse = { ...mockRequest, id: 1, dataEnvio: '2023-01-01', classificacaoIA: 'informativo', lida: false };
    
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    const resposta = await contatoService.enviarMensagem(mockRequest);

    expect(apiClient.post).toHaveBeenCalledWith('/contato', mockRequest);
    expect(resposta).toEqual(mockResponse);
  });

  it('deve listar mensagens com sucesso', async () => {
    const mockResponse = [
      { id: 1, nome: 'João', email: 'joao@teste.com', mensagem: 'Olá', dataEnvio: '2023-01-01', classificacaoIA: 'informativo', lida: false }
    ];
    
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse);

    const resposta = await contatoService.listarMensagens();

    expect(apiClient.get).toHaveBeenCalledWith('/contato');
    expect(resposta).toEqual(mockResponse);
  });
});
