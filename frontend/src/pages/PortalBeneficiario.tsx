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
import { useAuth } from '../context/useAuth';
import { atendimentoService } from '../services/atendimentoService';
import { mensagensService } from '../services/mensagensService';
import type { AtendimentoApi } from '../types/AtendimentoApi';

function statusTone(status?: string) {
  if (!status) return 'neutral';
  if (['ENCERRADO', 'Encerrado'].includes(status)) return 'success';
  if (['ABERTO', 'Aberto'].includes(status)) return 'info';
  if (['EM_ATENDIMENTO', 'Em andamento', 'Aguardando'].includes(status)) return 'warning';
  return 'neutral';
}

function prioridadeLabel(prioridade?: string | number) {
  const labels: Record<string, string> = {
    '1': 'Crítico',
    '2': 'Alto',
    '3': 'Médio',
    '4': 'Baixo',
    ALTA: 'Alto',
    MEDIA: 'Médio',
    BAIXA: 'Baixo',
  };
  return prioridade === undefined ? 'Não informada' : labels[String(prioridade)] ?? String(prioridade);
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

function PortalBeneficiario() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [atendimentos, setAtendimentos] = useState<AtendimentoApi[]>([]);
  const [novasMensagens, setNovasMensagens] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregarAtendimentos() {
      if (!user || user.tipoUsuario !== 'BENEFICIARIO') {
        setLoading(false);
        setErro('Esta area e exclusiva para beneficiarios.');
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
        setErro(error instanceof Error ? error.message : 'Nao foi possivel carregar seus atendimentos.');
        setLoading(false);
      }
    }

    void carregarAtendimentos();
  }, [user]);

  return (
    <PageShell>
      <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <Container className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={() => navigate('/')} className="text-sm font-semibold text-[#2563EB] hover:text-[#1E3A8A]">
              Voltar para o site
            </button>
            <p className="mt-1 text-sm text-[#475569]">Portal do beneficiario | {user?.nome}</p>
          </div>
          <Button variant="secondary" onClick={() => { logout(); navigate('/login'); }}>Sair</Button>
        </Container>
      </header>

      <PageHeader
        eyebrow="Portal"
        title={`Ola, ${user?.nome ?? 'beneficiario'}`}
        description="Solicite atendimentos, acompanhe status e converse com voluntarios pelo chat do atendimento."
      />

      <Section tone="white">
        <Card className="mb-6 flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Pessoa atendida</p>
            <h2 className="mt-2 text-2xl font-bold text-[#0F172A]">Meus atendimentos</h2>
            <p className="mt-1 text-[#475569]">
              Veja aqui os pedidos vinculados ao seu cadastro.
            </p>
          </div>
          <Button onClick={() => navigate('/beneficiario/solicitar-atendimento')} size="large">
            Solicitar atendimento
          </Button>
        </Card>

        <SectionHeader
          title="Acompanhamento"
          description="Acompanhe o andamento dos seus atendimentos e fale com o responsavel quando necessario."
        />

        {loading && <LoadingState title="Carregando seus atendimentos..." />}
        {erro && <ErrorState title="Erro ao carregar dados" description={erro} />}
        {!loading && !erro && atendimentos.length === 0 && (
          <EmptyState
            title="Voce ainda nao possui atendimentos."
            description="Clique em Solicitar atendimento para abrir um novo pedido."
          />
        )}

        <div className="grid gap-4">
          {!loading && !erro && atendimentos.map((atendimento) => (
            <Card key={atendimento.id} className="p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-[#0F172A]">{getPessoa(atendimento)}</h3>
                    <Badge tone="neutral">Atendimento #{atendimento.id}</Badge>
                    {atendimento.status && <Badge tone={statusTone(atendimento.status) as any}>{atendimento.status}</Badge>}
                    {novasMensagens[atendimento.id] && <Badge tone="danger">Nova Mensagem</Badge>}
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-[#475569] md:grid-cols-2">
                    <p><strong className="text-[#0F172A]">Prioridade:</strong> {prioridadeLabel(atendimento.prioridade)}</p>
                    <p><strong className="text-[#0F172A]">Última Atividade:</strong> {atendimento.dataAtualizacao ?? formatDate(atendimento.dataAbertura ?? atendimento.dataCriacao)}</p>
                    <p><strong className="text-[#0F172A]">Encerramento:</strong> {formatDate(atendimento.dataEncerramento)}</p>
                    <p><strong className="text-[#0F172A]">Voluntário:</strong> {atendimento.nomeVoluntario ?? atendimento.voluntario?.nome ?? 'Aguardando definicao'}</p>
                  </div>
                  {atendimento.descricao && (
                    <p className="mt-4 max-w-3xl text-sm leading-6 text-[#475569]">{atendimento.descricao}</p>
                  )}
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
