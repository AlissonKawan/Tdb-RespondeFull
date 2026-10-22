import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { saveSession, clearSession } from './session';

beforeEach(() => clearSession());
afterEach(() => vi.unstubAllGlobals());

function pendente() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>(r => { resolve = r; });
  return { promise, resolve };
}

it('compartilha GETs simultaneos com copias independentes e volta ao servidor na proxima leitura', async () => {
  const resposta = pendente();
  const fetchMock = vi.fn().mockReturnValueOnce(resposta.promise)
    .mockResolvedValueOnce(new Response('[{"id":2}]'));
  vi.stubGlobal('fetch', fetchMock);
  const a = apiClient.get<{ id: number }[]>('/performance-simultaneo');
  const b = apiClient.get<{ id: number }[]>('/performance-simultaneo');
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][0]).toMatch(/\/performance-simultaneo$/);
  expect(fetchMock.mock.calls[0][1].cache).toBe('no-store');
  resposta.resolve(new Response('[{"id":1}]'));
  const [primeiro, segundo] = await Promise.all([a, b]);
  primeiro[0].id = 99;
  expect(segundo[0].id).toBe(1);
  expect(await apiClient.get('/performance-simultaneo')).toEqual([{ id: 2 }]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it('nao compartilha leitura de outra sessao nem reaproveita a leitura antiga apos sua conclusao', async () => {
  const antiga = pendente(); const atual = pendente();
  const fetchMock = vi.fn().mockReturnValueOnce(antiga.promise).mockReturnValueOnce(atual.promise);
  vi.stubGlobal('fetch', fetchMock);
  saveSession({ token: 'conta-a', expiresAt: '2099-01-01' });
  const a = apiClient.get('/performance-sessao');
  saveSession({ token: 'conta-b', expiresAt: '2099-01-01' });
  const b = apiClient.get('/performance-sessao');
  antiga.resolve(new Response('{"conta":"a"}')); await a;
  const c = apiClient.get('/performance-sessao');
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer conta-b');
  atual.resolve(new Response('{"conta":"b"}'));
  expect(await b).toEqual({ conta: 'b' }); expect(await c).toEqual({ conta: 'b' });
});

it('uma escrita impede novas leituras de aderirem a uma resposta anterior', async () => {
  const antiga = pendente();
  const fetchMock = vi.fn().mockReturnValueOnce(antiga.promise)
    .mockResolvedValueOnce(new Response('{}'))
    .mockResolvedValueOnce(new Response('{"versao":2}'));
  vi.stubGlobal('fetch', fetchMock);
  const a = apiClient.get('/performance-escrita');
  await apiClient.put('/performance-escrita', { versao: 2 });
  expect(await apiClient.get('/performance-escrita')).toEqual({ versao: 2 });
  antiga.resolve(new Response('{"versao":1}')); await a;
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

it('falhas nao ficam retidas e chamadas cancelaveis sao independentes', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(new Response('{}', { status: 403 }))
    .mockImplementation(async () => new Response('[]'));
  vi.stubGlobal('fetch', fetchMock);
  await expect(apiClient.get('/performance-falha')).rejects.toMatchObject({ status: 403 });
  expect(await apiClient.get('/performance-falha')).toEqual([]);
  const controller = new AbortController();
  await Promise.all([
    apiClient.get('/performance-sinal', { signal: controller.signal }),
    apiClient.get('/performance-sinal'),
  ]);
  expect(fetchMock).toHaveBeenCalledTimes(4);
  expect(fetchMock.mock.calls[2][1].signal).toBe(controller.signal);
});
