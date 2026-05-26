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
import { voluntariosService, type Voluntario } from '../services/voluntariosService';

function AprovacaoVoluntarios() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [solicitacoes, setSolicitacoes] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState('');
  const [aprovandoId, setAprovandoId] = useState<number | null>(null);

  const carregar = async () => {
    setLoading(true);
    setErro('');
    try {
      setSolicitacoes(await voluntariosService.listarPendentes());
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Nao foi possivel carregar as solicitacoes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregar();
  }, []);

  const aprovar = async (id: number) => {
    setAprovandoId(id);
    setFeedback('');
    try {
      if (!user) throw new Error('Usuario logado nao encontrado');
      await voluntariosService.aprovar(id, { aprovadorId: user.id });
      setFeedback('Solicitacao aprovada com sucesso.');
      await carregar();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel aprovar a solicitacao.');
    } finally {
      setAprovandoId(null);
    }
  };

  return (
    <PageShell>
      <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <Container className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={() => navigate('/admin')} className="text-sm font-semibold text-[#2563EB] hover:text-[#1E3A8A]">
              Voltar para o Painel Admin
            </button>
            <p className="mt-1 text-sm text-[#475569]">Sessao de {user?.nome}</p>
          </div>
          <Button variant="secondary" onClick={() => { logout(); navigate('/login'); }}>Sair</Button>
        </Container>
      </header>

      <PageHeader
        eyebrow="Voluntariado"
        title="Solicitacoes de novos voluntarios"
        description="Analise os pedidos recebidos e libere o acesso apenas para pessoas aprovadas."
      />

      <Section tone="white">
        <SectionHeader title="Aguardando analise" description="Confira especialidade, contato e justificativa antes de aprovar." />

        {feedback && (
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#2563EB]">
            {feedback}
          </div>
        )}
        {loading && <LoadingState title="Carregando solicitacoes..." />}
        {erro && <ErrorState title="Erro ao carregar solicitacoes" description={erro} />}
        {!loading && !erro && solicitacoes.length === 0 && (
          <EmptyState title="Nenhuma inscrição pendente no momento." description="Quando alguem solicitar cadastro como voluntario, o pedido aparecera aqui." />
        )}

        <div className="grid gap-4">
          {!loading && !erro && solicitacoes.map((solicitacao) => (
            <Card key={solicitacao.id} className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-[#0F172A]">{solicitacao.nome}</h3>
                    <Badge tone="warning">Aguardando analise</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-[#475569] md:grid-cols-2">
                    {solicitacao.usuario && <p><strong className="text-[#0F172A]">Contato:</strong> {solicitacao.usuario}</p>}
                    <p><strong className="text-[#0F172A]">Especialidade:</strong> {solicitacao.especialidade?.nome ?? 'Nao informada'}</p>
                  </div>
                  {solicitacao.motivoVoluntariado && (
                    <p className="mt-4 rounded-xl bg-[#F8FAFC] p-4 text-sm leading-6 text-[#475569]">
                      {solicitacao.motivoVoluntariado}
                    </p>
                  )}
                </div>
                <Button disabled={aprovandoId === solicitacao.id} onClick={() => aprovar(solicitacao.id)}>
                  {aprovandoId === solicitacao.id ? 'Aprovando...' : 'Aprovar voluntario'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}

export default AprovacaoVoluntarios;
