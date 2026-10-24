import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { clearAllBodyScrollLocks } from '../../utils/scrollLock';

/**
 * Garante a liberação de qualquer trava de rolagem no body e reposiciona a janela
 * no topo da tela a cada mudança de rota na navegação mobile e desktop.
 */
export default function RouteScrollManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Limpa travas herdadas de modais, diálogos ou menus que possam ter vazado
    clearAllBodyScrollLocks();

    // 2. Reposiciona o scroll no topo de forma instantânea, sem atrasos de animação
    if (typeof window !== 'undefined') {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch {
        window.scrollTo(0, 0);
      }
    }
  }, [pathname]);

  return null;
}
