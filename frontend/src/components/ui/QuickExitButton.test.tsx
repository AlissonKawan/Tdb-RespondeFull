import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import QuickExitButton from './QuickExitButton';
import { quickExit } from '../../services/quickExit';

vi.mock('../../services/quickExit', () => ({ quickExit: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('explica o limite do histórico e sai sem submeter o formulário', () => {
  const submit = vi.fn();
  render(<form onSubmit={submit}><QuickExitButton /></form>);
  expect(screen.getByText('Não apaga o histórico')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Saída rápida para o YouTube' }));
  expect(quickExit).toHaveBeenCalledOnce();
  expect(submit).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
