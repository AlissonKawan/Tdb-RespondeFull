import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortalVoluntario from '../PortalVoluntario';
import { useAuth } from '../../context/useAuth';
import { voluntariosService } from '../../services/voluntariosService';
import { atendimentoService } from '../../services/atendimentoService';
import { mensagensService } from '../../services/mensagensService';
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

vi.mock('../../services/mensagensService', () => ({
  mensagensService: {
    getMensagensAtendimento: vi.fn().mockResolvedValue([]),
  },
}));

describe('PortalVoluntario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
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

  it('deve exibir nome do paciente como titulo, ordenar por dataAtualizacao e exibir badge de Nova Mensagem', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome: 'Voluntario', tipoUsuario: 'VOLUNTARIO', voluntarioId: 10 },
      logout: vi.fn(),
    } as any);

    vi.mocked(voluntariosService.buscarPorId).mockResolvedValue({ id: 10 } as any);

    // Mock Atendimentos (A = Antigo, B = Recente)
    vi.mocked(atendimentoService.listarPorVoluntario).mockResolvedValue([
      { id: 1, beneficiarioNome: 'Paciente Antigo', dataAtualizacao: '2023-01-01T00:00:00Z', status: 'ABERTO' },
      { id: 2, beneficiarioNome: 'Paciente Recente', dataAtualizacao: '2023-12-31T00:00:00Z', status: 'EM_ATENDIMENTO' },
    ] as any);

    // Mock Mensagens para Atendimento 2 (Recente) ter nova mensagem do BENEFICIARIO
    vi.mocked(mensagensService.getMensagensAtendimento).mockImplementation(async (id: number) => {
      if (id === 2) {
        return [{ id: 100, conteudo: 'Nova msg', enviadoPor: 'BENEFICIARIO', dataHora: new Date().toISOString() }] as any;
      }
      return [];
    });

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
  });
});
