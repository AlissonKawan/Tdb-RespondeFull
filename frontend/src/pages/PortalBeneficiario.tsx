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

function statusTone(status?: string) {
  if (!status) return 'neutral';
  if (['ENCERRADO', 'Encerrado'].includes(status)) return 'success';
  if (['ABERTO', 'Aberto'].includes(status)) return 'info';
  if (['EM_ATENDIMENTO', 'Em andamento', 'Aguardando'].includes(status)) return 'warning';
  return 'neutral';
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

function BeneficiaryEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card className="border-dashed bg-gradient-to-br from-slate-50 to-blue-50/60 p-8 text-center md:p-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-4.4-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.6-7 11-7 11Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v5m-2.5-2.5h5" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">Seu espaço de cuidado começa aqui</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        Você ainda não possui atendimentos. Abra uma solicitação para que nossa equipe possa acolher o seu caso.
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
        eyebrow="Portal"
        title={`Olá, ${user?.nome ?? 'beneficiário'}`}
        description="Solicite atendimentos, acompanhe status e converse com voluntários pelo chat do atendimento."
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
          <BeneficiaryEmptyState onCreate={() => navigate('/beneficiario/solicitar-atendimento')} />
        )}

        <div className="grid gap-4">
          {!loading && !erro && atendimentos.map((atendimento) => (
            <Card key={atendimento.id} className="p-5 hover:-translate-y-0.5 hover:border-blue-200 md:p-6">
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
    </PageShell>
  );
}

export default PortalBeneficiario;
