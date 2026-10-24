const RELOAD_KEY = 'tdb_page_load_reload_at';
const RELOAD_INTERVAL_MS = 60_000;

// Uma aba aberta antes de uma publicação pode tentar buscar arquivos da versão anterior.
export function installPageLoadRecovery(reload = () => window.location.reload()) {
  const recover = () => {
    const now = Date.now();
    try {
      const previous = sessionStorage.getItem(RELOAD_KEY);
      const lastReload = previous === null ? NaN : Number(previous);
      if (Number.isFinite(lastReload) && now - lastReload < RELOAD_INTERVAL_MS) return;

      // Persistir antes de recarregar impede um loop, inclusive após reiniciar a aplicação.
      sessionStorage.setItem(RELOAD_KEY, String(now));
    } catch {
      // Sem armazenamento, não é possível garantir o limite entre recargas.
      console.warn('Recuperação automática da página indisponível: armazenamento da sessão inacessível.');
      return;
    }

    reload();
  };

  // Não suprimir o erro original: se a recuperação falhar, ele continua diagnosticável.
  window.addEventListener('vite:preloadError', recover);
  return () => window.removeEventListener('vite:preloadError', recover);
}
