import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AgendaConsultas from '../AgendaConsultas';
import { useAuth } from '../../context/useAuth';
import { agendaService, type AgendaConsulta } from '../../services/agendaService';
import { prontuarioService } from '../../services/prontuarioService';
import { atendimentoService } from '../../services/atendimentoService';
import { ApiError } from '../../services/apiClient';
import type { AtendimentoApi } from '../../types/AtendimentoApi';

vi.mock('../../context/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../../services/agendaService', () => ({
  agendaService: { buscarPorVoluntario: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), excluir: vi.fn() },
}));
vi.mock('../../services/prontuarioService', () => ({
  prontuarioService: { buscarPorAgenda: vi.fn(), registrarEvolucao: vi.fn() },
}));
vi.mock('../../services/atendimentoService', () => ({
  atendimentoService: { listarPorVoluntario: vi.fn() },
}));

const consulta: AgendaConsulta = {
  id: 50, voluntarioId: 10, atendimentoId: 777, paciente: 'Eduardo Boni',
  tipo: 'Avaliação Inicial', dataConsulta: '2099-10-20', horario: '14:30',
  status: 'CONFIRMADO', tipoPessoa: 'CRIANCA_ADOLESCENTE',
};
const atendimento: AtendimentoApi = {
  id: 777, pessoaAtendidaNome: 'Eduardo Boni', status: 'EM_ATENDIMENTO',
  dataAbertura: '2099-10-18T10:00:00', tipoPessoa: 'CRIANCA_ADOLESCENTE',
};

function renderAgenda() {
  render(<MemoryRouter><AgendaConsultas /></MemoryRouter>);
}

async function novaConsulta() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Nova consulta' }));
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Selecionar Atendimento' })).toBeEnabled());
  return user;
}

describe('AgendaConsultas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, nome: 'Dentista', email: 'dentista@teste.org', tipoUsuario: 'VOLUNTARIO', ativo: true, voluntarioId: 10 },
      login: vi.fn(), register: vi.fn(), logout: vi.fn(), isAuthenticated: true,
      isLoading: false, authError: '', isVoluntario: true, isBeneficiario: false, isAdmin: false,
    });
    vi.mocked(agendaService.buscarPorVoluntario).mockResolvedValue([]);
    vi.mocked(atendimentoService.listarPorVoluntario).mockResolvedValue([]);
    vi.mocked(prontuarioService.buscarPorAgenda).mockResolvedValue([]);
  });
  afterEach(() => vi.restoreAllMocks());

  it('busca agenda pelo id do voluntario, distinto do id da conta', async () => {
    renderAgenda();
    await waitFor(() => expect(agendaService.buscarPorVoluntario).toHaveBeenCalledWith(10));
    expect(agendaService.buscarPorVoluntario).not.toHaveBeenCalledWith(1);
    expect(atendimentoService.listarPorVoluntario).toHaveBeenCalledWith(10);
  });

  it('nao usa o id da conta quando falta o vinculo de voluntario', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: {
      id: 1, nome: 'Dentista', email: 'dentista@teste.org', tipoUsuario: 'VOLUNTARIO', ativo: true,
    } } as ReturnType<typeof useAuth>);
    renderAgenda();
    expect(await screen.findByText('Sua conta não possui um voluntário vinculado para consultar a agenda.')).toBeInTheDocument();
    expect(agendaService.buscarPorVoluntario).not.toHaveBeenCalled();
    expect(atendimentoService.listarPorVoluntario).not.toHaveBeenCalled();
  });

  it('distingue negacao de acesso de falha de conexao na agenda', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(agendaService.buscarPorVoluntario).mockRejectedValueOnce(new ApiError('Acesso negado', 403));
    renderAgenda();
    expect(await screen.findByText('Você não tem permissão para consultar esta agenda.')).toBeInTheDocument();
    expect(screen.queryByText('Falha ao conectar com o servidor para buscar sua agenda.')).not.toBeInTheDocument();
  });

  it('valida nome, data e horário antes de confirmar ou enviar', async () => {
    renderAgenda();
    const user = await novaConsulta();
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Horário'), { target: { value: '' } });
    await user.click(screen.getByRole('button', { name: 'Salvar consulta' }));
    expect(await screen.findByText('Informe o nome do paciente.')).toBeInTheDocument();
    expect(screen.getByText('Informe a data da consulta.')).toBeInTheDocument();
    expect(screen.getByText('Informe o horário.')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(agendaService.criar).not.toHaveBeenCalled();
  });

  it('exibe opções humanas e preenche os dados da consulta vinculada', async () => {
    vi.mocked(agendaService.buscarPorVoluntario).mockResolvedValue([consulta]);
    vi.mocked(atendimentoService.listarPorVoluntario).mockResolvedValue([atendimento]);
    renderAgenda();
    const user = await novaConsulta();
    expect(screen.getByRole('option', { name: 'Eduardo Boni — 20/10/2099 às 14:30 — Avaliação Inicial' })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Selecionar Atendimento' }), '777');
    expect(screen.getByLabelText('Nome do Paciente')).toHaveValue('Eduardo Boni');
    expect(screen.getByLabelText('Tipo de Atendimento')).toHaveValue('Avaliação Inicial');
    expect(screen.getByLabelText('Data')).toHaveValue('2099-10-20');
    expect(screen.getByLabelText('Horário')).toHaveValue('14:30');
    expect(screen.getByLabelText('Status')).toHaveValue('CONFIRMADO');
    expect(screen.queryByPlaceholderText('Ex: 1001')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/EM_ATENDIMENTO|CONFIRMADO|CRIANCA_ADOLESCENTE|#777/);
    expect(screen.getByAltText('TDB Responde')).toHaveAttribute('src', '/img/logo-simbolo.png');
  });

  it('confirma a criação e mantém o vínculo interno na consulta e no prontuário', async () => {
    vi.mocked(atendimentoService.listarPorVoluntario).mockResolvedValue([atendimento]);
    vi.mocked(agendaService.criar).mockImplementation(async payload => ({ ...payload, id: 50 }));
    vi.mocked(prontuarioService.registrarEvolucao).mockImplementation(async payload => ({ ...payload, id: 900 }));
    renderAgenda();
    const user = await novaConsulta();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Selecionar Atendimento' }), '777');
    await user.click(screen.getByRole('button', { name: 'Salvar consulta' }));
    const confirmacao = await screen.findByRole('alertdialog', { name: 'Confirmar nova consulta' });
    expect(agendaService.criar).not.toHaveBeenCalled();
    expect(within(confirmacao).getByText('Eduardo Boni')).toBeInTheDocument();
    await user.click(within(confirmacao).getByRole('button', { name: 'Criar consulta' }));
    await waitFor(() => expect(agendaService.criar).toHaveBeenCalledWith(expect.objectContaining({
      atendimentoId: 777, paciente: 'Eduardo Boni', voluntarioId: 10,
      status: 'AGUARDANDO', tipoPessoa: 'CRIANCA_ADOLESCENTE',
    })));
    expect(await screen.findByText('Atendimento vinculado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver Prontuário' }));
    await user.type(await screen.findByLabelText('Alertas Médicos / Anamnese'), 'Hipertenso');
    await user.type(screen.getByLabelText('Procedimento Realizado Hoje'), 'Profilaxia');
    await user.click(screen.getByRole('button', { name: 'Salvar Evolução' }));
    expect(prontuarioService.registrarEvolucao).not.toHaveBeenCalled();
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Registrar evolução' }));
    await waitFor(() => expect(prontuarioService.registrarEvolucao).toHaveBeenCalledWith({
      voluntarioId: 10, agendaId: 50, atendimentoId: 777, paciente: 'Eduardo Boni',
      historicoMedico: 'Hipertenso', tratamentoAtual: 'Profilaxia',
    }));
    expect(await screen.findByText('Profilaxia')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/#777|CRIANCA_ADOLESCENTE/);
  });

  it('usa padrões para caso sem consulta e não reaproveita dados do caso anterior', async () => {
    vi.mocked(agendaService.buscarPorVoluntario).mockResolvedValue([consulta]);
    vi.mocked(atendimentoService.listarPorVoluntario).mockResolvedValue([
      atendimento, { id: 888, beneficiarioNome: 'Outra paciente', status: 'ABERTO', tipoPessoa: 'MULHER_APOLONIA', dataAbertura: '2000-01-01' },
    ]);
    vi.mocked(agendaService.criar).mockImplementation(async payload => ({ ...payload, id: 60 }));
    renderAgenda();
    const user = await novaConsulta();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Selecionar Atendimento' }), '777');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Selecionar Atendimento' }), '888');
    expect(screen.getByLabelText('Nome do Paciente')).toHaveValue('Outra paciente');
    expect(screen.getByLabelText('Data')).toHaveValue(new Date().toISOString().split('T')[0]);
    expect(screen.getByLabelText('Horário')).toHaveValue('08:00');
    expect(screen.getByLabelText('Status')).toHaveValue('AGUARDANDO');
    await user.click(screen.getByRole('button', { name: 'Salvar consulta' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Criar consulta' }));
    await waitFor(() => expect(agendaService.criar).toHaveBeenCalledWith(expect.objectContaining({ atendimentoId: 888, tipoPessoa: 'MULHER_APOLONIA' })));
  });

  it('preserva vínculo indisponível e tipo antigo, mostra diferenças e mantém dados ao cancelar', async () => {
    vi.mocked(agendaService.buscarPorVoluntario).mockResolvedValue([{ ...consulta, tipo: 'Tratamento Ortodôntico' }]);
    vi.mocked(agendaService.atualizar).mockImplementation(async (id, payload) => ({ ...payload, id }));
    renderAgenda();
    const user = userEvent.setup();
    await user.click(await screen.findByTitle('Editar'));
    expect(screen.getByRole('combobox', { name: 'Selecionar Atendimento' })).toHaveValue('777');
    expect(screen.getByLabelText('Tipo de Atendimento')).toHaveValue('Tratamento Ortodôntico');
    fireEvent.change(screen.getByLabelText('Horário'), { target: { value: '16:00' } });
    await user.selectOptions(screen.getByLabelText('Status'), 'CONCLUIDO');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    const confirmacao = await screen.findByRole('alertdialog');
    expect(within(confirmacao).getByText('14:30 → 16:00')).toBeInTheDocument();
    expect(within(confirmacao).getByText('Confirmado → Concluído')).toBeInTheDocument();
    expect(within(confirmacao).getByText('20/10/2099')).toBeInTheDocument();
    expect(agendaService.atualizar).not.toHaveBeenCalled();
    await user.click(within(confirmacao).getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByLabelText('Horário')).toHaveValue('16:00');
    expect(screen.getByLabelText('Status')).toHaveValue('CONCLUIDO');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Confirmar alterações' }));
    await waitFor(() => expect(agendaService.atualizar).toHaveBeenCalledWith(50, expect.objectContaining({ atendimentoId: 777, tipo: 'Tratamento Ortodôntico', horario: '16:00', status: 'CONCLUIDO' })));
  });

  it('prioriza a consulta editada quando há outras consultas no mesmo atendimento', async () => {
    vi.mocked(agendaService.buscarPorVoluntario).mockResolvedValue([consulta, { ...consulta, id: 51, horario: '18:00', tipo: 'Retorno' }]);
    vi.mocked(atendimentoService.listarPorVoluntario).mockResolvedValue([atendimento]);
    renderAgenda();
    const user = userEvent.setup();
    await screen.findAllByTitle('Editar');
    await user.click(screen.getAllByTitle('Editar')[0]);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Selecionar Atendimento' }), '');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Selecionar Atendimento' }), '777');
    expect(screen.getByLabelText('Horário')).toHaveValue('14:30');
    expect(screen.getByLabelText('Tipo de Atendimento')).toHaveValue('Avaliação Inicial');
  });

  it('permite criar sem vínculo sem pedir ID', async () => {
    vi.mocked(agendaService.criar).mockImplementation(async payload => ({ ...payload, id: 1 }));
    renderAgenda();
    const user = await novaConsulta();
    expect(screen.getByText(/Nenhum atendimento disponível/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Nome do Paciente'), 'Maria Silva');
    await user.click(screen.getByRole('button', { name: 'Salvar consulta' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Criar consulta' }));
    await waitFor(() => expect(agendaService.criar).toHaveBeenCalledWith(expect.objectContaining({ atendimentoId: null, paciente: 'Maria Silva' })));
  });

  it('não inventa nome nem mostra ID quando o atendimento não informa o paciente', async () => {
    vi.mocked(atendimentoService.listarPorVoluntario).mockResolvedValue([{ id: 777, status: 'ABERTO' }]);
    renderAgenda();
    const user = await novaConsulta();
    expect(screen.getByRole('option', { name: 'Paciente não informado — Data não informada — Aberto' })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Selecionar Atendimento' }), '777');
    expect(screen.getByLabelText('Nome do Paciente')).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Salvar consulta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Informe o nome do paciente.');
    expect(agendaService.criar).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain('#777');
  });

  it('mostra falha ao buscar atendimentos e permite tentar novamente', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(atendimentoService.listarPorVoluntario).mockRejectedValueOnce(new Error('Falha de rede')).mockResolvedValueOnce([atendimento]);
    renderAgenda();
    const user = await novaConsulta();
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar seus atendimentos.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('option', { name: /Eduardo Boni.*Em andamento/ })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('mostra conflito com mensagem segura e preserva o formulário', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(agendaService.criar).mockRejectedValue(new ApiError('SQL interno atendimentoId=777', 409));
    renderAgenda();
    const user = await novaConsulta();
    await user.type(screen.getByLabelText('Nome do Paciente'), 'Maria Silva');
    await user.click(screen.getByRole('button', { name: 'Salvar consulta' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Criar consulta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma consulta nesse horário. Escolha outro horário.');
    expect(screen.getByLabelText('Nome do Paciente')).toHaveValue('Maria Silva');
    expect(document.body.textContent).not.toMatch(/SQL|atendimentoId/);
    expect(screen.getByRole('button', { name: 'Salvar consulta' })).toBeEnabled();
  });

  it('bloqueia envios duplicados enquanto salva', async () => {
    let resolver!: (value: AgendaConsulta) => void;
    vi.mocked(agendaService.criar).mockReturnValue(new Promise(resolve => { resolver = resolve; }));
    renderAgenda();
    const user = await novaConsulta();
    await user.type(screen.getByLabelText('Nome do Paciente'), 'Maria Silva');
    await user.click(screen.getByRole('button', { name: 'Salvar consulta' }));
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Criar consulta' }));
    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Salvando...' }));
    expect(agendaService.criar).toHaveBeenCalledTimes(1);
    resolver({ ...consulta, paciente: 'Maria Silva' });
    expect(await screen.findByText('Consulta criada com sucesso.')).toBeInTheDocument();
  });

  it('foca o seletor, fecha com Escape e restaura a rolagem', async () => {
    renderAgenda();
    const user = await novaConsulta();
    expect(screen.getByRole('combobox', { name: 'Selecionar Atendimento' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('não envia status legado incompatível com o back-end e exige escolha válida', async () => {
    vi.mocked(agendaService.buscarPorVoluntario).mockResolvedValue([{ ...consulta, status: 'EM_ATENDIMENTO' }]);
    renderAgenda();
    const user = userEvent.setup();
    await user.click(await screen.findByTitle('Editar'));
    expect(screen.getByLabelText('Status')).toHaveValue('EM_ATENDIMENTO');
    expect(document.body.textContent).not.toContain('EM_ATENDIMENTO');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Selecione um status válido para a consulta.');
    expect(agendaService.atualizar).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Status'), 'CONFIRMADO');
    expect(screen.getByLabelText('Status')).toHaveValue('CONFIRMADO');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    expect(await screen.findByText('Em andamento → Confirmado')).toBeInTheDocument();
  });

  it('mantém o seletor indisponível durante o carregamento e depois exibe os atendimentos', async () => {
    let resolver!: (value: AtendimentoApi[]) => void;
    vi.mocked(atendimentoService.listarPorVoluntario).mockReturnValue(new Promise(resolve => { resolver = resolve; }));
    renderAgenda();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Nova consulta' }));
    expect(screen.getByRole('combobox', { name: 'Selecionar Atendimento' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Carregando atendimentos...' })).toBeInTheDocument();
    resolver([atendimento]);
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Selecionar Atendimento' })).toBeEnabled());
    expect(screen.getByRole('option', { name: /Eduardo Boni.*Em andamento/ })).toBeInTheDocument();
  });

  it('confirma o encerramento de consulta expirada com a mudança de status', async () => {
    vi.mocked(agendaService.buscarPorVoluntario).mockResolvedValue([{ ...consulta, dataConsulta: '2000-01-01' }]);
    vi.mocked(agendaService.atualizar).mockImplementation(async (id, payload) => ({ ...payload, id }));
    renderAgenda();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Resolver Pendência' }));
    await user.click(screen.getByRole('button', { name: 'Encerrar (Não compareceu)' }));
    const confirmacao = await screen.findByRole('alertdialog');
    expect(agendaService.atualizar).not.toHaveBeenCalled();
    expect(within(confirmacao).getByText('Confirmado → Encerrado')).toBeInTheDocument();
    await user.click(within(confirmacao).getByRole('button', { name: 'Encerrar consulta' }));
    await waitFor(() => expect(agendaService.atualizar).toHaveBeenCalledWith(50, expect.objectContaining({ status: 'ENCERRADO' })));
  });
});
