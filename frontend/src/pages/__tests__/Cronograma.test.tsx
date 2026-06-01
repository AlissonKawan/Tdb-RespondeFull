import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Cronograma from '../Cronograma';
import { useAuth } from '../../context/useAuth';
import { cronogramaService } from '../../services/cronogramaService';

vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/cronogramaService', () => ({
  cronogramaService: {
    listarTarefas: vi.fn().mockResolvedValue({ tarefas: [] }),
    criarTarefa: vi.fn().mockResolvedValue({}),
    atualizarTarefa: vi.fn().mockResolvedValue({}),
    excluirTarefa: vi.fn().mockResolvedValue({}),
  },
}));

const originalConfirm = window.confirm;
const originalAlert = window.alert;

describe('Cronograma', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
    window.alert = vi.fn();
  });

  afterAll(() => {
    window.confirm = originalConfirm;
    window.alert = originalAlert;
  });

  it('deve normalizar o status Concluído para Concluido ao confirmar uma tarefa (enviando sem acento para a API)', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome: 'Voluntario', tipoUsuario: 'VOLUNTARIO', voluntarioId: 10 },
      logout: vi.fn(),
    } as any);

    vi.mocked(cronogramaService.listarTarefas).mockResolvedValue({
      tarefas: [
        {
          id_tarefa: 1,
          titulo: 'Tarefa Pendente',
          dia_semana: 'Terca-feira',
          prioridade: 'Media',
          status: 'Pendente',
          tipo: 'Outros'
        }
      ]
    } as any);

    render(<Cronograma />);

    // Aguardar o carregamento e renderização da tarefa
    await waitFor(() => {
      expect(screen.getByText('Tarefa Pendente')).toBeInTheDocument();
    });

    // A prioridade Media do backend deve aparecer normalizada na tela como Média
    expect(screen.getByText('Média')).toBeInTheDocument();

    // Encontrar o botão de confirmar tarefa
    const btnConfirmar = await screen.findByTitle('Marcar como concluída');
    await user.click(btnConfirmar);

    await waitFor(() => {
      // Verificar se a API foi chamada com o status e propriedades normalizadas (sem acento)
      expect(cronogramaService.atualizarTarefa).toHaveBeenCalledWith(1, expect.objectContaining({
        status: 'Concluido',
        dia_semana: 'Terca-feira',
        prioridade: 'Media'
      }));
    });
  });

  it('deve exibir o status Concluído na interface com acento quando a API retornar Concluido sem acento', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome: 'Voluntario', tipoUsuario: 'VOLUNTARIO', voluntarioId: 10 },
      logout: vi.fn(),
    } as any);

    vi.mocked(cronogramaService.listarTarefas).mockResolvedValue({
      tarefas: [
        {
          id_tarefa: 2,
          titulo: 'Tarefa Já Concluída',
          dia_semana: 'Segunda-feira',
          prioridade: 'Media',
          status: 'Concluido',
          tipo: 'Outros'
        }
      ]
    } as any);

    render(<Cronograma />);

    await waitFor(() => {
      expect(screen.getByText('Tarefa Já Concluída')).toBeInTheDocument();
    });

    // Deve exibir os textos formatados com acento para o usuário
    expect(screen.getByText('Concluído')).toBeInTheDocument();
    expect(screen.getByText('Média')).toBeInTheDocument();
    
    // O botão de concluir não deve existir se a tarefa já está concluída
    expect(screen.queryByTitle('Marcar como concluída')).not.toBeInTheDocument();
  });

  it('deve exibir um alerta com detalhes do erro se a API retornar erro de validação (ex: 400 Bad Request)', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome: 'Voluntario', tipoUsuario: 'VOLUNTARIO', voluntarioId: 10 },
      logout: vi.fn(),
    } as any);

    vi.mocked(cronogramaService.listarTarefas).mockResolvedValue({
      tarefas: [
        {
          id_tarefa: 3,
          titulo: 'Tarefa com Erro',
          dia_semana: 'Sexta-feira',
          prioridade: 'Alta',
          status: 'Pendente',
          tipo: 'Reunião'
        }
      ]
    } as any);

    const apiError = new Error('Erro de validação');
    (apiError as any).details = { mensagem: "O campo 'id_voluntario' é obrigatório." };
    vi.mocked(cronogramaService.atualizarTarefa).mockRejectedValue(apiError);

    render(<Cronograma />);

    await waitFor(() => {
      expect(screen.getByText('Tarefa com Erro')).toBeInTheDocument();
    });

    const btnConfirmar = await screen.findByTitle('Marcar como concluída');
    await user.click(btnConfirmar);

    await waitFor(() => {
      // Verifica se a mensagem de erro da API foi mostrada no alerta para o usuário
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining("O campo 'id_voluntario' é obrigatório.")
      );
    });
  });
});
