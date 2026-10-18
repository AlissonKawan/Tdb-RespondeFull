import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImagemAmpliada from './ImagemAmpliada';

describe('ImagemAmpliada', () => {
  const viewport = new EventTarget();
  const matchMediaOriginal = window.matchMedia;
  const originais = {
    showModal: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal'),
    close: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close'),
  };
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue(viewport);
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, writable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = true; }) });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, writable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = false; }) });
  });

  afterEach(() => {
    cleanup();
    window.matchMedia = matchMediaOriginal;
    for (const name of ['showModal', 'close'] as const) {
      const descriptor = originais[name];
      if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
      else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
    }
  });

  it('amplia até 300%, reduz e ajusta novamente à tela', async () => {
    const user = userEvent.setup();
    render(<ImagemAmpliada src="blob:foto" onClose={vi.fn()} />);
    const zoom = screen.getByLabelText('Zoom da imagem');
    const aumentar = screen.getByRole('button', { name: 'Ampliar imagem' });
    const reduzir = screen.getByRole('button', { name: 'Reduzir imagem' });
    expect(zoom).toHaveTextContent('100%');
    expect(reduzir).toBeDisabled();
    for (let i = 0; i < 4; i++) await user.click(aumentar);
    expect(zoom).toHaveTextContent('300%');
    expect(aumentar).toBeDisabled();
    await user.click(reduzir);
    expect(zoom).toHaveTextContent('250%');
    await user.click(screen.getByRole('button', { name: 'Ajustar à tela' }));
    expect(zoom).toHaveTextContent('100%');
    expect(reduzir).toBeDisabled();
    expect(aumentar).toBeEnabled();
  });

  it('oferece voltar, fechar e cancelamento nativo sem navegar para outra página', async () => {
    const user = userEvent.setup();
    const fechar = vi.fn();
    render(<ImagemAmpliada src="blob:foto" onClose={fechar} />);
    await user.click(screen.getByRole('button', { name: 'Voltar à conversa' }));
    await user.click(screen.getByRole('button', { name: 'Fechar imagem' }));
    const cancelamento = new Event('cancel', { cancelable: true });
    fireEvent(screen.getByRole('dialog'), cancelamento);
    expect(cancelamento.defaultPrevented).toBe(true);
    expect(fechar).toHaveBeenCalledTimes(3);
  });

  it('trava a rolagem de fundo e restaura seu estado ao sair', () => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    try {
      const { unmount } = render(<ImagemAmpliada src="blob:foto" onClose={vi.fn()} />);
      expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(HTMLDialogElement.prototype.close).toHaveBeenCalledOnce();
      expect(document.body.style.overflow).toBe('auto');
    } finally {
      document.body.style.overflow = anterior;
    }
  });

  it('mantém a imagem à frente quando o painel muda de modo responsivo', () => {
    render(<ImagemAmpliada src="blob:foto" onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    act(() => { viewport.dispatchEvent(new Event('change')); });
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(2);
    expect(dialog).toHaveAttribute('open');
    expect(document.body.style.overflow).toBe('hidden');
  });
});
