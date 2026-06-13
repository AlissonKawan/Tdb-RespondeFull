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
import { voluntariosService } from '../services/voluntariosService';
import { mensagensService } from '../services/mensagensService';
import type { AtendimentoApi } from '../types/AtendimentoApi';
import { useAuth } from '../context/useAuth';

type Aba = 'solicitados' | 'meus';

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
    ?? `Atendimento #${atendimento.id}`;
}

function statusTone(status?: string) {
  if (!status) return 'neutral';
  if (['ENCERRADO', 'Encerrado'].includes(status)) return 'success';
  if (['ABERTO', 'Aberto'].includes(status)) return 'info';
  if (['EM_ATENDIMENTO', 'Em andamento', 'Aguardando'].includes(status)) return 'warning';
  return 'neutral';
}

function sortAtendimentos(a: AtendimentoApi, b: AtendimentoApi) {
  const dateA = new Date(a.dataAtualizacao ?? a.dataCriacao ?? a.dataAbertura ?? 0).getTime();
  const dateB = new Date(b.dataAtualizacao ?? b.dataCriacao ?? b.dataAbertura ?? 0).getTime();
  return dateB - dateA; // Descending
}


function AtendimentoCard({ atendimento, onAssumir, assumindo, assumirBloqueado, hasNovaMensagem }: {
  atendimento: AtendimentoApi;
  onAssumir?: (id: number) => void;
  assumindo?: boolean;
  assumirBloqueado?: boolean;
  hasNovaMensagem?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <Card className="p-4 md:p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-[#0F172A]">{getPessoa(atendimento)}</h3>
            {atendimento.status && <Badge tone={statusTone(atendimento.status) as any}>{atendimento.status}</Badge>}
            {hasNovaMensagem && <Badge tone="danger">Nova Mensagem</Badge>}
          </div>
          <div className="mt-3 grid gap-2 text-sm text-[#475569] md:grid-cols-2">
            <p><strong className="text-[#0F172A]">Contexto:</strong> <span className="line-clamp-1">{getAtendimentoDescricaoContexto(atendimento)}</span></p>
            {atendimento.canal && <p><strong className="text-[#0F172A]">Canal:</strong> {atendimento.canal}</p>}
            {atendimento.prioridade && <p><strong className="text-[#0F172A]">Prioridade:</strong> {atendimento.prioridade}</p>}
            {(atendimento.dataAtualizacao || atendimento.dataCriacao || atendimento.dataAbertura) && (
              <p><strong className="text-[#0F172A]">Última Atividade:</strong> {atendimento.dataAtualizacao ?? atendimento.dataCriacao ?? atendimento.dataAbertura}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {onAssumir && (
            <Button disabled={assumindo || assumirBloqueado} onClick={() => onAssumir(atendimento.id)}>
              {assumindo ? 'Assumindo...' : 'Assumir atendimento'}
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [aba, setAba] = useState<Aba>('solicitados');
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

      await Promise.all([
        carregarMeus(user.voluntarioId),
        voluntariosService.buscarPorId(user.voluntarioId).then(vol => {
          if (vol.codigoIndicacao) setCodigoIndicacao(vol.codigoIndicacao);
        }).catch(err => console.error('Erro ao buscar codigo de indicacao', err))
      ]);
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

  const copiarLink = async () => {
    if (!codigoIndicacao) return;
    const link = `${window.location.origin}/cadastro?ref=${codigoIndicacao}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar link', err);
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
            <p className="mt-1 text-sm text-[#475569]">Sessão de {user?.nome}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/ranking')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-500">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
              Ranking de Indicações
            </Button>
            <Button variant="secondary" onClick={() => { logout(); navigate('/login'); }}>Sair</Button>
          </div>
        </Container>
      </header>

      <PageHeader
        eyebrow="Portal"
        title="Portal do Voluntário"
        description="Acompanhe atendimentos solicitados e veja os atendimentos vinculados ao seu usuário."
      />

      <Section tone="white">
        <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_350px]">
          <Card className="flex flex-col gap-4 p-4 md:p-6 md:flex-row md:items-center md:justify-between">
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

          {user?.tipoUsuario === 'VOLUNTARIO' && (
            <Card className="p-4 md:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-[#0F172A]">Campanha de Indicações</h3>
                  <p className="mt-1 text-sm text-[#475569]">Convide outros profissionais e ganhe pontos no ranking!</p>
                  <div className="mt-4 flex flex-col gap-2">
                    {codigoIndicacao ? (
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={`${window.location.origin}/cadastro?ref=${codigoIndicacao}`}
                          className="w-full truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 outline-none"
                        />
                        <Button variant={copiado ? 'primary' : 'secondary'} onClick={copiarLink} className={copiado ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}>
                          {copiado ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><polyline points="20 6 9 17 4 12"/></svg>
                              Copiado
                            </>
                          ) : 'Copiar'}
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="secondary" 
                        className="w-fit"
                        onClick={async () => {
                          if (user?.voluntarioId) {
                            try {
                              const res = await voluntariosService.gerarCodigoIndicacao(user.voluntarioId);
                              if (res.codigoIndicacao) setCodigoIndicacao(res.codigoIndicacao);
                            } catch (err) {
                              console.error('Erro ao gerar codigo', err);
                            }
                          }
                        }}
                      >
                        Gerar meu Link
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

        </div>

        {feedback && (
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#2563EB]">
            {feedback}
          </div>
        )}

        {aba === 'solicitados' && (
          <div>
            <SectionHeader title="Atendimentos solicitados" description="Casos aguardando acolhimento da equipe voluntária." />
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
            <SectionHeader title="Meus atendimentos" description="Casos que já estão vinculados ao seu acompanhamento." />
            {loadingMeus && <LoadingState title="Carregando seus atendimentos..." />}
            {erroMeus && <ErrorState title="Erro ao carregar seus atendimentos" description={erroMeus} />}
            {!loadingMeus && !erroMeus && meusAtendimentos.length === 0 && (
              <EmptyState title="Nenhum atendimento vinculado ao seu usuário." />
            )}
            <div className="grid gap-4">
              {!loadingMeus && !erroMeus && meusAtendimentos.map((atendimento) => (
                <AtendimentoCard key={atendimento.id} atendimento={atendimento} hasNovaMensagem={novasMensagens[atendimento.id]} />
              ))}
            </div>
          </div>
        )}
      </Section>
    </PageShell>
  );
}

export default PortalVoluntario;
