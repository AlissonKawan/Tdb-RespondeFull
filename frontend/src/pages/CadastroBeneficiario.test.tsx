import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CadastroBeneficiario from './CadastroBeneficiario';
import { useAuth } from '../context/useAuth';
import { ApiError } from '../services/apiClient';

vi.mock('../context/useAuth', () => ({ useAuth: vi.fn() }));
const registerAccount = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: null, register: registerAccount, login: vi.fn(), logout: vi.fn(),
    isAuthenticated: false, isLoading: false, authError: '',
    isVoluntario: false, isBeneficiario: false, isAdmin: false,
  });
  registerAccount.mockResolvedValue({ nome: 'Pessoa gerada', tipoUsuario: 'BENEFICIARIO' });
});
afterEach(cleanup);

function start(mode = 'CODINOME') {
  render(<MemoryRouter><CadastroBeneficiario /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Programa de atendimento'), { target: { value: 'apolonia' } });
  fireEvent.change(screen.getByLabelText('Como deseja se apresentar?'), { target: { value: mode } });
  fireEvent.change(screen.getByLabelText('Nome de usuário'), { target: { value: 'aurora.segura' } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo123' } });
  fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'segredo123' } });
}

it('cadastra com codinome e sem contato somente após confirmar', async () => {
  start();
  fireEvent.change(screen.getByLabelText('Codinome'), { target: { value: 'Aurora' } });
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta de beneficiário' }));
  const confirm = await screen.findByRole('button', { name: 'Confirmar cadastro' });
  expect(registerAccount).not.toHaveBeenCalled();
  fireEvent.click(confirm);
  await waitFor(() => expect(registerAccount).toHaveBeenCalledExactlyOnceWith({
    nome: 'Aurora', email: '', senha: 'segredo123', usuario: 'aurora.segura',
    tipoUsuario: 'BENEFICIARIO', tipoBeneficiario: 'MULHER_APOLONIA', modoIdentificacao: 'CODINOME',
  }));
  expect(await screen.findByRole('status')).toHaveTextContent('aurora.segura');
});

it('nome gerado não mantém um nome real digitado antes da troca', async () => {
  start('NOME');
  fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Nome privado' } });
  fireEvent.change(screen.getByLabelText('Como deseja se apresentar?'), { target: { value: 'GERADO' } });
  expect(screen.queryByLabelText('Nome completo')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta de beneficiário' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmar cadastro' }));
  await waitFor(() => expect(registerAccount).toHaveBeenCalled());
  expect(registerAccount.mock.calls[0][0].nome).toBe('');
  expect(JSON.stringify(registerAccount.mock.calls)).not.toContain('Nome privado');
});

it('trocar de nome real para codinome exige preencher a nova identificação', () => {
  start('NOME');
  fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Nome privado' } });
  fireEvent.change(screen.getByLabelText('Como deseja se apresentar?'), { target: { value: 'CODINOME' } });
  expect(screen.getByLabelText('Codinome')).toHaveValue('');
});

it('cancelar preserva os dados sem enviar o cadastro', async () => {
  start();
  fireEvent.change(screen.getByLabelText('Codinome'), { target: { value: 'Aurora' } });
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta de beneficiário' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
  expect(registerAccount).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Codinome')).toHaveValue('Aurora');
});

it('exige escolha explícita e mantém o formulário em caso de falha', async () => {
  start('');
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta de beneficiário' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Escolha como deseja se apresentar');
  expect(registerAccount).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Como deseja se apresentar?'), { target: { value: 'GERADO' } });
  registerAccount.mockRejectedValue(new Error('falha'));
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta de beneficiário' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmar cadastro' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível criar o cadastro');
  expect(screen.getByLabelText('Nome de usuário')).toHaveValue('aurora.segura');
});

it('informa conflito de usuário sem atribuí-lo obrigatoriamente ao e-mail', async () => {
  start('GERADO');
  registerAccount.mockRejectedValue(new ApiError('Conflito', 409));
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta de beneficiário' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmar cadastro' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Este usuário ou e-mail já está cadastrado');
});

it('cadastra perfil de Criança e Adolescente já salvando idade, responsável, escola e telefone', async () => {
  render(<MemoryRouter><CadastroBeneficiario /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Lucas Silva' } });
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'lucas@familia.test' } });
  fireEvent.change(screen.getByLabelText(/Telefone/i), { target: { value: '11988887777' } });
  fireEvent.change(screen.getByLabelText('Idade'), { target: { value: '12' } });
  fireEvent.change(screen.getByLabelText('Nome do responsável'), { target: { value: 'Maria Silva' } });
  fireEvent.change(screen.getByLabelText('Escola'), { target: { value: 'Escola Municipal Esperança' } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'segredo123' } });
  fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'segredo123' } });

  fireEvent.click(screen.getByRole('button', { name: 'Criar conta de beneficiário' }));
  const confirm = await screen.findByRole('button', { name: 'Confirmar cadastro' });
  expect(registerAccount).not.toHaveBeenCalled();
  fireEvent.click(confirm);

  await waitFor(() => expect(registerAccount).toHaveBeenCalledExactlyOnceWith({
    nome: 'Lucas Silva',
    email: 'lucas@familia.test',
    telefone: '(11) 98888-7777',
    idade: 12,
    nomeResponsavel: 'Maria Silva',
    escola: 'Escola Municipal Esperança',
    senha: 'segredo123',
    tipoUsuario: 'BENEFICIARIO',
    tipoBeneficiario: 'CRIANCA_ADOLESCENTE',
  }));
});

it('permite que Mulher Apolônia informe telefone opcionalmente e exibe aviso de preenchimento não obrigatório', async () => {
  start();
  expect(screen.getByText(/O preenchimento do telefone não é obrigatório/i)).toBeInTheDocument();
  const telefone = screen.getByLabelText(/Telefone \(opcional\)/i);
  expect(telefone).toBeInTheDocument();
  fireEvent.change(telefone, { target: { value: '11977776666' } });
  fireEvent.change(screen.getByLabelText('Codinome'), { target: { value: 'Aurora Segura' } });
  fireEvent.click(screen.getByRole('button', { name: 'Criar conta de beneficiário' }));
  const confirm = await screen.findByRole('button', { name: 'Confirmar cadastro' });
  fireEvent.click(confirm);
  await waitFor(() => expect(registerAccount).toHaveBeenCalledWith(expect.objectContaining({
    tipoBeneficiario: 'MULHER_APOLONIA',
    telefone: '(11) 97777-6666',
    nome: 'Aurora Segura',
  })));
});
