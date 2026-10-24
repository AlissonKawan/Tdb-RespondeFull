let lockCount = 0;
let previousOverflow = '';

/**
 * Trava o scroll do body de forma segura e com suporte a travas aninhadas
 * (ex.: menu lateral mobile aberto + modal de confirmação aberto ao mesmo tempo).
 * Retorna uma função de liberação para ser chamada no cleanup do efeito.
 */
export function lockBodyScroll(): () => void {
  if (typeof document === 'undefined') return () => {};

  if (lockCount === 0) {
    const current = document.body.style.overflow;
    // Se por acaso já estava 'hidden' por vazamento anterior, tratamos como limpo
    previousOverflow = current === 'hidden' ? '' : current;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.overflow = previousOverflow || '';
      previousOverflow = '';
    }
  };
}

/**
 * Limpa imediatamente qualquer trava pendente do body (útil ao mudar de rota ou deslogar).
 */
export function clearAllBodyScrollLocks(): void {
  if (typeof document === 'undefined') return;
  lockCount = 0;
  previousOverflow = '';
  document.body.style.overflow = '';
}

export function getBodyScrollLockCount(): number {
  return lockCount;
}
