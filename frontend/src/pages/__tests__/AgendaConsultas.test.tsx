import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AgendaConsultas from '../AgendaConsultas';
import { useAuth } from '../../context/useAuth';
import { agendaService } from '../../services/agendaService';
import { prontuarioService } from '../../services/prontuarioService';

vi.mock('../../context/useAuth', () => ({ useAuth: vi.fn() }));

vi.mock('../../services/agendaService', () => ({
  agendaService: {
    buscarPorVoluntario: vi.fn().mockResolvedValue([]),
    criar: vi.fn(),
    atualizar: vi.fn(),
    excluir: vi.fn(),
  },
}));

vi.mock('../../services/prontuarioService', () => ({
  prontuarioService: {
    buscarPorAgenda: vi.fn().mockResolvedValue([]),
    registrarEvolucao: vi.fn(),
  },
}));

vi.mock('../../services/atendimentoService', () => ({
  atendimentoService: {
    listarPorVoluntario: vi.fn().mockResolvedValue([]),
  },
}));

describe('AgendaConsultas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome: 'Dentista', email: 'dentista@teste.org', tipoUsuario: 'VOLUNTARIO', ativo: true, voluntarioId: 10 },
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
      authError: '',
      isVoluntario: true,
      isBeneficiario: false,
      isAdmin: false,
    });
    vi.mocked(agendaService.buscarPorVoluntario).mockResolvedValue([]);
    vi.mocked(prontuarioService.buscarPorAgenda).mockResolvedValue([]);
  });

  it('exibe validacao contextual e nao envia consulta sem paciente', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><AgendaConsultas /></BrowserRouter>);

    await user.click(screen.getByRole('button', { name: 'Nova consulta' }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe o nome do paciente.');
    expect(agendaService.criar).not.toHaveBeenCalled();
  });

  it('bloqueia ID de atendimento negativo ou zero ao tentar criar consulta', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><AgendaConsultas /></BrowserRouter>);

    await user.click(screen.getByRole('button', { name: 'Nova consulta' }));

    const inputAtendimentoId = screen.getByPlaceholderText('Ex: 1001');
    const inputPaciente = screen.getByPlaceholderText('Ex: Maria Silva');

    await user.type(inputAtendimentoId, '-5');
    await user.type(inputPaciente, 'Maria Silva');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe um ID de atendimento válido maior que zero.');
    expect(agendaService.criar).not.toHaveBeenCalled();
  });

  it('cria consulta vinculada ao atendimentoId e exibe badge do atendimento e prontuário sincronizado', async () => {
    const user = userEvent.setup();
    const todayStr = new Date().toISOString().split('T')[0];

    vi.mocked(agendaService.criar).mockResolvedValue({
      id: 50,
      voluntarioId: 1,
      atendimentoId: 777,
      paciente: 'Carlos Oliveira',
      tipo: 'Avaliação Inicial',
      dataConsulta: todayStr,
      horario: '14:30',
      status: 'AGUARDANDO',
      tipoPessoa: 'OUTRO',
    });

    vi.mocked(prontuarioService.registrarEvolucao).mockResolvedValue({
      id: 900,
      voluntarioId: 1,
      agendaId: 50,
      atendimentoId: 777,
      paciente: 'Carlos Oliveira',
      historicoMedico: 'Hipertenso',
      tratamentoAtual: 'Profilaxia e raspagem supragengival',
      dataRegistro: '2026-10-18T14:45:00Z',
    });

    render(<BrowserRouter><AgendaConsultas /></BrowserRouter>);

    await user.click(screen.getByRole('button', { name: 'Nova consulta' }));

    const inputAtendimentoId = screen.getByPlaceholderText('Ex: 1001');
    const inputPaciente = screen.getByPlaceholderText('Ex: Maria Silva');

    await user.type(inputAtendimentoId, '777');
    await user.type(inputPaciente, 'Carlos Oliveira');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => {
      expect(agendaService.criar).toHaveBeenCalledWith(
        expect.objectContaining({
          atendimentoId: 777,
          paciente: 'Carlos Oliveira',
          voluntarioId: 1,
        })
      );
    });

    expect(await screen.findByText('Atendimento #777')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir para Atendimento' })).toBeInTheDocument();

    // Abre o Prontuário da consulta e registra uma evolução garantindo que atendimentoId é propagado
    await user.click(screen.getByRole('button', { name: 'Ver Prontuário' }));

    const inputHistorico = await screen.findByPlaceholderText('Ex: Alérgico a Penicilina, Hipertenso');
    const inputTratamento = screen.getByPlaceholderText('Descreva detalhadamente a evolução clínica, dentes tratados, etc...');

    await user.type(inputHistorico, 'Hipertenso');
    await user.type(inputTratamento, 'Profilaxia e raspagem supragengival');
    await user.click(screen.getByRole('button', { name: 'Salvar Evolução' }));

    await waitFor(() => {
      expect(prontuarioService.registrarEvolucao).toHaveBeenCalledWith({
        voluntarioId: 1,
        agendaId: 50,
        atendimentoId: 777,
        paciente: 'Carlos Oliveira',
        historicoMedico: 'Hipertenso',
        tratamentoAtual: 'Profilaxia e raspagem supragengival',
      });
    });

    expect(await screen.findByText('Profilaxia e raspagem supragengival')).toBeInTheDocument();
  });
});

