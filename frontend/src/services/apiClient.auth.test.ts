import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { request } from './apiClient';
import { AUTH_EXPIRED, saveSession } from './session';
beforeEach(() => { sessionStorage.clear(); });
afterEach(() => { vi.unstubAllGlobals(); });
it('envia a credencial e sinaliza expiração em 401', async () => {
  saveSession({ token: 'x'.repeat(43), expiresAt: new Date(Date.now() + 10000).toISOString() });
  const fetchMock = vi.fn().mockResolvedValue(new Response('{"message":"expirada"}', { status: 401 }));
  vi.stubGlobal('fetch', fetchMock);
  const listener = vi.fn(); window.addEventListener(AUTH_EXPIRED, listener);
  await expect(request('/atendimentos')).rejects.toMatchObject({ status: 401 });
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${'x'.repeat(43)}`);
  expect(listener).toHaveBeenCalledOnce();
  window.removeEventListener(AUTH_EXPIRED, listener);
});
it('não confunde falta de permissão 403 com sessão expirada', async () => {
  saveSession({ token: 'x'.repeat(43), expiresAt: new Date(Date.now() + 10000).toISOString() });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })));
  const listener = vi.fn(); window.addEventListener(AUTH_EXPIRED, listener);
  await expect(request('/usuarios')).rejects.toMatchObject({ status: 403 });
  expect(listener).not.toHaveBeenCalled();
  window.removeEventListener(AUTH_EXPIRED, listener);
});
