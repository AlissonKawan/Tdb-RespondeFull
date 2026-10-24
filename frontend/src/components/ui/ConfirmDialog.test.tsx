import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ConfirmDialog from './ConfirmDialog';
import { quickExit } from '../../services/quickExit';
import { AuthContext, type AuthContextType } from '../../context/authContextInstance';
import type { AuthUser } from '../../types/auth';

vi.mock('../../services/quickExit', () => ({ quickExit: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it.each([
  ['VOLUNTARIO', undefined, false],
  ['BENEFICIARIO', 'CRIANCA_ADOLESCENTE', false],
  ['BENEFICIARIO', 'MULHER_APOLONIA', true],
] as const)('respeita saída rápida para %s / %s sem faixa vazia no modal', (tipoUsuario, tipoBeneficiario, visible) => {
  const user: AuthUser = { id: 1, nome: 'Pessoa teste', email: null, ativo: true, tipoUsuario, tipoBeneficiario };
  const onConfirm = vi.fn();
  render(<AuthContext.Provider value={{ user } as AuthContextType}>
    <ConfirmDialog config={{ title: 'Excluir Tarefa', message: 'Deseja realmente excluir esta tarefa?',
      tone: 'danger', confirmText: 'Excluir', onConfirm }} onClose={vi.fn()} />
  </AuthContext.Provider>);
  const dialog = screen.getByRole('alertdialog', { name: 'Excluir Tarefa' });
  expect(dialog).toHaveAccessibleDescription('Deseja realmente excluir esta tarefa?');
  expect(within(dialog).queryByRole('button', { name: 'Saída rápida para o YouTube' }) !== null).toBe(visible);
  expect(dialog.querySelector('.justify-end.px-6.py-2') !== null).toBe(visible);
  fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }));
  expect(onConfirm).toHaveBeenCalledOnce();
});

describe('Confirmação compacta de saída', () => {
  function abrir() {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmDialog config={{ title: 'Sair da conta', message: 'Você realmente quer sair da conta?',
      compact: true, tone: 'danger', confirmText: 'Sair', onConfirm }} onClose={onClose} />);
    return { onConfirm, onClose, dialog: screen.getByRole('alertdialog', { name: 'Sair da conta' }) };
  }

  it('mantém mensagem acessível e encerra a sessão somente ao confirmar', () => {
    const { dialog, onConfirm, onClose } = abrir();
    expect(dialog).toHaveAccessibleDescription('Você realmente quer sair da conta?');
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: /^Sair$/ }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('cancelar, fechar e Escape não encerram a sessão', () => {
    const { dialog, onConfirm, onClose } = abrir();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fechar Sair da conta' }));
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('mantém uma única saída rápida independente da confirmação', () => {
    const { dialog, onConfirm, onClose } = abrir();
    expect(within(dialog).getAllByRole('button', { name: 'Saída rápida para o YouTube' })).toHaveLength(1);
    expect(within(dialog).getByRole('button', { name: 'Saída rápida para o YouTube' })).toHaveAccessibleDescription('Não apaga o histórico');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Saída rápida para o YouTube' }));
    expect(quickExit).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('preserva os resumos detalhados das demais confirmações', () => {
    render(<ConfirmDialog config={{ title: 'Confirmar alteração', message: 'Revise a alteração.',
      details: [{ label: 'Status', value: 'Aberto → Em andamento' }], onConfirm: vi.fn() }} onClose={vi.fn()} />);
    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription('Revise a alteração.');
    expect(screen.getByText('Aberto → Em andamento')).toBeInTheDocument();
  });
});
