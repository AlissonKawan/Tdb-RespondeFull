import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import SystemLayout from './SystemLayout';
import * as useAuthHook from '../../context/useAuth';

vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('SystemLayout', () => {
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
      logout: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
    });

    render(
      <MemoryRouter>
        <SystemLayout />
      </MemoryRouter>
    );

    expect(screen.getByText('Turma do Bem')).toBeInTheDocument();
    expect(screen.getByText('Olá, João Silva')).toBeInTheDocument();
    expect(screen.getByText('Portal Voluntário')).toBeInTheDocument();
    expect(screen.getByText('Ranking')).toBeInTheDocument();

    // Inscrições Pendentes NÃO deve mais aparecer para voluntário comum
    expect(screen.queryByText('Inscrições Pendentes')).not.toBeInTheDocument();

    expect(screen.getByText('Sair')).toBeInTheDocument();
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
