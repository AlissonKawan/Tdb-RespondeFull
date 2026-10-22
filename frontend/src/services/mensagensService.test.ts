import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mensagensService } from './mensagensService';
import { saveSession } from './session';

beforeEach(() => {
  sessionStorage.clear();
  saveSession({ token: 'x'.repeat(43), expiresAt: new Date(Date.now() + 10000).toISOString() });
});
afterEach(() => vi.unstubAllGlobals());

it('pagina mensagens na rota existente e preserva a chamada sem parametros', async () => {
  const fetchMock = vi.fn().mockImplementation(async () => new Response('[]'));
  vi.stubGlobal('fetch', fetchMock);
  await mensagensService.getMensagensAtendimento(42, { limite: 50, antesId: 81 });
  expect(fetchMock.mock.calls[0][0]).toMatch(/\/atendimentos\/42\/mensagens\?limite=50&antesId=81$/);
  await mensagensService.getMensagensAtendimento(42);
  expect(fetchMock.mock.calls[1][0]).toMatch(/\/atendimentos\/42\/mensagens$/);
});

it('envia atendimento e credencial junto ao arquivo', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ arquivoUrl: '/mensagens/midia/1-foto.png', mimeType: 'image/png' }), { status: 201 }));
  vi.stubGlobal('fetch', fetchMock);
  const file = new File(['foto'], 'foto.png', { type: 'image/png' });
  await mensagensService.uploadMidia(1, file);
  const options = fetchMock.mock.calls[0][1];
  expect(options.body.get('atendimentoId')).toBe('1');
  expect(options.body.get('file').name).toBe('foto.png');
  expect(options.headers.Authorization).toBe(`Bearer ${'x'.repeat(43)}`);
});

it('mantem o contexto do atendimento tambem para audio', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 201 }));
  vi.stubGlobal('fetch', fetchMock);
  await mensagensService.uploadMidia(42, new Blob(['audio'], { type: 'audio/webm' }), 'webm');
  const form = fetchMock.mock.calls[0][1].body;
  expect(form.get('atendimentoId')).toBe('42');
  expect(form.get('file').name).toBe('audio.webm');
});

it('propaga negacao de acesso ao baixar midia', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"message":"Acesso negado"}', { status: 403 })));
  await expect(mensagensService.carregarMidia('/mensagens/midia/foto.png')).rejects.toMatchObject({ status: 403 });
});
