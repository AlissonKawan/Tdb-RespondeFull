import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import { Field, Input } from '../components/ui/Input';
import { ApiError } from '../services/apiClient';
import type { LoginRequest, TipoUsuario } from '../types/auth';
import { useAuth } from '../context/useAuth';

const portalPorTipo: Record<TipoUsuario, string> = {
  ADMIN: '/admin',
  VOLUNTARIO: '/portal-voluntario',
  BENEFICIARIO: '/portal-beneficiario',
};

const beneficios = [
  'Acompanhe atendimentos em um só lugar',
  'Converse com sua rede de cuidado',
  'Acesse seu portal com segurança',
];

function Login() {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();

  if (user) return <Navigate to={portalPorTipo[user.tipoUsuario]} replace />;

  const errorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      const normalizedMessage = error.message.toLowerCase();
      if (
        normalizedMessage.includes('inativa') ||
        normalizedMessage.includes('inativo') ||
        normalizedMessage.includes('pendente') ||
        normalizedMessage.includes('aprov')
      ) {
        return 'Sua solicitação ainda está em análise. Aguarde a aprovação para acessar o portal.';
      }
      if (error.status === 404) return 'Conta não encontrada.';
      if (error.status === 401) return 'E-mail ou senha inválidos.';
      if (error.status === 403) return 'Sua solicitação ainda está em análise. Aguarde a aprovação para acessar o portal.';
      if (error.status === 0) return 'Não foi possível conectar ao servidor.';
      return error.message;
    }
    return 'Não foi possível entrar. Tente novamente.';
  };

  const onSubmit = async (data: LoginRequest) => {
    setErro('');
    setLoading(true);
    try {
      const loggedUser = await login(data);

      if (!loggedUser.ativo) {
        logout();
        setErro('Sua solicitação ainda está em análise. Aguarde a aprovação para acessar o portal.');
        return;
      }

      navigate(portalPorTipo[loggedUser.tipoUsuario], { replace: true });
    } catch (error) {
      setErro(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell className="relative min-h-dvh overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-36 top-1/4 h-80 w-80 rounded-full bg-blue-200/45 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-cyan-100/70 blur-3xl" />
      </div>

      <main className="relative mx-auto grid min-h-dvh w-full max-w-7xl items-stretch lg:grid-cols-[1.05fr_0.95fr]">
        <section className="order-2 flex flex-col justify-between px-6 py-10 sm:px-10 lg:order-1 lg:px-16 lg:py-12">
          <Link
            to="/"
            className="hidden w-fit rounded-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 lg:block"
            aria-label="Ir para a página inicial"
          >
            <img
              src="/img/logo-header.png"
              alt="TDB Responde"
              className="h-auto w-40 sm:w-48"
              width="192"
              height="192"
            />
          </Link>

          <div className="max-w-xl py-10 lg:py-16">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Turma do Bem</p>
            <h1 className="mt-4 text-pretty text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Cuidado que aproxima pessoas.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-muted-foreground">
              Entre para acompanhar sua jornada, organizar atendimentos e manter cada conversa importante por perto.
            </p>

            <ul className="mt-8 space-y-4" aria-label="Benefícios da plataforma">
              {beneficios.map((beneficio) => (
                <li key={beneficio} className="flex items-center gap-3 text-sm font-semibold text-foreground sm:text-base">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-primary" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2.5">
                      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {beneficio}
                </li>
              ))}
            </ul>
          </div>

          <p className="hidden text-sm text-muted-foreground lg:block">Unificando atendimentos que fazem o bem.</p>
        </section>

        <section className="order-1 flex items-center border-b border-border/70 bg-white/80 px-6 py-8 backdrop-blur-sm sm:px-10 lg:order-2 lg:border-b-0 lg:border-l lg:px-16 lg:py-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-4 flex justify-end">
              <Link
                to="/"
                className="inline-flex min-h-11 items-center gap-2 rounded-ui px-3 text-sm font-semibold text-primary transition-colors duration-fast hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Voltar para a página inicial
              </Link>
            </div>
            <Link
              to="/"
              className="mx-auto mb-6 block w-fit rounded-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 lg:hidden"
              aria-label="Ir para a página inicial"
            >
              <img
                src="/img/logo-header.png"
                alt="TDB Responde"
                className="h-auto w-32"
                width="128"
                height="128"
              />
            </Link>
            <div className="rounded-[1.25rem] border border-border bg-surface p-6 shadow-xl shadow-blue-950/[0.07] sm:p-8">
              <div>
                <p className="text-sm font-semibold text-primary">Acesso à plataforma</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">Que bom ter você aqui</h2>
                <p className="mt-3 leading-7 text-muted-foreground">
                  Use seu e-mail e senha. Nós identificamos seu perfil automaticamente.
                </p>
              </div>

              {erro && (
                <div className="mt-6 rounded-ui border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700" role="alert" aria-live="assertive">
                  {erro}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5" noValidate>
                <Field label="E-mail" error={errors.email?.message}>
                  <Input
                    type="email"
                    {...register('email', {
                      required: 'Digite seu e-mail',
                      pattern: { value: /^\S+@\S+$/i, message: 'E-mail inválido' },
                    })}
                    placeholder="voce@email.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </Field>

                <div>
                  <label htmlFor="login-senha" className="mb-1.5 block text-sm font-semibold text-foreground">Senha</label>
                  <div className="relative">
                    <Input
                      id="login-senha"
                      type={mostrarSenha ? 'text' : 'password'}
                      {...register('senha', {
                        required: 'Digite sua senha',
                        minLength: { value: 6, message: 'Senha mínima de 6 caracteres' },
                      })}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      className="pr-14"
                      aria-invalid={errors.senha ? true : undefined}
                      aria-describedby={errors.senha ? 'login-senha-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((visivel) => !visivel)}
                      className="absolute inset-y-0 right-0 flex min-w-12 cursor-pointer items-center justify-center rounded-r-ui text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                      aria-pressed={mostrarSenha}
                    >
                      {mostrarSenha ? (
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5 9 5a16.7 16.7 0 0 1-2.1 2.6M6.6 6.6C4.4 8.1 3 10 3 10s3.5 5 9 5c1 0 2-.2 2.8-.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="2.5" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.senha && <p id="login-senha-error" role="alert" className="mt-1.5 text-sm font-medium text-danger">{errors.senha.message}</p>}
                </div>

                <div className="flex justify-end">
                  <Link to="/contato" className="rounded-sm text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    Esqueceu sua senha?
                  </Link>
                </div>

                <Button type="submit" size="large" fullWidth isLoading={loading} loadingText="Entrando...">
                  Entrar
                </Button>
              </form>

              <div className="mt-7 border-t border-border pt-6">
                <p className="text-center text-sm text-muted-foreground">Ainda não tem acesso?</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Button href="/cadastro-beneficiario" variant="secondary" fullWidth>
                    Sou beneficiário
                  </Button>
                  <Button href="/quero-ser-voluntario" variant="ghost" fullWidth className="border border-transparent">
                    Quero ser voluntário
                  </Button>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
              Ao entrar, você acessa somente as informações vinculadas ao seu perfil.
            </p>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

export default Login;
