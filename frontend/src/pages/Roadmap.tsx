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
      'Ajuda a organizar demandas odontologicas, responsaveis, escola, prioridade e historico do atendimento em um unico fluxo.',
    details: ['Dor ou urgencia bucal', 'Acompanhamento com responsavel', 'Registro por codigo protegido'],
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
  ['Acompanhamento', 'Mensagens, status e historico ficam registrados para continuidade do cuidado.'],
];

function Roadmap() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Solucao"
        title="Como o TDB Responde ajuda na pratica"
        description="Uma solucao digital para reduzir dispersao, acelerar triagem e preservar contexto em atendimentos sociais sensiveis."
      />

      <Section tone="white">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <SectionHeader
              eyebrow="Impacto"
              title="Menos mensagens perdidas, mais continuidade no cuidado"
              description="O valor da solucao nao esta em criar mais uma tela, mas em transformar canais separados em um fluxo operacional simples, visivel e rastreavel."
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

      <Section tone="blue">
        <SectionHeader
          eyebrow="Por que ajuda"
          title="O problema deixa de ser invisivel"
          description="Quando tudo fica em mensagens soltas, a equipe perde prioridade, contexto e continuidade. O TDB Responde organiza isso em uma operacao unica."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {visualImpactMetrics.map((metric) => (
            <StatCard key={metric.label} {...metric} />
          ))}
        </div>
        <p className="mt-4 text-sm text-[#475569]">
          Indicadores visuais de demonstracao do MVP. Eles representam o desenho da solucao e nao dados reais da ONG.
        </p>
      </Section>

      <Section tone="white">
        <SectionHeader
          eyebrow="Quem e afetado"
          title="Dois grupos precisam de resposta rapida e cuidadosa"
          description="A solucao foi pensada para apoiar publicos com necessidades diferentes, mas com o mesmo desafio: atendimento que precisa de contexto, prioridade e acolhimento."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          {audiences.map((audience) => (
            <Card key={audience.title} className="p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-lg font-black text-[#2563EB] ring-1 ring-blue-100">
                {audience.title[0]}
              </div>
              <h3 className="text-2xl font-bold text-[#0F172A]">{audience.title}</h3>
              <p className="mt-3 leading-7 text-[#475569]">{audience.description}</p>
              <div className="mt-5 grid gap-3">
                {audience.details.map((detail) => (
                  <div key={detail} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#475569]">
                    {detail}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="blue">
        <SectionHeader
          eyebrow="Como funciona"
          title="Da primeira mensagem ate a resposta acompanhada"
          description="O fluxo simplifica o trabalho da equipe sem esconder o que importa: prioridade, responsavel, historico e status."
        />
        <div className="grid gap-4 lg:grid-cols-4">
          {helpFlow.map(([title, description], index) => (
            <Card key={title} className="relative overflow-hidden p-6">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2563EB] via-[#60A5FA] to-transparent" />
              <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2563EB] text-sm font-black text-white shadow-lg shadow-blue-600/20">
                {index + 1}
              </span>
              <h3 className="text-lg font-bold text-[#0F172A]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#475569]">{description}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="white">
        <Card className="flex flex-col gap-6 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] p-8 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Resultado esperado</p>
            <h2 className="mt-2 text-3xl font-black">Uma operacao mais clara para quem cuida</h2>
            <p className="mt-3 max-w-2xl text-blue-100">
              A plataforma nao substitui o acolhimento humano. Ela remove ruido operacional para que a equipe consiga responder melhor.
            </p>
          </div>
          <Button href="/quero-ser-voluntario" variant="secondary" size="large">
            Quero ser voluntario
          </Button>
        </Card>
      </Section>
    </PageShell>
  );
}

export default Roadmap;

