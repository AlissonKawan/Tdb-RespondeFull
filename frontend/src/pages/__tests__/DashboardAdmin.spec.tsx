import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardAdmin from '../Dashboardadmin';
import * as useAuthHook from '../../context/useAuth';
import { usuarioService } from '../../services/usuarioService';
import { voluntariosService } from '../../services/voluntariosService';
import { atendimentoService } from '../../services/atendimentoService';

vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../services/atendimentoService', () => ({
  atendimentoService: {
    listarTodos: vi.fn().mockResolvedValue([]),
    solicitar: vi.fn().mockResolvedValue({}),
    atualizarStatusPrioridade: vi.fn().mockResolvedValue({}),
  }
}));

vi.mock('../../services/voluntariosService', () => ({
  voluntariosService: {
    listar: vi.fn().mockResolvedValue([]),
    listarPendentes: vi.fn().mockResolvedValue([]),
    atualizar: vi.fn().mockResolvedValue({}),
    aprovar: vi.fn().mockResolvedValue({}),
    excluir: vi.fn().mockResolvedValue({}),
  }
}));

vi.mock('../../services/usuarioService', () => ({
  usuarioService: {
    listar: vi.fn().mockResolvedValue([]),
  }
}));

vi.mock('../../services/especialidadesService', () => ({
  getEspecialidades: vi.fn().mockResolvedValue([]),
}));

describe('DashboardAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o título correto e carregar abas', async () => {
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: 3, nome: 'Admin Chefe', email: 'admin@example.com', tipoUsuario: 'ADMIN', ativo: true },
      isVoluntario: false,
      isBeneficiario: false,
      isAdmin: true,
      isAuthenticated: true,
      isLoading: false,
      authError: '',
      logout: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
    });

    render(
      <MemoryRouter>
        <DashboardAdmin />
      </MemoryRouter>
    );

    // O Dashboard começa mostrando loading até que os dados sejam buscados
    expect(screen.getByText('Carregando sistema...')).toBeInTheDocument();

    await waitFor(() => {
      // Verifica o título após carregamento
      expect(screen.getByText('Painel do Administrador')).toBeInTheDocument();
      // Verifica se as abas existem
      expect(screen.getByRole('button', { name: /Beneficiários/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Voluntários/i })).toBeInTheDocument();
    });
  });

  it('deve listar beneficiários filtrados da API', async () => {
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: 3, nome: 'Admin Chefe', email: '', tipoUsuario: 'ADMIN', ativo: true },
      isVoluntario: false,
      isBeneficiario: false,
      isAdmin: true,
      isAuthenticated: true,
      isLoading: false,
      authError: '',
      logout: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
    });

    // Mockando um beneficiário e um voluntário vindos da API
    vi.mocked(usuarioService.listar).mockResolvedValueOnce([
      { id: 10, nome: 'João Beneficiário', email: 'joao@b.com', tipoUsuario: 'BENEFICIARIO', ativo: true },
      { id: 11, nome: 'Maria Voluntária', email: 'maria@v.com', tipoUsuario: 'VOLUNTARIO', ativo: true },
    ]);

    render(
      <MemoryRouter>
        <DashboardAdmin />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Painel do Administrador')).toBeInTheDocument();
    });

    // Clica na aba de Beneficiários
    const btnBeneficiarios = screen.getByRole('button', { name: /Beneficiários/i });
    btnBeneficiarios.click();

    // Deve mostrar João Beneficiário, mas não Maria
    expect(await screen.findByText('João Beneficiário')).toBeInTheDocument();
    expect(screen.queryByText('Maria Voluntária')).not.toBeInTheDocument();
  });

  it('deve filtrar voluntários por nome ou CRO em tempo real', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: 3, nome: 'Admin Chefe', email: '', tipoUsuario: 'ADMIN', ativo: true },
      isVoluntario: false,
      isBeneficiario: false,
      isAdmin: true,
      isAuthenticated: true,
      isLoading: false,
      authError: '',
      logout: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
    });
    vi.mocked(voluntariosService.listar).mockResolvedValueOnce([
      { id: 1, nome: 'Ana Souza', usuario: 'ana@tdb.org', especialidade: null, disponivel: true, acessoSigilo: false, cro: '1234', ufCro: 'SP' },
      { id: 2, nome: 'Bruno Lima', usuario: 'bruno@tdb.org', especialidade: null, disponivel: false, acessoSigilo: false, cro: '9876', ufCro: 'RJ' },
    ]);

    render(<MemoryRouter><DashboardAdmin /></MemoryRouter>);
    await screen.findByText('Painel do Administrador');
    await user.click(screen.getByRole('button', { name: 'Voluntários' }));

    const search = screen.getByRole('searchbox', { name: 'Buscar voluntário' });
    await user.type(search, '9876');

    await waitFor(() => expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument());
    expect(screen.getByText('Bruno Lima')).toBeInTheDocument();
    expect(screen.getByText('1 voluntário encontrado')).toBeInTheDocument();
  });

  it('deve focar o primeiro campo, bloquear a rolagem e fechar o modal com Escape', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: 3, nome: 'Admin Chefe', email: '', tipoUsuario: 'ADMIN', ativo: true },
      isVoluntario: false,
      isBeneficiario: false,
      isAdmin: true,
      isAuthenticated: true,
      isLoading: false,
      authError: '',
      logout: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
    });
    vi.mocked(usuarioService.listar).mockResolvedValueOnce([
      { id: 10, nome: 'João Beneficiário', email: 'joao@b.com', tipoUsuario: 'BENEFICIARIO', ativo: true },
    ]);

    render(<MemoryRouter><DashboardAdmin /></MemoryRouter>);
    await screen.findByText('Painel do Administrador');
    await user.click(screen.getByRole('button', { name: 'Beneficiários' }));
    await user.click(screen.getByRole('button', { name: 'Editar' }));

    const dialog = screen.getByRole('dialog', { name: 'Editar Beneficiário' });
    const nameInput = screen.getByRole('textbox', { name: 'Nome' });
    expect(dialog).toBeInTheDocument();
    expect(nameInput).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.keyDown(nameInput, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: 'Editar Beneficiário' })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('traduz status e confirma a mudança com paciente e valores anterior e novo', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: 3, nome: 'Admin', email: '', tipoUsuario: 'ADMIN', ativo: true },
      isVoluntario: false, isBeneficiario: false, isAdmin: true, isAuthenticated: true,
      isLoading: false, authError: '', logout: vi.fn(), login: vi.fn(), register: vi.fn(),
    });
    vi.mocked(atendimentoService.listarTodos).mockResolvedValueOnce([{ id: 777, pessoaAtendidaNome: 'Eduardo Boni', status: 'ABERTO' }]);
    render(<MemoryRouter><DashboardAdmin /></MemoryRouter>);
    await user.click(await screen.findByRole('button', { name: 'Atendimentos' }));
    const status = screen.getByRole('combobox', { name: 'Status do atendimento de Eduardo Boni' });
    await user.selectOptions(status, 'EM_ATENDIMENTO');
    expect(await screen.findByText('Aberto → Em andamento')).toBeInTheDocument();
    expect(screen.getByText('Deseja realmente alterar o status deste atendimento para Em andamento?')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/EM_ATENDIMENTO|ABERTO|#777/);
    expect(atendimentoService.atualizarStatusPrioridade).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(status).toHaveValue('ABERTO');
    await user.selectOptions(status, 'EM_ATENDIMENTO');
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(atendimentoService.atualizarStatusPrioridade).toHaveBeenCalledWith(777, { status: 'EM_ATENDIMENTO' }));
  });
});

describe('Permissão de casos sigilosos no painel administrativo', () => {
  const voluntario = {
    id: 80, nome: 'Voluntária sintética', usuario: 'voluntaria.sintetica',
    disponivel: true, acessoSigilo: false, cro: '12345', ufCro: 'SP',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      user: { id: 3, nome: 'Admin', email: '', tipoUsuario: 'ADMIN', ativo: true },
      isVoluntario: false, isBeneficiario: false, isAdmin: true, isAuthenticated: true,
      isLoading: false, authError: '', logout: vi.fn(), login: vi.fn(), register: vi.fn(),
    });
    vi.mocked(atendimentoService.listarTodos).mockResolvedValue([]);
    vi.mocked(usuarioService.listar).mockResolvedValue([]);
    vi.mocked(voluntariosService.listar).mockResolvedValue([voluntario]);
    vi.mocked(voluntariosService.listarPendentes).mockResolvedValue([]);
    vi.mocked(voluntariosService.atualizar).mockResolvedValue(voluntario);
  });

  async function abrirEdicao() {
    const user = userEvent.setup();
    render(<MemoryRouter><DashboardAdmin /></MemoryRouter>);
    await user.click(await screen.findByRole('button', { name: 'Voluntários' }));
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    return user;
  }

  it.each([
    [false, 'true', 'Não autorizado → Autorizado', true],
    [true, 'false', 'Autorizado → Não autorizado', false],
  ] as const)('confirma a alteração de acesso %s para %s antes de persistir', async (antes, opcao, resumo, depois) => {
    vi.mocked(voluntariosService.listar).mockResolvedValue([{ ...voluntario, acessoSigilo: antes }]);
    const user = await abrirEdicao();
    const salvar = screen.getByRole('button', { name: 'Salvar Alterações' });
    expect(salvar).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Autorizar atendimento de casos sigilosos'), opcao);
    await user.click(salvar);
    const confirmacao = screen.getByRole('alertdialog', { name: 'Confirmar alterações do voluntário' });
    expect(within(confirmacao).getByText(resumo)).toBeInTheDocument();
    expect(within(confirmacao).getByText(voluntario.nome)).toBeInTheDocument();
    expect(voluntariosService.atualizar).not.toHaveBeenCalled();
    await user.click(within(confirmacao).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(voluntariosService.atualizar).toHaveBeenCalledExactlyOnceWith(80, {
      nome: voluntario.nome, usuario: voluntario.usuario, senha: '', acessoSigilo: depois,
      cro: '12345', ufCro: 'SP', disponivel: true,
    }));
    expect(await screen.findByText('Voluntário atualizado com sucesso!')).toBeInTheDocument();
  });

  it('cancelar a confirmação mantém os campos sem enviar requisição', async () => {
    const user = await abrirEdicao();
    const nome = screen.getByLabelText('Nome');
    await user.clear(nome);
    await user.type(nome, 'Nome sintético alterado');
    await user.selectOptions(screen.getByLabelText('Autorizar atendimento de casos sigilosos'), 'true');
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
    const confirmacao = screen.getByRole('alertdialog');
    expect(within(confirmacao).getByText('Voluntária sintética → Nome sintético alterado')).toBeInTheDocument();
    await user.click(within(confirmacao).getByRole('button', { name: 'Cancelar' }));
    expect(nome).toHaveValue('Nome sintético alterado');
    expect(screen.getByLabelText('Autorizar atendimento de casos sigilosos')).toHaveValue('true');
    expect(voluntariosService.atualizar).not.toHaveBeenCalled();
  });

  it('preserva a edição após erro e permite tentar novamente', async () => {
    vi.mocked(voluntariosService.atualizar).mockRejectedValueOnce(new Error('Falha sintética'));
    const user = await abrirEdicao();
    await user.selectOptions(screen.getByLabelText('Autorizar atendimento de casos sigilosos'), 'true');
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Os dados preenchidos foram mantidos');
    expect(screen.getByLabelText('Autorizar atendimento de casos sigilosos')).toHaveValue('true');
    expect(screen.getByRole('button', { name: 'Salvar Alterações' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(voluntariosService.atualizar).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Voluntário atualizado com sucesso!')).toBeInTheDocument();
  });

  it('bloqueia novo envio, edição e fechamento durante o salvamento', async () => {
    let concluir!: () => void;
    vi.mocked(voluntariosService.atualizar).mockReturnValueOnce(new Promise(resolve => {
      concluir = () => resolve({ ...voluntario, acessoSigilo: true });
    }));
    const user = await abrirEdicao();
    await user.selectOptions(screen.getByLabelText('Autorizar atendimento de casos sigilosos'), 'true');
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));
    await user.dblClick(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Salvar' }));
    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled();
    expect(screen.getByLabelText('Autorizar atendimento de casos sigilosos')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Fechar Editar Voluntário' }));
    expect(screen.getByRole('dialog', { name: 'Editar Voluntário' })).toBeInTheDocument();
    expect(voluntariosService.atualizar).toHaveBeenCalledTimes(1);
    await act(async () => concluir());
    expect(await screen.findByText('Voluntário atualizado com sucesso!')).toBeInTheDocument();
  });
});
