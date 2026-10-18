import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortalVoluntario from '../PortalVoluntario';
import { useAuth } from '../../context/useAuth';
import { voluntariosService } from '../../services/voluntariosService';
import { atendimentoService } from '../../services/atendimentoService';
import { mensagensService } from '../../services/mensagensService';
import { BrowserRouter } from 'react-router-dom';
import type { AuthContextType } from '../../context/authContextInstance';
import type { AuthUser } from '../../types/auth';
import type { VoluntarioApi } from '../../types/api';
import type { AtendimentoApi } from '../../types/AtendimentoApi';

vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/voluntariosService', () => ({
  voluntariosService: {
    buscarPorId: vi.fn(),
    gerarCodigoIndicacao: vi.fn(),
  },
}));

vi.mock('../../services/atendimentoService', () => ({
  atendimentoService: {
    listarSolicitados: vi.fn().mockResolvedValue([]),
    listarPorVoluntario: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/mensagensService', () => ({
  mensagensService: {
    getMensagensAtendimento: vi.fn().mockResolvedValue([]),
  },
}));

function authContext(nome = 'Voluntario'): AuthContextType {
  const user: AuthUser = {
    id: 1,
    nome,
    email: 'voluntario@teste.org',
    tipoUsuario: 'VOLUNTARIO',
    ativo: true,
    voluntarioId: 10,
  };
  return {
    user,
    login: async () => user,
    register: async () => user,
    logout: vi.fn(),
    isAuthenticated: true,
    isLoading: false,
    authError: '',
    isVoluntario: true,
    isBeneficiario: false,
    isAdmin: false,
  };
}

function voluntario(codigoIndicacao?: string): VoluntarioApi {
  return {
    id: 10,
    nome: 'Voluntario',
    usuario: 'voluntario@teste.org',
    disponivel: true,
    acessoSigilo: false,
    codigoIndicacao,
  };
}

describe('PortalVoluntario', () => {
  const prioridadesNumericas: AtendimentoApi[] = [
    { id: 101, beneficiarioNome: 'Paciente urgente', prioridade: 1, status: 'ABERTO' },
    { id: 102, beneficiarioNome: 'Paciente alta', prioridade: 2, status: 'ABERTO' },
    { id: 103, beneficiarioNome: 'Paciente média', prioridade: 3, status: 'ABERTO' },
    { id: 104, beneficiarioNome: 'Paciente baixa', prioridade: 4, status: 'ABERTO' },
    { id: 105, beneficiarioNome: 'Paciente acompanhamento', prioridade: 5, status: 'ABERTO' },
  ];
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve exibir o botao "Gerar meu Link" se o voluntario nao possui codigo', async () => {
    vi.mocked(useAuth).mockReturnValue(authContext('Test'));

    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue(voluntario());

    render(
      <BrowserRouter>
        <PortalVoluntario />
      </BrowserRouter>
    );

    expect(await screen.findByText('Campanha de Indicações')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Gerar meu Link/i })).toBeInTheDocument();
  });

  it('deve gerar o codigo e exibir o link apos clicar no botao', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue(authContext('Test'));

    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue(voluntario());
    vi.mocked(voluntariosService.gerarCodigoIndicacao).mockResolvedValue(voluntario('TEST12'));

    render(
      <BrowserRouter>
        <PortalVoluntario />
      </BrowserRouter>
    );

    const btnGerar = await screen.findByRole('button', { name: /Gerar meu Link/i });
    await user.click(btnGerar);

    await waitFor(() => {
      expect(voluntariosService.gerarCodigoIndicacao).toHaveBeenCalledWith(10);
    });
    
    const input = await screen.findByDisplayValue(/cadastro\?ref=TEST12/i);
    expect(input).toBeInTheDocument();
  });

  it('deve exibir nome do paciente como titulo, ordenar por dataAtualizacao e exibir badge de Nova Mensagem', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue(authContext());

    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue(voluntario());

    // Mock Atendimentos (A = Antigo, B = Recente)
    vi.mocked(atendimentoService.listarPorVoluntario).mockResolvedValue([
      { id: 1, beneficiarioNome: 'Paciente Antigo', dataAtualizacao: '2023-01-01T00:00:00Z', status: 'ABERTO' },
      { id: 2, beneficiarioNome: 'Paciente Recente', dataAtualizacao: '2023-12-31T00:00:00Z', status: 'EM_ATENDIMENTO' },
    ]);

    // Mock Mensagens para Atendimento 2 (Recente) ter nova mensagem do BENEFICIARIO
    vi.mocked(mensagensService.getMensagensAtendimento).mockImplementation(async (id: number) => {
      if (id === 2) {
        return [{ id: 100, atendimentoId: 2, conteudo: 'Nova msg', enviadoPor: 'BENEFICIARIO', dataHora: new Date().toISOString() }];
      }
      return [];
    });

    render(
      <BrowserRouter>
        <PortalVoluntario />
      </BrowserRouter>
    );

    // Clicar na aba "Meus atendimentos"
    const abaMeus = await screen.findByRole('button', { name: /Meus atendimentos/i });
    await user.click(abaMeus);

    await waitFor(() => {
      // Devem aparecer os nomes
      expect(screen.getByText('Paciente Antigo')).toBeInTheDocument();
      expect(screen.getByText('Paciente Recente')).toBeInTheDocument();
      // Badge Nova Mensagem
      expect(screen.getByText('Nova Mensagem')).toBeInTheDocument();
    });

    // Validar ordenacao (Paciente Recente deve vir primeiro no DOM)
    const titles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    const posRecente = titles.indexOf('Paciente Recente');
    const posAntigo = titles.indexOf('Paciente Antigo');
    expect(posRecente).toBeLessThan(posAntigo);
  });

  it('deve filtrar a fila por urgentes e casos Apolonia', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue(authContext());
    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue(voluntario());
    vi.mocked(atendimentoService.listarSolicitados).mockResolvedValue([
      { id: 1, beneficiarioNome: 'Caso Urgente', prioridade: 'ALTA', status: 'ABERTO' },
      { id: 2, beneficiarioNome: 'Caso Protegido', tipoPessoa: 'MULHER_APOLONIA', prioridade: 'MEDIA', status: 'ABERTO' },
      { id: 3, beneficiarioNome: 'Caso Regular', prioridade: 'BAIXA', status: 'ABERTO' },
    ]);

    render(<BrowserRouter><PortalVoluntario /></BrowserRouter>);

    expect(await screen.findByText('Caso Urgente')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Urgentes \(1\)/i }));
    expect(screen.getByText('Caso Urgente')).toBeInTheDocument();
    expect(screen.queryByText('Caso Protegido')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Casos Apol.nia \(1\)/i }));
    expect(screen.getByText('Caso Protegido')).toBeInTheDocument();
    expect(screen.queryByText('Caso Urgente')).not.toBeInTheDocument();
  });

  it('filtra prioridades numéricas 1 e 2 como urgentes nas duas abas, excluindo 3, 4 e 5', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue(authContext());
    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue(voluntario());
    vi.mocked(atendimentoService.listarSolicitados).mockResolvedValue(prioridadesNumericas);
    vi.mocked(atendimentoService.listarPorVoluntario).mockResolvedValue([prioridadesNumericas[1], prioridadesNumericas[3], prioridadesNumericas[4]]);

    render(<BrowserRouter><PortalVoluntario /></BrowserRouter>);
    await screen.findByText('Paciente urgente');
    await user.click(screen.getByRole('button', { name: 'Urgentes (2)' }));
    expect(screen.getByText('Paciente urgente')).toBeInTheDocument();
    expect(screen.getByText('Paciente alta')).toBeInTheDocument();
    expect(screen.queryByText('Paciente média')).not.toBeInTheDocument();
    expect(screen.queryByText('Paciente baixa')).not.toBeInTheDocument();
    expect(screen.queryByText('Paciente acompanhamento')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Meus atendimentos/i }));
    await user.click(await screen.findByRole('button', { name: 'Urgentes (1)' }));
    expect(screen.getByText('Paciente alta')).toBeInTheDocument();
    expect(screen.queryByText('Paciente baixa')).not.toBeInTheDocument();
    expect(screen.queryByText('Paciente acompanhamento')).not.toBeInTheDocument();
  });

  it('exibe os cinco rótulos reais de prioridade e não presume prioridade ausente', async () => {
    vi.mocked(useAuth).mockReturnValue(authContext());
    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue(voluntario());
    vi.mocked(atendimentoService.listarSolicitados).mockResolvedValue([
      ...prioridadesNumericas,
      { id: 106, beneficiarioNome: 'Paciente sem prioridade', status: 'ABERTO' },
    ]);
    vi.mocked(atendimentoService.listarPorVoluntario).mockResolvedValue([]);

    render(<BrowserRouter><PortalVoluntario /></BrowserRouter>);
    await screen.findByText('Paciente urgente');
    for (const [nome, label] of [
      ['Paciente urgente', 'Urgente'], ['Paciente alta', 'Alta'],
      ['Paciente média', 'Média'], ['Paciente baixa', 'Baixa'],
      ['Paciente acompanhamento', 'Acompanhamento'], ['Paciente sem prioridade', 'Não informada'],
    ]) {
      const card = screen.getByRole('heading', { name: nome }).closest('article');
      expect(card).not.toBeNull();
      expect(within(card!).getByText(label)).toBeInTheDocument();
    }
  });

  it('deve mostrar Copiado por dois segundos ao copiar o link', async () => {
    vi.mocked(useAuth).mockReturnValue(authContext());
    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue(voluntario('TEST12'));

    render(<BrowserRouter><PortalVoluntario /></BrowserRouter>);
    const copyButton = await screen.findByRole('button', { name: /Copiar link/i });

    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(copyButton);
      await Promise.resolve();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('/cadastro?ref=TEST12'));
    expect(screen.getByRole('button', { name: /Copiado!/i })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1999));
    expect(screen.getByRole('button', { name: /Copiado!/i })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole('button', { name: /Copiar link/i })).toBeInTheDocument();
  });
});
