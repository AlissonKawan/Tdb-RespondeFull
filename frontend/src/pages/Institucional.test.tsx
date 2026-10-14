import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Contato from './Contato';
import FAQ from './FAQ';
import Integrantes from './Integrantes';
import Roadmap from './Roadmap';
import Sobre from './Sobre';
import { contatoService } from '../services/contatoService';

vi.mock('../services/contatoService', () => ({
  contatoService: { enviarMensagem: vi.fn() },
}));

function renderPage(page: ReactNode) {
  return render(<BrowserRouter>{page}</BrowserRouter>);
}

describe('páginas institucionais', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contatoService.enviarMensagem).mockResolvedValue({
      id: 1,
      nome: 'Maria Silva',
      email: 'maria@teste.org',
      mensagem: 'Mensagem enviada.',
      dataEnvio: '2026-10-14T12:00:00Z',
      lida: false,
    });
  });

  it('filtra o FAQ por categoria e usa chevron para indicar expansão', async () => {
    const user = userEvent.setup();
    renderPage(<FAQ />);

    await user.click(screen.getByRole('button', { name: 'Privacidade' }));

    const privacyQuestion = screen.getByRole('button', { name: /Os dados das pessoas assistidas são protegidos/ });
    expect(privacyQuestion).toHaveAttribute('aria-expanded', 'true');
    expect(privacyQuestion.querySelector('svg')).toHaveClass('rotate-180');
    expect(screen.queryByText('O que é o TDB Responde?')).not.toBeInTheDocument();
  });

  it('envia a mensagem de contato diretamente, sem abrir confirmação', async () => {
    const user = userEvent.setup();
    renderPage(<Contato />);

    await user.type(screen.getByLabelText('Nome'), 'Maria Silva');
    await user.type(screen.getByLabelText('E-mail'), 'maria@teste.org');
    await user.type(screen.getByLabelText('Mensagem'), 'Gostaria de conhecer melhor o projeto.');
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));

    await waitFor(() => expect(contatoService.enviarMensagem).toHaveBeenCalledWith({
      nome: 'Maria Silva',
      email: 'maria@teste.org',
      mensagem: 'Gostaria de conhecer melhor o projeto.',
    }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('Mensagem enviada com sucesso.');
  });

  it('apresenta GitHub e LinkedIn com ícones vetoriais acessíveis', () => {
    renderPage(<Integrantes />);

    const github = screen.getByRole('link', { name: 'GitHub de Alisson Kawan' });
    const linkedin = screen.getByRole('link', { name: 'LinkedIn de Alisson Kawan' });
    expect(github.querySelector('svg')).toBeInTheDocument();
    expect(linkedin.querySelector('svg')).toBeInTheDocument();
  });

  it('estrutura o roadmap nas três fases de entrega', () => {
    renderPage(<Roadmap />);

    const timeline = screen.getByRole('list', { name: 'Fases de entrega do TDB Responde' });
    expect(screen.getByRole('heading', { name: 'MVP' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Inteligência Operacional' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Expansão de Rede' })).toBeInTheDocument();
    expect(within(timeline).getAllByRole('listitem').length).toBeGreaterThanOrEqual(3);
  });

  it('exibe a redação institucional com acentuação revisada', () => {
    renderPage(<Sobre />);

    expect(screen.getByText('O que é o TDB Responde?')).toBeInTheDocument();
    expect(screen.getByText('Histórico preservado')).toBeInTheDocument();
    expect(screen.getByText('Priorização clara')).toBeInTheDocument();
  });
});
