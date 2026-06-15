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
import { useConfirm } from '../hooks/useConfirm';
import { formatStatusLabel } from '../utils/formatters';
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
  const { confirm, ConfirmModal } = useConfirm();
  const [atendimentos, setAtendimentos] = useState<AtendimentoApi[]>([]);
  const [novasMensagens, setNovasMensagens] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

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
      <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <Container className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[#475569]">Portal do beneficiario | {user?.nome}</p>
          </div>
          <Button variant="secondary" onClick={() => {
            confirm({
              title: 'Sair da conta',
              message: 'Você realmente quer sair da conta?',
              confirmText: 'Sair',
              tone: 'danger',
              onConfirm: () => {
                logout();
                navigate('/login');
              }
            });
          }}>Sair</Button>
        </Container>
      </header>

      <PageHeader
        eyebrow="Portal"
        title={`Ola, ${user?.nome ?? 'beneficiario'}`}
        description="Solicite atendimentos, acompanhe status e converse com voluntarios pelo chat do atendimento."
      />

      <Section tone="white">
        <Card className="mb-6 flex flex-col gap-5 p-4 md:p-6 md:flex-row md:items-center md:justify-between">
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
          description="Acompanhe o andamento dos seus atendimentos e fale com o responsável quando necessário."
        />

        {loading && <LoadingState title="Carregando seus atendimentos..." />}
        {erro && <ErrorState title="Erro ao carregar dados" description={erro} />}
        {!loading && !erro && atendimentos.length === 0 && (
          <EmptyState
            title="Você ainda não possui atendimentos."
            description="Clique em Solicitar atendimento para abrir um novo pedido."
          />
        )}

        <div className="grid gap-4">
          {!loading && !erro && atendimentos.map((atendimento) => (
            <Card key={atendimento.id} className="p-4 md:p-6 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-[#0F172A] truncate">{getPessoa(atendimento)}</h3>
                    {atendimento.status && <Badge tone={statusTone(atendimento.status) as any}>{formatStatusLabel(atendimento.status)}</Badge>}
                    {novasMensagens[atendimento.id] && <Badge tone="danger">Nova Mensagem</Badge>}
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-[#475569] md:grid-cols-2">

                    <p><strong className="text-[#0F172A]">Última Atividade:</strong> {formatDate(atendimento.dataAtualizacao ?? atendimento.dataAbertura ?? atendimento.dataCriacao)}</p>
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
      <ConfirmModal />
    </PageShell>
  );
}

export default PortalBeneficiario;
