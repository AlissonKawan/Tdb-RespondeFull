import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/FeedbackState';
import PageHeader from '../components/ui/PageHeader';
import SectionHeader from '../components/ui/SectionHeader';
import { atendimentoService } from '../services/atendimentoService';
import type { AtendimentoApi } from '../types/AtendimentoApi';
import { useAuth } from '../context/useAuth';

type Aba = 'solicitados' | 'meus';

function getAtendimentoTitle(atendimento: AtendimentoApi) {
  return atendimento.titulo
    ?? atendimento.descricao
    ?? atendimento.observacao
    ?? `Atendimento #${atendimento.id}`;
}

function getPessoa(atendimento: AtendimentoApi) {
  return atendimento.beneficiarioNome
    ?? atendimento.pacienteNome
    ?? atendimento.solicitanteNome
    ?? atendimento.beneficiario?.nome
    ?? atendimento.usuario?.nome
    ?? 'Beneficiario nao informado';
}

function statusTone(status?: string) {
  if (!status) return 'neutral';
  if (['ENCERRADO', 'Encerrado'].includes(status)) return 'success';
  if (['Aberto', 'ABERTO'].includes(status)) return 'info';
  if (['EM_ATENDIMENTO', 'Em andamento', 'Aguardando'].includes(status)) return 'warning';
  return 'neutral';
}

function AtendimentoCard({ atendimento, onAssumir, assumindo, assumirBloqueado }: {
  atendimento: AtendimentoApi;
  onAssumir?: (id: number) => void;
  assumindo?: boolean;
  assumirBloqueado?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Card className="p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-[#0F172A]">{getAtendimentoTitle(atendimento)}</h3>
            {atendimento.status && <Badge tone={statusTone(atendimento.status)}>{atendimento.status}</Badge>}
          </div>
          <div className="mt-3 grid gap-2 text-sm text-[#475569] md:grid-cols-2">
            <p><strong className="text-[#0F172A]">Pessoa:</strong> {getPessoa(atendimento)}</p>
            {atendimento.canal && <p><strong className="text-[#0F172A]">Canal:</strong> {atendimento.canal}</p>}
            {atendimento.prioridade && <p><strong className="text-[#0F172A]">Prioridade:</strong> {atendimento.prioridade}</p>}
            {(atendimento.dataCriacao || atendimento.dataAbertura) && (
              <p><strong className="text-[#0F172A]">Data:</strong> {atendimento.dataCriacao ?? atendimento.dataAbertura}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {onAssumir && (
            <Button disabled={assumindo || assumirBloqueado} onClick={() => onAssumir(atendimento.id)}>
              {assumindo ? 'Assumindo...' : 'Assumir atendimento'}
            </Button>
          )}
          {!onAssumir && (
            <Button variant="secondary" onClick={() => navigate(`/atendimentos/${atendimento.id}`)}>
              Abrir atendimento
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function PortalVoluntario() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [aba, setAba] = useState<Aba>('solicitados');
  const [solicitados, setSolicitados] = useState<AtendimentoApi[]>([]);
  const [meusAtendimentos, setMeusAtendimentos] = useState<AtendimentoApi[]>([]);
  const [loadingSolicitados, setLoadingSolicitados] = useState(true);
  const [loadingMeus, setLoadingMeus] = useState(true);
  const [erroSolicitados, setErroSolicitados] = useState('');
  const [erroMeus, setErroMeus] = useState('');
  const [feedback, setFeedback] = useState('');
  const [assumindoId, setAssumindoId] = useState<number | null>(null);

  const voluntarioSemVinculo = user?.tipoUsuario === 'VOLUNTARIO' && !user?.voluntarioId;

  const carregarSolicitados = async () => {
    setLoadingSolicitados(true);
    setErroSolicitados('');
    try {
      setSolicitados(await atendimentoService.listarSolicitados());
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
      setMeusAtendimentos(await atendimentoService.listarPorVoluntario(voluntarioId));
    } catch (error) {
      setErroMeus(error instanceof Error ? error.message : 'Erro ao carregar dados.');
    } finally {
      setLoadingMeus(false);
    }
  };

  useEffect(() => {
    async function carregarDadosDoPortal() {
      if (!user) return;

      await carregarSolicitados();

      if (user.tipoUsuario !== 'VOLUNTARIO') {
        setLoadingMeus(false);
        setErroMeus('Esta area e exclusiva para voluntarios.');
        return;
      }

      if (!user.voluntarioId) {
        setLoadingMeus(false);
        setErroMeus('');
        setMeusAtendimentos([]);
        setFeedback('Sua conta de voluntario esta sem vinculo de voluntario. Voce pode visualizar os atendimentos, mas ainda nao pode assumir casos.');
        return;
      }

      await carregarMeus(user.voluntarioId);
    }

    void carregarDadosDoPortal();
  }, [user]);

  const assumir = async (atendimentoId: number) => {
    if (!user) return;

    if (!user.voluntarioId) {
      setFeedback('Nao foi possivel assumir atendimento: sua conta ainda nao possui cadastro de voluntario vinculado.');
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
          : 'Nao foi possivel assumir atendimento.',
      );
    } finally {
      setAssumindoId(null);
    }
  };

  return (
    <PageShell>
      <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <Container className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={() => navigate('/')} className="text-sm font-semibold text-[#2563EB] hover:text-[#1E3A8A]">
              Voltar para o site
            </button>
            <p className="mt-1 text-sm text-[#475569]">Sessao de {user?.nome}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/ranking')}>🏆 Ranking de Indicações</Button>
            <Button variant="secondary" onClick={() => { logout(); navigate('/login'); }}>Sair</Button>
          </div>
        </Container>
      </header>

      <PageHeader
        eyebrow="Portal"
        title="Portal do Voluntario"
        description="Acompanhe atendimentos solicitados e veja os atendimentos vinculados ao seu usuario."
      />

      <Section tone="white">
        <Card className="mb-6 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Bem-vindo</p>
            <h2 className="mt-2 text-2xl font-bold text-[#0F172A]">{user?.nome}</h2>
            <p className="mt-1 text-[#475569]">{user?.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={aba === 'solicitados' ? 'primary' : 'secondary'} onClick={() => setAba('solicitados')}>Atendimentos solicitados</Button>
            <Button variant={aba === 'meus' ? 'primary' : 'secondary'} onClick={() => setAba('meus')}>Meus atendimentos</Button>
          </div>
        </Card>

        {feedback && (
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#2563EB]">
            {feedback}
          </div>
        )}

        {aba === 'solicitados' && (
          <div>
            <SectionHeader title="Atendimentos solicitados" description="Casos aguardando acolhimento da equipe voluntaria." />
            {loadingSolicitados && <LoadingState title="Carregando atendimentos solicitados..." />}
            {erroSolicitados && <ErrorState title="Erro ao carregar atendimentos" description={erroSolicitados} />}
            {!loadingSolicitados && !erroSolicitados && solicitados.length === 0 && (
              <EmptyState title="Nenhum atendimento solicitado no momento." />
            )}
            <div className="grid gap-4">
              {!loadingSolicitados && !erroSolicitados && solicitados.map((atendimento) => (
                <AtendimentoCard
                  key={atendimento.id}
                  atendimento={atendimento}
                  onAssumir={assumir}
                  assumirBloqueado={voluntarioSemVinculo}
                  assumindo={assumindoId === atendimento.id}
                />
              ))}
            </div>
          </div>
        )}

        {aba === 'meus' && (
          <div>
            <SectionHeader title="Meus atendimentos" description="Casos que ja estao vinculados ao seu acompanhamento." />
            {loadingMeus && <LoadingState title="Carregando seus atendimentos..." />}
            {erroMeus && <ErrorState title="Erro ao carregar seus atendimentos" description={erroMeus} />}
            {!loadingMeus && !erroMeus && meusAtendimentos.length === 0 && (
              <EmptyState title="Nenhum atendimento vinculado ao seu usuario." />
            )}
            <div className="grid gap-4">
              {!loadingMeus && !erroMeus && meusAtendimentos.map((atendimento) => (
                <AtendimentoCard key={atendimento.id} atendimento={atendimento} />
              ))}
            </div>
          </div>
        )}
      </Section>
    </PageShell>
  );
}

export default PortalVoluntario;
