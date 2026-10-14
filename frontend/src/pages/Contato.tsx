import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Field, Input, Textarea } from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import { contatoService } from '../services/contatoService';
import { ApiError } from '../services/apiClient';

interface FormData {
  nome: string;
  email: string;
  mensagem: string;
}

function Contato() {
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setEnviado(false);
    setErro('');
    setLoading(true);
    try {
      await contatoService.enviarMensagem(data);
      setEnviado(true);
      reset();
      window.setTimeout(() => setEnviado(false), 5000);
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      } else {
        setErro('Ocorreu um erro ao enviar sua mensagem. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Contato"
        title="Fale com a equipe"
        description="Envie uma mensagem para saber mais sobre o projeto, compartilhar dúvidas ou conversar sobre colaboração."
      />

      <Section tone="white" className="reveal">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <Card className="p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Turma do Bem</p>
              <h2 className="mt-3 text-2xl font-bold text-foreground">Canais de apoio</h2>
              <div className="mt-5 space-y-4 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
                  </span>
                  <div><p className="font-semibold text-foreground">Localização</p><p className="mt-1 text-sm leading-6">Rua Maurício Francisco Klabin, 449, Vila Mariana, São Paulo/SP</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M6.6 3h3l1.5 4-2 1.6a15.8 15.8 0 0 0 6.3 6.3l1.6-2 4 1.5v3A3.6 3.6 0 0 1 17.4 21 14.4 14.4 0 0 1 3 6.6 3.6 3.6 0 0 1 6.6 3Z"/></svg>
                  </span>
                  <div><p className="font-semibold text-foreground">Telefone</p><a className="mt-1 inline-block text-sm hover:text-primary hover:underline" href="tel:+551150847276">(11) 5084-7276</a></div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6"/></svg>
                  </span>
                  <div><p className="font-semibold text-foreground">E-mail</p><p className="mt-1 text-sm leading-6">A resposta será enviada ao endereço informado no formulário.</p></div>
                </div>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-foreground to-primary p-6 text-primary-foreground">
              <h3 className="text-xl font-bold">Resposta organizada</h3>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                A proposta do TDB Responde é transformar mensagens dispersas em um fluxo claro de acompanhamento.
              </p>
            </Card>
          </div>

          <Card className="p-6 lg:p-8">
            {enviado && (
              <div role="status" className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-success">
                Mensagem enviada com sucesso.
              </div>
            )}
            {erro && (
              <div role="alert" className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-danger">
                {erro}
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Field label="Nome" error={errors.nome?.message}>
                <Input autoComplete="name" {...register('nome', { required: 'Digite seu nome completo' })} placeholder="Seu nome" />
              </Field>
              <Field label="E-mail" error={errors.email?.message}>
                <Input
                  type="email"
                  autoComplete="email"
                  {...register('email', {
                    required: 'Digite um e-mail válido',
                    pattern: { value: /^\S+@\S+$/i, message: 'E-mail inválido' },
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
              <Button type="submit" isLoading={loading} loadingText="Enviando..." size="large" fullWidth>Enviar mensagem</Button>
            </form>
          </Card>
        </div>
      </Section>
    </PageShell>
  );
}

export default Contato;

