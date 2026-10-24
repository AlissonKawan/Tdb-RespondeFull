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
      { id: 2, beneficiarioNome: 'Paciente Recente', dataAtualizacao: '2023-12-31T00:00:00Z', status: 'EM_ATENDIMENTO', ultimaMensagemDoBeneficiario: true },
    ]);

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
    expect(mensagensService.getMensagensAtendimento).not.toHaveBeenCalled();
  });

  it('inicia meus atendimentos sem aguardar uma fila lenta e nao baixa historicos', async () => {
    vi.mocked(useAuth).mockReturnValue(authContext());
    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue(voluntario());
    let liberarFila!: (itens: AtendimentoApi[]) => void;
    vi.mocked(atendimentoService.listarSolicitados).mockReturnValueOnce(new Promise(resolve => { liberarFila = resolve; }));
    vi.mocked(atendimentoService.listarPorVoluntario).mockResolvedValueOnce([]);
    render(<BrowserRouter><PortalVoluntario /></BrowserRouter>);
    await waitFor(() => expect(atendimentoService.listarPorVoluntario).toHaveBeenCalledWith(10));
    expect(mensagensService.getMensagensAtendimento).not.toHaveBeenCalled();
    await act(async () => liberarFila([]));
  });

  it('deve filtrar a fila por urgentes e casos Apolonia', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue(authContext());
    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue(voluntario());
    vi.mocked(atendimentoService.listarSolicitados).mockResolvedValue([
      { id: 1, beneficiarioNome: 'Caso Urgente', prioridade: 'ALTA', status: 'ABERTO' },
      { id: 2, codinome: 'Caso Protegido', tipoPessoa: 'MULHER_APOLONIA', prioridade: 'MEDIA', status: 'ABERTO' },
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
      ['Paciente acompanhamento', 'Acompanhamento'], ['Paciente sem prioridade', 'Aguardando triagem'],
    ]) {
      const card = screen.getByRole('heading', { name: nome }).closest('article');
      expect(card).not.toBeNull();
      expect(within(card!).getByText(label)).toBeInTheDocument();
    }
  });

  it('mostra codinome, comentário completo e sigilo nas duas filas e na confirmação', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue(authContext());
    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue(voluntario());
    const caso: AtendimentoApi = {
      id: 201, tipoPessoa: 'MULHER_APOLONIA', codinome: 'Flor de teste',
      pessoaAtendidaNome: 'Nome que não deve aparecer', necessitaSigiloAbsoluto: true,
      titulo: 'Título genérico', descricao: 'Preciso de apoio odontológico.\nPrefiro conversar pela aplicação.',
      status: 'ABERTO',
    };
    vi.mocked(atendimentoService.listarSolicitados).mockResolvedValue([caso]);
    vi.mocked(atendimentoService.listarPorVoluntario).mockResolvedValue([caso]);
    render(<BrowserRouter><PortalVoluntario /></BrowserRouter>);
    await screen.findByRole('heading', { name: 'Flor de teste' });
    expect(screen.queryByText('Nome que não deve aparecer')).not.toBeInTheDocument();
    expect(screen.getByText('Mulher Apolônia · Atendimento sigiloso')).toBeInTheDocument();
    expect(screen.getByText(/Sigilo absoluto solicitado/)).toBeInTheDocument();
    expect(screen.getByText(/Preciso de apoio odontológico/)).toHaveClass('whitespace-pre-wrap');
    expect(screen.queryByText(/Região:/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Assumir atendimento' }));
    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('Flor de teste')).toBeInTheDocument();
    expect(within(dialog).getByText(/Preciso de apoio odontológico/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Meus atendimentos' }));
    expect(screen.getByRole('heading', { name: 'Flor de teste' })).toBeInTheDocument();
    expect(screen.getByText('Mulher Apolônia · Atendimento sigiloso')).toBeInTheDocument();
  });

  it('não usa nome da conta como codinome e trata dados ausentes sem inventar informações', async () => {
    vi.mocked(useAuth).mockReturnValue(authContext());
    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue(voluntario());
    vi.mocked(atendimentoService.listarSolicitados).mockResolvedValue([
      { id: 202, tipoPessoa: 'MULHER_APOLONIA', beneficiarioNome: 'Nome privado', descricao: '  ', observacao: 'Comentário alternativo' },
      { id: 203, tipoPessoa: 'MULHER_APOLONIA', pessoaAtendidaNome: 'Codinome legado' },
    ]);
    render(<BrowserRouter><PortalVoluntario /></BrowserRouter>);
    expect(await screen.findByRole('heading', { name: 'Codinome não informado' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Codinome legado' })).toBeInTheDocument();
    expect(screen.queryByText('Nome privado')).not.toBeInTheDocument();
    expect(screen.getByText('Comentário alternativo')).toBeInTheDocument();
    expect(screen.getByText('Comentário não informado')).toBeInTheDocument();
    expect(screen.queryByText(/Sigilo absoluto solicitado/)).not.toBeInTheDocument();
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

  it('oculta o código #TDB para voluntário e exibe apenas para administrador', async () => {
    vi.mocked(useAuth).mockReturnValue(authContext());
    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue(voluntario());
    vi.mocked(atendimentoService.listarSolicitados).mockResolvedValue([
      { id: 163, beneficiarioNome: 'Eduardo Boni', prioridade: 1, status: 'ABERTO' },
    ]);

    const { unmount } = render(<BrowserRouter><PortalVoluntario /></BrowserRouter>);
    expect(await screen.findByText('Eduardo Boni')).toBeInTheDocument();
    expect(screen.queryByText('#TDB-163')).not.toBeInTheDocument();
    unmount();

    const adminAuth = authContext('Admin');
    adminAuth.user!.tipoUsuario = 'ADMIN';
    adminAuth.isAdmin = true;
    adminAuth.isVoluntario = false;
    vi.mocked(useAuth).mockReturnValue(adminAuth);

    render(<BrowserRouter><PortalVoluntario /></BrowserRouter>);
    expect(await screen.findByText('Eduardo Boni')).toBeInTheDocument();
    expect(screen.getByText('#TDB-163')).toBeInTheDocument();
  });
});
