import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DetalheAtendimento from '../DetalheAtendimento';
import { useAuth } from '../../context/useAuth';
import { atendimentoService } from '../../services/atendimentoService';
import { mensagensService } from '../../services/mensagensService';
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

vi.mock('../../services/atendimentoService', () => ({
  atendimentoService: {
    buscarPorId: vi.fn(),
    atualizarStatusPrioridade: vi.fn(),
    atualizarCheckin: vi.fn(),
  },
}));

vi.mock('../../services/mensagensService', () => ({
  mensagensService: {
    getMensagensAtendimento: vi.fn(),
    enviarMensagem: vi.fn(),
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

describe('DetalheAtendimento - Deduplicação de Mensagens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeWebSocketInstances = [];
    (window as any).WebSocket = MockWebSocket as any;

    // Default mock implementation for auth
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 10, nome: 'Voluntário Teste', tipoUsuario: 'VOLUNTARIO' },
      logout: vi.fn(),
    } as any);
  });

  afterEach(() => {
    (window as any).WebSocket = originalWebSocket;
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
});
