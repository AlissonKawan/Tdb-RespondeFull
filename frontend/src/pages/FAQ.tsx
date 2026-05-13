import { useState } from 'react';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';

interface FAQItem {
  question: string;
  answer: string;
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'O que e o TDB Responde?',
      answer: 'E uma plataforma de atendimento centralizado para a Turma do Bem, reunindo canais, historico e prioridades em um unico fluxo.',
    },
    {
      question: 'Quem pode usar a plataforma?',
      answer: 'A solucao foi pensada para voluntarios, equipe administrativa e beneficiarios acompanharem atendimentos com mais clareza.',
    },
    {
      question: 'O projeto e gratuito?',
      answer: 'Sim. Este MVP foi desenvolvido como projeto academico da FIAP em parceria com a proposta social da Turma do Bem.',
    },
    {
      question: 'Os dados dos assistidos sao protegidos?',
      answer: 'O fluxo considera sigilo, codinomes e acesso restrito para casos sensiveis, especialmente no contexto do Programa Apolonia.',
    },
    {
      question: 'Preciso fazer login?',
      answer: 'Sim. Voluntarios acessam o painel administrativo e beneficiarios acompanham seus atendimentos por um portal protegido.',
    },
    {
      question: 'Como me tornar voluntario?',
      answer: 'Use a pagina Seja voluntario para registrar interesse. A equipe pode analisar a solicitacao no painel.',
    },
    {
      question: 'Quem desenvolveu o projeto?',
      answer: 'O projeto foi desenvolvido por Alisson Kawan, Marcos Vinicius e Eduardo Boni.',
    },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="FAQ"
        title="Perguntas frequentes"
        description="Respostas rapidas sobre funcionamento, acesso, seguranca e proposta do TDB Responde."
        align="center"
      />

      <Section tone="white">
        <div className="mx-auto max-w-4xl space-y-4">
          {faqs.map((faq, index) => (
            <Card key={faq.question} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-blue-50/50"
              >
                <span className="text-base font-bold text-[#0F172A]">{faq.question}</span>
                <span className={`text-2xl font-light text-[#2563EB] transition-transform ${openIndex === index ? 'rotate-45' : ''}`}>+</span>
              </button>
              {openIndex === index && (
                <div className="border-t border-[#E2E8F0] px-6 py-5 text-[#475569]">
                  {faq.answer}
                </div>
              )}
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="blue" className="border-t border-[#E2E8F0]">
        <div className="text-center">
          <p className="mb-4 text-[#475569]">Ainda tem duvidas?</p>
          <Button href="/contato" size="large">Entre em contato</Button>
        </div>
      </Section>
    </PageShell>
  );
}

export default FAQ;

