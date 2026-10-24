import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PortalBeneficiario from '../PortalBeneficiario';
import { useAuth } from '../../context/useAuth';
import { atendimentoService } from '../../services/atendimentoService';
import { mensagensService } from '../../services/mensagensService';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/atendimentoService', () => ({
  atendimentoService: {
    listarPorContaBeneficiario: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/mensagensService', () => ({
  mensagensService: {
    getMensagensAtendimento: vi.fn().mockResolvedValue([]),
  },
}));

describe('PortalBeneficiario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve exibir nome do paciente como titulo, ordenar por dataAtualizacao e exibir badge de Nova Mensagem', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome: 'Beneficiario Teste', email: 'beneficiario@example.com', tipoUsuario: 'BENEFICIARIO', ativo: true },
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

    // Mock Atendimentos (A = Antigo, B = Recente)
    vi.mocked(atendimentoService.listarPorContaBeneficiario).mockResolvedValue([
      { id: 1, beneficiarioNome: 'Filho Antigo', dataAtualizacao: '2023-01-01T00:00:00Z', status: 'ABERTO' },
      { id: 2, beneficiarioNome: 'Filho Recente', dataAtualizacao: '2023-12-31T00:00:00Z', status: 'EM_ATENDIMENTO' },
    ]);

    // Mock Mensagens para Atendimento 2 (Recente) ter nova mensagem do VOLUNTARIO
    vi.mocked(mensagensService.getMensagensAtendimento).mockImplementation(async (id: number) => {
      if (id === 2) {
        return [{ id: 100, atendimentoId: 2, conteudo: 'Nova msg', enviadoPor: 'VOLUNTARIO', dataHora: new Date().toISOString() }];
      }
      return [];
    });

    render(
      <BrowserRouter>
        <PortalBeneficiario />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Devem aparecer os nomes
      expect(screen.getByText('Filho Antigo')).toBeInTheDocument();
      expect(screen.getByText('Filho Recente')).toBeInTheDocument();
      // Badge Nova Mensagem
      expect(screen.getByText('Nova Mensagem')).toBeInTheDocument();
    });

    // Validar ordenacao (Filho Recente deve vir primeiro no DOM)
    const titles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    const posRecente = titles.indexOf('Filho Recente');
    const posAntigo = titles.indexOf('Filho Antigo');
    expect(posRecente).toBeLessThan(posAntigo);
    expect(screen.getByLabelText('Progresso do atendimento: Em tratamento')).toBeInTheDocument();
    expect(screen.getByText('Nova Mensagem').parentElement).toHaveClass('animate-pulse');
  });

  it('deve refletir os estados reais da API no indicador de progresso', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome: 'Beneficiario Teste', email: 'beneficiario@example.com', tipoUsuario: 'BENEFICIARIO', ativo: true },
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
    vi.mocked(atendimentoService.listarPorContaBeneficiario).mockResolvedValue([
      { id: 1, beneficiarioNome: 'Em triagem', status: 'ABERTO' },
      { id: 2, beneficiarioNome: 'Com dentista', status: 'ABERTO', voluntarioId: 8, nomeVoluntario: 'Dra. Ana' },
      { id: 3, beneficiarioNome: 'Em tratamento', status: 'EM_ATENDIMENTO' },
      { id: 4, beneficiarioNome: 'Concluído', status: 'ENCERRADO' },
      { id: 5, beneficiarioNome: 'Cancelado', status: 'CANCELADO' },
    ]);

    render(<BrowserRouter><PortalBeneficiario /></BrowserRouter>);

    expect(await screen.findByLabelText('Progresso do atendimento: Em triagem')).toBeInTheDocument();
    expect(screen.getByLabelText('Progresso do atendimento: Dentista atribuído')).toBeInTheDocument();
    expect(screen.getByLabelText('Progresso do atendimento: Em tratamento')).toBeInTheDocument();
    expect(screen.getByLabelText('Progresso do atendimento: Concluído')).toBeInTheDocument();
    expect(screen.getByLabelText('Progresso do atendimento: Atendimento cancelado')).toBeInTheDocument();
  });

  it('adapta o portal para Criança e Adolescente (Dentista do Bem) exibindo dados do perfil cadastrado', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 2,
        nome: 'Lucas Silva',
        email: 'maria@example.com',
        telefone: '(11) 98888-7777',
        idade: 12,
        nomeResponsavel: 'Maria Silva',
        escola: 'Escola Municipal Sol',
        tipoUsuario: 'BENEFICIARIO',
        tipoBeneficiario: 'CRIANCA_ADOLESCENTE',
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
    vi.mocked(atendimentoService.listarPorContaBeneficiario).mockResolvedValue([]);

    render(<BrowserRouter><PortalBeneficiario /></BrowserRouter>);

    expect(await screen.findByText('Portal Dentista do Bem')).toBeInTheDocument();
    expect(screen.getByText('Programa Dentista do Bem — Criança e Adolescente')).toBeInTheDocument();
    expect(screen.getByText('Lucas Silva (12 anos)')).toBeInTheDocument();
    expect(screen.getByText('Maria Silva • Escola Municipal Sol')).toBeInTheDocument();
  });

  it('adapta o portal para Mulher Beneficiária (Apolônias do Bem) com identidade de acolhimento sigiloso', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 3,
        nome: 'Aurora',
        usuario: 'aurora.segura',
        email: null,
        tipoUsuario: 'BENEFICIARIO',
        tipoBeneficiario: 'MULHER_APOLONIA',
        modoIdentificacao: 'CODINOME',
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
    vi.mocked(atendimentoService.listarPorContaBeneficiario).mockResolvedValue([]);

    render(<BrowserRouter><PortalBeneficiario /></BrowserRouter>);

    expect(await screen.findByText('Portal Apolônias do Bem')).toBeInTheDocument();
    expect(screen.getByText('Programa Apolônias do Bem')).toBeInTheDocument();
    expect(screen.getByText('Sigilo protegido')).toBeInTheDocument();
    expect(screen.getByText('Acolhimento e solicitações sigilosas')).toBeInTheDocument();
    expect(screen.getByText('aurora.segura')).toBeInTheDocument();
    expect(screen.getByText('Seu espaço seguro de acolhimento começa aqui')).toBeInTheDocument();
  });
});
