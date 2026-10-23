import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Contato from './Contato';
import FAQ from './FAQ';
import Integrantes from './Integrantes';
import Solucao from './Solucao';
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

  it('apresenta os públicos e conecta o pedido ao trabalho voluntário', () => {
    renderPage(<Solucao />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Todo pedido de ajuda merece acolhimento.');
    expect(screen.getByRole('heading', { name: 'Um sorriso pode abrir novos caminhos.' })).toBeInTheDocument();
    const journey = screen.getByRole('list', { name: 'Caminho de um pedido' });
    expect(within(journey).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Quero fazer parte dessa rede' })).toHaveAttribute('href', '/cadastro-voluntario');
    expect(screen.queryByText('MVP')).not.toBeInTheDocument();
    expect(screen.getByText(/Imagens ilustrativas geradas por IA/)).toBeInTheDocument();
    for (const link of screen.getAllByRole('link')) {
      const href = link.getAttribute('href');
      if (href?.startsWith('#')) expect(document.getElementById(href.slice(1))).toBeInTheDocument();
    }
  });

  it('exibe a redação institucional com acentuação revisada', () => {
    renderPage(<Sobre />);

    expect(screen.getByText('O que é o TDB Responde?')).toBeInTheDocument();
    expect(screen.getByText('Histórico preservado')).toBeInTheDocument();
    expect(screen.getByText('Priorização clara')).toBeInTheDocument();
  });
});
