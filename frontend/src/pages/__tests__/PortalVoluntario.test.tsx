import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortalVoluntario from '../PortalVoluntario';
import { useAuth } from '../../context/useAuth';
import { voluntariosService } from '../../services/voluntariosService';
import { BrowserRouter } from 'react-router-dom';

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

describe('PortalVoluntario - Campanha de Indicações', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  it('deve exibir o botao "Gerar meu Link" se o voluntario nao possui codigo', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome: 'Test', tipoUsuario: 'VOLUNTARIO', voluntarioId: 10 },
      logout: vi.fn(),
    } as any);

    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue({
      id: 10,
      codigoIndicacao: undefined,
    } as any);

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
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome: 'Test', tipoUsuario: 'VOLUNTARIO', voluntarioId: 10 },
      logout: vi.fn(),
    } as any);

    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue({ id: 10 } as any);
    vi.mocked(voluntariosService.gerarCodigoIndicacao).mockResolvedValue({ id: 10, codigoIndicacao: 'TEST12' } as any);

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
});
