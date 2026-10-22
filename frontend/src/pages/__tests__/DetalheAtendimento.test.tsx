import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor, act, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DetalheAtendimento from '../DetalheAtendimento';
import { useAuth } from '../../context/useAuth';
import { atendimentoService } from '../../services/atendimentoService';
import { mensagensService } from '../../services/mensagensService';
import { agendaService } from '../../services/agendaService';
import { prontuarioService } from '../../services/prontuarioService';
import type { AtendimentoApi, Mensagem } from '../../types/AtendimentoApi';

const previsaoIAMock = vi.hoisted(() => vi.fn().mockResolvedValue({}));

// Mock routing params so that useParams returns { id: '1' }
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/chatSocket', () => ({
  openChatSocket: async (id: number, clientId: string) => new WebSocket(`ws://localhost/chat/${id}/${clientId}?ticket=test`),
}));

vi.mock('../../services/atendimentoService', () => ({
  atendimentoService: {
    buscarPorId: vi.fn(),
    atualizarStatusPrioridade: vi.fn(),
    atualizarCheckin: vi.fn(),
    preverCheckinIA: previsaoIAMock,
  },
}));

vi.mock('../../services/mensagensService', () => ({
  mensagensService: {
    getMensagensAtendimento: vi.fn(),
    enviarMensagem: vi.fn(),
    uploadMidia: vi.fn(),
    carregarMidia: vi.fn(),
  },
}));

vi.mock('../../services/agendaService', () => ({
  agendaService: {
    buscarPorAtendimento: vi.fn().mockResolvedValue([]),
    criar: vi.fn(),
    atualizar: vi.fn(),
  },
}));

vi.mock('../../services/prontuarioService', () => ({
  prontuarioService: {
    buscarPorAtendimento: vi.fn().mockResolvedValue([]),
    registrarEvolucao: vi.fn(),
  },
}));

// Mock WebSocket implementation to capture connections and simulate message broadcasts
let activeWebSocketInstances: MockWebSocket[] = [];

class MockWebSocket {
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    activeWebSocketInstances.push(this);
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }

  send() {}
  close() {}
}

const originalWebSocket = window.WebSocket;
const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
const originalMatchMedia = window.matchMedia;

describe('DetalheAtendimento - Deduplicação de Mensagens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(min-width: 1280px)', media: query,
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
    }));
    // JSDOM não implementa o ciclo de abertura de dialog nativo.
    HTMLDialogElement.prototype.show = function () { this.open = true; };
    HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    HTMLDialogElement.prototype.close = function () { this.open = false; };
    activeWebSocketInstances = [];
    HTMLElement.prototype.scrollIntoView = vi.fn();
    window.WebSocket = MockWebSocket as unknown as typeof WebSocket;

    // Default mock implementation for auth
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 10, voluntarioId: 10, nome: 'Voluntário Teste', tipoUsuario: 'VOLUNTARIO' },
      logout: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(agendaService.buscarPorAtendimento).mockResolvedValue([]);
    vi.mocked(prontuarioService.buscarPorAtendimento).mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    window.WebSocket = originalWebSocket;
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    window.matchMedia = originalMatchMedia;
    vi.unstubAllGlobals();
  });

  const mockAtendimento: AtendimentoApi = {
    id: 1,
    descricao: 'Preciso de atendimento odontológico urgente',
    status: 'EM_ATENDIMENTO',
    prioridade: 3,
    canal: 'WhatsApp',
    pessoaAtendidaNome: 'Maria Souza',
    pessoaAtendidaEmail: 'maria@example.com',
    pessoaAtendidaTelefone: '5511999999999',
    voluntarioId: 10,
    nomeVoluntario: 'Voluntário Teste',
  };

  const mockMensagensIniciais: Mensagem[] = [
    {
      id: 101,
      atendimentoId: 1,
      conteudo: 'Olá Maria, em que posso ajudar?',
      dataHora: '2026-06-03T19:00:00.000Z',
      enviadoPor: 'VOLUNTARIO',
    },
    {
      id: 102,
      atendimentoId: 1,
      conteudo: 'Tenho uma dor de dente muito forte',
      dataHora: '2026-06-03T19:02:00.000Z',
      enviadoPor: 'BENEFICIARIO',
    },
  ];

  it('consulta caso aberto da fila sem carregar conversa ou dados clinicos antes de assumir', async () => {
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue({
      ...mockAtendimento, status: 'ABERTO', voluntarioId: undefined,
    });
    render(<MemoryRouter><DetalheAtendimento /></MemoryRouter>);
    await screen.findByRole('heading', { name: 'Atendimento de Maria Souza' });
    expect(mensagensService.getMensagensAtendimento).not.toHaveBeenCalled();
    expect(agendaService.buscarPorAtendimento).not.toHaveBeenCalled();
    expect(prontuarioService.buscarPorAtendimento).not.toHaveBeenCalled();
    expect(activeWebSocketInstances).toHaveLength(0);
  });

  it('deve carregar o atendimento e as mensagens iniciais sem duplicá-las', async () => {
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue(mockMensagensIniciais);

    render(
      <MemoryRouter>
        <DetalheAtendimento />
      </MemoryRouter>
    );

    // Espera sumir a tela de loading
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Atendimento de Maria Souza' })).toBeInTheDocument();
    });

    expect(screen.getByText('Olá Maria, em que posso ajudar?')).toBeInTheDocument();
    expect(screen.getByText('Tenho uma dor de dente muito forte')).toBeInTheDocument();

    // Cada uma das mensagens deve aparecer apenas uma vez
    expect(screen.getAllByText('Olá Maria, em que posso ajudar?')).toHaveLength(1);
    expect(screen.getAllByText('Tenho uma dor de dente muito forte')).toHaveLength(1);
    expect(screen.queryByText('IA: Classificação')).not.toBeInTheDocument();
    expect(screen.getByText('Você · Dentista Voluntário')).toBeInTheDocument();
    expect(within(screen.getByRole('log')).getByText('Maria Souza')).toBeInTheDocument();
    expect(screen.getAllByText(/^\d{2}:\d{2}$/)).toHaveLength(2);
  });

  it('deve deduplicar mensagens novas idênticas recebidas via WebSocket', async () => {
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue(mockMensagensIniciais);

    render(
      <MemoryRouter>
        <DetalheAtendimento />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Atendimento de Maria Souza' })).toBeInTheDocument();
    });

    // Simula a chegada de uma nova mensagem via WebSocket
    const novaMsgWS: Mensagem = {
      id: 103,
      atendimentoId: 1,
      conteudo: 'Vou agendar um horário para você',
      dataHora: '2026-06-03T19:10:00.000Z',
      enviadoPor: 'VOLUNTARIO',
    };

    expect(activeWebSocketInstances.length).toBeGreaterThan(0);
    const lastWsInstance = activeWebSocketInstances[activeWebSocketInstances.length - 1];

    // Dispara a mensagem no WebSocket
    act(() => {
      lastWsInstance.onmessage?.({ data: JSON.stringify(novaMsgWS) });
    });

    await waitFor(() => {
      expect(screen.getByText('Vou agendar um horário para você')).toBeInTheDocument();
    });
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });

    // Dispara a mesma mensagem novamente no WebSocket (simulando outra conexão aberta ou duplicidade do broadcast)
    act(() => {
      lastWsInstance.onmessage?.({ data: JSON.stringify(novaMsgWS) });
    });

    // A mensagem deve continuar aparecendo apenas UMA vez na tela
    const elements = screen.getAllByText('Vou agendar um horário para você');
    expect(elements).toHaveLength(1);
  });

  it('deve evitar a duplicação visual de mensagem enviada pelo próprio usuário quando o broadcast do WebSocket chega', async () => {
    const userEventSetup = userEvent.setup();

    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue(mockMensagensIniciais);

    // Quando enviamos a mensagem, ela é persistida na API REST que retorna a mensagem salva
    const msgEnviada: Mensagem = {
      id: 104,
      atendimentoId: 1,
      conteudo: 'Estou enviando um teste agora mesmo',
      dataHora: '2026-06-03T19:15:00.000Z',
      enviadoPor: 'VOLUNTARIO',
    };
    vi.mocked(mensagensService.enviarMensagem).mockResolvedValue(msgEnviada);

    render(
      <MemoryRouter>
        <DetalheAtendimento />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Atendimento de Maria Souza' })).toBeInTheDocument();
    });

    // Digita e clica para enviar
    const input = screen.getByPlaceholderText('Escreva sua mensagem...');
    const submitBtn = screen.getByRole('button', { name: 'Enviar mensagem' });

    await userEventSetup.type(input, 'Estou enviando um teste agora mesmo');
    await userEventSetup.click(submitBtn);

    // Espera a mensagem aparecer na tela (vinda da resposta do POST)
    await waitFor(() => {
      expect(screen.getByText('Estou enviando um teste agora mesmo')).toBeInTheDocument();
    });

    // Simula a recepção da mesma mensagem logo em seguida através do WebSocket broadcast
    const lastWsInstance = activeWebSocketInstances[activeWebSocketInstances.length - 1];
    act(() => {
      lastWsInstance.onmessage?.({ data: JSON.stringify(msgEnviada) });
    });

    // A mensagem NÃO deve estar duplicada visualmente
    const elements = screen.getAllByText('Estou enviando um teste agora mesmo');
    expect(elements).toHaveLength(1);
  });

  it('envia com Enter e preserva quebra de linha com Shift + Enter', async () => {
    const userEventSetup = userEvent.setup();
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue(mockMensagensIniciais);
    vi.mocked(mensagensService.enviarMensagem).mockResolvedValue({
      id: 105,
      atendimentoId: 1,
      conteudo: 'Primeira linha\nSegunda linha',
      dataHora: '2026-06-03T19:20:00.000Z',
      enviadoPor: 'VOLUNTARIO',
    });

    render(
      <MemoryRouter>
        <DetalheAtendimento />
      </MemoryRouter>
    );

    const composer = await screen.findByPlaceholderText('Escreva sua mensagem...');
    await userEventSetup.type(composer, 'Primeira linha');
    await userEventSetup.keyboard('{Shift>}{Enter}{/Shift}');
    expect(mensagensService.enviarMensagem).not.toHaveBeenCalled();
    expect(composer).toHaveValue('Primeira linha\n');

    await userEventSetup.type(composer, 'Segunda linha');
    await userEventSetup.keyboard('{Enter}');

    await waitFor(() => expect(mensagensService.enviarMensagem).toHaveBeenCalledWith(1, {
      conteudo: 'Primeira linha\nSegunda linha',
      enviadoPor: 'VOLUNTARIO',
    }));
  });

  it('remove a previsão de IA e preserva a confirmação operacional do WhatsApp', async () => {
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue(mockMensagensIniciais);

    render(
      <MemoryRouter>
        <DetalheAtendimento />
      </MemoryRouter>
    );

    expect(await screen.findByRole('button', { name: 'Abrir WhatsApp' })).toBeInTheDocument();
    expect(screen.queryByText(/Previsão da Inteligência Artificial|de confiança/i)).not.toBeInTheDocument();
    expect(previsaoIAMock).not.toHaveBeenCalled();
  });

  it('permite agendar consulta vinculada diretamente pelo atendimento com validação de campos', async () => {
    const user = userEvent.setup();
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue([]);
    vi.mocked(agendaService.buscarPorAtendimento).mockResolvedValue([]);
    vi.mocked(agendaService.criar).mockResolvedValue({
      id: 300,
      voluntarioId: 10,
      atendimentoId: 1,
      paciente: 'Maria Souza',
      tipo: 'Urgência Endodôntica',
      dataConsulta: '2026-10-20',
      horario: '15:00',
      status: 'CONFIRMADO',
      tipoPessoa: 'OUTRO',
    });

    render(
      <MemoryRouter>
        <DetalheAtendimento />
      </MemoryRouter>
    );

    expect(await screen.findByText('Agenda vinculada')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma consulta agendada para este atendimento.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Agendar Consulta' }));

    const inputTipo = screen.getByPlaceholderText('Ex: Avaliação Inicial');
    await user.clear(inputTipo);
    await user.click(screen.getByRole('button', { name: 'Salvar Agendamento' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe o tipo da consulta.');
    expect(agendaService.criar).not.toHaveBeenCalled();

    await user.type(inputTipo, 'Urgência Endodôntica');
    await user.click(screen.getByRole('button', { name: 'Salvar Agendamento' }));

    await waitFor(() => {
      expect(agendaService.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          atendimentoId: 1,
          paciente: 'Maria Souza',
          tipo: 'Urgência Endodôntica',
        })
      );
    });

    expect(await screen.findByText('Urgência Endodôntica')).toBeInTheDocument();
    expect(screen.getByText('Vinculada')).toBeInTheDocument();
  });

  it('exibe situação atual do prontuário do paciente no atendimento e registra nova evolução', async () => {
    const user = userEvent.setup();
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue([]);
    vi.mocked(agendaService.buscarPorAtendimento).mockResolvedValue([
      {
        id: 300,
        voluntarioId: 10,
        atendimentoId: 1,
        paciente: 'Maria Souza',
        tipo: 'Avaliação Inicial',
        dataConsulta: '2026-10-18',
        horario: '09:00',
        status: 'CONFIRMADO',
        tipoPessoa: 'OUTRO',
      },
    ]);
    vi.mocked(prontuarioService.buscarPorAtendimento).mockResolvedValue([
      {
        id: 801,
        voluntarioId: 10,
        agendaId: 300,
        atendimentoId: 1,
        paciente: 'Maria Souza',
        historicoMedico: 'Alérgica a Dipirona, Gestante',
        tratamentoAtual: 'Abertura coronária do dente 26 e medicação intracanal.',
        dataRegistro: '2026-10-18T10:00:00Z',
      },
    ]);

    vi.mocked(prontuarioService.registrarEvolucao).mockResolvedValue({
      id: 802,
      voluntarioId: 10,
      agendaId: 300,
      atendimentoId: 1,
      paciente: 'Maria Souza',
      historicoMedico: 'Alérgica a Dipirona, Gestante',
      tratamentoAtual: 'Obturação endodôntica do dente 26 e restauração provisória.',
      dataRegistro: '2026-10-18T11:30:00Z',
    });

    render(
      <MemoryRouter>
        <DetalheAtendimento />
      </MemoryRouter>
    );

    expect(await screen.findByText('Prontuário rápido')).toBeInTheDocument();
    expect(await screen.findByText('Alérgica a Dipirona, Gestante')).toBeInTheDocument();
    expect(screen.getAllByText('Abertura coronária do dente 26 e medicação intracanal.').length).toBeGreaterThan(0);

    // Tenta salvar evolução vazia -> deve disparar validação
    await user.click(screen.getByRole('button', { name: 'Registrar evolução' }));
    await user.click(screen.getByRole('button', { name: 'Salvar Evolução no Prontuário' }));
    expect(await screen.findByText('Descreva o procedimento ou evolução clínica realizada.')).toBeInTheDocument();
    expect(prontuarioService.registrarEvolucao).not.toHaveBeenCalled();

    // Preenche nova evolução e salva
    const inputProcedimento = screen.getByPlaceholderText(
      'Descreva a situação atual do prontuário, dentes avaliados/tratados e conduta...'
    );
    await user.type(inputProcedimento, 'Obturação endodôntica do dente 26 e restauração provisória.');
    await user.click(screen.getByRole('button', { name: 'Salvar Evolução no Prontuário' }));

    await waitFor(() => {
      expect(prontuarioService.registrarEvolucao).toHaveBeenCalledWith({
        voluntarioId: 10,
        atendimentoId: 1,
        agendaId: 300,
        paciente: 'Maria Souza',
        historicoMedico: '',
        tratamentoAtual: 'Obturação endodôntica do dente 26 e restauração provisória.',
      });
    });

    expect(
      (await screen.findAllByText('Obturação endodôntica do dente 26 e restauração provisória.')).length
    ).toBeGreaterThan(0);
  });

  it('fecha e reabre o painel preservando rascunho, mensagens e conexão', async () => {
    const user = userEvent.setup();
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue(mockMensagensIniciais);
    const { container } = render(<MemoryRouter><DetalheAtendimento /></MemoryRouter>);
    const composer = await screen.findByRole('textbox', { name: 'Nova mensagem' });
    await user.type(composer, 'Rascunho preservado');
    const connections = activeWebSocketInstances.length;
    await user.click(screen.getByRole('button', { name: 'Fechar detalhes do atendimento' }));
    const toggle = screen.getByRole('button', { name: 'Abrir detalhes do atendimento' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('.atendimento-workspace')).toHaveAttribute('data-panel-open', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(toggle);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(composer).toHaveValue('Rascunho preservado');
    expect(within(screen.getByRole('log')).getAllByText('Tenho uma dor de dente muito forte')).toHaveLength(1);
    expect(activeWebSocketInstances).toHaveLength(connections);
    expect(atendimentoService.buscarPorId).toHaveBeenCalledTimes(1);
  });

  it('abre como drawer no celular e devolve foco ao fechar pelo cancelamento nativo', async () => {
    const user = userEvent.setup();
    vi.mocked(window.matchMedia).mockImplementation(query => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }) as unknown as MediaQueryList);
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue([]);
    render(<MemoryRouter><DetalheAtendimento /></MemoryRouter>);
    const toggle = await screen.findByRole('button', { name: 'Abrir detalhes do atendimento' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(toggle);
    expect(showModal).toHaveBeenCalledTimes(1);
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });

  it('recolhe agenda e prontuário independentemente e mantém o estado ao reabrir o painel', async () => {
    const user = userEvent.setup();
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue([]);
    render(<MemoryRouter><DetalheAtendimento /></MemoryRouter>);
    const agenda = (await screen.findByText('Agenda vinculada')).closest('details');
    const prontuario = screen.getByText('Prontuário rápido').closest('details');
    await user.click(screen.getByText('Agenda vinculada'));
    expect(agenda).not.toHaveAttribute('open');
    expect(prontuario).toHaveAttribute('open');
    await user.click(screen.getByRole('button', { name: 'Fechar detalhes do atendimento' }));
    await user.click(screen.getByRole('button', { name: 'Abrir detalhes do atendimento' }));
    expect(agenda).not.toHaveAttribute('open');
    expect(prontuario).toHaveAttribute('open');
  });

  it('não busca nem expõe prontuário, agenda ou ações de equipe para beneficiários', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 20, nome: 'Maria Souza', tipoUsuario: 'BENEFICIARIO' }, isBeneficiario: true } as ReturnType<typeof useAuth>);
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue(mockMensagensIniciais);
    render(<MemoryRouter><DetalheAtendimento /></MemoryRouter>);
    expect(await screen.findByRole('textbox', { name: 'Nova mensagem' })).toBeEnabled();
    expect(prontuarioService.buscarPorAtendimento).not.toHaveBeenCalled();
    expect(agendaService.buscarPorAtendimento).not.toHaveBeenCalled();
    expect(screen.queryByText('Prontuário rápido')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Encerrar atendimento' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Status do atendimento')).not.toBeInTheDocument();
  });

  it('salva status e prioridade somente após confirmação e bloqueia o chat encerrado', async () => {
    const user = userEvent.setup();
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue([]);
    vi.mocked(atendimentoService.atualizarStatusPrioridade).mockResolvedValue({ ...mockAtendimento, status: 'ENCERRADO', prioridade: 2 });
    render(<MemoryRouter><DetalheAtendimento /></MemoryRouter>);
    await user.selectOptions(await screen.findByLabelText('Status do atendimento'), 'ENCERRADO');
    await user.selectOptions(screen.getByLabelText('Prioridade'), '2');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(atendimentoService.atualizarStatusPrioridade).not.toHaveBeenCalled();
    const confirmation = screen.getByRole('alertdialog');
    expect(within(confirmation).getByText('Em atendimento')).toBeInTheDocument();
    expect(within(confirmation).getByText('Encerrado')).toBeInTheDocument();
    await user.click(within(confirmation).getByRole('button', { name: 'Confirmar e finalizar' }));
    await waitFor(() => expect(atendimentoService.atualizarStatusPrioridade).toHaveBeenCalledWith(1, { status: 'ENCERRADO', prioridade: 2 }));
    expect(screen.getByRole('textbox', { name: 'Nova mensagem' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Enviar foto' })).toBeDisabled();
  });

  it('distingue falhas de agenda e prontuário de estados sem registros', async () => {
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue([]);
    vi.mocked(agendaService.buscarPorAtendimento).mockRejectedValue(new Error('Falha de rede'));
    vi.mocked(prontuarioService.buscarPorAtendimento).mockRejectedValue(new Error('Falha de rede'));
    render(<MemoryRouter><DetalheAtendimento /></MemoryRouter>);
    expect(await screen.findByText('Não foi possível carregar a agenda. Tente novamente.')).toBeInTheDocument();
    expect(await screen.findByText('Não foi possível carregar o prontuário. Tente novamente.')).toBeInTheDocument();
    expect(screen.queryByText('Nenhuma consulta agendada para este atendimento.')).not.toBeInTheDocument();
    expect(screen.queryByText('Nenhum histórico clínico registrado neste atendimento.')).not.toBeInTheDocument();
  });

  it('copia os dados do atendimento sem incluir conteúdo clínico', async () => {
    const user = userEvent.setup();
    const copy = vi.spyOn(navigator.clipboard, 'writeText');
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue([]);
    vi.mocked(prontuarioService.buscarPorAtendimento).mockResolvedValue([{ id: 10, voluntarioId: 10, paciente: 'Maria Souza', historicoMedico: 'Informação clínica reservada', tratamentoAtual: 'Tratamento reservado' }]);
    render(<MemoryRouter><DetalheAtendimento /></MemoryRouter>);
    await user.click(await screen.findByRole('button', { name: 'Copiar dados' }));
    expect(copy).toHaveBeenCalledWith(expect.stringContaining('Beneficiário: Maria Souza'));
    expect(copy).toHaveBeenCalledWith(expect.stringContaining('Status: Em atendimento'));
    expect(copy.mock.calls[0][0]).not.toMatch(/Informação clínica reservada|Tratamento reservado/);
    expect(await screen.findByText('Dados do atendimento copiados.')).toBeInTheDocument();
  });

  it('envia foto com legenda e carrega a mídia autenticada para exibição', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => 'blob:foto-autenticada');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', class extends URL { static createObjectURL = createObjectURL; static revokeObjectURL = revokeObjectURL; });
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue([]);
    vi.mocked(mensagensService.uploadMidia).mockResolvedValue({ arquivoUrl: '/mensagens/midia/foto.png', mimeType: 'image/png' });
    vi.mocked(mensagensService.enviarMensagem).mockResolvedValue({ id: 200, atendimentoId: 1, enviadoPor: 'VOLUNTARIO', dataHora: '2026-10-18T12:00:00Z', conteudo: 'Orientações', tipoMensagem: 'IMAGEM', arquivoUrl: '/mensagens/midia/foto.png' });
    vi.mocked(mensagensService.carregarMidia).mockResolvedValue(new Blob(['foto'], { type: 'image/png' }));
    const { unmount } = render(<MemoryRouter><DetalheAtendimento /></MemoryRouter>);
    await user.type(await screen.findByRole('textbox', { name: 'Nova mensagem' }), 'Orientações');
    const file = new File(['foto'], 'foto.png', { type: 'image/png' });
    const input = screen.getByLabelText('Selecionar foto', { selector: 'input' });
    await user.upload(input, file);
    expect(mensagensService.uploadMidia).toHaveBeenCalledWith(1, file);
    expect(mensagensService.enviarMensagem).toHaveBeenCalledWith(1, { conteudo: 'Orientações', enviadoPor: 'VOLUNTARIO', tipoMensagem: 'IMAGEM', arquivoUrl: '/mensagens/midia/foto.png', mimeType: 'image/png' });
    expect(await screen.findByRole('img', { name: 'Foto enviada' })).toHaveAttribute('src', 'blob:foto-autenticada');
    expect(mensagensService.carregarMidia).toHaveBeenCalledWith('/mensagens/midia/foto.png');
    expect(within(screen.getByRole('log')).getByText('Orientações')).toBeInTheDocument();
    const abrirGuia = vi.spyOn(window, 'open');
    const foto = screen.getByRole('button', { name: 'Ampliar foto na conversa' });
    const composer = screen.getByRole('textbox', { name: 'Nova mensagem' });
    await user.type(composer, 'Rascunho preservado');
    await user.click(foto);
    const visualizador = screen.getByRole('dialog', { name: 'Imagem da conversa' });
    expect(within(visualizador).getByRole('img', { name: 'Imagem ampliada da conversa' })).toHaveAttribute('src', 'blob:foto-autenticada');
    expect(within(visualizador).getByText('Orientações')).toBeInTheDocument();
    expect(abrirGuia).not.toHaveBeenCalled();
    expect(mensagensService.carregarMidia).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    await user.click(within(visualizador).getByRole('button', { name: 'Voltar à conversa' }));
    expect(screen.queryByRole('dialog', { name: 'Imagem da conversa' })).not.toBeInTheDocument();
    expect(foto).toHaveFocus();
    expect(composer).toHaveValue('Rascunho preservado');
    await user.click(foto);
    fireEvent(screen.getByRole('dialog', { name: 'Imagem da conversa' }), new Event('cancel', { cancelable: true }));
    expect(screen.queryByRole('dialog', { name: 'Imagem da conversa' })).not.toBeInTheDocument();
    expect(foto).toHaveFocus();
    abrirGuia.mockRestore();
    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:foto-autenticada');
  });
});

