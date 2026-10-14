import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AgendaConsultas from '../AgendaConsultas';
import { useAuth } from '../../context/useAuth';
import { agendaService } from '../../services/agendaService';

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
  });

  it('exibe validacao contextual e nao envia consulta sem paciente', async () => {
    const user = userEvent.setup();
    render(<BrowserRouter><AgendaConsultas /></BrowserRouter>);

    await user.click(screen.getByRole('button', { name: 'Nova consulta' }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Informe o nome do paciente.');
    expect(agendaService.criar).not.toHaveBeenCalled();
  });
});
