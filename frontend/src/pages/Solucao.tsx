import PageShell from '../components/layout/PageShell';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';
import './Solucao.css';

const steps = [
  { title: 'Um pedido ganha atenção', description: 'A solicitação entra na fila de atendimentos para que a equipe conheça a necessidade e organize o próximo passo.' },
  { title: 'A conversa ganha contexto', description: 'As mensagens do chat ficam vinculadas ao atendimento. O dentista pode retomar a conversa sem depender de mensagens soltas.' },
  { title: 'O cuidado tem continuidade', description: 'O histórico do atendimento ajuda a equipe a acompanhar o que já aconteceu e o que ainda precisa de atenção.' },
];

export default function Solucao() {
  return (
    <PageShell className="solucao-page">
      <section className="solucao-hero relative isolate flex items-center overflow-hidden bg-slate-900 text-white" aria-labelledby="apolonias-title">
        <img src="/img/solucao-apolonias.webp" alt="" width="1672" height="941" fetchPriority="high" className="solucao-photo absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="solucao-shade absolute inset-0 -z-10" />
        <Container className="w-full py-16 sm:py-20">
          <div className="max-w-xl">
            <p className="mb-6 inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-purple-100">Apolônias do Bem</p>
            <h1 id="apolonias-title" className="text-pretty text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Todo pedido de ajuda merece acolhimento.</h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-slate-100">Para mulheres que viveram situações de violência, reconstruir o sorriso também faz parte de recomeçar.</p>
            <p className="mt-4 max-w-md leading-7 text-slate-200">O TDB Responde ajuda a organizar o pedido e o acompanhamento, apoiando o trabalho de quem acolhe.</p>
            <div className="mt-8"><Button href="#cuidado-organizado" size="large">Conheça o caminho de um pedido</Button></div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-purple-100" aria-label="Princípios do acolhimento">
              <span>Escuta com respeito</span><span>Cuidado humano</span><span>Continuidade</span>
            </div>
          </div>
          <a href="#criancas-jovens" className="mt-10 inline-flex min-h-11 items-center gap-3 text-sm text-white underline decoration-white/40 underline-offset-4">Conheça também quem está crescendo <span aria-hidden="true">↓</span></a>
        </Container>
      </section>

      <section id="criancas-jovens" className="solucao-youth relative isolate flex items-center overflow-hidden bg-blue-50" aria-labelledby="jovens-title">
        <img src="/img/solucao-jovens.webp" alt="" width="1672" height="941" loading="lazy" decoding="async" className="solucao-photo absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="solucao-youth-shade absolute inset-0 -z-10" />
        <Container className="w-full py-20 sm:py-28">
          <div className="max-w-lg">
            <p className="mb-5 font-semibold text-primary">Crianças e adolescentes · Dentista do Bem</p>
            <h2 id="jovens-title" className="text-pretty text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Um sorriso pode abrir novos caminhos.</h2>
            <p className="mt-6 max-w-md text-lg leading-8 text-slate-700">Saúde bucal é também autoestima, convivência e confiança para crescer.</p>
            <p className="mt-4 max-w-md leading-7 text-slate-600">Cada pedido precisa de atenção. A plataforma reúne informações do atendimento e ajuda a equipe a acompanhar crianças, adolescentes e seus responsáveis ao longo dessa jornada.</p>
            <div className="mt-8"><Button href="#cuidado-organizado" variant="secondary" size="large">Veja como o cuidado se conecta</Button></div>
          </div>
        </Container>
      </section>

      <section id="cuidado-organizado" className="bg-surface py-20 sm:py-28" aria-labelledby="dentistas-title">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <div>
              <p className="mb-5 font-semibold text-primary">Para dentistas e equipes voluntárias</p>
              <h2 id="dentistas-title" className="text-pretty text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Menos mensagens perdidas. Mais espaço para acolher.</h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">Por trás de cada conversa, existe alguém esperando cuidado. O TDB Responde organiza solicitações, mensagens e histórico para ajudar quem dedica seu tempo a transformar sorrisos.</p>
              <p className="mt-5 leading-7 text-muted-foreground">Assim, o dentista encontra o contexto do atendimento e a equipe pode dedicar mais atenção às pessoas.</p>
              <div className="mt-8"><Button to="/cadastro-voluntario" size="large">Quero fazer parte dessa rede</Button></div>
            </div>
            <ol aria-label="Caminho de um pedido" className="space-y-0 rounded-3xl border border-blue-100 bg-blue-50/50 p-6 sm:p-8">
              {steps.map((step, index) => (
                <li key={step.title} className="relative flex gap-5 pb-9 last:pb-0">
                  {index < steps.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-5 top-11 w-px bg-blue-200" />}
                  <span aria-hidden="true" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">{index + 1}</span>
                  <div className="pt-1"><h3 className="text-lg font-bold">{step.title}</h3><p className="mt-2 leading-7 text-muted-foreground">{step.description}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-16 border-t border-border pt-8 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <p className="max-w-xl text-lg font-medium">A tecnologia organiza. O acolhimento continua sendo humano.</p>
            <p className="mt-4 text-xs leading-5 text-muted-foreground sm:mt-0 sm:max-w-xs">Imagens ilustrativas geradas por IA. Não representam pessoas atendidas pelos programas.</p>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
