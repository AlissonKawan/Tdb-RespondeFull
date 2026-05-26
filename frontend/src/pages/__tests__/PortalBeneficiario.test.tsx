import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PortalBeneficiario from '../PortalBeneficiario';
import { useAuth } from '../../context/useAuth';
import { atendimentoService } from '../../services/atendimentoService';
import { mensagensService } from '../../services/mensagensService';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/atendimentoService', () => ({
  atendimentoService: {
    listarPorContaBeneficiario: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/mensagensService', () => ({
  mensagensService: {
    getMensagensAtendimento: vi.fn().mockResolvedValue([]),
  },
}));

describe('PortalBeneficiario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve exibir nome do paciente como titulo, ordenar por dataAtualizacao e exibir badge de Nova Mensagem', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome: 'Beneficiario Teste', tipoUsuario: 'BENEFICIARIO' },
      logout: vi.fn(),
    } as any);

    // Mock Atendimentos (A = Antigo, B = Recente)
    vi.mocked(atendimentoService.listarPorContaBeneficiario).mockResolvedValue([
      { id: 1, beneficiarioNome: 'Filho Antigo', dataAtualizacao: '2023-01-01T00:00:00Z', status: 'ABERTO' },
      { id: 2, beneficiarioNome: 'Filho Recente', dataAtualizacao: '2023-12-31T00:00:00Z', status: 'EM_ATENDIMENTO' },
    ] as any);

    // Mock Mensagens para Atendimento 2 (Recente) ter nova mensagem do VOLUNTARIO
    vi.mocked(mensagensService.getMensagensAtendimento).mockImplementation(async (id: number) => {
      if (id === 2) {
        return [{ id: 100, conteudo: 'Nova msg', enviadoPor: 'VOLUNTARIO', dataHora: new Date().toISOString() }] as any;
      }
      return [];
    });

    render(
      <BrowserRouter>
        <PortalBeneficiario />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Devem aparecer os nomes
      expect(screen.getByText('Filho Antigo')).toBeInTheDocument();
      expect(screen.getByText('Filho Recente')).toBeInTheDocument();
      // Badge Nova Mensagem
      expect(screen.getByText('Nova Mensagem')).toBeInTheDocument();
    });

    // Validar ordenacao (Filho Recente deve vir primeiro no DOM)
    const titles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    const posRecente = titles.indexOf('Filho Recente');
    const posAntigo = titles.indexOf('Filho Antigo');
    expect(posRecente).toBeLessThan(posAntigo);
  });
});
