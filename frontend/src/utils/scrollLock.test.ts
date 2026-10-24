import { describe, it, expect, beforeEach } from 'vitest';
import {
  lockBodyScroll,
  clearAllBodyScrollLocks,
  getBodyScrollLockCount,
} from './scrollLock';

describe('scrollLock utility', () => {
  beforeEach(() => {
    clearAllBodyScrollLocks();
    document.body.style.overflow = '';
  });

  it('trava o body na primeira chamada e restaura ao liberar', () => {
    expect(document.body.style.overflow).toBe('');
    expect(getBodyScrollLockCount()).toBe(0);

    const unlock = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
    expect(getBodyScrollLockCount()).toBe(1);

    unlock();
    expect(document.body.style.overflow).toBe('');
    expect(getBodyScrollLockCount()).toBe(0);
  });

  it('preserva valor customizado anterior de overflow ao destravar', () => {
    document.body.style.overflow = 'auto';
    const unlock = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    unlock();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('suporta travas aninhadas (menu mobile + modal) sem vazar estado hidden', () => {
    // 1. Abre menu lateral mobile
    const unlockSidebar = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
    expect(getBodyScrollLockCount()).toBe(1);

    // 2. Abre modal de confirmação por cima do menu
    const unlockModal = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
    expect(getBodyScrollLockCount()).toBe(2);

    // 3. Fecha modal primeiro (mantém sidebar travada)
    unlockModal();
    expect(document.body.style.overflow).toBe('hidden');
    expect(getBodyScrollLockCount()).toBe(1);

    // 4. Fecha sidebar
    unlockSidebar();
    expect(document.body.style.overflow).toBe('');
    expect(getBodyScrollLockCount()).toBe(0);
  });

  it('evita chamar unlock duplicado da mesma instância', () => {
    const unlock = lockBodyScroll();
    expect(getBodyScrollLockCount()).toBe(1);

    unlock();
    expect(getBodyScrollLockCount()).toBe(0);

    // Chamada redundante
    unlock();
    expect(getBodyScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe('');
  });

  it('limpa forçadamente todas as travas residuais com clearAllBodyScrollLocks', () => {
    lockBodyScroll();
    lockBodyScroll();
    expect(getBodyScrollLockCount()).toBe(2);
    expect(document.body.style.overflow).toBe('hidden');

    clearAllBodyScrollLocks();
    expect(getBodyScrollLockCount()).toBe(0);
    expect(document.body.style.overflow).toBe('');
  });
});
