import { useEffect, useState, type ReactNode } from 'react';
import Button from '../components/ui/Button';
import Container from '../components/ui/Container';
import FeatureCard from '../components/ui/FeatureCard';
import HeroDashboardCard from '../components/ui/HeroDashboardCard';

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      {children}
    </svg>
  );
}

const featureIcons = {
  agile: (
    <Icon>
      <path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),
  care: (
    <Icon>
      <path d="M12 21s-7-4.4-9.3-9A5.5 5.5 0 0 1 12 6.2 5.5 5.5 0 0 1 21.3 12C19 16.6 12 21 12 21Z" strokeLinecap="round" strokeLinejoin="round" />
    </Icon>
  ),
  connected: (
    <Icon>
      <path d="M8 12h8M7 7h.01M17 17h.01" strokeLinecap="round" />
      <path d="M7 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </Icon>
  ),
  organized: (
    <Icon>
      <path d="M4 19V5M8 19V9M12 19V7M16 19v-5M20 19V4" strokeLinecap="round" />
    </Icon>
  ),
};

const features = [
  {
    icon: featureIcons.agile,
    title: 'Mais agil',
    description: 'Atendimentos reunidos em um fluxo unico para reduzir espera e perda de contexto.',
    tone: 'blue' as const,
  },
  {
    icon: featureIcons.care,
    title: 'Mais acolhedor',
    description: 'Historico e mensagens organizadas para que cada pessoa seja atendida com cuidado.',
    tone: 'sky' as const,
  },
  {
    icon: featureIcons.connected,
    title: 'Canais integrados',
    description: 'WhatsApp, e-mail e redes sociais aparecem como uma operacao centralizada.',
    tone: 'orange' as const,
  },
  {
    icon: featureIcons.organized,
    title: 'Gestao clara',
    description: 'Status, prioridades e voluntarios ficam visiveis para orientar a proxima acao.',
    tone: 'slate' as const,
  },
];

function Home() {
  const [visitas, setVisitas] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const totalSalvo = localStorage.getItem('tdb_visitas');
      const contagemAtual = totalSalvo ? parseInt(totalSalvo, 10) : 0;
      const novaContagem = contagemAtual + 1;
      localStorage.setItem('tdb_visitas', novaContagem.toString());
      setVisitas(novaContagem);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-[#E2E8F0] bg-[linear-gradient(135deg,#F8FAFC_0%,#EFF6FF_48%,#FFFFFF_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.06)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.32),transparent_65%)]" />

        <Container className="relative grid max-w-7xl gap-10 py-16 lg:grid-cols-[1.04fr_0.86fr] lg:items-center">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-blue-100 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#2563EB] shadow-sm backdrop-blur">
              Visitas a plataforma: {visitas}
            </span>

            <h1 className="mt-6 text-4xl font-black tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
              Atendimento social com{' '}
              <span className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#60A5FA] bg-clip-text text-transparent">
                inteligencia operacional
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#475569]">
              O TDB Responde centraliza conversas, prioridades e historico para ajudar voluntarios
              a responder com mais velocidade, clareza e acolhimento.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/login" size="large">Acessar sistema</Button>
              <Button href="/quero-ser-voluntario" variant="secondary" size="large">Quero ser voluntario</Button>
              <Button href="/sobre" variant="ghost" size="large">Conhecer projeto</Button>
            </div>
          </div>

          <HeroDashboardCard />
        </Container>
      </section>

      <section className="border-b border-[#E2E8F0] bg-white py-16">
        <Container className="max-w-7xl">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Beneficios</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0F172A] sm:text-4xl">Por que TDB Responde?</h2>
            <p className="mt-3 text-base leading-7 text-[#475569]">
              Uma camada simples e profissional para transformar mensagens dispersas em atendimento acompanhavel.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                destaque={index === 0}
                tone={feature.tone}
              />
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-[#E2E8F0] bg-gradient-to-b from-[#F8FAFC] to-blue-50/60 py-16">
        <Container className="grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Missao</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">Tecnologia para acolher melhor</h2>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <p className="text-lg leading-8 text-[#475569]">
              Transformar o atendimento da <strong className="text-[#0F172A]">Turma do Bem</strong> em uma
              experiencia mais rapida, eficiente e humana, unindo organizacao operacional e empatia em um unico sistema.
            </p>
            <p className="mt-4 font-bold text-[#2563EB]">
              Tudo isso para servir melhor quem mais precisa.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-white py-16">
        <Container className="flex max-w-7xl flex-col gap-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] p-6 shadow-xl shadow-blue-950/15 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Proximo passo</p>
            <h2 className="mt-2 text-3xl font-bold text-white">Pronto para comecar?</h2>
            <p className="mt-3 max-w-2xl text-blue-100">
              Acesse o sistema, conheca o projeto ou fale com a equipe para entender como o TDB Responde organiza o atendimento.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/login" size="large">Entrar</Button>
            <Button href="/contato" variant="secondary" size="large">Fale conosco</Button>
          </div>
        </Container>
      </section>
    </div>
  );
}

export default Home;
