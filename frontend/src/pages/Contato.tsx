import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Field, Input, Textarea } from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';

interface FormData {
  nome: string;
  email: string;
  mensagem: string;
}

function Contato() {
  const [enviado, setEnviado] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>();

  const onSubmit = () => {
    setEnviado(true);
    reset();
    window.setTimeout(() => setEnviado(false), 3000);
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Contato"
        title="Fale com a equipe"
        description="Envie uma mensagem para saber mais sobre o projeto, compartilhar duvidas ou conversar sobre colaboracao."
      />

      <Section tone="white">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <Card className="p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Turma do Bem</p>
              <h2 className="mt-3 text-2xl font-bold text-[#0F172A]">Canais de apoio</h2>
              <div className="mt-5 space-y-3 text-[#475569]">
                <p>Rua Mauricio Francisco Klabin 449, Vila Mariana, Sao Paulo/SP</p>
                <p>(11) 5084-7276</p>
                <p>Atendimento e colaboracao via equipe do projeto.</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] p-6 text-white">
              <h3 className="text-xl font-bold">Resposta organizada</h3>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                A proposta do TDB Responde e transformar mensagens dispersas em um fluxo claro de acompanhamento.
              </p>
            </Card>
          </div>

          <Card className="p-6 lg:p-8">
            {enviado && (
              <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-[#059669]">
                Mensagem enviada com sucesso.
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Field label="Nome" error={errors.nome?.message}>
                <Input {...register('nome', { required: 'Digite seu nome completo' })} placeholder="Seu nome" />
              </Field>
              <Field label="E-mail" error={errors.email?.message}>
                <Input
                  type="email"
                  {...register('email', {
                    required: 'Digite um e-mail valido',
                    pattern: { value: /^\S+@\S+$/i, message: 'E-mail invalido' },
                  })}
                  placeholder="seu@email.com"
                />
              </Field>
              <Field label="Mensagem" error={errors.mensagem?.message}>
                <Textarea
                  rows={5}
                  {...register('mensagem', { required: 'Digite sua mensagem' })}
                  placeholder="Como podemos ajudar?"
                />
              </Field>
              <Button type="submit" size="large" fullWidth>Enviar mensagem</Button>
            </form>
          </Card>
        </div>
      </Section>
    </PageShell>
  );
}

export default Contato;

