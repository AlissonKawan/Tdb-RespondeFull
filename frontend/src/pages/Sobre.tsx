import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import SectionHeader from '../components/ui/SectionHeader';

const pillars = [
  'Atendimento organizado',
  'Historico preservado',
  'Priorizacao clara',
  'Sigilo em casos sensiveis',
  'Voluntarios por especialidade',
  'Acompanhamento pelo beneficiario',
];

const challenges = [
  ['Canais desconectados', 'WhatsApp, e-mail e redes sociais sem integracao geravam perda de mensagens e respostas duplicadas.'],
  ['Historico fragmentado', 'Voluntarios tinham dificuldade para acompanhar o contexto de cada atendimento.'],
  ['Prioridade pouco clara', 'Casos urgentes precisavam de uma triagem mais visual e objetiva.'],
  ['Captacao manual', 'Novos voluntarios precisavam de um fluxo simples para demonstrar interesse.'],
];

const solutions = [
  ['Atendimento centralizado', 'Todos os canais aparecem em uma unica operacao visual.'],
  ['Protocolo de sigilo', 'Casos sensiveis podem ser tratados com mais cuidado e controle.'],
  ['Painel operacional', 'Status, prioridades e responsaveis ficam visiveis para a equipe.'],
  ['Triagem por prioridade', 'Demandas sao classificadas para orientar a proxima resposta.'],
  ['Historico unificado', 'Mensagens e mudancas de status ficam registradas no fluxo.'],
  ['Captacao de voluntarios', 'Formulario publico registra candidatos para analise interna.'],
];

const flow = [
  ['1', 'Entrada do beneficiario', 'A demanda chega por canais como WhatsApp, e-mail, redes sociais ou atendimento presencial.'],
  ['2', 'Triagem inicial', 'A equipe registra dados, classifica prioridade e protege informacoes sensiveis.'],
  ['3', 'Atribuicao', 'O caso e direcionado ao voluntario adequado conforme disponibilidade e especialidade.'],
  ['4', 'Acompanhamento', 'Mensagens, status e historico permanecem em um fluxo unico.'],
  ['5', 'Encerramento', 'O atendimento e finalizado com contexto preservado para consultas futuras.'],
];

function Sobre() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Sobre o projeto"
        title="Uma plataforma para organizar atendimento social"
        description="O TDB Responde e um MVP desenvolvido para centralizar comunicacao, priorizar demandas e apoiar voluntarios da Turma do Bem com uma experiencia digital mais clara."
      />

      <Section tone="white">
        <Card className="p-8">
          <SectionHeader title="O que e o TDB Responde?" />
          <div className="grid gap-6 text-lg leading-8 text-[#475569] lg:grid-cols-2">
            <p>
              O sistema unifica atendimentos da ONG em uma plataforma digital, facilitando a comunicacao entre voluntarios e beneficiarios.
            </p>
            <p>
              A solucao atende criancas, adolescentes e mulheres em situacao de vulnerabilidade, preservando contexto, prioridade e sigilo quando necessario.
            </p>
          </div>
        </Card>
      </Section>

      <Section tone="blue">
        <SectionHeader
          eyebrow="Desafios"
          title="O problema que orientou o produto"
          description="A proposta nasce da necessidade de reduzir dispersao operacional e dar mais clareza ao atendimento."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {challenges.map(([title, desc], index) => (
            <Card key={title} className="p-6">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 font-bold text-[#2563EB] ring-1 ring-blue-100">
                {index + 1}
              </span>
              <h3 className="text-lg font-bold text-[#0F172A]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#475569]">{desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="white">
        <SectionHeader
          eyebrow="Solucao"
          title="Como o TDB Responde resolve"
          description="Funcionalidades pensadas para transformar mensagens dispersas em uma operacao acompanhavel."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {solutions.map(([title, desc], index) => (
            <Card key={title} className="p-6 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10">
              <Badge tone={index === 0 ? 'info' : 'neutral'}>{index === 0 ? 'Principal' : 'Modulo'}</Badge>
              <h3 className="mt-4 text-lg font-bold text-[#0F172A]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#475569]">{desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="blue">
        <SectionHeader title="Como funciona" align="center" />
        <div className="mx-auto max-w-4xl space-y-4">
          {flow.map(([step, title, desc]) => (
            <Card key={step} className="flex gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2563EB] text-lg font-black text-white shadow-lg shadow-blue-600/20">
                {step}
              </span>
              <div>
                <h3 className="font-bold text-[#0F172A]">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-[#475569]">{desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="white">
        <SectionHeader title="Pontos principais" align="center" />
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3">
          {pillars.map((item) => (
            <span key={item} className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-[#2563EB]">
              {item}
            </span>
          ))}
        </div>
      </Section>

      <Section tone="base">
        <Card className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Colaborar</p>
            <h2 className="mt-2 text-3xl font-bold text-[#0F172A]">Quer saber mais sobre o projeto?</h2>
            <p className="mt-2 text-[#475569]">Fale com a equipe ou conheca os integrantes.</p>
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
