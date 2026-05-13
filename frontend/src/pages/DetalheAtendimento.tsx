import { useParams, useNavigate } from 'react-router-dom';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/useAuth';

function DetalheAtendimento() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <PageShell>
      <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <Container className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={() => navigate(-1)} className="text-sm font-semibold text-[#2563EB] hover:text-[#1E3A8A]">
              Voltar
            </button>
            <p className="mt-1 text-sm text-[#475569]">Sessao de {user?.nome}</p>
          </div>
          <Button variant="secondary" onClick={() => { logout(); navigate('/login'); }}>Sair</Button>
        </Container>
      </header>

      <PageHeader
        eyebrow="Atendimento"
        title={`Atendimento ${id ?? ''}`}
        description="Acompanhe status, responsavel e mensagens deste atendimento."
      />

      <Section tone="white">
        <Card className="mx-auto max-w-3xl p-8 text-center">
          <h2 className="text-2xl font-bold text-[#0F172A]">Detalhes em preparacao</h2>
          <p className="mt-3 text-[#475569]">
            As informacoes completas deste atendimento serao exibidas aqui.
          </p>
        </Card>
      </Section>
    </PageShell>
  );
}

export default DetalheAtendimento;
