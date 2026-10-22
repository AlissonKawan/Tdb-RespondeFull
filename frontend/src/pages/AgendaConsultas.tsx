import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import PageShell from '../components/layout/PageShell';
import PageHeader from '../components/ui/PageHeader';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Dialog } from '../components/ui/ConfirmDialog';
import { LoadingState } from '../components/ui/FeedbackState';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import { useAuth } from '../context/useAuth';
import { useConfirm } from '../hooks/useConfirm';
import { agendaService } from '../services/agendaService';
import type { AgendaConsulta } from '../services/agendaService';
import { prontuarioService } from '../services/prontuarioService';
import type { Prontuario } from '../services/prontuarioService';
import { atendimentoService } from '../services/atendimentoService';
import type { AtendimentoApi } from '../types/AtendimentoApi';
import { formatStatusLabel } from '../utils/formatters';
import { ApiError } from '../services/apiClient';

// Utils para Datas
const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const formatDateLabel = (dateStr: string) => {
  if (dateStr === getTodayStr()) return 'Hoje';
  if (dateStr === getTomorrowStr()) return 'Amanhã';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

type AgendaFormData = Omit<AgendaConsulta, 'id' | 'voluntarioId'>;
type ProntuarioFormData = Pick<Prontuario, 'historicoMedico' | 'tratamentoAtual'>;

const agendaDefaultValues = (): AgendaFormData => ({
  atendimentoId: null,
  paciente: '',
  tipo: 'Avaliação Inicial',
  dataConsulta: getTodayStr(),
  horario: '08:00',
  status: 'AGUARDANDO',
  tipoPessoa: 'OUTRO',
});

const TIPOS_CONSULTA = ['Avaliação Inicial', 'Retorno', 'Urgência', 'Limpeza / Profilaxia', 'Restauração', 'Tratamento Clínico'];
// Valores aceitos por AgendaConsultaBO; status do atendimento não é status da agenda.
const STATUS_CONSULTA = ['AGUARDANDO', 'CONFIRMADO', 'CONCLUIDO', 'ENCERRADO', 'CANCELADO'];

function ConsultaIcon({ name, className = 'h-5 w-5' }: { name: 'search' | 'document' | 'user' | 'calendar' | 'clock' | 'status' | 'save'; className?: string }) {
  const paths: Record<typeof name, ReactNode> = {
    search: <><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></>,
    document: <><path d="M14 3H5v18h14V8Z" /><path d="M14 3v5h5M8 12h8M8 16h6" /></>,
    user: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    status: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z" /><path d="M7 3v6h10V3M7 21v-8h10v8" /></>,
  };
  return <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function consultaStatusTone(status: string) {
  const label = formatStatusLabel(status);
  if (label === 'Concluído') return 'success';
  if (label === 'Aguardando') return 'warning';
  if (label === 'Confirmado' || label === 'Em andamento') return 'info';
  if (label === 'Encerrado') return 'neutral';
  return 'danger';
}

function dataDaOpcao(value?: string) {
  const parts = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return parts ? `${parts[3]}/${parts[2]}/${parts[1]}` : 'Data não informada';
}

function consultaRelacionada(atendimentoId: number, consultas: AgendaConsulta[], editingId: number | null) {
  const vinculadas = consultas.filter(consulta => consulta.atendimentoId === atendimentoId);
  // Ao editar, o registro atual tem prioridade sobre outras consultas do mesmo caso.
  return vinculadas.find(consulta => consulta.id === editingId)
    ?? vinculadas.sort((a, b) => `${b.dataConsulta} ${b.horario}`.localeCompare(`${a.dataConsulta} ${a.horario}`))[0];
}

function nomeDoPaciente(atendimento: AtendimentoApi, consulta?: AgendaConsulta, fallback = 'Paciente não informado') {
  return atendimento.pessoaAtendidaNome || atendimento.beneficiarioNome || atendimento.pacienteNome || consulta?.paciente || fallback;
}

function opcaoAtendimento(atendimento: AtendimentoApi, consulta?: AgendaConsulta) {
  const nome = nomeDoPaciente(atendimento, consulta);
  const data = dataDaOpcao(consulta?.dataConsulta || atendimento.dataAbertura || atendimento.dataCriacao);
  const horario = consulta?.horario ? ` às ${consulta.horario.slice(0, 5)}` : '';
  return `${nome} — ${data}${horario} — ${consulta?.tipo || formatStatusLabel(atendimento.status)}`;
}

export default function AgendaConsultas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm, confirmDialog } = useConfirm();
  
  const [filtro, setFiltro] = useState<'Todos' | 'Hoje' | 'Amanhã'>('Todos');
  const [consultas, setConsultas] = useState<AgendaConsulta[]>([]);
  const [atendimentosDisponiveis, setAtendimentosDisponiveis] = useState<AtendimentoApi[]>([]);
  const [isLoadingAtendimentos, setIsLoadingAtendimentos] = useState(true);
  const [erroAtendimentos, setErroAtendimentos] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveInFlight = useRef(false);
  const atendimentoSelectRef = useRef<HTMLSelectElement>(null);
  // Modal Prontuario State
  const [selectedProntuarioAgenda, setSelectedProntuarioAgenda] = useState<AgendaConsulta | null>(null);
  const [prontuariosList, setProntuariosList] = useState<Prontuario[]>([]);
  const [isProntuarioLoading, setIsProntuarioLoading] = useState(false);
  
  // Modal Expirado
  const [resolveExpiredAgenda, setResolveExpiredAgenda] = useState<AgendaConsulta | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AgendaFormData>({ mode: 'onBlur', defaultValues: agendaDefaultValues() });
  const [atendimentoSelecionado, tipoSelecionado, statusSelecionado] = watch(['atendimentoId', 'tipo', 'status']);
  const isBusy = isSaving || isSubmitting || isProntuarioLoading || Boolean(confirmDialog);

  const {
    register: registerProntuario,
    handleSubmit: handleSubmitProntuario,
    reset: resetProntuario,
    setError: setProntuarioError,
    formState: { errors: prontuarioErrors },
  } = useForm<ProntuarioFormData>({
    mode: 'onBlur',
    defaultValues: { historicoMedico: '', tratamentoAtual: '' },
  });

  const carregarAgendas = async () => {
    if (!user?.voluntarioId) {
      setConsultas([]);
      setIsLoading(false);
      setFeedback({ tone: 'danger', message: 'Sua conta não possui um voluntário vinculado para consultar a agenda.' });
      return;
    }
    try {
      setIsLoading(true);
      const data = await agendaService.buscarPorVoluntario(user.voluntarioId);
      setConsultas(data);
      setFeedback(null);
    } catch (error) {
      console.error("Erro ao carregar agenda", error);
      const message = error instanceof ApiError && error.status === 403
        ? 'Você não tem permissão para consultar esta agenda.'
        : error instanceof ApiError && error.status === 401
          ? 'Sua sessão expirou. Entre novamente para consultar a agenda.'
          : 'Não foi possível carregar sua agenda. Tente novamente.';
      setFeedback({ tone: 'danger', message });
    } finally {
      setIsLoading(false);
    }
  };

  const carregarAtendimentos = async () => {
    const volId = user?.voluntarioId;
    if (!volId) {
      setIsLoadingAtendimentos(false);
      return;
    }
    setIsLoadingAtendimentos(true);
    setErroAtendimentos('');
    try {
      const lista = await atendimentoService.listarPorVoluntario(volId);
      if (!Array.isArray(lista)) throw new Error('Resposta de atendimentos inválida.');
      setAtendimentosDisponiveis(lista);
    } catch (error) {
      console.error('Erro ao carregar atendimentos da agenda', error);
      setErroAtendimentos('Não foi possível carregar seus atendimentos. Tente novamente ou preencha a consulta manualmente.');
    } finally {
      setIsLoadingAtendimentos(false);
    }
  };

  useEffect(() => {
    void carregarAgendas();
    void carregarAtendimentos();
  }, [user?.id, user?.voluntarioId]);

  const consultasFiltradas = consultas.filter(c => {
    if (filtro === 'Todos') return true;
    if (filtro === 'Hoje') return c.dataConsulta === getTodayStr();
    if (filtro === 'Amanhã') return c.dataConsulta === getTomorrowStr();
    return true;
  });

  const handleOpenNew = () => {
    if (isBusy) return;
    setEditingId(null);
    reset(agendaDefaultValues());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: AgendaConsulta) => {
    if (!c.id || isBusy) return;
    setEditingId(c.id);
    reset({
      atendimentoId: c.atendimentoId ?? null,
      paciente: c.paciente,
      tipo: c.tipo,
      dataConsulta: c.dataConsulta,
      horario: c.horario,
      status: c.status,
      tipoPessoa: c.tipoPessoa || 'OUTRO'
    });
    setIsModalOpen(true);
  };

  const handleSelectAtendimentoRapido = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const val = event.target.value;
    if (!val) {
      setValue('atendimentoId', null, { shouldValidate: true });
      return;
    }
    const atend = atendimentosDisponiveis.find(a => a.id === Number(val));
    if (atend) {
      const relacionada = consultaRelacionada(atend.id, consultas, editingId);
      const defaults = agendaDefaultValues();
      reset({
        atendimentoId: atend.id,
        paciente: nomeDoPaciente(atend, relacionada, ''),
        tipo: relacionada?.tipo || defaults.tipo,
        dataConsulta: relacionada?.dataConsulta || defaults.dataConsulta,
        horario: relacionada?.horario.slice(0, 5) || defaults.horario,
        status: relacionada?.status || defaults.status,
        tipoPessoa: atend.tipoPessoa || relacionada?.tipoPessoa || defaults.tipoPessoa,
      });
    }
  };

  const handleDelete = (consulta: AgendaConsulta) => {
    if (isBusy || !consulta.id) return;
    confirm({
      title: 'Excluir Agendamento',
      message: 'Você tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      tone: 'danger',
      details: [
        { label: 'Paciente', value: consulta.paciente },
        { label: 'Data e horário', value: `${dataDaOpcao(consulta.dataConsulta)} às ${consulta.horario}` },
        { label: 'Tipo de atendimento', value: consulta.tipo },
      ],
      onConfirm: async () => {
        if (saveInFlight.current) return;
        saveInFlight.current = true;
        setIsSaving(true);
        try {
          await agendaService.excluir(consulta.id!);
          setConsultas(prev => prev.filter(c => c.id !== consulta.id));
          setFeedback({ tone: 'success', message: 'Agendamento excluído com sucesso.' });
        } catch (error) {
          console.error(error);
          setFeedback({ tone: 'danger', message: 'Erro ao excluir agendamento.' });
        } finally {
          saveInFlight.current = false;
          setIsSaving(false);
        }
      }
    });
  };

  const handleSave = async (formData: AgendaFormData) => {
    if (saveInFlight.current) return;
    if (!user?.voluntarioId) {
      setError('root.server', { message: 'Sua conta precisa estar vinculada a um voluntário para salvar consultas.' });
      return;
    }
    saveInFlight.current = true;

    try {
      setIsSaving(true);
      const parsedAtendimentoId =
        formData.atendimentoId !== null && formData.atendimentoId !== undefined && Number(formData.atendimentoId) > 0
          ? Number(formData.atendimentoId)
          : null;
      const agendaPayload: AgendaConsulta = {
        ...formData,
        atendimentoId: parsedAtendimentoId,
        voluntarioId: user.voluntarioId
      };

      if (editingId) {
        const atualizada = await agendaService.atualizar(editingId, agendaPayload);
        setConsultas(prev => prev.map(c => c.id === editingId ? atualizada : c));
      } else {
        const nova = await agendaService.criar(agendaPayload);
        setConsultas(prev => [...prev, nova]);
      }
      setIsModalOpen(false);
      setFeedback({ tone: 'success', message: editingId ? 'Consulta atualizada com sucesso.' : 'Consulta criada com sucesso.' });
    } catch (error) {
      console.error(error);
      const msg = error instanceof ApiError && error.status === 409
        ? 'Já existe uma consulta nesse horário. Escolha outro horário.'
        : error instanceof ApiError && error.status === 403
          ? 'Você não tem permissão para alterar esta consulta.'
          : error instanceof ApiError && error.status === 404
            ? 'A consulta ou o atendimento vinculado não está mais disponível. Atualize a agenda.'
            : 'Não foi possível salvar a consulta. Confira os dados e tente novamente.';
      setError('root.server', { message: msg });
    } finally {
      saveInFlight.current = false;
      setIsSaving(false);
    }
  };

  const requestSave = (formData: AgendaFormData) => {
    if (isBusy) return;
    const anterior = consultas.find(consulta => consulta.id === editingId);
    const alteracao = (antes: string | undefined, depois: string) => antes !== undefined && antes !== depois ? `${antes} → ${depois}` : depois;
    const vinculo = (id: number | null | undefined) => {
      if (!id) return 'Sem atendimento vinculado';
      const atend = atendimentosDisponiveis.find(item => item.id === id);
      const relacionada = consultaRelacionada(id, consultas, editingId);
      return atend || relacionada ? opcaoAtendimento(atend || { id }, relacionada) : 'Atendimento vinculado';
    };
    const perfil = (tipo: string) => tipo === 'CRIANCA_ADOLESCENTE' ? 'Criança ou adolescente' : tipo === 'MULHER_APOLONIA' ? 'Mulher do projeto Apolônias' : 'Outro';
    confirm({
      title: editingId ? 'Confirmar alterações da consulta' : 'Confirmar nova consulta',
      message: editingId ? 'Confira os dados abaixo. Deseja confirmar estas alterações?' : 'Confira os dados abaixo. Deseja criar esta consulta?',
      confirmText: editingId ? 'Confirmar alterações' : 'Criar consulta',
      details: [
        { label: 'Paciente', value: alteracao(anterior?.paciente, formData.paciente) },
        { label: 'Data', value: alteracao(anterior ? dataDaOpcao(anterior.dataConsulta) : undefined, dataDaOpcao(formData.dataConsulta)) },
        { label: 'Horário', value: alteracao(anterior?.horario, formData.horario) },
        { label: 'Tipo de atendimento', value: alteracao(anterior?.tipo, formData.tipo) },
        { label: 'Status', value: alteracao(anterior ? formatStatusLabel(anterior.status) : undefined, formatStatusLabel(formData.status)) },
        { label: 'Atendimento vinculado', value: alteracao(anterior ? vinculo(anterior.atendimentoId) : undefined, vinculo(formData.atendimentoId)) },
        { label: 'Perfil do paciente', value: alteracao(anterior ? perfil(anterior.tipoPessoa) : undefined, perfil(formData.tipoPessoa)) },
      ],
      onConfirm: () => void handleSave(formData),
    });
  };

  // --- Lógica de Prontuário ---
  const handleOpenProntuario = async (agenda: AgendaConsulta) => {
    setSelectedProntuarioAgenda(agenda);
    resetProntuario({ historicoMedico: '', tratamentoAtual: '' });
    if (!agenda.id) return;
    try {
      setIsProntuarioLoading(true);
      const data = await prontuarioService.buscarPorAgenda(agenda.id);
      setProntuariosList(data);
    } catch (e) {
      console.error(e);
      setProntuarioError('root.server', { message: 'Erro ao carregar prontuário.' });
    } finally {
      setIsProntuarioLoading(false);
    }
  };

  const handleSaveProntuario = async (prontuarioForm: ProntuarioFormData) => {
    if (!selectedProntuarioAgenda?.id || saveInFlight.current) return;
    if (!user?.voluntarioId) {
      setProntuarioError('root.server', { message: 'Sua conta precisa estar vinculada a um voluntário para registrar evoluções.' });
      return;
    }
    saveInFlight.current = true;

    try {
      setIsProntuarioLoading(true);
      const novo: Prontuario = {
        voluntarioId: user.voluntarioId,
        agendaId: selectedProntuarioAgenda.id,
        atendimentoId: selectedProntuarioAgenda.atendimentoId ?? null,
        paciente: selectedProntuarioAgenda.paciente,
        historicoMedico: prontuarioForm.historicoMedico,
        tratamentoAtual: prontuarioForm.tratamentoAtual
      };
      const criado = await prontuarioService.registrarEvolucao(novo);
      setProntuariosList(prev => [criado, ...prev]); // Adiciona no topo
      resetProntuario({ historicoMedico: '', tratamentoAtual: '' });
    } catch (e) {
      console.error(e);
      setProntuarioError('root.server', { message: 'Não foi possível salvar a evolução. Confira os dados e tente novamente.' });
    } finally {
      saveInFlight.current = false;
      setIsProntuarioLoading(false);
    }
  };

  const requestSaveProntuario = (form: ProntuarioFormData) => {
    if (isProntuarioLoading || confirmDialog || !selectedProntuarioAgenda) return;
    confirm({
      title: 'Confirmar evolução clínica',
      message: 'Confira as informações. Deseja registrar esta evolução no prontuário?',
      confirmText: 'Registrar evolução',
      details: [
        { label: 'Paciente', value: selectedProntuarioAgenda.paciente },
        { label: 'Data da consulta', value: dataDaOpcao(selectedProntuarioAgenda.dataConsulta) },
        { label: 'Alertas médicos', value: form.historicoMedico || 'Nenhum informado' },
        { label: 'Procedimento realizado', value: form.tratamentoAtual },
      ],
      onConfirm: () => void handleSaveProntuario(form),
    });
  };

  // --- Lógica de Expirados ---
  const handleEncerrarExpirada = async () => {
    if (!resolveExpiredAgenda?.id || saveInFlight.current) return;
    saveInFlight.current = true;
    try {
      setIsSaving(true);
      const atualizada = await agendaService.atualizar(resolveExpiredAgenda.id, {
        ...resolveExpiredAgenda,
        status: 'ENCERRADO'
      });
      setConsultas(prev => prev.map(c => c.id === resolveExpiredAgenda.id ? atualizada : c));
      setResolveExpiredAgenda(null);
      setFeedback({ tone: 'success', message: 'Consulta encerrada com sucesso.' });
    } catch (e) {
      console.error(e);
      setFeedback({ tone: 'danger', message: 'Erro ao encerrar a consulta.' });
    } finally {
      saveInFlight.current = false;
      setIsSaving(false);
    }
  };

  const requestEncerrarExpirada = () => {
    if (!resolveExpiredAgenda || isBusy) return;
    confirm({
      title: 'Confirmar encerramento da consulta',
      message: 'Deseja encerrar esta consulta sem atendimento?',
      confirmText: 'Encerrar consulta',
      tone: 'danger',
      details: [
        { label: 'Paciente', value: resolveExpiredAgenda.paciente },
        { label: 'Data e horário', value: `${dataDaOpcao(resolveExpiredAgenda.dataConsulta)} às ${resolveExpiredAgenda.horario}` },
        { label: 'Status', value: `${formatStatusLabel(resolveExpiredAgenda.status)} → Encerrado` },
      ],
      onConfirm: () => void handleEncerrarExpirada(),
    });
  };

  const handleReagendarExpirada = () => {
    if (!resolveExpiredAgenda) return;
    const agenda = resolveExpiredAgenda;
    setResolveExpiredAgenda(null);
    handleOpenEdit(agenda);
  };

  return (
    <PageShell>
      <PageHeader
        variant="compact"
        eyebrow="Agenda"
        title="Meus Horários"
        description="Acompanhe suas consultas marcadas com os beneficiários da ONG."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/portal-voluntario')}>
              Voltar para o portal
            </Button>
            <Button disabled={isBusy} onClick={handleOpenNew}>Nova consulta</Button>
          </>
        }
      />

      <Container className="py-8">
        <div className="flex gap-2 mb-8">
          <Button variant={filtro === 'Todos' ? 'primary' : 'secondary'} onClick={() => setFiltro('Todos')}>Todos</Button>
          <Button variant={filtro === 'Hoje' ? 'primary' : 'secondary'} onClick={() => setFiltro('Hoje')}>Hoje</Button>
          <Button variant={filtro === 'Amanhã' ? 'primary' : 'secondary'} onClick={() => setFiltro('Amanhã')}>Amanhã</Button>
        </div>

        {feedback && (
          <div
            role={feedback.tone === 'danger' ? 'alert' : 'status'}
            className={`mb-6 rounded-xl border px-4 py-3 text-sm font-semibold ${feedback.tone === 'danger' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}
          >
            {feedback.message}
          </div>
        )}

        {isLoading ? (
          <LoadingState title="Carregando sua agenda..." count={3} />
        ) : consultasFiltradas.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
            <p>Nenhuma consulta encontrada para este filtro.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {consultasFiltradas.sort((a,b) => a.dataConsulta.localeCompare(b.dataConsulta) || a.horario.localeCompare(b.horario)).map((consulta) => (
              <Card key={consulta.id} className="p-6 border-l-4 border-l-primary hover:shadow-lg transition-shadow relative group">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button disabled={isBusy} onClick={() => handleOpenEdit(consulta)} className="p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button disabled={isBusy} onClick={() => handleDelete(consulta)} className="p-2 text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors" title="Excluir">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>

                <div className="flex justify-between items-start mb-4 pr-16">
                  <Badge tone={consultaStatusTone(consulta.status)}>
                    {formatStatusLabel(consulta.status)}
                  </Badge>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                    {formatDateLabel(consulta.dataConsulta)}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-foreground">{consulta.paciente}</h3>
                <p className="text-sm text-muted-foreground mt-1">{consulta.tipo}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {consulta.atendimentoId ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/atendimento/${consulta.atendimentoId}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <span>Atendimento vinculado</span>
                      <span aria-hidden="true">↗</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      Sem atendimento vinculado
                    </span>
                  )}
                </div>
                
                <div className="mt-4 flex items-center gap-2 text-primary font-semibold bg-blue-50 px-3 py-2 rounded-lg w-max">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {consulta.horario}
                </div>

                {consulta.dataConsulta < getTodayStr() && consulta.status !== 'CONCLUIDO' && consulta.status !== 'ENCERRADO' ? (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 mb-3 text-sm flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <div>
                        <strong>Data Expirada!</strong>
                        <p>O paciente não compareceu ou a data passou.</p>
                      </div>
                    </div>
                    <Button variant="danger" className="w-full justify-center" onClick={() => setResolveExpiredAgenda(consulta)}>
                      Resolver Pendência
                    </Button>
                  </div>
                ) : (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    {consulta.atendimentoId ? (
                      <Button variant="secondary" onClick={() => navigate(`/atendimento/${consulta.atendimentoId}`)}>
                        Ir para Atendimento
                      </Button>
                    ) : <span />}
                    <Button variant="ghost" onClick={() => handleOpenProntuario(consulta)}>
                      Ver Prontuário
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Container>

      {/* Modal de Criar/Editar */}
      {isModalOpen && (
        <Dialog
          title={editingId ? 'Editar Consulta' : 'Nova Consulta'}
          description="Selecione um dos seus atendimentos para preencher automaticamente os dados."
          maxWidthClassName="max-w-3xl"
          variant="form"
          initialFocusRef={atendimentoSelectRef}
          onClose={() => { if (!isBusy) setIsModalOpen(false); }}
          headerIcon={<img src="/img/logo-simbolo.png" alt="TDB Responde" width="512" height="492" className="h-12 w-12 object-contain sm:h-16 sm:w-16" />}
          footer={<>
            <Button type="button" disabled={isBusy} variant="secondary" className="!bg-slate-100 text-slate-700 hover:!bg-slate-200" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="agenda-consulta-form" disabled={isBusy} isLoading={isSaving} loadingText="Salvando..." leftIcon={<ConsultaIcon name="save" />}>{editingId ? 'Salvar alterações' : 'Salvar consulta'}</Button>
          </>}
        >
          <form id="agenda-consulta-form" onSubmit={handleSubmit(requestSave)} noValidate className="space-y-4 [&_input]:py-2 [&_select]:py-2" aria-busy={isSaving}>
            <section aria-labelledby="selecionar-atendimento-titulo" className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <label id="selecionar-atendimento-titulo" htmlFor="consulta-atendimento" className="mb-3 flex items-center gap-2.5 text-sm font-bold text-foreground sm:text-base">
                <ConsultaIcon name="search" className="h-5 w-5 text-primary" />
                Selecionar Atendimento
              </label>
              <Select id="consulta-atendimento" ref={atendimentoSelectRef} disabled={isBusy || isLoadingAtendimentos} value={atendimentoSelecionado ?? ''} onChange={handleSelectAtendimentoRapido} aria-describedby="consulta-atendimento-hint" className="border-blue-200 focus-visible:border-primary">
                <option value="">{isLoadingAtendimentos ? 'Carregando atendimentos...' : 'Preencher manualmente, sem vínculo'}</option>
                {atendimentosDisponiveis.map(atend => (
                  <option key={atend.id} value={atend.id}>{opcaoAtendimento(atend, consultaRelacionada(atend.id, consultas, editingId))}</option>
                ))}
                {atendimentoSelecionado && !atendimentosDisponiveis.some(atend => atend.id === atendimentoSelecionado) ? (
                  <option value={atendimentoSelecionado}>{opcaoAtendimento({ id: atendimentoSelecionado }, consultas.find(consulta => consulta.id === editingId))}</option>
                ) : null}
              </Select>
              <p id="consulta-atendimento-hint" className="mt-2 text-sm italic leading-5 text-muted-foreground">
                Selecione um atendimento para carregar automaticamente os dados abaixo.
              </p>
              {!isLoadingAtendimentos && !erroAtendimentos && atendimentosDisponiveis.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nenhum atendimento disponível. Você pode preencher a consulta manualmente.</p> : null}
              {erroAtendimentos ? <div className="mt-3 text-sm text-danger"><p role="alert">{erroAtendimentos}</p><Button type="button" variant="ghost" size="sm" disabled={isBusy || isLoadingAtendimentos} onClick={() => void carregarAtendimentos()}>Tentar novamente</Button></div> : null}
            </section>

            <section aria-labelledby="informacoes-consulta-titulo" className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <h3 id="informacoes-consulta-titulo" className="mb-4 flex items-center gap-3 text-base font-bold text-foreground sm:text-lg">
                <span className="rounded-xl bg-blue-50 p-2 text-primary"><ConsultaIcon name="document" /></span>
                Informações da Consulta
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={<span className="flex items-center gap-2"><ConsultaIcon name="user" />Nome do Paciente</span>} error={errors.paciente?.message}>
                  <Input disabled={isBusy} {...register('paciente', { required: 'Informe o nome do paciente.', maxLength: { value: 255, message: 'Use até 255 caracteres para o nome.' } })} placeholder="Ex: Maria Silva" className={atendimentoSelecionado ? '!bg-slate-100/80' : ''} />
                </Field>
                <Field label={<span className="flex items-center gap-2"><ConsultaIcon name="document" />Tipo de Atendimento</span>} error={errors.tipo?.message}>
                  <Select disabled={isBusy} {...register('tipo', { required: 'Informe o tipo de atendimento.' })}>
                    {TIPOS_CONSULTA.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                    {tipoSelecionado && !TIPOS_CONSULTA.includes(tipoSelecionado) ? <option value={tipoSelecionado}>{tipoSelecionado}</option> : null}
                  </Select>
                </Field>
                <Field label={<span className="flex items-center gap-2"><ConsultaIcon name="calendar" />Data</span>} error={errors.dataConsulta?.message}>
                  <Input disabled={isBusy} type="date" min={getTodayStr()} {...register('dataConsulta', { required: 'Informe a data da consulta.' })} />
                </Field>
                <Field label={<span className="flex items-center gap-2"><ConsultaIcon name="clock" />Horário</span>} error={errors.horario?.message}>
                  <Input disabled={isBusy} type="time" {...register('horario', { required: 'Informe o horário.' })} />
                </Field>
                <div className="sm:col-span-2">
                  <label htmlFor="consulta-status" className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground"><ConsultaIcon name="status" />Status</label>
                  <div className="relative">
                    <Select id="consulta-status" value={statusSelecionado} disabled={isBusy} aria-invalid={errors.status ? true : undefined} aria-describedby={errors.status ? 'consulta-status-error' : undefined} className="relative z-10 appearance-none bg-transparent pr-10 !text-transparent [&>option]:text-foreground" {...register('status', { validate: status => STATUS_CONSULTA.includes(status) || 'Selecione um status válido para a consulta.' })}>
                      {STATUS_CONSULTA.map(status => <option key={status} value={status}>{formatStatusLabel(status)}</option>)}
                      {!STATUS_CONSULTA.includes(statusSelecionado) ? <option value={statusSelecionado} disabled>{formatStatusLabel(statusSelecionado)}</option> : null}
                    </Select>
                    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex max-w-[calc(100%-3rem)] items-center [&>span]:px-3 [&>span]:py-1.5 [&>span]:text-sm">
                      <Badge tone={consultaStatusTone(statusSelecionado)}><span className="mr-2 h-2 w-2 shrink-0 rounded-full bg-current" />{formatStatusLabel(statusSelecionado)}</Badge>
                    </div>
                    <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                  </div>
                  {errors.status?.message ? <p id="consulta-status-error" role="alert" className="mt-1.5 text-sm text-danger">{errors.status.message}</p> : null}
                </div>
              </div>
              {errors.root?.server?.message && <p role="alert" className="mt-4 text-sm font-medium text-danger">{errors.root.server.message}</p>}
            </section>
          </form>
        </Dialog>
      )}

      {/* Modal Prontuário Premium */}
      {selectedProntuarioAgenda && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header do Prontuário */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg>
                    Prontuário Clínico
                  </h2>
                  <p className="mt-1 text-slate-300">
                    Paciente: <strong className="text-white">{selectedProntuarioAgenda.paciente}</strong>
                    {selectedProntuarioAgenda.atendimentoId ? (
                      <span className="ml-2 inline-flex items-center rounded bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-200">
                        Atendimento vinculado
                      </span>
                    ) : null}
                  </p>
                </div>
                <button aria-label="Fechar prontuário" disabled={isProntuarioLoading || Boolean(confirmDialog)} onClick={() => setSelectedProntuarioAgenda(null)} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-slate-50">
              
              {/* Form de Nova Evolução */}
              <form onSubmit={handleSubmitProntuario(requestSaveProntuario)} noValidate className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </span>
                  Nova Evolução ({formatDateLabel(selectedProntuarioAgenda.dataConsulta)})
                </h3>
                
                <div className="grid gap-4">
                  <Field label="Alertas Médicos / Anamnese" hint="Use vírgulas para separar as informações.">
                    <Input
                      disabled={isProntuarioLoading || Boolean(confirmDialog)}
                      placeholder="Ex: Alérgico a Penicilina, Hipertenso"
                      {...registerProntuario('historicoMedico')}
                    />
                  </Field>
                  <Field label="Procedimento Realizado Hoje" error={prontuarioErrors.tratamentoAtual?.message}>
                    <Textarea
                      disabled={isProntuarioLoading || Boolean(confirmDialog)}
                      className="min-h-[100px]"
                      placeholder="Descreva detalhadamente a evolução clínica, dentes tratados, etc..."
                      {...registerProntuario('tratamentoAtual', { required: 'Descreva o procedimento realizado hoje.' })}
                    />
                  </Field>
                </div>

                {prontuarioErrors.root?.server?.message && <p role="alert" className="text-sm font-medium text-danger">{prontuarioErrors.root.server.message}</p>}
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isProntuarioLoading || Boolean(confirmDialog)}>
                    {isProntuarioLoading ? 'Salvando...' : 'Salvar Evolução'}
                  </Button>
                </div>
              </form>

              {/* Histórico da Timeline */}
              <div>
                <h3 className="font-bold text-slate-800 mb-4 px-1">Histórico Clínico</h3>
                {isProntuarioLoading && prontuariosList.length === 0 ? (
                  <LoadingState title="Carregando histórico..." count={2} className="md:grid-cols-1 xl:grid-cols-1" />
                ) : prontuariosList.length === 0 ? (
                  <div className="text-center py-8 bg-white border border-dashed border-slate-300 rounded-xl text-slate-500">
                    Nenhuma evolução registrada para esta consulta ainda.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {prontuariosList.map((p, index) => (
                      <div key={p.id || index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5 ring-4 ring-primary/10"></div>
                          {index !== prontuariosList.length - 1 && <div className="w-0.5 h-full bg-blue-100 my-1"></div>}
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 flex-1 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                              {p.dataRegistro ? new Date(p.dataRegistro).toLocaleString('pt-BR') : 'Agora'}
                            </span>
                          </div>
                          
                          {p.historicoMedico && (
                            <div className="mb-3 flex flex-wrap gap-1.5">
                              {p.historicoMedico.split(',').map((tag, i) => tag.trim() ? (
                                <Badge key={i} tone="danger">{tag.trim()}</Badge>
                              ) : null)}
                            </div>
                          )}
                          
                          <p className="text-slate-700 text-sm whitespace-pre-wrap">{p.tratamentoAtual}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </Card>
        </div>
      )}

      {/* Modal Resolver Expirada */}
      {resolveExpiredAgenda && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200 text-center border-t-4 border-t-red-500">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Consulta Expirada</h2>
            <p className="text-slate-500 text-sm mb-6">A data de consulta de <strong>{resolveExpiredAgenda.paciente}</strong> passou. O que deseja fazer?</p>
            
            <div className="flex flex-col gap-3">
              <Button disabled={isBusy} onClick={handleReagendarExpirada} className="w-full justify-center text-md">
                Reagendar Consulta
              </Button>
              <Button disabled={isBusy} variant="danger" onClick={requestEncerrarExpirada} className="w-full justify-center text-md">
                {isSaving ? 'Aguarde...' : 'Encerrar (Não compareceu)'}
              </Button>
              <Button disabled={isBusy} variant="ghost" onClick={() => setResolveExpiredAgenda(null)} className="w-full justify-center mt-2">
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {confirmDialog}
    </PageShell>
  );
}
