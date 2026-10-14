import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Home from './Home';

vi.mock('../components/ui/HeroDashboardCard', () => ({
  default: () => <div aria-label="Exemplo de triagem com dados protegidos" />,
}));

describe('Home', () => {
  it('exibe a identidade institucional e a nova hierarquia de ações', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Rede de Solidariedade Odontológica/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Acessar Plataforma' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Seja um Dentista Voluntário' })).toHaveAttribute(
      'href',
      '/quero-ser-voluntario',
    );
    expect(screen.getByRole('link', { name: 'Conheça a Turma do Bem' })).toHaveAttribute('href', '/sobre');
  });

  it('não renderiza nem grava contador local de visitas', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/visitas à plataforma/i)).not.toBeInTheDocument();
    expect(setItemSpy).not.toHaveBeenCalled();

    setItemSpy.mockRestore();
  });
});
