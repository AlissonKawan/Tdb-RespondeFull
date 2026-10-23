import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App';
import { authService } from './services/authService';
import { saveSession } from './services/session';

vi.mock('./services/authService', () => ({
  authService: { me: vi.fn(), login: vi.fn(), logout: vi.fn(), register: vi.fn() },
}));
vi.mock('./pages/Login', () => ({ default: () => <div>Login isolado</div> }));
vi.mock('./pages/PortalBeneficiario', () => ({ default: () => <div>Painel beneficiário</div> }));
vi.mock('./pages/PortalVoluntario', () => ({ default: () => <div>Painel voluntário</div> }));
vi.mock('./pages/Dashboardadmin', () => ({ default: () => <div>Painel administrador</div> }));
vi.mock('./pages/Home', () => ({ default: () => <div>Institucional</div> }));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  localStorage.clear();
});
afterEach(cleanup);

function go(path: string) {
  window.history.replaceState({}, '', path);
  render(<App />);
}

it.each(['/roadmap', '/solucao'])('abre a solução pela URL %s e mantém os links canônicos', async (path) => {
  go(path);
  expect(await screen.findByRole('heading', { name: 'Todo pedido de ajuda merece acolhimento.' })).toBeInTheDocument();
  expect(window.location.pathname).toBe('/solucao');
  for (const link of screen.getAllByRole('link', { name: 'Solução' })) {
    expect(link).toHaveAttribute('href', '/solucao');
  }
});

function authenticated(role: 'VOLUNTARIO' | 'ADMIN' | 'BENEFICIARIO') {
  saveSession({ token: 'x'.repeat(43), expiresAt: new Date(Date.now() + 3_600_000).toISOString() });
  vi.mocked(authService.me).mockResolvedValue({
    id: 7,
    nome: 'Teste',
    email: 't@example.test',
    tipoUsuario: role,
    ativo: true,
  });
}

it.each(['/admin', '/portal', '/portal-voluntario', '/atendimentos/1', '/url-inexistente'])(
  'URL %s sem sessão vai ao login sem layout institucional',
  async (path) => {
    go(path);
    expect(await screen.findByText('Login isolado')).toBeInTheDocument();
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard administrativo')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  },
);

it('raiz sem sessão exibe o conteúdo institucional', async () => {
  go('/');
  expect(await screen.findByText('Institucional')).toBeInTheDocument();
  expect(screen.queryByText('Login isolado')).not.toBeInTheDocument();
  expect(window.location.pathname).toBe('/');
});

it('voluntário não entra no admin digitando URL', async () => {
  authenticated('VOLUNTARIO');
  go('/admin');
  expect(await screen.findByText('Painel voluntário')).toBeInTheDocument();
  expect(screen.queryByText('Painel administrador')).not.toBeInTheDocument();
});

it.each(['/login', '/portal'])('usuário autenticado em %s vai para seu painel', async (path) => {
  authenticated('ADMIN');
  go(path);
  expect(await screen.findByText('Painel administrador')).toBeInTheDocument();
  expect(window.location.pathname).toBe('/admin');
});

it.each(['/', '/institucional'])(
  'usuário autenticado pode consultar a rota institucional %s',
  async (path) => {
    authenticated('ADMIN');
    go(path);
    expect(await screen.findByText('Institucional')).toBeInTheDocument();
    expect(screen.queryByText('Painel administrador')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe(path);
  },
);
