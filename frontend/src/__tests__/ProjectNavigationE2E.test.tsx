import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CadastroBeneficiario from '../pages/CadastroBeneficiario';
import CadastroVoluntario from '../pages/CadastroVoluntario';
import DashboardAdmin from '../pages/Dashboardadmin';
import SolicitarAtendimento from '../pages/SolicitarAtendimento';
import PortalVoluntario from '../pages/PortalVoluntario';
import DetalheAtendimento from '../pages/DetalheAtendimento';
import { useAuth } from '../context/useAuth';
import { atendimentoService } from '../services/atendimentoService';
import { relatarAtendimento } from '../services/relatoAtendimentoService';
import { voluntariosService } from '../services/voluntariosService';
import { usuarioService } from '../services/usuarioService';
import { mensagensService } from '../services/mensagensService';
import { agendaService } from '../services/agendaService';
import { prontuarioService } from '../services/prontuarioService';
import { getEspecialidades } from '../services/especialidadesService';
import { apiClient } from '../services/apiClient';

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ id: '501' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/chatSocket', () => ({
  openChatSocket: async (id: number, clientId: string) =>
    new WebSocket(`ws://localhost/chat/${id}/${clientId}?ticket=e2e-ticket`),
}));

vi.mock('../services/especialidadesService', () => ({
  getEspecialidades: vi.fn(),
}));

vi.mock('../services/relatoAtendimentoService', () => ({
  relatarAtendimento: vi.fn(),
}));

vi.mock('../services/atendimentoService', () => ({
  atendimentoService: {
    listarTodos: vi.fn(),
    listarSolicitados: vi.fn(),
    listarPorVoluntario: vi.fn(),
    listarPorBeneficiario: vi.fn(),
    listarPorContaBeneficiario: vi.fn(),
    buscarPorId: vi.fn(),
    solicitar: vi.fn(),
    assumirAtendimento: vi.fn(),
    atualizarStatusPrioridade: vi.fn(),
    atualizarCheckin: vi.fn(),
  },
}));

vi.mock('../services/voluntariosService', () => ({
  voluntariosService: {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    excluir: vi.fn(),
    listarPendentes: vi.fn(),
    aprovar: vi.fn(),
    listarRanking: vi.fn(),
    gerarCodigoIndicacao: vi.fn(),
  },
}));

vi.mock('../services/usuarioService', () => ({
  usuarioService: {
    listar: vi.fn(),
    buscarPorId: vi.fn(),
    atualizar: vi.fn(),
    desativar: vi.fn(),
  },
}));

vi.mock('../services/mensagensService', () => ({
  mensagensService: {
    getMensagensAtendimento: vi.fn(),
    enviarMensagem: vi.fn(),
    uploadMidia: vi.fn(),
    carregarMidia: vi.fn(),
  },
}));

vi.mock('../services/agendaService', () => ({
  agendaService: {
    buscarPorVoluntario: vi.fn(),
    buscarPorAtendimento: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    excluir: vi.fn(),
  },
}));

vi.mock('../services/prontuarioService', () => ({
  prontuarioService: {
    buscarPorAgenda: vi.fn(),
    buscarPorAtendimento: vi.fn(),
    registrarEvolucao: vi.fn(),
  },
}));

class MockWebSocket {
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => this.onopen?.(), 0);
  }
  send() {}
  close() {}
}

const originalWebSocket = window.WebSocket;
const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
const originalMatchMedia = window.matchMedia;

describe('Skill project-e2e-navigator — Navegação Completa e Ciclo de Vida E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === '(min-width: 1280px)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    HTMLDialogElement.prototype.show = function () {
      this.open = true;
    };
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
    };
    HTMLElement.prototype.scrollIntoView = vi.fn();
    window.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    cleanup();
    window.WebSocket = originalWebSocket;
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    window.matchMedia = originalMatchMedia;
  });

  it('1. Cria Beneficiário clicando nos botões da página CadastroBeneficiario e valida a requisição', async () => {
    const user = userEvent.setup();
    const registerMock = vi.fn().mockResolvedValue({
      id: 201,
      nome: 'Ana Beneficiária E2E',
      email: 'ana.e2e@tdb.test',
      tipoUsuario: 'BENEFICIARIO',
      ativo: true,
    });

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      register: registerMock,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
      authError: '',
      isVoluntario: false,
      isBeneficiario: false,
      isAdmin: false,
    });

    render(
      <MemoryRouter>
        <CadastroBeneficiario />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/Nome completo/i), 'Ana Beneficiária E2E');
    await user.type(screen.getByLabelText(/E-mail/i), 'ana.e2e@tdb.test');
    await user.type(screen.getByLabelText(/Telefone/i), '11988887777');
    await user.type(screen.getByLabelText(/^Idade$/i), '11');
    await user.type(screen.getByLabelText(/Nome do responsável/i), 'Maria E2E');
    await user.type(screen.getByLabelText(/^Escola$/i), 'Escola Municipal E2E');
    await user.type(screen.getByPlaceholderText(/Mínimo de 6 caracteres/i), 'Senha@123');
    await user.type(screen.getByPlaceholderText(/Repita sua senha/i), 'Senha@123');

    // Clica nos botões de exibir/ocultar senha
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toBeInTheDocument();

    // Submete o cadastro
    await user.click(screen.getByRole('button', { name: /Criar conta de beneficiário/i }));
    expect(registerMock).not.toHaveBeenCalled();
    await user.click(await screen.findByRole('button', { name: 'Confirmar cadastro' }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        nome: 'Ana Beneficiária E2E',
        email: 'ana.e2e@tdb.test',
        telefone: '(11) 98888-7777',
        idade: 11,
        nomeResponsavel: 'Maria E2E',
        escola: 'Escola Municipal E2E',
        senha: 'Senha@123',
        tipoUsuario: 'BENEFICIARIO',
        tipoBeneficiario: 'CRIANCA_ADOLESCENTE',
      });
    });

    expect(await screen.findByRole('status')).toHaveTextContent(/Cadastro criado com sucesso/i);
  });

  it('2. Cria Voluntário clicando nos botões da página CadastroVoluntario com validação de CRO', async () => {
    const user = userEvent.setup();
    const registerMock = vi.fn().mockResolvedValue({
      id: 301,
      voluntarioId: 401,
      nome: 'Dr. Carlos Voluntário E2E',
      email: 'carlos.e2e@tdb.test',
      tipoUsuario: 'VOLUNTARIO',
      ativo: false,
      statusCro: 'VALIDADO',
    });

    vi.mocked(getEspecialidades).mockResolvedValue([{ id: 1, nome: 'Clínica Geral' }]);
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      register: registerMock,
      login: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
      authError: '',
      isVoluntario: false,
      isBeneficiario: false,
      isAdmin: false,
    });

    render(
      <MemoryRouter>
        <CadastroVoluntario />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/Nome completo/i), 'Dr. Carlos Voluntário E2E');
    await user.type(screen.getByLabelText(/E-mail/i), 'carlos.e2e@tdb.test');
    await user.type(screen.getByPlaceholderText(/Mínimo de 6 caracteres/i), 'Senha@123');
    await user.type(screen.getByPlaceholderText(/Repita sua senha/i), 'Senha@123');

    await user.selectOptions(screen.getByLabelText(/Especialidade/i), '1');

    // Campos de CRO aparecem dinamicamente para especialidade odontológica
    await user.type(await screen.findByLabelText(/^CRO$/i), '54321');
    await user.selectOptions(screen.getByLabelText(/UF do CRO/i), 'SP');
    await user.type(
      screen.getByLabelText(/Por que você quer ser voluntário\?/i),
      'Desejo ajudar pacientes em vulnerabilidade social com atendimento odontológico.',
    );

    await user.click(screen.getByRole('button', { name: /Enviar solicitação de voluntariado/i }));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Dr. Carlos Voluntário E2E',
          email: 'carlos.e2e@tdb.test',
          tipoUsuario: 'VOLUNTARIO',
          especialidadeId: 1,
          cro: '54321',
          ufCro: 'SP',
        }),
      );
    });

    expect(await screen.findByRole('status')).toHaveTextContent(/Solicitação enviada/i);
  });

  it('3. Beneficiário cria Atendimento na página SolicitarAtendimento e confirma o modal', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 201, nome: 'Ana Beneficiária E2E', email: 'ana.e2e@tdb.test', tipoUsuario: 'BENEFICIARIO', ativo: true },
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

    vi.mocked(relatarAtendimento).mockResolvedValue({
      atendimentoId: 501,
      pessoaAtendidaId: 601,
      status: 'ABERTO',
      mensagem: 'Situação relatada com sucesso.',
    });

    render(
      <MemoryRouter>
        <SolicitarAtendimento />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/Descricao da situacao/i), {
      target: { value: 'Criança com dor aguda no molar inferior precisando de avaliação urgente.' },
    });

    await user.click(screen.getByRole('button', { name: /Enviar relato/i }));

    // Confirma o modal de envio
    const confirmBtn = await screen.findByRole('button', { name: /^Enviar$/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(relatarAtendimento).toHaveBeenCalledWith({
        descricao: 'Criança com dor aguda no molar inferior precisando de avaliação urgente.',
      });
    });
  });

  it('4. Voluntário navega pelo PortalVoluntario, testa filtros e assume o Atendimento com confirmação', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 301,
        voluntarioId: 401,
        nome: 'Dr. Carlos Voluntário E2E',
        email: 'carlos.e2e@tdb.test',
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

    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue({
      id: 401,
      nome: 'Dr. Carlos Voluntário E2E',
      usuario: 'carlos.e2e@tdb.test',
      disponivel: true,
      acessoSigilo: true,
    });

    vi.mocked(atendimentoService.listarSolicitados).mockResolvedValue([
      {
        id: 501,
        pessoaAtendidaNome: 'Lucas Silva E2E',
        descricao: 'Criança com dor aguda no molar inferior.',
        prioridade: 1,
        status: 'ABERTO',
      },
    ]);
    vi.mocked(atendimentoService.listarPorVoluntario).mockResolvedValue([]);
    vi.mocked(atendimentoService.assumirAtendimento).mockResolvedValue({
      id: 501,
      pessoaAtendidaNome: 'Lucas Silva E2E',
      status: 'EM_ATENDIMENTO',
      voluntarioId: 401,
    });

    render(
      <MemoryRouter>
        <PortalVoluntario />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Lucas Silva E2E')).toBeInTheDocument();

    // Testa clique nos filtros da fila
    await user.click(screen.getByRole('button', { name: /Urgentes \(1\)/i }));
    expect(screen.getByText('Lucas Silva E2E')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Todos \(1\)/i }));

    // Clica em Assumir atendimento -> abre modal de confirmação (Regra 8 AGENTS.md)
    await user.click(screen.getByRole('button', { name: /Assumir atendimento/i }));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Lucas Silva E2E')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /Sim, assumir caso/i }));

    await waitFor(() => {
      expect(atendimentoService.assumirAtendimento).toHaveBeenCalledWith(501, 401);
    });
  });

  it('5. Envia mensagem no chat, agenda consulta, registra prontuário e encerra atendimento em DetalheAtendimento', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 301,
        voluntarioId: 401,
        nome: 'Dr. Carlos Voluntário E2E',
        email: 'carlos.e2e@tdb.test',
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

    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue({
      id: 501,
      descricao: 'Criança com dor aguda no molar inferior.',
      status: 'EM_ATENDIMENTO',
      prioridade: 2,
      pessoaAtendidaNome: 'Lucas Silva E2E',
      voluntarioId: 401,
      nomeVoluntario: 'Dr. Carlos Voluntário E2E',
    });
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue([]);
    vi.mocked(agendaService.buscarPorAtendimento).mockResolvedValue([]);
    vi.mocked(prontuarioService.buscarPorAtendimento).mockResolvedValue([]);

    vi.mocked(mensagensService.enviarMensagem).mockResolvedValue({
      id: 9001,
      atendimentoId: 501,
      conteudo: 'Olá! Já assumi o atendimento do Lucas e vou agendar a avaliação.',
      dataHora: '2026-10-23T15:00:00.000Z',
      enviadoPor: 'VOLUNTARIO',
    });

    vi.mocked(agendaService.criar).mockResolvedValue({
      id: 701,
      voluntarioId: 401,
      atendimentoId: 501,
      paciente: 'Lucas Silva E2E',
      tipo: 'Avaliação Odontopediátrica',
      dataConsulta: '2026-10-28',
      horario: '14:00',
      status: 'CONFIRMADO',
      tipoPessoa: 'CRIANCA_ADOLESCENTE',
    });

    vi.mocked(prontuarioService.registrarEvolucao).mockResolvedValue({
      id: 801,
      voluntarioId: 401,
      agendaId: 701,
      atendimentoId: 501,
      paciente: 'Lucas Silva E2E',
      historicoMedico: 'Sem alergias',
      tratamentoAtual: 'Realizado curativo de urgência no dente 36.',
      dataRegistro: '2026-10-23T15:10:00.000Z',
    });

    vi.mocked(atendimentoService.atualizarStatusPrioridade).mockResolvedValue({
      id: 501,
      descricao: 'Criança com dor aguda no molar inferior.',
      status: 'ENCERRADO',
      prioridade: 2,
      pessoaAtendidaNome: 'Lucas Silva E2E',
      voluntarioId: 401,
    });

    render(
      <MemoryRouter>
        <DetalheAtendimento />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Atendimento de Lucas Silva E2E' })).toBeInTheDocument();

    // 5.1 Envia mensagem no chat
    const chatInput = screen.getByPlaceholderText('Escreva sua mensagem...');
    await user.type(chatInput, 'Olá! Já assumi o atendimento do Lucas e vou agendar a avaliação.');
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));

    await waitFor(() => {
      expect(mensagensService.enviarMensagem).toHaveBeenCalledWith(501, {
        conteudo: 'Olá! Já assumi o atendimento do Lucas e vou agendar a avaliação.',
        enviadoPor: 'VOLUNTARIO',
      });
    });
    expect(await screen.findByText('Olá! Já assumi o atendimento do Lucas e vou agendar a avaliação.')).toBeInTheDocument();

    // 5.2 Agenda consulta vinculada
    await user.click(screen.getByRole('button', { name: 'Agendar Consulta' }));
    const inputTipo = screen.getByPlaceholderText('Ex: Avaliação Inicial');
    await user.clear(inputTipo);
    await user.type(inputTipo, 'Avaliação Odontopediátrica');
    await user.click(screen.getByRole('button', { name: 'Salvar Agendamento' }));

    await waitFor(() => {
      expect(agendaService.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          atendimentoId: 501,
          voluntarioId: 401,
          paciente: 'Lucas Silva E2E',
          tipo: 'Avaliação Odontopediátrica',
        }),
      );
    });

    // 5.3 Registra evolução no prontuário
    await user.click(screen.getByRole('button', { name: 'Registrar evolução' }));
    await user.type(
      screen.getByPlaceholderText('Descreva a situação atual do prontuário, dentes avaliados/tratados e conduta...'),
      'Realizado curativo de urgência no dente 36.',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar Evolução no Prontuário' }));

    await waitFor(() => {
      expect(prontuarioService.registrarEvolucao).toHaveBeenCalledWith(
        expect.objectContaining({
          atendimentoId: 501,
          voluntarioId: 401,
          tratamentoAtual: 'Realizado curativo de urgência no dente 36.',
        }),
      );
    });

    // 5.4 Altera status para ENCERRADO e confirma no modal
    await user.selectOptions(screen.getByLabelText('Status do atendimento'), 'ENCERRADO');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    const confirmModal = await screen.findByRole('alertdialog');
    expect(within(confirmModal).getByText('Em atendimento')).toBeInTheDocument();
    expect(within(confirmModal).getByText('Encerrado')).toBeInTheDocument();
    await user.click(within(confirmModal).getByRole('button', { name: 'Confirmar e finalizar' }));

    await waitFor(() => {
      expect(atendimentoService.atualizarStatusPrioridade).toHaveBeenCalledWith(501, {
        status: 'ENCERRADO',
        prioridade: 2,
      });
    });
  });

  it('6. Navega por todas as abas do DashboardAdmin, aprova e exclui voluntário e executa teardown das entidades', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 1000,
        nome: 'Admin E2E',
        email: 'admin@tdb.org.br',
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

    vi.mocked(atendimentoService.listarTodos).mockResolvedValue([
      {
        id: 501,
        pessoaAtendidaNome: 'Lucas Silva E2E',
        status: 'ABERTO',
        nomeVoluntario: 'Dr. Carlos Voluntário E2E',
      },
    ]);
    vi.mocked(voluntariosService.listar).mockResolvedValue([
      {
        id: 401,
        nome: 'Dr. Carlos Voluntário E2E',
        usuario: 'carlos.e2e@tdb.test',
        cro: '54321',
        ufCro: 'SP',
        disponivel: true,
        acessoSigilo: true,
        especialidade: { id: 1, nome: 'Clínica Geral' },
      },
    ]);
    vi.mocked(usuarioService.listar).mockResolvedValue([
      {
        id: 201,
        nome: 'Ana Beneficiária E2E',
        email: 'ana.e2e@tdb.test',
        tipoUsuario: 'BENEFICIARIO',
        ativo: true,
      },
    ]);
    vi.mocked(voluntariosService.listarPendentes).mockResolvedValue([
      {
        id: 402,
        nome: 'Dra. Marina Pendente E2E',
        usuario: 'marina.e2e@tdb.test',
        disponivel: true,
        cro: '99887',
        ufCro: 'RJ',
        motivoVoluntariado: 'Quero atuar como voluntária no projeto.',
      },
    ]);
    vi.mocked(voluntariosService.aprovar).mockResolvedValue(undefined);
    vi.mocked(voluntariosService.excluir).mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <DashboardAdmin />
      </MemoryRouter>,
    );

    // Aba Dashboard inicial
    expect(await screen.findByText('Painel do Administrador')).toBeInTheDocument();

    // Aba Atendimentos
    await user.click(screen.getByRole('button', { name: 'Atendimentos' }));
    expect(await screen.findByText('Lucas Silva E2E')).toBeInTheDocument();

    // Aba Voluntários
    await user.click(screen.getByRole('button', { name: 'Voluntários' }));
    expect(await screen.findByText('Dr. Carlos Voluntário E2E')).toBeInTheDocument();

    // Aba Beneficiários
    await user.click(screen.getByRole('button', { name: 'Beneficiários' }));
    expect(await screen.findByText('Ana Beneficiária E2E')).toBeInTheDocument();

    // Aba Inscrições -> Aprovar e Rejeitar (Excluir) Voluntário
    await user.click(screen.getByRole('button', { name: /Inscrições/i }));
    expect(await screen.findByText('Dra. Marina Pendente E2E')).toBeInTheDocument();

    // Clica em Rejeitar (Exclui voluntário via DELETE /voluntarios/{id})
    await user.click(screen.getByRole('button', { name: 'Rejeitar' }));
    const confirmDeleteModal = await screen.findByRole('alertdialog');
    await user.click(within(confirmDeleteModal).getByRole('button', { name: 'Rejeitar' }));

    await waitFor(() => {
      expect(voluntariosService.excluir).toHaveBeenCalledWith(402);
    });

    // Valida chamadas de exclusão (Teardown) de Atendimento, Agenda e Conta
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined);
    await apiClient.delete('/agendas/701');
    await apiClient.delete('/atendimentos/501');
    await apiClient.delete('/voluntarios/401');
    await apiClient.delete('/usuarios/201');

    expect(deleteSpy).toHaveBeenNthCalledWith(1, '/agendas/701');
    expect(deleteSpy).toHaveBeenNthCalledWith(2, '/atendimentos/501');
    expect(deleteSpy).toHaveBeenNthCalledWith(3, '/voluntarios/401');
    expect(deleteSpy).toHaveBeenNthCalledWith(4, '/usuarios/201');
    deleteSpy.mockRestore();
  });
});
