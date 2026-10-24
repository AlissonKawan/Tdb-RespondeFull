import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPageLoadRecovery } from './pageLoadRecovery';

describe('recuperação do carregamento de páginas', () => {
  let dispose: (() => void) | undefined;
  const reload = vi.fn();
  const fail = () => window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));

  beforeEach(() => {
    sessionStorage.clear();
    reload.mockReset();
    vi.spyOn(Date, 'now').mockReturnValue(100_000);
    dispose = installPageLoadRecovery(reload);
  });

  afterEach(() => {
    dispose?.();
    vi.restoreAllMocks();
  });

  it('recarrega na falha de um arquivo da página sem alterar a URL ou a sessão', () => {
    window.history.replaceState({}, '', '/sobre?origem=menu#projeto');
    sessionStorage.setItem('tdb_session', 'sessao-preservada');
    expect(fail()).toBe(true); // O erro original não é suprimido.
    expect(reload).toHaveBeenCalledOnce();
    expect(window.location.pathname + window.location.search + window.location.hash)
      .toBe('/sobre?origem=menu#projeto');
    expect(sessionStorage.getItem('tdb_session')).toBe('sessao-preservada');
  });

  it('impede recargas repetidas, inclusive após reinicializar a aplicação', () => {
    fail();
    fail();
    dispose?.();
    dispose = installPageLoadRecovery(reload);
    fail();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('permite recuperar uma nova falha depois do intervalo de proteção', () => {
    fail();
    vi.mocked(Date.now).mockReturnValue(160_000);
    fail();
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it.each(['getItem', 'setItem'] as const)('evita loops se %s estiver bloqueado', (method) => {
    vi.spyOn(Storage.prototype, method).mockImplementation(() => { throw new Error('Bloqueado'); });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(fail()).toBe(true);
    expect(reload).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledOnce();
  });

  it('não recarrega por erros comuns de execução ou de API', () => {
    window.dispatchEvent(new Event('error'));
    expect(reload).not.toHaveBeenCalled();
  });

  it('remove o listener ao encerrar o registro', () => {
    dispose?.();
    fail();
    expect(reload).not.toHaveBeenCalled();
  });
});
