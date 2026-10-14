import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import { useAuth } from '../context/useAuth';
import { ApiError } from '../services/apiClient';
import { getEspecialidades } from '../services/especialidadesService';
import type { EspecialidadeApi } from '../types/api';

interface FormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  especialidadeId: number;
  motivoVoluntariado: string;
  cro: string;
  ufCro: string;
}

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const ESPECIALIDADES_PADRAO: EspecialidadeApi[] = [
  { id: 1, nome: 'Clínica Geral' },
  { id: 2, nome: 'Ortodontia' },
  { id: 3, nome: 'Endodontia' },
  { id: 4, nome: 'Odontopediatria' },
  { id: 5, nome: 'Periodontia' },
  { id: 6, nome: 'Cirurgia Bucomaxilofacial' },
];

const ESPECIALIDADES_ODONTOLOGICAS = new Set([
  'odontologia',
  ...ESPECIALIDADES_PADRAO.map((especialidade) => especialidade.nome.toLowerCase()),
]);

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

function CadastroVoluntario() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codigoIndicacao = searchParams.get('ref') || undefined;
  const { register: registerAccount } = useAuth();
  const [especialidades, setEspecialidades] = useState<EspecialidadeApi[]>(ESPECIALIDADES_PADRAO);
  const [usandoEspecialidadesPadrao, setUsandoEspecialidadesPadrao] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();

  const senha = watch('senha');
  const especialidadeId = watch('especialidadeId');
  const selectedEspecialidade = especialidades.find((especialidade) => especialidade.id === Number(especialidadeId));
  const isOdontologia = selectedEspecialidade
    ? ESPECIALIDADES_ODONTOLOGICAS.has(selectedEspecialidade.nome.toLowerCase())
    : false;

  useEffect(() => {
    let active = true;

    getEspecialidades()
      .then((items) => {
        if (!active || items.length === 0) return;
        setEspecialidades(items);
        setUsandoEspecialidadesPadrao(false);
      })
      .catch(() => {
        // A lista local já está disponível para manter o formulário utilizável.
      });

    return () => {
      active = false;
    };
  }, []);

  const errorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 409) return 'Este e-mail já está cadastrado.';
      if (error.status === 400) return error.message || 'Confira os dados da solicitação.';
      if (error.status === 0) return 'Não foi possível conectar ao servidor.';
      return error.message;
    }
    return 'Não foi possível enviar a solicitação.';
  };

  const onSubmit = async (data: FormData) => {
    setErro('');
    setSucesso('');
    setLoading(true);

    try {
      const response = await registerAccount({
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        tipoUsuario: 'VOLUNTARIO',
        especialidadeId: data.especialidadeId,
        motivoVoluntariado: data.motivoVoluntariado,
        cro: data.cro,
        ufCro: data.ufCro,
        codigoIndicacao,
      });

      if (isOdontologia && response?.statusCro === 'VALIDADO') {
        setSucesso('Solicitação enviada! Seu CRO foi validado automaticamente. Agora, aguarde a aprovação para acessar o portal.');
      } else if (isOdontologia && response?.statusCro === 'FALHA_INTEGRACAO') {
        setSucesso('Solicitação enviada! Seu CRO seguirá para análise manual devido a uma indisponibilidade na validação automática.');
      } else {
        setSucesso('Solicitação enviada com sucesso. Aguarde a aprovação para acessar o portal.');
      }

      window.setTimeout(() => navigate('/login'), 6000);
    } catch (error) {
      setErro(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    {
      title: 'Atenda no seu consultório',
      description: 'Você acolhe cada paciente no ambiente profissional que já conhece.',
      icon: <path d="M4 20V8l8-4 8 4v12M8 20v-5h8v5M9 10h6M12 7v6" strokeLinecap="round" strokeLinejoin="round" />,
    },
    {
      title: 'Flexibilidade total',
      description: 'Sua agenda e sua disponibilidade orientam cada novo atendimento.',
      icon: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" /></>,
    },
    {
      title: 'Triagem antes do atendimento',
      description: 'Os casos chegam organizados para uma decisão clínica mais segura.',
      icon: <><path d="M7 4h10v16H7z" strokeLinejoin="round" /><path d="M9.5 9h5M9.5 13h5M9.5 17H12" strokeLinecap="round" /></>,
    },
  ];

  return (
    <PageShell className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="absolute inset-x-0 top-0 -z-0 h-80 bg-gradient-to-b from-blue-100/70 to-transparent" aria-hidden="true" />

        <div className="relative z-10 mx-auto grid max-w-7xl overflow-hidden rounded-[1.75rem] border border-blue-100 bg-white shadow-[0_30px_90px_-42px_rgba(15,23,42,0.42)] lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative min-h-[34rem] overflow-hidden bg-slate-950 lg:min-h-full">
            <img
              src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80"
              alt="Dentista acolhendo uma paciente durante atendimento odontológico"
              className="absolute inset-0 h-full w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-blue-950/25 via-blue-950/65 to-slate-950/95" aria-hidden="true" />

            <div className="relative flex h-full flex-col justify-end p-6 text-white sm:p-10 lg:p-12">
              <img src="/img/logo-header.png" alt="Turma do Bem" className="mb-auto h-14 w-auto self-start rounded-xl bg-white/95 px-3 py-2 object-contain shadow-sm" />

              <h1 className="mt-16 max-w-xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl">
                Devolva a dignidade através de um sorriso
              </h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-blue-50/90">
                Faça parte de uma rede que conecta cuidado odontológico, escuta e transformação social.
              </p>

              <div className="mt-8 grid gap-4">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-sky-200 ring-1 ring-white/20 backdrop-blur-sm">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        {benefit.icon}
                      </svg>
                    </span>
                    <div>
                      <h2 className="text-sm font-bold text-white">{benefit.title}</h2>
                      <p className="mt-0.5 text-sm leading-5 text-slate-300">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <figure className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                <p className="mb-2 text-[0.6875rem] font-bold text-sky-200">Relato ilustrativo da experiência voluntária</p>
                <blockquote className="text-sm leading-6 text-white">
                  “Cada atendimento me lembra que técnica e humanidade podem mudar uma história inteira.”
                </blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&q=80"
                    alt="Retrato ilustrativo de uma dentista voluntária"
                    className="h-11 w-11 rounded-full border-2 border-white/80 object-cover"
                    loading="lazy"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">Dentista da rede</p>
                    <p className="text-xs text-sky-200">CRO-SP • cadastro profissional validado</p>
                  </div>
                </figcaption>
              </figure>
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-12 xl:p-14">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8">
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-primary ring-1 ring-blue-100">
                  Cadastro de voluntário
                </span>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Comece sua jornada</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
                  Preencha seus dados. Sua solicitação será revisada antes da liberação do acesso ao portal.
                </p>
              </div>

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

                <Field
                  label="Especialidade"
                  hint={usandoEspecialidadesPadrao ? 'Lista essencial disponível enquanto sincronizamos as especialidades.' : undefined}
                  error={errors.especialidadeId?.message}
                >
                  <Select
                    defaultValue=""
                    {...register('especialidadeId', {
                      required: 'Selecione uma especialidade',
                      valueAsNumber: true,
                      validate: (value) => Number.isFinite(value) || 'Selecione uma especialidade',
                    })}
                  >
                    <option value="" disabled>Selecione uma especialidade</option>
                    {especialidades.map((especialidade) => (
                      <option key={especialidade.id} value={especialidade.id}>{especialidade.nome}</option>
                    ))}
                  </Select>
                </Field>

                {isOdontologia && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="CRO" error={errors.cro?.message}>
                      <Input {...register('cro', { required: 'Informe seu CRO' })} placeholder="Ex.: 12345" />
                    </Field>
                    <Field label="UF do CRO" error={errors.ufCro?.message}>
                      <Select defaultValue="" {...register('ufCro', { required: 'Selecione o estado do CRO' })}>
                        <option value="" disabled>Selecione a UF</option>
                        {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                      </Select>
                    </Field>
                  </div>
                )}

                <Field label="Por que você quer ser voluntário?" error={errors.motivoVoluntariado?.message}>
                  <Textarea
                    rows={4}
                    {...register('motivoVoluntariado', {
                      required: 'Conte seu motivo para ser voluntário',
                      minLength: { value: 20, message: 'Escreva pelo menos 20 caracteres' },
                    })}
                    placeholder="Conte um pouco sobre o que inspira você a fazer parte desta rede."
                  />
                </Field>

                <Button type="submit" disabled={loading} isLoading={loading} loadingText="Enviando solicitação..." size="large" fullWidth>
                  Enviar solicitação de voluntariado
                </Button>
                <p className="text-center text-xs leading-5 text-slate-500">
                  Seus dados profissionais são usados apenas na análise e na organização dos atendimentos.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

export default CadastroVoluntario;
