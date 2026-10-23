import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import SystemLayout from './SystemLayout';
import * as useAuthHook from '../../context/useAuth';

vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('SystemLayout', () => {
  it('mantém a saída disponível com conteúdo longo e só encerra a sessão após confirmar', () => {
    const logout = vi.fn();
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: 1, nome: 'Voluntário', email: 'local@example.test', tipoUsuario: 'VOLUNTARIO', ativo: true },
      isVoluntario: true, isBeneficiario: false, isAdmin: false,
      isAuthenticated: true, isLoading: false, authError: '',
      logout, login: vi.fn(), register: vi.fn(),
    });
    render(<MemoryRouter initialEntries={['/portal-voluntario']}>
      <Routes>
        <Route element={<SystemLayout />}>
          <Route path="/portal-voluntario" element={<section>{Array.from({ length: 60 }, (_, i) => <article key={i}>Atendimento {i + 1}</article>)}</section>} />
        </Route>
        <Route path="/login" element={<h1>Entrar na plataforma</h1>} />
      </Routes>
    </MemoryRouter>);

    const sidebar = screen.getByLabelText('Navegação do sistema');
    const exit = within(sidebar).getByRole('button', { name: 'Sair da conta' });
    expect(within(sidebar.querySelector('nav')!).queryByRole('button', { name: 'Sair da conta' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(60);
    fireEvent.click(exit);
    expect(logout).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }));
    expect(logout).not.toHaveBeenCalled();
    fireEvent.click(exit);
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: /^Sair$/ }));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Entrar na plataforma' })).toBeInTheDocument();
  });

  it('renderiza a sidebar com o nome do usuário e botão sair para voluntário', () => {
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: {
        id: 1,
        nome: 'João Silva',
        email: 'joao@example.com',
        tipoUsuario: 'VOLUNTARIO',
        ativo: true,
      },
      isVoluntario: true,
      isBeneficiario: false,
      isAdmin: false,
      isAuthenticated: true,
      isLoading: false,
      authError: '',
      logout: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/agenda']}>
        <SystemLayout />
      </MemoryRouter>
    );

    expect(screen.getByAltText('Turma do Bem')).toHaveAttribute('src', '/img/turmadobem.png');
    const brandLink = screen.getByRole('link', { name: 'TDB Responde — página inicial' });
    expect(within(brandLink).getByRole('presentation')).toHaveAttribute('src', '/img/logo-simbolo.png');
    expect(brandLink).toHaveAttribute('href', '/');
    expect(screen.getAllByText('João Silva')[0]).toBeInTheDocument();
    expect(screen.getByText('VOLUNTÁRIO')).toBeInTheDocument();
    expect(screen.getByText('Portal Voluntário')).toBeInTheDocument();
    expect(screen.getByText('Ranking')).toBeInTheDocument();
    expect(screen.getByText('GESTÃO & CONTROLE')).toBeInTheDocument();
    expect(screen.getByText('CLÍNICA & AGENDA')).toBeInTheDocument();
    expect(screen.getByText('COMUNICAÇÃO')).toBeInTheDocument();

    // Inscrições Pendentes NÃO deve mais aparecer para voluntário comum
    expect(screen.queryByText('Inscrições Pendentes')).not.toBeInTheDocument();

    expect(screen.getByText('Sair da conta')).toBeInTheDocument();
    expect(screen.getByText('Área restrita')).toBeInTheDocument();
    expect(screen.getByText('Minha agenda')).toBeInTheDocument();
  });

  it('renderiza links corretos para beneficiário', () => {
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: {
        id: 2,
        nome: 'Maria Souza',
        email: 'maria@example.com',
        tipoUsuario: 'BENEFICIARIO',
        ativo: true,
      },
      isVoluntario: false,
      isBeneficiario: true,
      isAdmin: false,
      isAuthenticated: true,
      isLoading: false,
      authError: '',
      logout: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
    });

    render(
      <MemoryRouter>
        <SystemLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Portal Beneficiário')).toBeInTheDocument();
    expect(screen.getByText('Solicitar Atendimento')).toBeInTheDocument();
  });

  it('renderiza links corretos para administrador', () => {
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: {
        id: 3,
        nome: 'Admin Chefe',
        email: 'admin@example.com',
        tipoUsuario: 'ADMIN',
        ativo: true,
      },
      isVoluntario: false,
      isBeneficiario: false,
      isAdmin: true,
      isAuthenticated: true,
      isLoading: false,
      authError: '',
      logout: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
    });

    render(
      <MemoryRouter>
        <SystemLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
    expect(screen.getByText('Inscrições Pendentes')).toBeInTheDocument();
    expect(screen.getByText('Portal Voluntário')).toBeInTheDocument();
    expect(screen.getByText('Portal Beneficiário')).toBeInTheDocument();
  });
});
