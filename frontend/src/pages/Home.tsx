import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
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
  organized: (
    <Icon>
      <path d="M4 19V5M8 19V9M12 19V7M16 19v-5M20 19V4" strokeLinecap="round" />
    </Icon>
  ),
};

const features = [
  {
    icon: featureIcons.agile,
    title: 'Mais ágil',
    description: 'Pedidos organizados por prioridade para reduzir a espera e orientar a equipe.',
    tone: 'blue' as const,
  },
  {
    icon: featureIcons.care,
    title: 'Mais acolhedor',
    description: 'Histórico e mensagens organizadas para que cada pessoa seja atendida com cuidado.',
    tone: 'sky' as const,
  },
  {
    icon: featureIcons.organized,
    title: 'Gestão clara',
    description: 'Status, prioridades e voluntários ficam visíveis para orientar a próxima ação.',
    tone: 'slate' as const,
  },
];

function Home() {
  return (
    <div>
      <section className="relative isolate overflow-hidden border-b border-border bg-gradient-to-br from-white via-blue-50/70 to-sky-100/70">
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(37,99,235,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.055)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute -right-36 top-8 -z-10 h-80 w-80 rounded-full bg-sky-300/30 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="absolute -left-36 bottom-0 -z-10 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />

        <Container className="relative max-w-7xl py-10 sm:py-14 lg:py-16">
          <HeroDashboardCard />

          <div className="mt-14 grid min-w-0 gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-16">
            <div>
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200/80 bg-white/90 px-3 py-2 text-sm font-semibold leading-5 text-blue-900 shadow-sm backdrop-blur sm:px-4">
                <svg className="h-4 w-4 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 20.5S4 16.1 4 9.7A4.2 4.2 0 0 1 11.5 7a.7.7 0 0 0 1 0A4.2 4.2 0 0 1 20 9.7c0 6.4-8 10.8-8 10.8Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.8 11.8c.7 1.5 1.8 2.2 3.2 2.2s2.5-.7 3.2-2.2" strokeLinecap="round" />
                </svg>
                <span>Rede de Solidariedade Odontológica <span aria-hidden="true">•</span> Turma do Bem</span>
              </span>

              <h1 className="mt-7 text-balance text-[2.5rem] font-black leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[3.65rem]">
                Cada pedido de ajuda merece chegar a quem pode cuidar.
              </h1>
            </div>

            <div className="lg:pb-1">
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                O TDB Responde organiza a triagem, protege cada história e aproxima pessoas em
                situação de vulnerabilidade de dentistas voluntários da Turma do Bem.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button href="/login" size="large" className="w-full shadow-lg shadow-blue-600/20 sm:w-auto">
                  Acessar Plataforma
                </Button>
                <Button href="/quero-ser-voluntario" variant="secondary" size="large" className="w-full border-blue-200 bg-white/90 text-blue-950 sm:w-auto">
                  Seja um Dentista Voluntário
                </Button>
              </div>

              <Link
                to="/sobre"
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md py-2 font-semibold text-primary underline-offset-4 transition-colors hover:text-blue-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Conheça a Turma do Bem
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-surface py-16">
        <Container className="max-w-7xl">
          <div className="mb-8 max-w-2xl reveal">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Benefícios</p>
            <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">Por que TDB Responde?</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Uma camada simples e profissional para transformar mensagens dispersas em atendimento acompanhável.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div key={feature.title} className="reveal">
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  destaque={index === 0}
                  tone={feature.tone}
                />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-gradient-to-b from-background to-primary/5 py-16">
        <Container className="grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative reveal">
            <img
              src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80"
              alt="Profissional realizando atendimento odontológico humanizado"
              loading="lazy"
              className="h-[380px] w-full rounded-3xl object-cover shadow-2xl"
            />
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-lg backdrop-blur-md sm:right-auto sm:max-w-sm">
              <p className="text-sm font-bold leading-6 text-blue-950">
                Tecnologia a serviço de quem mais precisa <span className="text-primary" aria-hidden="true">•</span> +90.000 atendimentos realizados
              </p>
            </div>
          </div>

          <div className="reveal">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Missão</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">Tecnologia para acolher melhor</h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Transformar o atendimento da <strong className="text-foreground">Turma do Bem</strong> em uma
              experiência mais rápida, eficiente e humana, unindo organização operacional e empatia em um único sistema.
            </p>
            <blockquote className="mt-7 border-l-4 border-primary bg-white/70 py-3 pl-5 pr-4 text-xl font-bold leading-8 text-blue-950">
              “Tudo isso para servir melhor a quem mais precisa.”
            </blockquote>
          </div>
        </Container>
      </section>

      <section className="bg-surface py-16">
        <Container className="flex max-w-7xl flex-col gap-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-foreground to-primary p-6 shadow-xl shadow-primary/15 md:flex-row md:items-center md:justify-between reveal">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Próximo passo</p>
            <h2 className="mt-2 text-3xl font-bold text-primary-foreground">Pronto para começar?</h2>
            <p className="mt-3 max-w-2xl text-blue-100">
              Acesse o sistema, conheça o projeto ou fale com a equipe para entender como o TDB Responde organiza o atendimento.
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
