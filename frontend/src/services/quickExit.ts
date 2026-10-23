import { authService } from './authService';
import { AUTH_EXPIRED, clearSession } from './session';

export function quickExit() {
  try {
    // Captura a credencial antes da limpeza; a navegação não espera pela rede.
    void authService.logout({ keepalive: true }).catch(() => {
      console.warn('Não foi possível confirmar o encerramento da sessão no servidor.');
    });
  } finally {
    try {
      clearSession();
      window.dispatchEvent(new Event(AUTH_EXPIRED));
    } finally {
      window.location.replace('https://www.youtube.com/');
    }
  }
}
