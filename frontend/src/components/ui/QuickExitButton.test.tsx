import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import QuickExitButton from './QuickExitButton';
import { quickExit } from '../../services/quickExit';

vi.mock('../../services/quickExit', () => ({ quickExit: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('explica o limite do histórico e sai sem submeter o formulário', () => {
  const submit = vi.fn();
  render(<form onSubmit={submit}><QuickExitButton /></form>);
  const exit = screen.getByRole('button', { name: 'Saída rápida para o YouTube' });
  expect(exit).toHaveAccessibleDescription('Não apaga o histórico');
  expect(exit).toHaveAttribute('title', expect.stringContaining('Não apaga o histórico do navegador.'));
  fireEvent.click(exit);
  expect(quickExit).toHaveBeenCalledOnce();
  expect(submit).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('permite saída imediata pelo teclado sem modal de confirmação', async () => {
  const user = userEvent.setup();
  render(<QuickExitButton />);
  await user.tab();
  expect(screen.getByRole('button', { name: 'Saída rápida para o YouTube' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(quickExit).toHaveBeenCalledOnce();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
