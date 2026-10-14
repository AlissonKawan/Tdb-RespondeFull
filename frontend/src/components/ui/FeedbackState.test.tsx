import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CardSkeleton, EmptyState, LoadingState, Skeleton, TableSkeleton } from './FeedbackState';

describe('FeedbackState', () => {
  it('renderiza skeleton sem expor o bloco visual para leitores de tela', () => {
    const { container } = render(<Skeleton className="h-8" />);
    const skeleton = container.firstElementChild;

    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton).toHaveClass('animate-pulse', 'motion-reduce:animate-none', 'h-8');
  });

  it('reserva o formato de uma grade de cards', () => {
    const { container } = render(<CardSkeleton count={2} label="Carregando atendimentos" />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando atendimentos');
    expect(container.querySelectorAll('.min-h-52')).toHaveLength(2);
  });

  it('reserva cabecalho e linhas de uma tabela', () => {
    const { container } = render(<TableSkeleton rows={4} columns={3} />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelectorAll('.divide-y > div')).toHaveLength(4);
  });

  it('mantem compatibilidade com LoadingState e sua variante compacta', () => {
    render(<LoadingState title="Validando sessao" variant="inline" />);

    expect(screen.getByRole('status')).toHaveTextContent('Validando sessao');
  });

  it('oferece icone e acao opcional no estado vazio', () => {
    const onAction = vi.fn();
    const { container } = render(
      <EmptyState
        title="Nenhum atendimento"
        description="Crie o primeiro registro."
        actionLabel="Criar novo"
        onAction={onAction}
      />,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Criar novo' }));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
