import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ChartCard from '../components/ui/ChartCard';
import PageHeader from '../components/ui/PageHeader';
import SectionHeader from '../components/ui/SectionHeader';
import StatCard from '../components/ui/StatCard';
import { programImages } from '../config/programImages';

const visualImpactMetrics = [
  {
    label: 'Públicos prioritários',
    value: '2',
    description: 'Crianças, adolescentes e mulheres em situação de vulnerabilidade.',
    tone: 'blue' as const,
  },
  {
    label: 'Canais reunidos',
    value: '5',
    description: 'WhatsApp, e-mail, redes sociais, telefone e atendimento presencial.',
    tone: 'slate' as const,
  },
  {
    label: 'Tempo de triagem',
    value: '3m',
    description: 'Meta visual do MVP para transformar mensagem em atendimento.',
    tone: 'orange' as const,
  },
  {
    label: 'Histórico',
    value: '1',
    description: 'Um registro centralizado para cada pessoa acompanhada.',
    tone: 'blue' as const,
  },
];

const audiences = [
  {
    title: 'Crianças e adolescentes',
    image: programImages.dentistaDoBem,
    imageAlt: 'Adolescente sorrindo durante atendimento odontológico do programa Dentista do Bem',
    imageClassName: 'object-center',
    description:
      'Ajuda a organizar demandas odontológicas, responsáveis, escola, prioridade e histórico do atendimento em um único fluxo.',
    details: ['Dor ou urgência bucal', 'Acompanhamento com responsável', 'Registro por código protegido'],
  },
  {
    title: 'Mulheres do Programa Apolônia',
    image: programImages.apoloniasDoBem,
    imageAlt: 'Mulher sorrindo, representando acolhimento no programa Apolônias do Bem',
    imageClassName: 'object-[center_30%]',
    description:
      'Apoia casos sensíveis com codinome, controle de sigilo e direcionamento para voluntários autorizados.',
    details: ['Atendimento com sigilo', 'Priorização por risco', 'Histórico com acesso controlado'],
  },
];

const deliveryPhases = [
  {
    title: 'MVP',
    subtitle: 'Base do atendimento',
    status: 'Base funcional',
    tone: 'success' as const,
    description: 'Centraliza o relato, a triagem e o acompanhamento dos casos em um fluxo protegido.',
    deliveries: ['Portais por perfil', 'Fila de atendimentos', 'Agenda e cronograma'],
  },
  {
    title: 'Inteligência Operacional',
    subtitle: 'Decisões com contexto',
    status: 'Próxima evolução',
    tone: 'warning' as const,
    description: 'Transforma dados do atendimento em sinais claros para priorização e continuidade do cuidado.',
    deliveries: ['Indicadores de triagem', 'Alertas operacionais', 'Visão consolidada da jornada'],
  },
  {
    title: 'Expansão de Rede',
    subtitle: 'Mais alcance com governança',
    status: 'Visão futura',
    tone: 'info' as const,
    description: 'Prepara a plataforma para ampliar a rede de voluntários, unidades e canais de acolhimento.',
    deliveries: ['Novos núcleos de atendimento', 'Integrações de comunicação', 'Gestão ampliada de voluntários'],
  },
];

function Roadmap() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Solução"
        title="Como o TDB Responde ajuda na prática"
        description="Uma solução digital para reduzir dispersão, acelerar triagem e preservar contexto em atendimentos sociais sensíveis."
      />

      <Section tone="white" className="reveal">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <SectionHeader
              eyebrow="Impacto"
              title="Menos mensagens perdidas, mais continuidade no cuidado"
              description="O valor da solução não está em criar mais uma tela, mas em transformar canais separados em um fluxo operacional simples, visível e rastreável."
            />
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">Triagem centralizada</Badge>
              <Badge tone="info">Histórico unificado</Badge>
              <Badge tone="warning">Sigilo orientado</Badge>
              <Badge tone="success">Fluxo ativo</Badge>
            </div>
          </div>
          <ChartCard />
        </div>
      </Section>

      <Section tone="blue" className="reveal">
        <SectionHeader
          eyebrow="Por que ajuda"
          title="O problema deixa de ser invisível"
          description="Quando tudo fica em mensagens soltas, a equipe perde prioridade, contexto e continuidade. O TDB Responde organiza isso em uma operação única."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {visualImpactMetrics.map((metric) => (
            <StatCard key={metric.label} {...metric} />
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Indicadores visuais de demonstração do MVP. Eles representam o desenho da solução e não dados reais da ONG.
        </p>
      </Section>

      <Section tone="white" className="reveal">
        <SectionHeader
          eyebrow="Quem é atendido"
          title="Dois grupos precisam de resposta rápida e cuidadosa"
          description="A solução foi pensada para apoiar públicos com necessidades diferentes, mas com o mesmo desafio: atendimento que precisa de contexto, prioridade e acolhimento."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          {audiences.map((audience) => (
            <Card key={audience.title} className="overflow-hidden p-0">
              <img
                src={audience.image}
                alt={audience.imageAlt}
                loading="lazy"
                className={`h-52 w-full object-cover sm:h-60 ${audience.imageClassName}`}
              />
              <div className="p-6">
                <h3 className="text-2xl font-bold text-foreground">{audience.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{audience.description}</p>
                <div className="mt-5 grid gap-3">
                  {audience.details.map((detail) => (
                    <div key={detail} className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="blue" className="reveal">
        <SectionHeader
          eyebrow="Plano de evolução"
          title="Três fases conectam a base atual ao crescimento da rede"
          description="A evolução parte de um atendimento organizado, avança para decisões operacionais mais claras e prepara a ampliação responsável da rede."
        />
        <ol aria-label="Fases de entrega do TDB Responde" className="relative mx-auto max-w-5xl space-y-8 before:absolute before:bottom-6 before:left-6 before:top-6 before:w-px before:bg-primary/25 md:before:left-1/2">
          {deliveryPhases.map((phase, index) => (
            <li key={phase.title} className="relative pl-16 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
              <span className="absolute left-6 top-6 z-10 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border-4 border-blue-50 bg-primary text-sm font-black text-primary-foreground shadow-md md:left-1/2" aria-hidden="true">
                {index + 1}
              </span>
              <Card className={`p-6 md:p-7 ${index % 2 === 0 ? 'md:col-start-1' : 'md:col-start-2'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-primary">{phase.subtitle}</p>
                  <Badge tone={phase.tone}>{phase.status}</Badge>
                </div>
                <h3 className="mt-3 text-2xl font-bold text-foreground">{phase.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{phase.description}</p>
                <ul className="mt-5 space-y-3">
                  {phase.deliveries.map(delivery => (
                    <li key={delivery} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <svg className="mt-0.5 h-5 w-5 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" /></svg>
                      <span>{delivery}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="white" className="reveal">
        <Card className="flex flex-col gap-6 bg-gradient-to-br from-foreground to-primary p-8 text-primary-foreground md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Resultado esperado</p>
            <h2 className="mt-2 text-3xl font-black">Uma operação mais clara para quem cuida</h2>
            <p className="mt-3 max-w-2xl text-blue-100">
              A plataforma não substitui o acolhimento humano. Ela remove ruído operacional para que a equipe consiga responder melhor.
            </p>
          </div>
          <Button href="/cadastro-voluntario" variant="secondary" size="large">
            Quero ser voluntário
          </Button>
        </Card>
      </Section>
    </PageShell>
  );
}

export default Roadmap;
