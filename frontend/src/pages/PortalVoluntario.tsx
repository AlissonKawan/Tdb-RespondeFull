import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ErrorState, LoadingState } from '../components/ui/FeedbackState';
import PageHeader from '../components/ui/PageHeader';
import SectionHeader from '../components/ui/SectionHeader';
import { Input } from '../components/ui/Input';
import { atendimentoService } from '../services/atendimentoService';
import { voluntariosService } from '../services/voluntariosService';
import { mensagensService } from '../services/mensagensService';
import type { AtendimentoApi } from '../types/AtendimentoApi';
import { useAuth } from '../context/useAuth';
import { useConfirm } from '../hooks/useConfirm';
import { formatStatusLabel, formatDate } from '../utils/formatters';

type Aba = 'solicitados' | 'meus';
type FiltroFila = 'todos' | 'urgentes' | 'apolonia';
type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

function getPessoa(atendimento: AtendimentoApi) {
  return atendimento.pessoaAtendidaNome
    ?? atendimento.beneficiarioNome
    ?? atendimento.pacienteNome
    ?? atendimento.solicitanteNome
    ?? atendimento.beneficiario?.nome
    ?? atendimento.usuario?.nome
    ?? 'Beneficiário não informado';
}

function getAtendimentoDescricaoContexto(atendimento: AtendimentoApi) {
  return atendimento.titulo
    ?? atendimento.descricao
    ?? atendimento.observacao
    ?? 'Atendimento sem descrição';
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
    || (typeof atendimento.prioridade === 'number' && atendimento.prioridade >= 4);
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


function AtendimentoCard({ atendimento, onAssumir, assumindo, assumirBloqueado, hasNovaMensagem }: {
  atendimento: AtendimentoApi;
  onAssumir?: (atendimento: AtendimentoApi) => void;
  assumindo?: boolean;
  assumirBloqueado?: boolean;
  hasNovaMensagem?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Card className="p-5 hover:-translate-y-0.5 hover:border-blue-200 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">{getPessoa(atendimento)}</h3>
            {atendimento.status && <Badge tone={statusTone(atendimento.status)}>{formatStatusLabel(atendimento.status)}</Badge>}
            {hasNovaMensagem && <Badge tone="danger">Nova Mensagem</Badge>}
          </div>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <p><strong className="text-foreground">Contexto:</strong> <span className="line-clamp-1">{getAtendimentoDescricaoContexto(atendimento)}</span></p>
            {atendimento.canal && <p><strong className="text-foreground">Canal:</strong> {atendimento.canal?.toLowerCase().includes('sistema web') ? 'TDB - Responde' : atendimento.canal}</p>}
            {atendimento.prioridade && <p><strong className="text-foreground">Prioridade:</strong> {atendimento.prioridade}</p>}
            {(atendimento.dataAtualizacao || atendimento.dataCriacao || atendimento.dataAbertura) && (
              <p><strong className="text-foreground">Última Atividade:</strong> {formatDate(atendimento.dataAtualizacao ?? atendimento.dataCriacao ?? atendimento.dataAbertura)}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {onAssumir && (
            <Button
              disabled={assumirBloqueado}
              isLoading={assumindo}
              loadingText="Assumindo..."
              onClick={() => onAssumir(atendimento)}
            >
              Assumir atendimento
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate(`/atendimentos/${atendimento.id}`)}>
            Abrir atendimento
          </Button>
        </div>
      </div>
    </Card>
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

      // Fetch mensagens para verificar novidades em background
      void (async () => {
        const unreadMap: Record<number, boolean> = {};
        await Promise.all(sorted.map(async (atendimento) => {
          try {
            const msgs = await mensagensService.getMensagensAtendimento(atendimento.id);
            if (msgs.length > 0) {
              const ultima = msgs[msgs.length - 1];
              // Se a última mensagem não foi enviada pelo voluntário ou admin, conta como nova
              if (ultima.enviadoPor === 'BENEFICIARIO') {
                unreadMap[atendimento.id] = true;
              }
            }
          } catch { /* ignora se falhar ao buscar msgs */ }
        }));
        setNovasMensagens(prev => ({ ...prev, ...unreadMap }));
      })();

    } catch (error) {
      setErroMeus(error instanceof Error ? error.message : 'Erro ao carregar dados.');
      setLoadingMeus(false);
    }
  };

  useEffect(() => {
    async function carregarDadosDoPortal() {
      if (!user) return;

      await carregarSolicitados();

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
    <PageShell>
      <PageHeader
        variant="compact"
        eyebrow="Portal"
        title="Portal do Voluntário"
        description="Acompanhe atendimentos solicitados e veja os atendimentos vinculados ao seu usuário."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/agenda')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-500">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Minha Agenda
            </Button>
            <Button variant="secondary" onClick={() => navigate('/ranking')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-500">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
              Ranking de Indicações
            </Button>
          </>
        }
      />

      <Section tone="white">
        {user?.tipoUsuario === 'VOLUNTARIO' && (
          <Card className="mb-5 overflow-hidden border-blue-100 bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm ring-1 ring-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-foreground">Campanha de Indicações</h2>
                  <p className="text-sm text-muted-foreground">Convide profissionais para ampliar a rede de atendimento.</p>
                </div>
              </div>
              {codigoIndicacao ? (
                <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl">
                  <Input aria-label="Link de indicação" readOnly value={`${window.location.origin}/cadastro?ref=${codigoIndicacao}`} className="min-w-0 bg-white py-2 text-sm" />
                  <Button
                    variant={copiado ? 'primary' : 'secondary'}
                    onClick={copiarLink}
                    className={`min-w-28 justify-center transition-[transform,background-color,color] motion-reduce:transition-none ${copiado ? 'scale-[1.02] bg-emerald-600 text-white hover:bg-emerald-700 motion-reduce:scale-100' : ''}`}
                  >
                    {copiado ? (
                      <><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>Copiado!</>
                    ) : 'Copiar link'}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
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
                  Gerar meu link
                </Button>
              )}
            </div>
            <div className="sr-only" role="status" aria-live="polite">{copiado ? 'Link de indicação copiado.' : ''}</div>
            {erroCopia && <p role="alert" className="mt-2 text-sm font-medium text-danger">{erroCopia}</p>}
          </Card>
        )}

        <div className="mb-6">
          <Card className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Bem-vindo</p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">{user?.nome}</h2>
              <p className="mt-1 text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={aba === 'solicitados' ? 'primary' : 'secondary'} onClick={() => selecionarAba('solicitados')}>Atendimentos solicitados</Button>
              <Button variant={aba === 'meus' ? 'primary' : 'secondary'} onClick={() => selecionarAba('meus')}>Meus atendimentos</Button>
            </div>
          </Card>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Filtros da fila de atendimentos">
          {([
            ['todos', `Todos (${atendimentosAtuais.length})`],
            ['urgentes', `Urgentes (${totalUrgentes})`],
            ['apolonia', `Casos Apolônia (${totalApolonia})`],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={filtroFila === value ? 'primary' : 'secondary'}
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
            <SectionHeader title="Atendimentos solicitados" description="Casos aguardando acolhimento da equipe voluntária." />
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
                />
              ))}
            </div>
          </div>
        )}

        {aba === 'meus' && (
          <div>
            <SectionHeader title="Meus atendimentos" description="Casos que já estão vinculados ao seu acompanhamento." />
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
                <AtendimentoCard key={atendimento.id} atendimento={atendimento} hasNovaMensagem={novasMensagens[atendimento.id]} />
              ))}
            </div>
          </div>
        )}
      </Section>
      {confirmDialog}
    </PageShell>
  );
}

export default PortalVoluntario;
