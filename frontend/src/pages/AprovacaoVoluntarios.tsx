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
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar as solicitações.');
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
      if (!user) throw new Error('Usuário logado não encontrado');
      await voluntariosService.aprovar(id, { aprovadorId: user.id });
      setFeedback('Solicitacao aprovada com sucesso.');
      await carregar();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível aprovar a solicitação.');
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
        title="Solicitações de novos voluntários"
        description="Analise os pedidos recebidos e libere o acesso apenas para pessoas aprovadas."
      />

      <Section tone="white">
        <SectionHeader title="Aguardando análise" description="Confira especialidade, contato e justificativa antes de aprovar." />

        {feedback && (
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#2563EB]">
            {feedback}
          </div>
        )}
        {loading && <LoadingState title="Carregando solicitações..." />}
        {erro && <ErrorState title="Erro ao carregar solicitações" description={erro} />}
        {!loading && !erro && solicitacoes.length === 0 && (
          <EmptyState title="Nenhuma inscrição pendente no momento." description="Quando alguém solicitar cadastro como voluntário, o pedido aparecerá aqui." />
        )}

        <div className="grid gap-4">
          {!loading && !erro && solicitacoes.map((solicitacao) => (
            <Card key={solicitacao.id} className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-[#0F172A]">{solicitacao.nome}</h3>
                    <Badge tone="warning">Aguardando análise</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-[#475569] md:grid-cols-2">
                    {solicitacao.usuario && <p><strong className="text-[#0F172A]">Contato:</strong> {solicitacao.usuario}</p>}
                    <p><strong className="text-[#0F172A]">Especialidade:</strong> {solicitacao.especialidade?.nome ?? 'Não informada'}</p>
                    {solicitacao.cro && (
                      <div className="flex flex-col gap-1">
                        <p>
                          <strong className="text-[#0F172A]">Registro Profissional (CRO):</strong> {solicitacao.cro} - {solicitacao.ufCro || 'N/A'}
                        </p>
                        {solicitacao.statusCro === 'VALIDADO' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit mt-1 border border-emerald-100">
                            <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                            Validado automaticamente pelo portal do governo
                          </span>
                        )}
                        {solicitacao.statusCro === 'FALHA_INTEGRACAO' && (
                          <span className="inline-flex items-start gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg w-fit mt-1 border border-amber-200 leading-normal max-w-lg">
                            <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <span>
                              <strong>Aviso do Robô:</strong> Não foi possível validar no portal do governo (CAPTCHA / instabilidade). Por favor, <strong>valide manualmente</strong> este registro.
                            </span>
                          </span>
                        )}
                        {solicitacao.statusCro === 'REJEITADO' && (
                          <span className="inline-flex items-start gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg w-fit mt-1 border border-rose-200 leading-normal max-w-lg">
                            <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <span>
                              <strong>Aviso do Robô:</strong> A verificação de registro indicou que este CRO é <strong>inválido ou inativo</strong> no portal do conselho.
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {solicitacao.motivoVoluntariado && (
                    <p className="mt-4 rounded-xl bg-[#F8FAFC] p-4 text-sm leading-6 text-[#475569]">
                      {solicitacao.motivoVoluntariado}
                    </p>
                  )}
                </div>
                <Button disabled={aprovandoId === solicitacao.id} onClick={() => aprovar(solicitacao.id)}>
                  {aprovandoId === solicitacao.id ? 'Aprovando...' : 'Aprovar voluntário'}
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
