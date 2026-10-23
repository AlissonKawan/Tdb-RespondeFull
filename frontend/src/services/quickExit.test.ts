import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { quickExit } from './quickExit';
import { authService } from './authService';
import { readSession, saveSession } from './session';

vi.mock('./authService', () => ({ authService: { logout: vi.fn() } }));
const replace = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  vi.stubGlobal('location', { replace });
  saveSession({ token: 'credencial-de-teste', expiresAt: '2099-01-01' });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('saída rápida', () => {
  it('limpa a sessão e substitui a página sem esperar pela rede', () => {
    vi.mocked(authService.logout).mockImplementation(() => {
      expect(readSession()?.token).toBe('credencial-de-teste');
      return new Promise(() => {});
    });
    quickExit();
    expect(readSession()).toBeNull();
    expect(authService.logout).toHaveBeenCalledWith({ keepalive: true });
    expect(replace).toHaveBeenCalledExactlyOnceWith('https://www.youtube.com/');
  });

  it('continua saindo quando o servidor recusa a revogação', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.mocked(authService.logout).mockRejectedValue(new Error('offline'));
    quickExit();
    await Promise.resolve();
    expect(replace).toHaveBeenCalledOnce();
    expect(readSession()).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
  });

  it('continua navegando mesmo se o armazenamento local estiver indisponível', () => {
    vi.mocked(authService.logout).mockResolvedValue();
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('bloqueado'); });
    expect(() => quickExit()).toThrow('bloqueado');
    expect(replace).toHaveBeenCalledOnce();
  });
});
