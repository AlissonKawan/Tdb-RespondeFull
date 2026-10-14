import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ChartCard from '../components/ui/ChartCard';
import PageHeader from '../components/ui/PageHeader';
import SectionHeader from '../components/ui/SectionHeader';
import StatCard from '../components/ui/StatCard';

const visualImpactMetrics = [
  {
    label: 'Publicos prioritarios',
    value: '2',
    description: 'Criancas/adolescentes e mulheres em situacao de vulnerabilidade.',
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
    label: 'Historico',
    value: '1',
    description: 'Um registro centralizado para cada pessoa acompanhada.',
    tone: 'blue' as const,
  },
];

const audiences = [
  {
    title: 'Criancas e adolescentes',
    description:
      'Ajuda a organizar demandas odontológicas, responsáveis, escola, prioridade e histórico do atendimento em um único fluxo.',
    details: ['Dor ou urgência bucal', 'Acompanhamento com responsável', 'Registro por código protegido'],
  },
  {
    title: 'Mulheres do Programa Apolonia',
    description:
      'Apoia casos sensiveis com codinome, controle de sigilo e direcionamento para voluntarios autorizados.',
    details: ['Atendimento com sigilo', 'Priorizacao por risco', 'Historico com acesso controlado'],
  },
];

const helpFlow = [
  ['Entrada', 'A demanda chega por um canal da ONG e deixa de ficar perdida em conversas separadas.'],
  ['Triagem', 'A equipe classifica tipo, prioridade, canal, contexto e necessidade de sigilo.'],
  ['Encaminhamento', 'O atendimento e direcionado a um voluntario disponivel e com especialidade adequada.'],
  ['Acompanhamento', 'Mensagens, status e histórico ficam registrados para continuidade do cuidado.'],
];

function Roadmap() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Solução"
        title="Como o TDB Responde ajuda na pratica"
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
              <Badge tone="info">Historico unificado</Badge>
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
          title="O problema deixa de ser invisivel"
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
          eyebrow="Quem e afetado"
          title="Dois grupos precisam de resposta rapida e cuidadosa"
          description="A solução foi pensada para apoiar públicos com necessidades diferentes, mas com o mesmo desafio: atendimento que precisa de contexto, prioridade e acolhimento."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          {audiences.map((audience) => (
            <Card key={audience.title} className="p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-black text-primary ring-1 ring-primary/20">
                {audience.title[0]}
              </div>
              <h3 className="text-2xl font-bold text-foreground">{audience.title}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">{audience.description}</p>
              <div className="mt-5 grid gap-3">
                {audience.details.map((detail) => (
                  <div key={detail} className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
                    {detail}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="blue" className="reveal">
        <SectionHeader
          eyebrow="Como funciona"
          title="Da primeira mensagem ate a resposta acompanhada"
          description="O fluxo simplifica o trabalho da equipe sem esconder o que importa: prioridade, responsável, histórico e status."
        />
        <div className="grid gap-4 lg:grid-cols-4">
          {helpFlow.map(([title, description], index) => (
            <Card key={title} className="relative overflow-hidden p-6">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-transparent" />
              <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/20">
                {index + 1}
              </span>
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </Card>
          ))}
        </div>
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
            Quero ser voluntario
          </Button>
        </Card>
      </Section>
    </PageShell>
  );
}

export default Roadmap;
