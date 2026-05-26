import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardAdmin from '../Dashboardadmin';
import * as useAuthHook from '../../context/useAuth';
import { atendimentoService } from '../../services/atendimentoService';
import { voluntariosService } from '../../services/voluntariosService';
import { usuarioService } from '../../services/usuarioService';

vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/atendimentoService', () => ({
  atendimentoService: {
    listarTodos: vi.fn().mockResolvedValue([]),
    solicitar: vi.fn().mockResolvedValue({}),
    atualizarStatusPrioridade: vi.fn().mockResolvedValue({}),
  }
}));

vi.mock('../../services/voluntariosService', () => ({
  voluntariosService: {
    listar: vi.fn().mockResolvedValue([]),
    listarPendentes: vi.fn().mockResolvedValue([]),
    aprovar: vi.fn().mockResolvedValue({}),
    excluir: vi.fn().mockResolvedValue({}),
  }
}));

vi.mock('../../services/usuarioService', () => ({
  usuarioService: {
    listar: vi.fn().mockResolvedValue([]),
  }
}));

vi.mock('../../services/especialidadesService', () => ({
  getEspecialidades: vi.fn().mockResolvedValue([]),
}));

describe('DashboardAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o título correto e carregar abas', async () => {
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: 3, nome: 'Admin Chefe', email: 'admin@example.com', tipoUsuario: 'ADMIN', ativo: true },
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
        <DashboardAdmin />
      </MemoryRouter>
    );

    // O Dashboard começa mostrando loading até que os dados sejam buscados
    expect(screen.getByText('Carregando sistema...')).toBeInTheDocument();

    await waitFor(() => {
      // Verifica o título após carregamento
      expect(screen.getByText('Painel do Administrador')).toBeInTheDocument();
      // Verifica se as abas existem
      expect(screen.getByRole('button', { name: /Beneficiários/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Voluntários/i })).toBeInTheDocument();
    });
  });

  it('deve listar beneficiários filtrados da API', async () => {
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: 3, nome: 'Admin Chefe', email: '', tipoUsuario: 'ADMIN', ativo: true },
      isVoluntario: false,
      isBeneficiario: false,
      isAdmin: true,
      isAuthenticated: true,
      logout: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
    });

    // Mockando um beneficiário e um voluntário vindos da API
    vi.mocked(usuarioService.listar).mockResolvedValueOnce([
      { id: 10, nome: 'João Beneficiário', email: 'joao@b.com', tipoUsuario: 'BENEFICIARIO', ativo: true },
      { id: 11, nome: 'Maria Voluntária', email: 'maria@v.com', tipoUsuario: 'VOLUNTARIO', ativo: true },
    ]);

    render(
      <MemoryRouter>
        <DashboardAdmin />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Painel do Administrador')).toBeInTheDocument();
    });

    // Clica na aba de Beneficiários
    const btnBeneficiarios = screen.getByRole('button', { name: /Beneficiários/i });
    btnBeneficiarios.click();

    // Deve mostrar João Beneficiário, mas não Maria
    expect(await screen.findByText('João Beneficiário')).toBeInTheDocument();
    expect(screen.queryByText('Maria Voluntária')).not.toBeInTheDocument();
  });
});
