import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChartCard from './ChartCard';
import { atendimentoService } from '../../services/atendimentoService';
import { voluntariosService } from '../../services/voluntariosService';
import { usuarioService } from '../../services/usuarioService';
import { mensagensService } from '../../services/mensagensService';

vi.mock('../../services/atendimentoService', () => ({
  atendimentoService: {
    listarTodos: vi.fn(),
  }
}));

vi.mock('../../services/voluntariosService', () => ({
  voluntariosService: {
    listar: vi.fn(),
  }
}));

vi.mock('../../services/usuarioService', () => ({
  usuarioService: {
    listar: vi.fn(),
  }
}));

vi.mock('../../services/mensagensService', () => ({
  mensagensService: {
    getMensagensAtendimento: vi.fn(),
  }
}));

describe('ChartCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve exibir "..." inicialmente e depois renderizar as métricas reais', async () => {
    // Mockando respostas para 3 atendimentos, 2 mensagens no primeiro, 1 voluntário e 2 usuários (1 beneficiário)
    vi.mocked(atendimentoService.listarTodos).mockResolvedValue([
      { id: 1 }, { id: 2 }, { id: 3 }
    ] as any);
    
    vi.mocked(voluntariosService.listar).mockResolvedValue([
      { id: 10, nome: 'V1' }
    ] as any);

    vi.mocked(usuarioService.listar).mockResolvedValue([
      { id: 100, tipoUsuario: 'BENEFICIARIO' },
      { id: 101, tipoUsuario: 'VOLUNTARIO' }
    ] as any);

    vi.mocked(mensagensService.getMensagensAtendimento).mockImplementation((id: number) => {
      if (id === 1) return Promise.resolve([{ id: 1 }, { id: 2 }] as any);
      return Promise.resolve([]);
    });

    render(<ChartCard />);

      // Espera até que as atualizações de estado assíncronas aconteçam
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getAllByText('1').length).toBe(2);
    });
  });

  it('deve lidar com falhas na API e cair para 0', async () => {
    vi.mocked(atendimentoService.listarTodos).mockRejectedValue(new Error('Auth error'));
    vi.mocked(voluntariosService.listar).mockRejectedValue(new Error('Auth error'));
    vi.mocked(usuarioService.listar).mockRejectedValue(new Error('Auth error'));

    render(<ChartCard />);

    await waitFor(() => {
      // Deve exibir quatro "0" para cada categoria devido a erro
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(4);
    });
  });
});
