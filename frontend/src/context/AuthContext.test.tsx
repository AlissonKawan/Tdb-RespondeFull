import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';
import { authService } from '../services/authService';
import { ApiError } from '../services/apiClient';
import { AUTH_EXPIRED, readSession, saveSession } from '../services/session';

vi.mock('../services/authService', () => ({ authService: {
  me: vi.fn(), login: vi.fn(), logout: vi.fn().mockResolvedValue(undefined), register: vi.fn(),
} }));
const user = { id: 7, nome: 'Pessoa', email: 'p@example.test', tipoUsuario: 'BENEFICIARIO' as const, ativo: true };
const session = { token: 'x'.repeat(43), expiresAt: new Date(Date.now() + 3600000).toISOString() };
function Probe() {
  const auth = useAuth();
  return <><p>{auth.isLoading ? 'validando' : auth.user?.nome || 'desconectado'}</p>
    <p>{auth.authError}</p><button onClick={auth.logout}>Sair</button>
    <button onClick={() => void auth.login({ email: 'p@example.test', senha: 'teste123' })}>Entrar</button></>;
}
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); localStorage.clear(); });
afterEach(cleanup);
describe('sessão autenticada', () => {
  it('ignora usuário antigo ou forjado no localStorage', async () => {
    localStorage.setItem('tdb_auth_user', JSON.stringify({ ...user, tipoUsuario: 'ADMIN' }));
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(await screen.findByText('desconectado')).toBeInTheDocument();
    expect(localStorage.getItem('tdb_auth_user')).toBeNull();
    expect(authService.me).not.toHaveBeenCalled();
  });
  it('aguarda confirmação do servidor antes de restaurar usuário', async () => {
    saveSession(session);
    let resolve!: (value: typeof user) => void;
    vi.mocked(authService.me).mockReturnValue(new Promise(r => { resolve = r; }));
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByText('validando')).toBeInTheDocument();
    expect(screen.queryByText('Pessoa')).not.toBeInTheDocument();
    await act(async () => resolve(user));
    expect(screen.getByText('Pessoa')).toBeInTheDocument();
  });
  it('descarta sessão rejeitada pelo servidor', async () => {
    saveSession(session);
    vi.mocked(authService.me).mockRejectedValue(new ApiError('expirada', 401));
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(await screen.findByText('desconectado')).toBeInTheDocument();
    expect(readSession()).toBeNull();
  });
  it('falha de rede não libera conteúdo privado nem apaga credencial', async () => {
    saveSession(session);
    vi.mocked(authService.me).mockRejectedValue(new ApiError('offline', 0));
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(await screen.findByText(/Não foi possível validar/)).toBeInTheDocument();
    expect(screen.queryByText('Pessoa')).not.toBeInTheDocument();
    expect(readSession()?.token).toBe(session.token);
  });
  it('logout revoga no servidor e limpa o navegador', async () => {
    vi.mocked(authService.login).mockResolvedValue({ ...session, user });
    render(<AuthProvider><Probe /></AuthProvider>);
    fireEvent.click(screen.getByText('Entrar'));
    await screen.findByText('Pessoa');
    fireEvent.click(screen.getByText('Sair'));
    expect(authService.logout).toHaveBeenCalledOnce();
    expect(readSession()).toBeNull();
    expect(screen.getByText('desconectado')).toBeInTheDocument();
  });
  it('401 de outra chamada encerra sessão e uma resposta antiga não a restaura', async () => {
    saveSession(session);
    let resolve!: (value: typeof user) => void;
    vi.mocked(authService.me).mockReturnValue(new Promise(r => { resolve = r; }));
    render(<AuthProvider><Probe /></AuthProvider>);
    act(() => { window.dispatchEvent(new Event(AUTH_EXPIRED)); });
    await act(async () => resolve(user));
    await waitFor(() => expect(screen.getByText('desconectado')).toBeInTheDocument());
    expect(readSession()).toBeNull();
  });
});
