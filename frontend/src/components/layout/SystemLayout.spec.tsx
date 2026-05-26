import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import SystemLayout from './SystemLayout';
import * as useAuthHook from '../../context/useAuth';

// Faz o mock do hook de autenticação
vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('SystemLayout', () => {
  it('renderiza a sidebar com o nome do usuário e botão sair para voluntário', () => {
    // Definindo o retorno simulado do useAuth
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

    // Verifica se a marca/logo da plataforma aparece
    expect(screen.getByText('Turma do Bem')).toBeInTheDocument();
    
    // Verifica se o nome do usuário logado aparece corretamente
    expect(screen.getByText('Olá, João Silva')).toBeInTheDocument();

    // Verifica se os links específicos do voluntário aparecem
    expect(screen.getByText('Portal Voluntário')).toBeInTheDocument();
    expect(screen.getByText('Inscrições Pendentes')).toBeInTheDocument();
    expect(screen.getByText('Ranking')).toBeInTheDocument();

    // Verifica se o botão sair aparece
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

    // Verifica se os links específicos do beneficiário aparecem
    expect(screen.getByText('Portal Beneficiário')).toBeInTheDocument();
    expect(screen.getByText('Solicitar Atendimento')).toBeInTheDocument();
  });
});
