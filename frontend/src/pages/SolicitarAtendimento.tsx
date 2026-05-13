import { useNavigate } from 'react-router-dom';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/useAuth';

function SolicitarAtendimento() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <PageShell>
      <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <Container className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={() => navigate('/portal-beneficiario')} className="text-sm font-semibold text-[#2563EB] hover:text-[#1E3A8A]">
              Voltar para o portal
            </button>
            <p className="mt-1 text-sm text-[#475569]">Sessao de {user?.nome}</p>
          </div>
          <Button variant="secondary" onClick={() => { logout(); navigate('/login'); }}>Sair</Button>
        </Container>
      </header>

      <PageHeader
        eyebrow="Atendimento"
        title="Solicitar atendimento"
        description="Conte brevemente o que esta acontecendo para que a equipe possa orientar o proximo passo."
      />

      <Section tone="white">
        <Card className="mx-auto max-w-3xl p-8 text-center">
          <h2 className="text-2xl font-bold text-[#0F172A]">Solicitacao em preparacao</h2>
          <p className="mt-3 text-[#475569]">
            Este espaco esta reservado para o formulario de abertura de atendimento.
          </p>
          <Button className="mt-6" onClick={() => navigate('/portal-beneficiario')}>Voltar ao portal</Button>
        </Card>
      </Section>
    </PageShell>
  );
}

export default SolicitarAtendimento;
