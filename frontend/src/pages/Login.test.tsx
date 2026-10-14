import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from './Login';
import { useAuth } from '../context/useAuth';
import type { AuthUser, TipoUsuario } from '../types/auth';

vi.mock('../context/useAuth', () => ({ useAuth: vi.fn() }));

const login = vi.fn();
const logout = vi.fn();

function authUser(tipoUsuario: TipoUsuario, ativo = true): AuthUser {
  return {
    id: 1,
    nome: 'Pessoa Teste',
    email: 'pessoa@teste.com',
    tipoUsuario,
    ativo,
  };
}

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<p>Painel admin</p>} />
        <Route path="/portal-voluntario" element={<p>Portal voluntário</p>} />
        <Route path="/portal-beneficiario" element={<p>Portal beneficiário</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function preencherEEntrar() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('E-mail'), 'pessoa@teste.com');
  await user.type(screen.getByLabelText('Senha'), 'senha123');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    login,
    logout,
    register: vi.fn(),
    isLoading: false,
    authError: '',
    isAuthenticated: false,
    isVoluntario: false,
    isBeneficiario: false,
    isAdmin: false,
  });
});

afterEach(cleanup);

describe('login sem seleção prévia de perfil', () => {
  it('oferece retorno explícito para a página inicial', () => {
    renderLogin();

    expect(screen.getByRole('link', { name: 'Voltar para a página inicial' })).toHaveAttribute('href', '/');
  });

  it.each([
    ['ADMIN', 'Painel admin'],
    ['VOLUNTARIO', 'Portal voluntário'],
    ['BENEFICIARIO', 'Portal beneficiário'],
  ] as const)('redireciona %s para o portal correto', async (tipoUsuario, destino) => {
    login.mockResolvedValue(authUser(tipoUsuario));
    renderLogin();

    await preencherEEntrar();

    expect(await screen.findByText(destino)).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });

  it('alterna a visibilidade da senha com nome acessível atualizado', async () => {
    const user = userEvent.setup();
    renderLogin();
    const senha = screen.getByLabelText('Senha');

    expect(senha).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(senha).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(senha).toHaveAttribute('type', 'password');
  });

  it('mantém bloqueio e mensagem para conta inativa', async () => {
    login.mockResolvedValue(authUser('VOLUNTARIO', false));
    renderLogin();

    await preencherEEntrar();

    expect(logout).toHaveBeenCalledOnce();
    expect(await screen.findByRole('alert')).toHaveTextContent('ainda está em análise');
    expect(screen.queryByText('Portal voluntário')).not.toBeInTheDocument();
  });
});
