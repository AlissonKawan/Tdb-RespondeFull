import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SolicitarAtendimento from '../SolicitarAtendimento';
import { useAuth } from '../../context/useAuth';
import { listarCanais } from '../../services/canaisService';
import { relatarAtendimento } from '../../services/relatoAtendimentoService';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/canaisService', () => ({
  listarCanais: vi.fn(),
}));

vi.mock('../../services/relatoAtendimentoService', () => ({
  relatarAtendimento: vi.fn(),
}));

describe('SolicitarAtendimento', () => {
  const mockCanais = [
    { id: 1, nome: 'WhatsApp', descricao: 'WhatsApp link' },
    { id: 5, nome: 'Formulario Web', descricao: 'Web Form' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 10, nome: 'Maria Silva', email: 'maria@example.com', tipoUsuario: 'BENEFICIARIO' },
      logout: vi.fn(),
    } as any);
    vi.mocked(listarCanais).mockResolvedValue(mockCanais as any);
  });

  it('deve ocultar campos tecnicos (prioridade, gravidade bucal, canal de comunicacao) na renderizacao inicial', async () => {
    render(
      <BrowserRouter>
        <SolicitarAtendimento />
      </BrowserRouter>
    );

    // Aguarda carregar os canais em segundo plano
    await waitFor(() => {
      expect(listarCanais).toHaveBeenCalled();
    });

    // Validar que os campos ocultados não estão visíveis
    expect(screen.queryByLabelText(/Prioridade/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Canal de comunicacao/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Gravidade bucal/i)).not.toBeInTheDocument();

    // Validar que o campo geral de Nome está visível por padrão (como Criança ou Adolescente está selecionado inicialmente)
    expect(screen.getByLabelText(/Nome da pessoa atendida/i)).toBeInTheDocument();
  });

  it('deve ocultar campo de nome geral e exibir apenas codinome quando o tipo for Mulher Apolonia', async () => {
    render(
      <BrowserRouter>
        <SolicitarAtendimento />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(listarCanais).toHaveBeenCalled();
    });

    // Altera o tipo para Mulher Apolonia
    const selectTipo = screen.getByLabelText(/Tipo da pessoa atendida/i);
    fireEvent.change(selectTipo, { target: { value: 'MULHER_APOLONIA' } });

    // O campo geral de nome deve desaparecer
    expect(screen.queryByLabelText(/Nome da pessoa atendida/i)).not.toBeInTheDocument();

    // O campo codinome deve aparecer no bloco de sigilo sensível
    expect(screen.getByLabelText(/Codinome/i)).toBeInTheDocument();
  });

  it('deve submeter o payload correto com o codinome mapeado para nomeCodificado para Mulher Apolonia', async () => {
    vi.mocked(relatarAtendimento).mockResolvedValue({ id: 123 } as any);

    render(
      <BrowserRouter>
        <SolicitarAtendimento />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(listarCanais).toHaveBeenCalled();
    });

    // Altera o tipo para Mulher Apolonia
    const selectTipo = screen.getByLabelText(/Tipo da pessoa atendida/i);
    fireEvent.change(selectTipo, { target: { value: 'MULHER_APOLONIA' } });

    // Preenche telefone, email, codinome e descricao
    fireEvent.change(screen.getByLabelText(/Telefone/i), { target: { value: '(11) 98888-8888' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Codinome/i), { target: { value: 'Aurora Segura' } });
    fireEvent.change(screen.getByLabelText(/Descricao da situacao/i), { target: { value: 'Esta e uma descricao de teste valida com mais de 15 caracteres.' } });

    // Clica no botão de enviar
    const submitBtn = screen.getByRole('button', { name: /Enviar relato/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(relatarAtendimento).toHaveBeenCalled();
    });

    // O payload enviado deve conter nomeCodificado = 'Aurora Segura' (mapeado de codinome),
    // e o canalComunicacaoId deve ser 5 (Formulario Web detectado automaticamente)
    const payload = vi.mocked(relatarAtendimento).mock.calls[0][0];
    expect(payload.nomeCodificado).toBe('Aurora Segura');
    expect(payload.canalComunicacaoId).toBe(5); // Detectado Formulario Web na busca automatica do mock
    expect(payload.prioridade).toBe(3); // Default inicial
  });
});
