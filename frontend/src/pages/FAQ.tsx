import { useId, useState } from 'react';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';

type FAQCategory = 'Plataforma' | 'Privacidade' | 'Participação';
type FAQFilter = 'Todas' | FAQCategory;

interface FAQItem {
  category: FAQCategory;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Plataforma',
    question: 'O que é o TDB Responde?',
    answer: 'É uma plataforma de atendimento centralizado para a Turma do Bem, reunindo canais, histórico e prioridades em um único fluxo.',
  },
  {
    category: 'Plataforma',
    question: 'Quem pode usar a plataforma?',
    answer: 'A solução foi pensada para voluntários, equipe administrativa e beneficiários acompanharem atendimentos com mais clareza.',
  },
  {
    category: 'Participação',
    question: 'O projeto é gratuito?',
    answer: 'Sim. Este MVP foi desenvolvido como projeto acadêmico da FIAP em parceria com a proposta social da Turma do Bem.',
  },
  {
    category: 'Privacidade',
    question: 'Os dados das pessoas assistidas são protegidos?',
    answer: 'O fluxo considera sigilo, codinomes e acesso restrito para casos sensíveis, especialmente no contexto do Programa Apolônia.',
  },
  {
    category: 'Privacidade',
    question: 'Preciso fazer login?',
    answer: 'Sim. Voluntários e beneficiários acessam áreas protegidas de acordo com as responsabilidades de cada perfil.',
  },
  {
    category: 'Participação',
    question: 'Como me tornar voluntário?',
    answer: 'Use a página Seja voluntário para registrar seu interesse. A equipe poderá analisar a solicitação no painel administrativo.',
  },
  {
    category: 'Participação',
    question: 'Quem desenvolveu o projeto?',
    answer: 'O projeto foi desenvolvido por Alisson Kawan, Marcos Vinícius e Eduardo Boni.',
  },
];

const filters: FAQFilter[] = ['Todas', 'Plataforma', 'Privacidade', 'Participação'];

function FAQ() {
  const [openQuestion, setOpenQuestion] = useState<string | null>(faqs[0].question);
  const [activeFilter, setActiveFilter] = useState<FAQFilter>('Todas');
  const accordionId = useId();
  const visibleFaqs = activeFilter === 'Todas' ? faqs : faqs.filter(faq => faq.category === activeFilter);

  const selectFilter = (filter: FAQFilter) => {
    setActiveFilter(filter);
    const firstVisibleQuestion = filter === 'Todas' ? faqs[0]?.question : faqs.find(faq => faq.category === filter)?.question;
    setOpenQuestion(firstVisibleQuestion ?? null);
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="FAQ"
        title="Perguntas frequentes"
        description="Respostas rápidas sobre funcionamento, acesso, segurança e proposta do TDB Responde."
        align="center"
      />

      <Section tone="white" className="reveal">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-wrap justify-center gap-2" aria-label="Filtrar perguntas por categoria">
            {filters.map(filter => (
              <Button
                key={filter}
                type="button"
                size="sm"
                variant={activeFilter === filter ? 'primary' : 'secondary'}
                aria-pressed={activeFilter === filter}
                onClick={() => selectFilter(filter)}
              >
                {filter}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {visibleFaqs.map((faq) => {
              const isOpen = openQuestion === faq.question;
              const itemIndex = faqs.indexOf(faq);
              return (
                <Card key={faq.question} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenQuestion(isOpen ? null : faq.question)}
                    aria-expanded={isOpen}
                    aria-controls={`${accordionId}-panel-${itemIndex}`}
                    id={`${accordionId}-trigger-${itemIndex}`}
                    className="flex min-h-14 w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-fast hover:bg-blue-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <span>
                      <span className="block text-xs font-semibold text-primary">{faq.category}</span>
                      <span className="mt-1 block text-base font-bold text-foreground">{faq.question}</span>
                    </span>
                    <svg
                      className={`h-5 w-5 shrink-0 text-primary transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div
                      id={`${accordionId}-panel-${itemIndex}`}
                      role="region"
                      aria-labelledby={`${accordionId}-trigger-${itemIndex}`}
                      className="border-t border-border px-6 py-5 leading-7 text-muted-foreground"
                    >
                      {faq.answer}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </Section>

      <Section tone="blue" className="border-t border-border reveal">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">Ainda tem dúvidas?</p>
          <Button href="/contato" size="large">Entre em contato</Button>
        </div>
      </Section>
    </PageShell>
  );
}

export default FAQ;
