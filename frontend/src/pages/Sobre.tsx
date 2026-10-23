import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import SectionHeader from '../components/ui/SectionHeader';

const pillars = [
  'Atendimento organizado',
  'Histórico preservado',
  'Priorização clara',
  'Sigilo em casos sensíveis',
  'Voluntários por especialidade',
  'Acompanhamento pelo beneficiário',
];

const challenges = [
  ['Histórico fragmentado', 'Voluntários tinham dificuldade para acompanhar o contexto de cada atendimento.'],
  ['Prioridade pouco clara', 'Casos urgentes precisavam de uma triagem mais visual e objetiva.'],
  ['Captação manual', 'Novos voluntários precisavam de um fluxo simples para demonstrar interesse.'],
];

const solutions = [
  ['Protocolo de sigilo', 'Casos sensíveis podem ser tratados com mais cuidado e controle.'],
  ['Painel operacional', 'Status, prioridades e responsáveis ficam visíveis para a equipe.'],
  ['Triagem por prioridade', 'Demandas são classificadas para orientar a próxima resposta.'],
  ['Histórico do atendimento', 'Mensagens e mudanças de status ficam registradas na plataforma.'],
  ['Captação de voluntários', 'Formulário público registra candidatos para análise interna.'],
];

const flow = [
  ['1', 'Entrada do beneficiário', 'A demanda é registrada pelo beneficiário na plataforma.'],
  ['2', 'Triagem inicial', 'A equipe registra dados, classifica prioridade e protege informações sensíveis.'],
  ['3', 'Atribuição', 'O caso é direcionado ao voluntário adequado conforme disponibilidade e especialidade.'],
  ['4', 'Acompanhamento', 'Mensagens, status e histórico permanecem em um fluxo único.'],
  ['5', 'Encerramento', 'O atendimento é finalizado com contexto preservado para consultas futuras.'],
];

function Sobre() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Sobre o projeto"
        title="Uma plataforma para organizar atendimento social"
        description="O TDB Responde é uma plataforma digital para registrar e acompanhar solicitações, priorizar demandas e apoiar voluntários da Turma do Bem."
      />

      <Section tone="white" className="reveal">
        <Card className="p-8">
          <SectionHeader title="O que é o TDB Responde?" />
          <div className="grid gap-6 text-lg leading-8 text-muted-foreground lg:grid-cols-2">
            <p>
              O sistema reúne os atendimentos da ONG em uma plataforma digital, facilitando a comunicação entre voluntários e beneficiários.
            </p>
            <p>
              A solução atende crianças, adolescentes e mulheres em situação de vulnerabilidade, preservando contexto, prioridade e sigilo quando necessário.
            </p>
          </div>
        </Card>
      </Section>

      <Section tone="blue" className="reveal">
        <SectionHeader
          eyebrow="Desafios"
          title="O problema que orientou o produto"
          description="A proposta nasce da necessidade de reduzir dispersão operacional e dar mais clareza ao atendimento."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map(([title, desc], index) => (
            <Card key={title} className="p-6">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 font-bold text-primary ring-1 ring-primary/20">
                {index + 1}
              </span>
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="white" className="reveal">
        <SectionHeader
          eyebrow="Solução"
          title="Como o TDB Responde resolve"
          description="Funcionalidades pensadas para transformar mensagens dispersas em uma operação acompanhável."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {solutions.map(([title, desc], index) => (
            <Card key={title} className="p-6 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10">
              <Badge tone={index === 0 ? 'info' : 'neutral'}>{index === 0 ? 'Principal' : 'Módulo'}</Badge>
              <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="blue" className="reveal">
        <SectionHeader title="Como funciona" align="center" />
        <div className="mx-auto max-w-4xl space-y-4">
          {flow.map(([step, title, desc]) => (
            <Card key={step} className="flex gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-lg shadow-primary/20">
                {step}
              </span>
              <div>
                <h3 className="font-bold text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="white" className="reveal">
        <SectionHeader title="Pontos principais" align="center" />
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3">
          {pillars.map((item) => (
            <span key={item} className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              {item}
            </span>
          ))}
        </div>
      </Section>

      <Section tone="base" className="reveal">
        <Card className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Colaborar</p>
            <h2 className="mt-2 text-3xl font-bold text-foreground">Quer saber mais sobre o projeto?</h2>
            <p className="mt-2 text-muted-foreground">Fale com a equipe ou conheça os integrantes.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/contato" size="large">Fale conosco</Button>
            <Button href="/integrantes" variant="secondary" size="large">Ver equipe</Button>
          </div>
        </Card>
      </Section>
    </PageShell>
  );
}

export default Sobre;
