import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { useAuth } from '../context/useAuth';
import { ApiError } from '../services/apiClient';

interface FormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

const BENEFITS = [
  {
    title: 'Acompanhe seus atendimentos',
    icon: <><path d="M5 4h14v16H5z" /><path d="M9 4V2m6 2V2M8 9h8m-8 4h5" strokeLinecap="round" /></>,
  },
  {
    title: 'Converse com seu dentista',
    icon: <path d="M5 5h14v11H9l-4 4V5Z" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    title: 'Cuidado odontológico com acolhimento',
    icon: <path d="M12 20S4.5 15.7 4.5 9.8A4.3 4.3 0 0 1 12 6.9a4.3 4.3 0 0 1 7.5 2.9C19.5 15.7 12 20 12 20Z" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 6 9 6a16 16 0 0 1-2.1 2.8M6.6 6.6C4.3 8.1 3 10 3 10s3.5 6 9 6a9.6 9.6 0 0 0 3.4-.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function CadastroBeneficiario() {
  const navigate = useNavigate();
  const { register: registerAccount } = useAuth();
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();
  const senha = watch('senha');

  const errorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 409) return 'Este e-mail já está cadastrado.';
      if (error.status === 400) return error.message || 'Confira os dados do cadastro.';
      if (error.status === 0) return 'Não foi possível conectar ao servidor.';
      return error.message;
    }
    return 'Não foi possível criar o cadastro.';
  };

  const onSubmit = async (data: FormData) => {
    setErro('');
    setSucesso('');
    setLoading(true);
    try {
      await registerAccount({
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        tipoUsuario: 'BENEFICIARIO',
      });
      setSucesso('Cadastro criado com sucesso. Agora você pode entrar e acompanhar seus atendimentos.');
      window.setTimeout(() => navigate('/login'), 2200);
    } catch (error) {
      setErro(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell className="min-h-screen bg-slate-50">
      <main className="relative overflow-hidden px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-blue-100/70 to-transparent" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-6xl items-stretch gap-8 lg:grid-cols-12">
          <section className="order-1 rounded-3xl border border-blue-100 bg-white p-5 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.38)] sm:p-8 lg:order-2 lg:col-span-7 lg:p-10" aria-labelledby="cadastro-beneficiario-titulo">
            <div className="mx-auto flex h-full max-w-2xl flex-col justify-center">
              <header className="mb-8">
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-primary ring-1 ring-blue-100">
                  Cadastro de beneficiário
                </span>
                <h1 id="cadastro-beneficiario-titulo" className="mt-4 max-w-xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                  Comece sua jornada para um novo sorriso
                </h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
                  Crie sua conta para acompanhar seus atendimentos e conversar com o dentista responsável.
                </p>
              </header>

              {sucesso && (
                <div role="status" className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-800">
                  {sucesso}
                </div>
              )}
              {erro && (
                <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Nome completo" error={errors.nome?.message}>
                    <Input autoComplete="name" {...register('nome', { required: 'Informe seu nome completo' })} placeholder="Maria Silva" />
                  </Field>
                  <Field label="E-mail" error={errors.email?.message}>
                    <Input
                      type="email"
                      autoComplete="email"
                      {...register('email', {
                        required: 'Informe seu e-mail',
                        pattern: { value: /^\S+@\S+$/i, message: 'Informe um e-mail válido' },
                      })}
                      placeholder="maria@email.com"
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Senha" error={errors.senha?.message}>
                    <div className="relative">
                      <Input
                        type={mostrarSenha ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="pr-12"
                        {...register('senha', {
                          required: 'Informe uma senha',
                          minLength: { value: 6, message: 'Use pelo menos 6 caracteres' },
                        })}
                        placeholder="Mínimo de 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha((visible) => !visible)}
                        aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-pressed={mostrarSenha}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-ui text-slate-500 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                      >
                        <EyeIcon hidden={mostrarSenha} />
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirmar senha" error={errors.confirmarSenha?.message}>
                    <div className="relative">
                      <Input
                        type={mostrarConfirmacao ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="pr-12"
                        {...register('confirmarSenha', {
                          required: 'Confirme sua senha',
                          validate: (value) => value === senha || 'As senhas precisam ser iguais',
                        })}
                        placeholder="Repita sua senha"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarConfirmacao((visible) => !visible)}
                        aria-label={mostrarConfirmacao ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                        aria-pressed={mostrarConfirmacao}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-ui text-slate-500 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                      >
                        <EyeIcon hidden={mostrarConfirmacao} />
                      </button>
                    </div>
                  </Field>
                </div>

                <Button type="submit" disabled={loading} isLoading={loading} loadingText="Criando cadastro..." size="large" fullWidth>
                  Criar conta de beneficiário
                </Button>
              </form>
            </div>
          </section>

          <aside className="order-2 relative min-h-[420px] overflow-hidden rounded-3xl bg-slate-950 shadow-2xl lg:order-1 lg:col-span-5 lg:min-h-[650px]">
            <img
              src="/img/cadastro-beneficiario.jpg"
              alt="Beneficiária sorrindo após receber atendimento odontológico"
              width="1024"
              height="1024"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/5 via-slate-950/35 to-slate-950/95" aria-hidden="true" />

            <div className="relative flex min-h-[420px] flex-col justify-end p-6 text-white sm:p-8 lg:min-h-[650px] lg:p-10">
              <h2 className="max-w-md text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                Seu sorriso merece cuidado. Sua história merece atenção.
              </h2>

              <ul className="mt-7 grid gap-3.5" aria-label="Benefícios do portal do beneficiário">
                {BENEFITS.map((benefit) => (
                  <li key={benefit.title} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-cyan-100 ring-1 ring-white/20 backdrop-blur-sm">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        {benefit.icon}
                      </svg>
                    </span>
                    <span className="text-sm font-bold leading-5 text-white">{benefit.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}

export default CadastroBeneficiario;
