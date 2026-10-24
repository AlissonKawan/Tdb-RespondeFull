import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ErrorState, LoadingState } from '../components/ui/FeedbackState';
import { Input } from '../components/ui/Input';
import { atendimentoService } from '../services/atendimentoService';
import { voluntariosService } from '../services/voluntariosService';
import type { AtendimentoApi } from '../types/AtendimentoApi';
import { useAuth } from '../context/useAuth';
import { useConfirm } from '../hooks/useConfirm';
import { formatStatusLabel, formatDate } from '../utils/formatters';

type Aba = 'solicitados' | 'meus';
type FiltroFila = 'todos' | 'urgentes' | 'apolonia';
type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const PRIORIDADE_LABELS: Record<string, string> = {
  '1': 'Urgente',
  '2': 'Alta',
  '3': 'Média',
  '4': 'Baixa',
  '5': 'Acompanhamento',
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa',
};

type PortalIconName = 'document' | 'alert' | 'users' | 'chart' | 'megaphone' | 'link' | 'copy' | 'calendar' | 'trophy' | 'tooth' | 'clock' | 'eye';

function PortalIcon({ name, className = 'h-5 w-5' }: { name: PortalIconName; className?: string }) {
  const paths: Record<PortalIconName, ReactNode> = {
    document: <><path d="M8 3H5v18h14V7l-4-4H8Z" /><path d="M14 3v5h5M8 11h8M8 15h8M8 18h5" /></>,
    alert: <><path d="m10.3 4-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
    users: <><circle cx="9" cy="7" r="3" /><path d="M2 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 4 5v2" /></>,
    chart: <><path d="M5 20v-6m7 6V9m7 11V3" strokeWidth="4" /></>,
    megaphone: <><path d="m3 11 14-6v14L3 15v-4Zm14-3 3-2v12l-3-2M6 16l2 6h3l-2-5M22 10v4" /></>,
    link: <><path d="m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" /></>,
    copy: <><rect x="8" y="7" width="12" height="15" rx="2" /><path d="M15 7V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6m10-6v6M3 11h18m-13 4h3m-3 3h6" /></>,
    trophy: <><path d="M7 3h10v5a5 5 0 0 1-10 0V3Zm0 2H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4M12 13v5m-5 3h10m-8 0v-3h6v3" /></>,
    tooth: <path d="M12 5C7 1 3 4 4 10c.4 2.5 2 4 2.5 8 .6 5 3.5 4 3.5 0 0-5 4-5 4 0 0 4 2.9 5 3.5 0 .5-4 2.1-5.5 2.5-8 1-6-3-9-8-5Zm0 0 3 2" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  };
  return <svg className={`shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function CareIllustration() {
  const id = useId();
  return (
    <svg className="pointer-events-none absolute -right-16 bottom-0 h-full w-80 opacity-25 sm:right-4 sm:opacity-60 lg:right-32 lg:w-96" viewBox="0 0 360 240" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-heart`} x1="140" y1="30" x2="220" y2="120" gradientUnits="userSpaceOnUse"><stop stopColor="#7DD3FC" /><stop offset="1" stopColor="#0284C7" /></linearGradient>
        <linearGradient id={`${id}-hands`} x1="110" y1="80" x2="250" y2="235" gradientUnits="userSpaceOnUse"><stop stopColor="#BAE6FD" /><stop offset="1" stopColor="#60A5FA" /></linearGradient>
        <radialGradient id={`${id}-glow`}><stop stopColor="#FFF" stopOpacity=".95" /><stop offset="1" stopColor="#BAE6FD" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="180" cy="113" rx="160" ry="110" fill={`url(#${id}-glow)`} />
      <path d="M180 101c-14-13-43-30-38-51 5-23 31-22 38-6 11-21 36-18 39 1 4 23-23 44-39 56Z" fill={`url(#${id}-heart)`} />
      <g fill={`url(#${id}-hands)`}>
        <path d="M123 240c10-30-3-51-23-77-20-28-23-53-17-83 3-17 14-17 15 0 2 24 8 43 23 55-13-26-19-42-11-46 9-5 11 21 28 40-7-18-15-26-8-30 9-5 14 10 25 25 25 32 14 57-2 116Z" />
        <path d="M237 240c-10-30 3-51 23-77 20-28 23-53 17-83-3-17-14-17-15 0-2 24-8 43-23 55 13-26 19-42 11-46-9-5-11 21-28 40 7-18 15-26 8-30-9-5-14 10-25 25-25 32-14 57 2 116Z" />
      </g>
      <path d="m123 40 5 9m102-21-5 9m-45-17v-9" stroke="white" strokeWidth="7" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

function QueueHeading({ mine = false }: { mine?: boolean }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100/80 text-blue-600"><PortalIcon name="document" className="h-6 w-6" /></span>
      <div><h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{mine ? 'Meus atendimentos' : 'Atendimentos solicitados'}</h2>
        <p className="mt-1 text-sm text-slate-500">{mine ? 'Casos que já estão vinculados ao seu acompanhamento.' : 'Casos aguardando acolhimento da equipe voluntária.'}</p></div>
    </div>
  );
}

function getPessoa(atendimento: AtendimentoApi) {
  if (atendimento.tipoPessoa === 'MULHER_APOLONIA') {
    return atendimento.codinome?.trim() || atendimento.pessoaAtendidaNome?.trim() || 'Codinome não informado';
  }
  return atendimento.pessoaAtendidaNome
    ?? atendimento.beneficiarioNome
    ?? atendimento.pacienteNome
    ?? atendimento.solicitanteNome
    ?? atendimento.beneficiario?.nome
    ?? atendimento.usuario?.nome
    ?? 'Beneficiário não informado';
}

function getAtendimentoDescricaoContexto(atendimento: AtendimentoApi) {
  return atendimento.descricao?.trim()
    || atendimento.observacao?.trim()
    || atendimento.titulo?.trim()
    || 'Comentário não informado';
}

function statusTone(status?: string): BadgeTone {
  if (!status) return 'neutral';
  if (['ENCERRADO', 'Encerrado'].includes(status)) return 'success';
  if (['ABERTO', 'Aberto'].includes(status)) return 'info';
  if (['EM_ATENDIMENTO', 'Em andamento', 'Aguardando'].includes(status)) return 'warning';
  return 'neutral';
}

function isUrgente(atendimento: AtendimentoApi) {
  return atendimento.prioridade === 'ALTA'
    || atendimento.prioridade === 1
    || atendimento.prioridade === 2;
}

function matchesFiltro(atendimento: AtendimentoApi, filtro: FiltroFila) {
  if (filtro === 'urgentes') return isUrgente(atendimento);
  if (filtro === 'apolonia') return atendimento.tipoPessoa === 'MULHER_APOLONIA';
  return true;
}

function sortAtendimentos(a: AtendimentoApi, b: AtendimentoApi) {
  const dateA = new Date(a.dataAtualizacao ?? a.dataCriacao ?? a.dataAbertura ?? 0).getTime();
  const dateB = new Date(b.dataAtualizacao ?? b.dataCriacao ?? b.dataAbertura ?? 0).getTime();
  return dateB - dateA; // Descending
}

function OperationalEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed bg-gradient-to-br from-slate-50 to-blue-50/60 p-8 text-center md:p-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M5 11h14M6 21h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="m9 16 2 2 4-5" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
    </Card>
  );
}


function AtendimentoCard({ atendimento, onAssumir, assumindo, assumirBloqueado, hasNovaMensagem, showProtocol }: {
  atendimento: AtendimentoApi;
  onAssumir?: (atendimento: AtendimentoApi) => void;
  assumindo?: boolean;
  assumirBloqueado?: boolean;
  hasNovaMensagem?: boolean;
  showProtocol?: boolean;
}) {
  const navigate = useNavigate();
  const aguardandoAcolhimento = ['ABERTO', 'Aberto'].includes(atendimento.status ?? 'ABERTO');
  const prioridadeUrgente = isUrgente(atendimento);
  const prioridadeLabel = PRIORIDADE_LABELS[String(atendimento.prioridade)] ?? 'Aguardando triagem';
  const isApolonia = atendimento.tipoPessoa === 'MULHER_APOLONIA';

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md motion-reduce:transition-none">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 md:h-16 md:w-16"><PortalIcon name="tooth" className="h-7 w-7" /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={aguardandoAcolhimento ? 'warning' : statusTone(atendimento.status)}>
                <PortalIcon name="clock" className="mr-1 h-3.5 w-3.5" />
                {aguardandoAcolhimento ? 'Aguardando acolhimento' : formatStatusLabel(atendimento.status)}
              </Badge>
              {hasNovaMensagem && <Badge tone="danger">Nova Mensagem</Badge>}
              {isApolonia && <Badge tone="warning">Mulher Apolônia · Atendimento sigiloso</Badge>}
            </div>
            <h3 className="mt-2 break-words text-lg font-bold text-slate-900">{getPessoa(atendimento)}</h3>
            {isApolonia && (
              <p className="mt-2 break-words rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
                {atendimento.necessitaSigiloAbsoluto ? 'Sigilo absoluto solicitado. ' : ''}
                Identificação por codinome. Preserve o sigilo da beneficiária e das informações deste atendimento.
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-6 text-slate-600 sm:text-sm">
              <span>Especialidade: Clínica geral</span><span aria-hidden="true">•</span>
              <span className="inline-flex items-center gap-1.5">Prioridade:
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${prioridadeUrgente ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{prioridadeLabel}</span>
              </span>
            </div>
            <div className="mt-2 space-y-1 text-xs leading-5 text-slate-500">
              <p><strong className="text-foreground">Comentário da solicitação:</strong> <span className="block whitespace-pre-wrap break-words">{getAtendimentoDescricaoContexto(atendimento)}</span></p>
              {(atendimento.dataAtualizacao || atendimento.dataCriacao || atendimento.dataAbertura) && (
                <p><strong className="text-foreground">Última Atividade:</strong> {formatDate(atendimento.dataAtualizacao ?? atendimento.dataCriacao ?? atendimento.dataAbertura)}</p>
              )}
            </div>
          </div>
        </div>
        <div className="shrink-0 xl:max-w-xs xl:text-right">
          {showProtocol && <p className="text-sm font-bold text-slate-500">#TDB-{atendimento.id.toString().padStart(3, '0')}</p>}
          {(atendimento.dataCriacao || atendimento.dataAbertura) && <p className="mt-0.5 text-xs text-slate-500">Recebido em {formatDate(atendimento.dataCriacao ?? atendimento.dataAbertura)}</p>}
          <div className="mt-4 flex flex-wrap gap-2 xl:justify-end">
            <Button onClick={() => navigate(`/atendimentos/${atendimento.id}`)} className="rounded-xl"><PortalIcon name="eye" />Abrir atendimento</Button>
            {onAssumir && (
              <Button
                variant="secondary"
                className="rounded-xl"
                disabled={assumirBloqueado}
                isLoading={assumindo}
                loadingText="Assumindo..."
                onClick={() => onAssumir(atendimento)}
              >
                Assumir atendimento
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function PortalVoluntario() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { confirm, confirmDialog } = useConfirm();
  const [aba, setAba] = useState<Aba>('solicitados');
  const [filtroFila, setFiltroFila] = useState<FiltroFila>('todos');
  const [solicitados, setSolicitados] = useState<AtendimentoApi[]>([]);
  const [meusAtendimentos, setMeusAtendimentos] = useState<AtendimentoApi[]>([]);
  const [novasMensagens, setNovasMensagens] = useState<Record<number, boolean>>({});
  const [loadingSolicitados, setLoadingSolicitados] = useState(true);
  const [loadingMeus, setLoadingMeus] = useState(true);
  const [erroSolicitados, setErroSolicitados] = useState('');
  const [erroMeus, setErroMeus] = useState('');
  const [feedback, setFeedback] = useState('');
  const [assumindoId, setAssumindoId] = useState<number | null>(null);
  const [codigoIndicacao, setCodigoIndicacao] = useState<string>('');
  const [copiado, setCopiado] = useState(false);
  const [erroCopia, setErroCopia] = useState('');
  const copyFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const voluntarioSemVinculo = user?.tipoUsuario === 'VOLUNTARIO' && !user?.voluntarioId;

  const carregarSolicitados = async () => {
    setLoadingSolicitados(true);
    setErroSolicitados('');
    try {
      const data = await atendimentoService.listarSolicitados();
      setSolicitados(data.sort(sortAtendimentos));
    } catch (error) {
      setErroSolicitados(error instanceof Error ? error.message : 'Erro ao carregar dados.');
    } finally {
      setLoadingSolicitados(false);
    }
  };

  const carregarMeus = async (voluntarioId: number) => {
    setLoadingMeus(true);
    setErroMeus('');
    try {
      const data = await atendimentoService.listarPorVoluntario(voluntarioId);
      const sorted = data.sort(sortAtendimentos);
      setMeusAtendimentos(sorted);
      setLoadingMeus(false); // Desbloqueia a UI imediatamente

      // Preserva a regra do badge sem baixar o historico de cada atendimento.
      setNovasMensagens(Object.fromEntries(sorted.map(atendimento => [
        atendimento.id, atendimento.ultimaMensagemDoBeneficiario === true,
      ])));

    } catch (error) {
      setErroMeus(error instanceof Error ? error.message : 'Erro ao carregar dados.');
      setLoadingMeus(false);
    }
  };

  useEffect(() => {
    async function carregarDadosDoPortal() {
      if (!user) return;

      const solicitados = carregarSolicitados();

      if (user.tipoUsuario !== 'VOLUNTARIO' && user.tipoUsuario !== 'ADMIN') {
        setLoadingMeus(false);
        setErroMeus('Esta área é exclusiva para voluntários e administradores.');
        return;
      }

      if (!user.voluntarioId) {
        setLoadingMeus(false);
        setErroMeus('');
        setMeusAtendimentos([]);
        setFeedback(user.tipoUsuario === 'ADMIN' ? 'Atenção: Administrador sem perfil de voluntário. Você pode visualizar os atendimentos, mas recursos de voluntário estão desativados.' : 'Sua conta de voluntário está sem vínculo de voluntário. Você pode visualizar os atendimentos, mas ainda não pode assumir casos.');
        return;
      }

      await Promise.all([
        solicitados,
        carregarMeus(user.voluntarioId),
        voluntariosService.buscarPorId(user.voluntarioId).then(vol => {
          if (vol.codigoIndicacao) setCodigoIndicacao(vol.codigoIndicacao);
        }).catch(err => console.error('Erro ao buscar codigo de indicacao', err))
      ]);
    }

    void carregarDadosDoPortal();
  }, [user]);

  useEffect(() => () => {
    if (copyFeedbackTimer.current) clearTimeout(copyFeedbackTimer.current);
  }, []);

  const assumir = async (atendimentoId: number) => {
    if (!user) return;

    if (!user.voluntarioId) {
      setFeedback('Não foi possível assumir o atendimento: sua conta ainda não possui cadastro de voluntário vinculado.');
      return;
    }

    const voluntarioId = user.voluntarioId;

    setFeedback('');
    setAssumindoId(atendimentoId);

    try {
      await atendimentoService.assumirAtendimento(atendimentoId, voluntarioId);
      setFeedback('Atendimento assumido com sucesso.');
      await Promise.all([
        carregarSolicitados(),
        carregarMeus(voluntarioId),
      ]);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Não foi possível assumir o atendimento.',
      );
    } finally {
      setAssumindoId(null);
    }
  };

  const copiarLink = async () => {
    if (!codigoIndicacao) return;
    const link = `${window.location.origin}/cadastro?ref=${codigoIndicacao}`;
    try {
      await navigator.clipboard.writeText(link);
      setErroCopia('');
      setCopiado(true);
      if (copyFeedbackTimer.current) clearTimeout(copyFeedbackTimer.current);
      copyFeedbackTimer.current = setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar link', err);
      setCopiado(false);
      setErroCopia('Não foi possível copiar automaticamente. Selecione o link e copie manualmente.');
    }
  };

  const assumirComConfirmacao = (atendimento: AtendimentoApi) => {
    confirm({
      title: 'Assumir Atendimento',
      message: 'Você deseja assumir a responsabilidade por este caso? Ele passará para a sua fila de atendimentos ativos e o beneficiário será notificado.',
      confirmText: 'Sim, assumir caso',
      tone: 'primary',
      details: [
        { label: 'Beneficiário', value: getPessoa(atendimento) },
        { label: 'Contexto', value: getAtendimentoDescricaoContexto(atendimento) },
        { label: 'Status atual', value: formatStatusLabel(atendimento.status ?? 'ABERTO'), tone: 'primary' },
      ],
      onConfirm: () => void assumir(atendimento.id)
    });
  };

  const atendimentosAtuais = aba === 'solicitados' ? solicitados : meusAtendimentos;
  const atendimentosFiltrados = atendimentosAtuais.filter(atendimento => matchesFiltro(atendimento, filtroFila));
  const totalUrgentes = atendimentosAtuais.filter(isUrgente).length;
  const totalApolonia = atendimentosAtuais.filter(atendimento => atendimento.tipoPessoa === 'MULHER_APOLONIA').length;

  const selecionarAba = (novaAba: Aba) => {
    setAba(novaAba);
    setFiltroFila('todos');
  };

  return (
    <PageShell className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <section aria-labelledby="portal-titulo" className="relative isolate overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-sky-50/50 to-blue-100/40 p-6 md:p-7">
        <CareIllustration />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Portal</p>
          <h1 id="portal-titulo" className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">Seu painel de atendimentos</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 md:text-base">Acompanhe atendimentos solicitados, gerencie sua agenda e acompanhe o impacto do seu trabalho voluntário.</p>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-3 lg:justify-end">
          <Button variant="secondary" onClick={() => navigate('/agenda')} className="rounded-xl bg-white"><PortalIcon name="calendar" className="h-5 w-5 text-blue-600" />Minha Agenda</Button>
          <Button variant="secondary" onClick={() => navigate('/ranking')} className="rounded-xl bg-white"><PortalIcon name="trophy" className="h-5 w-5 text-blue-600" />Ranking de Indicações</Button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Resumo dos atendimentos">
        {([
          { label: 'Solicitações disponíveis', value: solicitados.length, description: 'Casos aguardando voluntários', icon: 'document', decoration: 'users', surface: 'border-blue-100 bg-blue-50/60', color: 'bg-blue-100 text-blue-600', watermark: 'text-blue-200', loading: loadingSolicitados, error: erroSolicitados },
          { label: 'Urgentes', value: totalUrgentes, description: 'Casos que precisam de atenção', icon: 'alert', decoration: 'alert', surface: 'border-rose-100 bg-rose-50/50', color: 'bg-rose-100 text-rose-600', watermark: 'text-rose-200', loading: aba === 'solicitados' ? loadingSolicitados : loadingMeus, error: aba === 'solicitados' ? erroSolicitados : erroMeus },
          { label: 'Meus atendimentos', value: meusAtendimentos.length, description: 'Casos em acompanhamento', icon: 'users', decoration: 'chart', surface: 'border-emerald-100 bg-emerald-50/50', color: 'bg-emerald-100 text-emerald-600', watermark: 'text-emerald-200', loading: loadingMeus, error: erroMeus },
        ] as const).map(metric => (
          <div key={metric.label} className={`relative flex items-start gap-4 overflow-hidden rounded-2xl border p-5 md:flex-col xl:flex-row ${metric.surface}`}>
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${metric.color}`}><PortalIcon name={metric.icon} className="h-6 w-6" /></span>
            <div className="relative z-10 min-w-0">
              <p className="text-sm font-semibold text-slate-700">{metric.label}</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900" aria-label={metric.error ? 'Indisponível' : metric.loading ? 'Carregando' : undefined}>{metric.loading || metric.error ? '—' : metric.value}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{metric.description}</p>
            </div>
            <PortalIcon name={metric.decoration} className={`absolute bottom-5 right-4 h-11 w-11 opacity-60 ${metric.watermark}`} />
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {user?.tipoUsuario === 'VOLUNTARIO' && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm ring-1 ring-blue-100">
                  <PortalIcon name="megaphone" className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-foreground">Campanha de Indicações</h2>
                  <p className="text-sm text-muted-foreground">Convide profissionais para ampliar a rede de atendimento.</p>
                </div>
              </div>
              {codigoIndicacao ? (
                <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-lg">
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white pl-3 text-blue-600">
                    <PortalIcon name="link" />
                    <Input aria-label="Link de indicação" readOnly value={`${window.location.origin}/cadastro?ref=${codigoIndicacao}`} className="min-w-0 border-0 bg-transparent py-2 pl-0 text-sm shadow-none" />
                  </div>
                  <Button
                    variant="primary"
                    onClick={copiarLink}
                    className={`min-w-28 shrink-0 justify-center rounded-xl motion-reduce:transition-none ${copiado ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}`}
                  >
                    {copiado ? (
                      <><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>Copiado!</>
                    ) : <><PortalIcon name="copy" />Copiar link</>}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="shrink-0 rounded-xl"
                  onClick={async () => {
                    if (!user?.voluntarioId) return;
                    try {
                      const res = await voluntariosService.gerarCodigoIndicacao(user.voluntarioId);
                      if (res.codigoIndicacao) setCodigoIndicacao(res.codigoIndicacao);
                    } catch (err) {
                      console.error('Erro ao gerar codigo', err);
                      setErroCopia('Não foi possível gerar o link de indicação agora.');
                    }
                  }}
                >
                  Gerar meu Link
                </Button>
              )}
            </div>
            <div className="sr-only" role="status" aria-live="polite">{copiado ? 'Link de indicação copiado.' : ''}</div>
            {erroCopia && <p role="alert" className="mt-2 text-sm font-medium text-danger">{erroCopia}</p>}
          </div>
        )}

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl font-bold text-blue-600" aria-hidden="true">{user?.nome?.trim().charAt(0).toUpperCase() || 'U'}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Bem-vindo</p>
                <h2 className="mt-1 break-words text-xl font-bold text-slate-900">{user?.nome}</h2>
                <p className="break-words text-sm text-slate-500">{user?.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-50 p-1" role="group" aria-label="Filas de atendimentos">
              <Button className="rounded-xl" aria-pressed={aba === 'solicitados'} variant={aba === 'solicitados' ? 'primary' : 'ghost'} onClick={() => selecionarAba('solicitados')}>Atendimentos solicitados</Button>
              <Button className="rounded-xl" aria-pressed={aba === 'meus'} variant={aba === 'meus' ? 'primary' : 'ghost'} onClick={() => selecionarAba('meus')}>Meus atendimentos</Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtros da fila de atendimentos">
          {([
            ['todos', `Todos (${atendimentosAtuais.length})`],
            ['urgentes', `Urgentes (${totalUrgentes})`],
            ['apolonia', `Casos Apolônia (${totalApolonia})`],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={filtroFila === value ? 'primary' : 'secondary'}
              className="rounded-full px-4 py-1.5"
              aria-pressed={filtroFila === value}
              onClick={() => setFiltroFila(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        {feedback && (
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-primary">
            {feedback}
          </div>
        )}

        {aba === 'solicitados' && (
          <div>
            <QueueHeading />
            {loadingSolicitados && <LoadingState title="Carregando atendimentos solicitados..." count={3} />}
            {erroSolicitados && <ErrorState title="Erro ao carregar atendimentos" description={erroSolicitados} />}
            {!loadingSolicitados && !erroSolicitados && solicitados.length === 0 && (
              <OperationalEmptyState
                title="Tudo acolhido por enquanto"
                description="Não há novos casos aguardando um profissional. Quando uma solicitação chegar, ela aparecerá nesta fila."
              />
            )}
            {!loadingSolicitados && !erroSolicitados && solicitados.length > 0 && atendimentosFiltrados.length === 0 && (
              <OperationalEmptyState title="Nenhum caso neste filtro" description="Tente outro filtro para visualizar os demais atendimentos disponíveis." />
            )}
            <div className="grid gap-4">
              {!loadingSolicitados && !erroSolicitados && atendimentosFiltrados.map((atendimento) => (
                <AtendimentoCard
                  key={atendimento.id}
                  atendimento={atendimento}
                  onAssumir={assumirComConfirmacao}
                  assumirBloqueado={voluntarioSemVinculo}
                  assumindo={assumindoId === atendimento.id}
                  showProtocol={user?.tipoUsuario === 'ADMIN'}
                />
              ))}
            </div>
          </div>
        )}

        {aba === 'meus' && (
          <div>
            <QueueHeading mine />
            {loadingMeus && <LoadingState title="Carregando seus atendimentos..." count={3} />}
            {erroMeus && <ErrorState title="Erro ao carregar seus atendimentos" description={erroMeus} />}
            {!loadingMeus && !erroMeus && meusAtendimentos.length === 0 && (
              <OperationalEmptyState
                title="Sua fila está livre"
                description="Os casos assumidos por você aparecerão aqui com status, mensagens e próximos passos."
              />
            )}
            {!loadingMeus && !erroMeus && meusAtendimentos.length > 0 && atendimentosFiltrados.length === 0 && (
              <OperationalEmptyState title="Nenhum caso neste filtro" description="Tente outro filtro para visualizar os demais atendimentos sob seu acompanhamento." />
            )}
            <div className="grid gap-4">
              {!loadingMeus && !erroMeus && atendimentosFiltrados.map((atendimento) => (
                <AtendimentoCard
                  key={atendimento.id}
                  atendimento={atendimento}
                  hasNovaMensagem={novasMensagens[atendimento.id]}
                  showProtocol={user?.tipoUsuario === 'ADMIN'}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      {confirmDialog}
    </PageShell>
  );
}

export default PortalVoluntario;
