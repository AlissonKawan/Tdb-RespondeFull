import { render } from '@testing-library/react';
import { MemoryRouter, Link, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RouteScrollManager from './RouteScrollManager';
import { lockBodyScroll } from '../../utils/scrollLock';

describe('RouteScrollManager', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  it('limpa trava do body e rola a tela para o topo ao mudar de rota', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    // Simula uma trava ativa deixada por um modal/menu anterior
    lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    const { getByRole, findByText } = render(
      <MemoryRouter initialEntries={['/']}>
        <RouteScrollManager />
        <nav>
          <Link to="/sobre">Ir para Sobre</Link>
        </nav>
        <Routes>
          <Route path="/" element={<div>Página Home</div>} />
          <Route path="/sobre" element={<div>Página Sobre</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
    expect(document.body.style.overflow).toBe('');

    // Re-trava antes da navegação
    lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    getByRole('link', { name: 'Ir para Sobre' }).click();
    await findByText('Página Sobre');

    expect(document.body.style.overflow).toBe('');
    expect(scrollToSpy).toHaveBeenCalledTimes(2);

    scrollToSpy.mockRestore();
  });
});
