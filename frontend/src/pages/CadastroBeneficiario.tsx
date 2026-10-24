import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Input';
import { useConfirm } from '../hooks/useConfirm';
import type { RegisterRequest } from '../types/auth';
import { useAuth } from '../context/useAuth';
import { ApiError } from '../services/apiClient';

interface FormData {
  nome: string;
  email: string;
  telefone: string;
  telefoneOpcional: string;
  idade: string;
  nomeResponsavel: string;
  escola: string;
  senha: string;
  confirmarSenha: string;
  usuario: string;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;

  const areaCode = digits.slice(0, 2);
  const subscriber = digits.slice(2);
  if (subscriber.length <= 4) return `(${areaCode}) ${subscriber}`;

  const prefixLength = subscriber.length <= 8 ? 4 : 5;
  return `(${areaCode}) ${subscriber.slice(0, prefixLength)}-${subscriber.slice(prefixLength)}`;
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
  const [apolonia, setApolonia] = useState(false);
  const [identificacao, setIdentificacao] = useState('');
  const { confirm, confirmDialog } = useConfirm();
  const { register, handleSubmit, watch, setValue, unregister, clearErrors, formState: { errors } } = useForm<FormData>({ shouldUnregister: true });
  const senha = watch('senha');

  const errorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 409) return apolonia ? 'Este usuário ou e-mail já está cadastrado.' : 'Este e-mail já está cadastrado.';
      if (error.status === 400) return error.message || 'Confira os dados do cadastro.';
      if (error.status === 0) return 'Não foi possível conectar ao servidor.';
      return error.message;
    }
    return 'Não foi possível criar o cadastro.';
  };

  const salvar = async (payload: RegisterRequest) => {
    setErro('');
    setSucesso('');
    setLoading(true);
    try {
      const conta = await registerAccount(payload);
      setSucesso(apolonia
        ? `Conta criada. Seu usuário é ${payload.usuario}. Você será apresentada como ${conta.nome}. Guarde seu usuário e sua senha em um local seguro.`
        : 'Cadastro criado com sucesso. Agora você pode entrar e acompanhar seus atendimentos.');
    } catch (error) {
      setErro(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: FormData) => {
    if (loading || confirmDialog) return;
    if (apolonia && !identificacao) {
      setErro('Escolha como deseja se apresentar.');
      return;
    }
    const payload: RegisterRequest = {
      nome: apolonia && identificacao === 'GERADO' ? '' : data.nome.trim(),
      email: data.email?.trim() || '',
      senha: data.senha,
      tipoUsuario: 'BENEFICIARIO',
  ...(apolonia ? {
        tipoBeneficiario: 'MULHER_APOLONIA' as const,
        usuario: data.usuario.trim().toLowerCase(),
        modoIdentificacao: identificacao as RegisterRequest['modoIdentificacao'],
        ...(data.telefoneOpcional?.trim() ? { telefone: formatPhone(data.telefoneOpcional.trim()) } : {}),
      } : {
        tipoBeneficiario: 'CRIANCA_ADOLESCENTE' as const,
        telefone: formatPhone(data.telefone.trim()),
        idade: Number(data.idade),
        nomeResponsavel: data.nomeResponsavel.trim(),
        escola: data.escola.trim(),
      }),
    };
    confirm({
      title: 'Criar sua conta',
      message: 'Confirma a criação da conta com estas escolhas?',
      confirmText: 'Confirmar cadastro',
      details: apolonia ? [
        { label: 'Programa', value: 'Apolônias do Bem' },
        { label: 'Como você será apresentada', value: identificacao === 'GERADO' ? 'Nome gerado pelo sistema' : payload.nome },
        { label: 'Acesso', value: payload.usuario! },
        { label: 'Telefone informado', value: payload.telefone || 'Não informado (opcional)' },
        { label: 'E-mail informado', value: payload.email || 'Nenhum. Acompanhe pela aplicação.' },
      ] : [
        { label: 'Programa', value: 'Criança e Adolescente (Dentista do Bem)' },
        { label: 'Pessoa atendida', value: `${payload.nome} (${payload.idade} anos)` },
        { label: 'Responsável', value: payload.nomeResponsavel! },
        { label: 'Escola', value: payload.escola! },
        { label: 'Contato', value: `${payload.telefone} / ${payload.email}` },
      ],
      onConfirm: () => { void salvar(payload); },
    });
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
                <Field label="Programa de atendimento">
                  <Select value={apolonia ? 'apolonia' : 'geral'} onChange={event => {
                    const isApolonia = event.target.value === 'apolonia';
                    setApolonia(isApolonia); setIdentificacao(''); setErro('');
                    setValue('nome', ''); setValue('email', '');
                    setValue('telefone', ''); setValue('idade', '');
                    setValue('nomeResponsavel', ''); setValue('escola', '');
                    unregister('telefone'); unregister('idade');
                    unregister('nomeResponsavel'); unregister('escola');
                    clearErrors();
                  }}>
                    <option value="geral">Criança e Adolescente (Dentista do Bem)</option>
                    <option value="apolonia">Apolônias do Bem</option>
                  </Select>
                </Field>
                {apolonia && (
                  <div className="space-y-4 rounded-ui border border-rose-200 bg-rose-50/60 p-4">
                    <p className="text-sm text-foreground">Você escolhe como se apresentar. O nome escolhido será usado no portal e poderá ser visto pela equipe de voluntários na fila de atendimento. Informe apenas o que for seguro compartilhar.</p>
                    <Field label="Como deseja se apresentar?">
                      <Select value={identificacao} onChange={event => { setIdentificacao(event.target.value); setValue('nome', ''); }}>
                        <option value="">Escolha uma opção</option>
                        <option value="NOME">Quero usar meu nome</option>
                        <option value="CODINOME">Quero escolher um codinome</option>
                        <option value="GERADO">Prefiro um nome gerado pelo sistema</option>
                      </Select>
                    </Field>
                    <Field label="Nome de usuário" hint="Use de 3 a 40 letras, números, pontos, traços ou sublinhados. Não precisa ser seu nome real." error={errors.usuario?.message}>
                      <Input autoComplete="username" autoCapitalize="none" maxLength={40} {...register('usuario', {
                        required: apolonia ? 'Escolha um nome de usuário' : false,
                        pattern: { value: /^[A-Za-z0-9._-]{3,40}$/, message: 'Use de 3 a 40 caracteres: letras, números, ponto, traço ou sublinhado.' },
                      })} />
                    </Field>
                    <p className="text-sm text-muted-foreground">O preenchimento do telefone não é obrigatório. O e-mail também é opcional e não autoriza contato externo. Sem e-mail, entre com seu usuário para acompanhar as respostas. A recuperação de senha ainda não está disponível; guarde suas credenciais com cuidado.</p>
                  </div>
                )}
                <div className="grid gap-5 sm:grid-cols-2">
                  {(!apolonia || (identificacao && identificacao !== 'GERADO')) && <Field label={apolonia && identificacao === 'CODINOME' ? 'Codinome' : 'Nome completo'} error={errors.nome?.message}>
                    <Input maxLength={apolonia ? 50 : 120} autoComplete={apolonia ? 'off' : 'name'} {...register('nome', { required: !apolonia || identificacao !== 'GERADO' ? 'Informe o nome ou codinome escolhido' : false })} />
                  </Field>}
                  {apolonia && (
                    <Field label="Telefone (opcional)" hint="Não é obrigatório preencher">
                      <Input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        maxLength={15}
                        placeholder="(11) 99999-9999"
                        {...register('telefoneOpcional', {
                          required: false,
                          onChange: (event) => {
                            event.target.value = formatPhone(event.target.value);
                          },
                        })}
                      />
                    </Field>
                  )}
                  <Field label={apolonia ? 'E-mail (opcional)' : 'E-mail'} error={errors.email?.message}>
                    <Input
                      type="email"
                      autoComplete="email"
                      {...register('email', {
                        required: apolonia ? false : 'Informe seu e-mail',
                        pattern: { value: /^\S+@\S+$/i, message: 'Informe um e-mail válido' },
                      })}
                      placeholder="maria@email.com"
                    />
                  </Field>
                </div>

                {!apolonia && (
                  <div className="space-y-4 rounded-ui border border-blue-100 bg-blue-50/50 p-4">
                    <p className="text-sm font-medium text-slate-700">
                      Configure já os dados da criança ou adolescente. Assim, ao precisar de atendimento, você só precisará relatar o que está acontecendo.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Telefone do responsável" hint="Telefone de contato do pai, mãe ou responsável legal" error={errors.telefone?.message}>
                        <Input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          maxLength={15}
                          placeholder="(11) 99999-9999"
                          {...register('telefone', {
                            required: !apolonia ? 'Informe o telefone do responsável para contato' : false,
                            onChange: (event) => {
                              event.target.value = formatPhone(event.target.value);
                            },
                          })}
                        />
                      </Field>
                      <Field label="Idade" error={errors.idade?.message}>
                        <Input
                          type="number"
                          min={0}
                          max={17}
                          placeholder="Ex.: 12"
                          {...register('idade', {
                            required: !apolonia ? 'Informe a idade da criança ou adolescente' : false,
                            validate: (value) => {
                              if (apolonia) return true;
                              const num = Number(value);
                              if (Number.isNaN(num) || num < 0 || num > 17) return 'A idade deve estar entre 0 e 17 anos';
                              return true;
                            },
                          })}
                        />
                      </Field>
                      <Field label="Nome do responsável" error={errors.nomeResponsavel?.message}>
                        <Input
                          placeholder="Nome de quem acompanha"
                          {...register('nomeResponsavel', {
                            required: !apolonia ? 'Informe o nome do responsável' : false,
                          })}
                        />
                      </Field>
                      <Field label="Escola" error={errors.escola?.message}>
                        <Input
                          placeholder="Nome da escola"
                          {...register('escola', {
                            required: !apolonia ? 'Informe a escola' : false,
                          })}
                        />
                      </Field>
                    </div>
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cadastro-senha" className="mb-1.5 block text-sm font-semibold text-foreground">Senha</label>
                    <div className="relative">
                      <Input
                        id="cadastro-senha"
                        aria-invalid={Boolean(errors.senha)}
                        aria-describedby={errors.senha ? 'cadastro-senha-erro' : undefined}
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
                    {errors.senha && <p id="cadastro-senha-erro" role="alert" className="mt-1.5 text-sm text-danger">{errors.senha.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="cadastro-confirmar-senha" className="mb-1.5 block text-sm font-semibold text-foreground">Confirmar senha</label>
                    <div className="relative">
                      <Input
                        id="cadastro-confirmar-senha"
                        aria-invalid={Boolean(errors.confirmarSenha)}
                        aria-describedby={errors.confirmarSenha ? 'cadastro-confirmar-senha-erro' : undefined}
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
                    {errors.confirmarSenha && <p id="cadastro-confirmar-senha-erro" role="alert" className="mt-1.5 text-sm text-danger">{errors.confirmarSenha.message}</p>}
                  </div>
                </div>

                <Button type="submit" disabled={loading || Boolean(confirmDialog) || Boolean(sucesso)} isLoading={loading} loadingText="Criando cadastro..." size="large" fullWidth>
                  Criar conta de beneficiário
                </Button>
                {sucesso && <Button type="button" onClick={() => navigate('/login')} fullWidth>Entrar na minha conta</Button>}
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
      {confirmDialog}
    </PageShell>
  );
}

export default CadastroBeneficiario;
