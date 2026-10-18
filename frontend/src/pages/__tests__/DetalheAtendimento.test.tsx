import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DetalheAtendimento from '../DetalheAtendimento';
import { useAuth } from '../../context/useAuth';
import { atendimentoService } from '../../services/atendimentoService';
import { mensagensService } from '../../services/mensagensService';
import { agendaService } from '../../services/agendaService';
import { prontuarioService } from '../../services/prontuarioService';
import type { AtendimentoApi, Mensagem } from '../../types/AtendimentoApi';

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
    preverCheckinIA: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/mensagensService', () => ({
  mensagensService: {
    getMensagensAtendimento: vi.fn(),
    enviarMensagem: vi.fn(),
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

  send(_data: string) {}
  close() {}
}

const originalWebSocket = (window as any).WebSocket;
const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

describe('DetalheAtendimento - Deduplicação de Mensagens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeWebSocketInstances = [];
    HTMLElement.prototype.scrollIntoView = vi.fn();
    (window as any).WebSocket = MockWebSocket as any;

    // Default mock implementation for auth
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 10, nome: 'Voluntário Teste', tipoUsuario: 'VOLUNTARIO' },
      logout: vi.fn(),
    } as any);
    vi.mocked(agendaService.buscarPorAtendimento).mockResolvedValue([]);
    vi.mocked(prontuarioService.buscarPorAtendimento).mockResolvedValue([]);
  });

  afterEach(() => {
    (window as any).WebSocket = originalWebSocket;
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
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
      expect(screen.getByText('Detalhes do Atendimento')).toBeInTheDocument();
    });

    expect(screen.getByText('Olá Maria, em que posso ajudar?')).toBeInTheDocument();
    expect(screen.getByText('Tenho uma dor de dente muito forte')).toBeInTheDocument();

    // Cada uma das mensagens deve aparecer apenas uma vez
    expect(screen.getAllByText('Olá Maria, em que posso ajudar?')).toHaveLength(1);
    expect(screen.getAllByText('Tenho uma dor de dente muito forte')).toHaveLength(1);
    expect(screen.queryByText('IA: Classificação')).not.toBeInTheDocument();
    expect(screen.getByText('Você · Dentista Voluntário')).toBeInTheDocument();
    expect(screen.getByText('Beneficiário')).toBeInTheDocument();
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
      expect(screen.getByText('Detalhes do Atendimento')).toBeInTheDocument();
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
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

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
      expect(screen.getByText('Detalhes do Atendimento')).toBeInTheDocument();
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

  it('exibe a previsão da IA sem marcadores ASCII', async () => {
    vi.mocked(atendimentoService.buscarPorId).mockResolvedValue(mockAtendimento);
    vi.mocked(mensagensService.getMensagensAtendimento).mockResolvedValue(mockMensagensIniciais);
    vi.mocked(atendimentoService.preverCheckinIA).mockResolvedValue({
      previsaoCheckin: 'CONFIRMADO',
      confiancaCheckin: 0.92,
    });

    render(
      <MemoryRouter>
        <DetalheAtendimento />
      </MemoryRouter>
    );

    expect(await screen.findByText('Previsão da Inteligência Artificial')).toBeInTheDocument();
    expect(screen.getByText('Confirmado')).toBeInTheDocument();
    expect(screen.queryByText('[V]')).not.toBeInTheDocument();
    expect(screen.queryByText('[X]')).not.toBeInTheDocument();
    expect(screen.queryByText('[~]')).not.toBeInTheDocument();
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

    expect(await screen.findByText('Agenda do Atendimento')).toBeInTheDocument();
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

    expect(await screen.findByText('Prontuário Clínico do Paciente')).toBeInTheDocument();
    expect(screen.getAllByText('Alérgica a Dipirona').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gestante').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Abertura coronária do dente 26 e medicação intracanal.').length).toBeGreaterThan(0);

    // Tenta salvar evolução vazia -> deve disparar validação
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
});

