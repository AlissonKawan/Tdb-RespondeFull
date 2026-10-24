import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ErrorState, LoadingState } from '../components/ui/FeedbackState';
import PageHeader from '../components/ui/PageHeader';
import SectionHeader from '../components/ui/SectionHeader';
import { useAuth } from '../context/useAuth';
import { atendimentoService } from '../services/atendimentoService';
import { mensagensService } from '../services/mensagensService';
import { formatStatusLabel } from '../utils/formatters';
import type { AtendimentoApi } from '../types/AtendimentoApi';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const progressSteps = [
  'Solicitação enviada',
  'Em triagem',
  'Dentista atribuído',
  'Em tratamento',
  'Concluído',
] as const;

function statusTone(status?: string): BadgeTone {
  if (!status) return 'neutral';
  if (['ENCERRADO', 'Encerrado'].includes(status)) return 'success';
  if (['ABERTO', 'Aberto'].includes(status)) return 'info';
  if (['EM_ATENDIMENTO', 'Em andamento', 'Aguardando'].includes(status)) return 'warning';
  return 'neutral';
}

function getProgress(atendimento: AtendimentoApi) {
  const status = atendimento.status?.trim().toUpperCase().replaceAll(' ', '_') ?? '';
  const hasVolunteer = Boolean(
    atendimento.voluntarioId
    || atendimento.nomeVoluntario
    || atendimento.voluntario?.id
    || atendimento.voluntario?.nome,
  );

  if (status === 'CANCELADO') return { currentStep: 1, cancelled: true };
  if (status === 'ENCERRADO') return { currentStep: 5, cancelled: false };
  if (status === 'EM_ATENDIMENTO' || status === 'EM_ANDAMENTO') {
    return { currentStep: 4, cancelled: false };
  }
  if (status === 'ABERTO' || status === 'AGUARDANDO') {
    return { currentStep: hasVolunteer ? 3 : 2, cancelled: false };
  }
  return { currentStep: 1, cancelled: false };
}

function AtendimentoProgress({ atendimento }: { atendimento: AtendimentoApi }) {
  const { currentStep, cancelled } = getProgress(atendimento);
  const currentLabel = cancelled ? 'Atendimento cancelado' : progressSteps[currentStep - 1];

  return (
    <div className="mt-5 rounded-ui border border-border bg-muted/35 px-4 py-4 sm:px-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-foreground">Andamento do atendimento</p>
        <span className={`text-xs font-semibold ${cancelled ? 'text-danger' : 'text-primary'}`}>
          {cancelled ? currentLabel : `Etapa ${currentStep} de ${progressSteps.length}`}
        </span>
      </div>

      <ol
        className="relative grid gap-3 sm:grid-cols-5 sm:gap-2"
        aria-label={`Progresso do atendimento: ${currentLabel}`}
      >
        <span className="absolute left-4 top-4 hidden h-0.5 w-[calc(100%-2rem)] bg-border sm:block" aria-hidden="true" />
        {progressSteps.map((step, index) => {
          const stepNumber = index + 1;
          const complete = !cancelled && stepNumber < currentStep;
          const current = stepNumber === currentStep;
          const emphasized = complete || current;

          return (
            <li
              key={step}
              className="relative z-10 flex items-center gap-3 sm:block sm:text-center"
              aria-current={current && !cancelled ? 'step' : undefined}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold sm:mx-auto ${
                  cancelled && current
                    ? 'border-danger bg-red-50 text-danger'
                    : emphasized
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-surface text-muted-foreground'
                }`}
                aria-hidden="true"
              >
                {complete ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" />
                  </svg>
                ) : stepNumber}
              </span>
              <span className={`text-xs font-semibold leading-5 sm:mt-2 sm:block ${emphasized ? 'text-foreground' : 'text-muted-foreground'}`}>
                {stepNumber}. {step}
              </span>
            </li>
          );
        })}
      </ol>

      {cancelled ? (
        <p className="mt-4 text-sm font-medium text-danger">Este atendimento foi cancelado e o progresso foi interrompido.</p>
      ) : null}
    </div>
  );
}



function formatDate(value?: string | null) {
  if (!value) return 'Não informada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
}

function sortAtendimentos(a: AtendimentoApi, b: AtendimentoApi) {
  const dateA = new Date(a.dataAtualizacao ?? a.dataCriacao ?? a.dataAbertura ?? 0).getTime();
  const dateB = new Date(b.dataAtualizacao ?? b.dataCriacao ?? b.dataAbertura ?? 0).getTime();
  return dateB - dateA; // Descending
}

function getPessoa(atendimento: AtendimentoApi) {
  return atendimento.pessoaAtendidaNome
    ?? atendimento.beneficiarioNome
    ?? atendimento.pacienteNome
    ?? atendimento.solicitanteNome
    ?? atendimento.beneficiario?.nome
    ?? atendimento.usuario?.nome
    ?? 'Beneficiário não informado';
}

function BeneficiaryEmptyState({ onCreate, isApolonia }: { onCreate: () => void; isApolonia: boolean }) {
  return (
    <Card className={`border-dashed p-8 text-center md:p-10 ${isApolonia ? 'border-rose-200 bg-gradient-to-br from-rose-50/70 to-white' : 'bg-gradient-to-br from-slate-50 to-blue-50/60'}`}>
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ${isApolonia ? 'text-rose-600 ring-rose-200' : 'text-blue-600 ring-blue-100'}`}>
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-4.4-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.6-7 11-7 11Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v5m-2.5-2.5h5" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">
        {isApolonia ? 'Seu espaço seguro de acolhimento começa aqui' : 'Seu espaço de cuidado começa aqui'}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        {isApolonia
          ? 'Você ainda não possui solicitações abertas. Relate sua necessidade com tranquilidade e sigilo para que nossa equipe possa acolher você.'
          : 'Você ainda não possui atendimentos. Abra uma solicitação para que nossa equipe de dentistas voluntários possa acolher o seu caso.'}
      </p>
      <Button className="mt-5" onClick={onCreate}>Solicitar primeiro atendimento</Button>
    </Card>
  );
}

function PortalBeneficiario() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [atendimentos, setAtendimentos] = useState<AtendimentoApi[]>([]);
  const [novasMensagens, setNovasMensagens] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const isApolonia = user?.tipoBeneficiario === 'MULHER_APOLONIA'
    || atendimentos.some((a) => a.tipoBeneficiario === 'MULHER_APOLONIA' || a.beneficiario?.tipo === 'MULHER_APOLONIA');

  useEffect(() => {
    async function carregarAtendimentos() {
      if (!user || (user.tipoUsuario !== 'BENEFICIARIO' && user.tipoUsuario !== 'ADMIN')) {
        setLoading(false);
        setErro('Esta área é exclusiva para beneficiários e administradores.');
        return;
      }

      setLoading(true);
      setErro('');
      try {
        const data = await atendimentoService.listarPorContaBeneficiario(user.id);
        const sorted = data.sort(sortAtendimentos);
        setAtendimentos(sorted);
        setLoading(false); // Desbloqueia a UI imediatamente

        // Fetch mensagens para verificar novidades em background
        void (async () => {
          const unreadMap: Record<number, boolean> = {};
          await Promise.all(sorted.map(async (atendimento) => {
            try {
              const msgs = await mensagensService.getMensagensAtendimento(atendimento.id);
              if (msgs.length > 0) {
                const ultima = msgs[msgs.length - 1];
                // Se a última mensagem não foi enviada pelo beneficiário, conta como nova
                if (ultima.enviadoPor !== 'BENEFICIARIO') {
                  unreadMap[atendimento.id] = true;
                }
              }
            } catch { /* ignora */ }
          }));
          setNovasMensagens(prev => ({ ...prev, ...unreadMap }));
        })();
      } catch (error) {
        setErro(error instanceof Error ? error.message : 'Não foi possível carregar seus atendimentos.');
        setLoading(false);
      }
    }

    void carregarAtendimentos();
  }, [user]);

  return (
    <PageShell>
      <PageHeader
        variant="compact"
        eyebrow={isApolonia ? 'Portal Apolônias do Bem' : 'Portal Dentista do Bem'}
        title={`Olá, ${user?.nome ?? (isApolonia ? 'beneficiária' : 'beneficiário')}`}
        description={
          isApolonia
            ? 'Espaço seguro e sigiloso para solicitar acolhimento odontológico, acompanhar seu atendimento e conversar com a equipe pela aplicação.'
            : 'Acompanhe o cuidado odontológico da criança ou adolescente, verifique o status da triagem e converse com o dentista voluntário pelo chat.'
        }
      />

      <Section tone="white">
        <Card className={`mb-6 flex flex-col gap-5 p-4 md:p-6 ${isApolonia ? 'border-rose-200 bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30' : 'border-blue-100 bg-gradient-to-br from-blue-50/55 via-white to-slate-50'}`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={isApolonia ? 'danger' : 'info'}>
                  {isApolonia ? 'Programa Apolônias do Bem' : 'Programa Dentista do Bem — Criança e Adolescente'}
                </Badge>
                {isApolonia && <Badge tone="neutral">Sigilo protegido</Badge>}
              </div>
              <h2 className="mt-3 text-2xl font-bold text-foreground">
                {isApolonia ? 'Acolhimento e solicitações sigilosas' : 'Meus atendimentos odontológicos'}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {isApolonia
                  ? 'Suas preferências de apresentação e privacidade já estão salvas na sua conta.'
                  : 'Os dados do perfil da criança ou adolescente já estão vinculados à sua conta.'}
              </p>
            </div>
            <Button onClick={() => navigate('/beneficiario/solicitar-atendimento')} size="large">
              Solicitar atendimento
            </Button>
          </div>

          <div className={`grid gap-3 rounded-xl border p-4 text-sm sm:grid-cols-3 ${isApolonia ? 'border-rose-200/80 bg-white/85' : 'border-blue-100 bg-white/85'}`}>
            {isApolonia ? (
              <>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Como você é apresentada</p>
                  <p className="mt-1 font-semibold text-foreground">{user?.nome ?? 'Identificação protegida'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Acesso da conta</p>
                  <p className="mt-1 font-semibold text-foreground">{user?.usuario ?? user?.email ?? 'Acesso pela aplicação'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Canal de retorno</p>
                  <p className="mt-1 font-semibold text-foreground">Exclusivo pela aplicação</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Pessoa atendida</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {user?.nome ?? 'Beneficiário'}{user?.idade != null ? ` (${user.idade} anos)` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Responsável e escola</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {[user?.nomeResponsavel, user?.escola].filter(Boolean).join(' • ') || 'Perfil vinculado à conta'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Contato cadastrado</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {[user?.telefone, user?.email].filter(Boolean).join(' • ') || 'Pela aplicação'}
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        <SectionHeader
          title="Acompanhamento"
          description={
            isApolonia
              ? 'Acompanhe o andamento das suas solicitações com privacidade e converse com a profissional responsável.'
              : 'Acompanhe o andamento dos atendimentos da criança ou adolescente e fale com o dentista responsável.'
          }
        />

        {loading && <LoadingState title="Carregando seus atendimentos..." count={3} />}
        {erro && <ErrorState title="Erro ao carregar dados" description={erro} />}
        {!loading && !erro && atendimentos.length === 0 && (
          <BeneficiaryEmptyState isApolonia={isApolonia} onCreate={() => navigate('/beneficiario/solicitar-atendimento')} />
        )}

        <div className="grid gap-4">
          {!loading && !erro && atendimentos.map((atendimento) => (
            <Card key={atendimento.id} className={`p-5 transition-[border-color,transform] duration-fast hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none md:p-6 ${isApolonia ? 'hover:border-rose-200' : 'hover:border-blue-200'}`}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground truncate">{getPessoa(atendimento)}</h3>
                    {atendimento.status && <Badge tone={statusTone(atendimento.status)}>{formatStatusLabel(atendimento.status)}</Badge>}
                    {novasMensagens[atendimento.id] ? (
                      <span className="inline-flex animate-pulse motion-reduce:animate-none" role="status" aria-atomic="true">
                        <Badge tone="danger">Nova Mensagem</Badge>
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">

                    <p><strong className="text-foreground">Última Atividade:</strong> {formatDate(atendimento.dataAtualizacao ?? atendimento.dataAbertura ?? atendimento.dataCriacao)}</p>
                    <p><strong className="text-foreground">Encerramento:</strong> {formatDate(atendimento.dataEncerramento)}</p>
                    <p><strong className="text-foreground">Voluntário:</strong> {atendimento.nomeVoluntario ?? atendimento.voluntario?.nome ?? 'Aguardando definicao'}</p>
                  </div>
                  {atendimento.descricao && (
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{atendimento.descricao}</p>
                  )}
                  <AtendimentoProgress atendimento={atendimento} />
                </div>
                <Button variant="secondary" onClick={() => navigate(`/atendimentos/${atendimento.id}`)}>
                  Ver detalhes
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}

export default PortalBeneficiario;
