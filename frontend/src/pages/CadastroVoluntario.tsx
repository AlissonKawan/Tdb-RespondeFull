import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ErrorState, LoadingState } from '../components/ui/FeedbackState';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import SectionHeader from '../components/ui/SectionHeader';
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
}

function CadastroVoluntario() {
  const navigate = useNavigate();
  const { register: registerAccount } = useAuth();
  const [especialidades, setEspecialidades] = useState<EspecialidadeApi[]>([]);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true);
  const [erroEspecialidades, setErroEspecialidades] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();

  const senha = watch('senha');

  useEffect(() => {
    let active = true;
    getEspecialidades()
      .then((items) => {
        if (!active) return;
        setEspecialidades(items);
        setErroEspecialidades('');
      })
      .catch((error) => {
        if (!active) return;
        setErroEspecialidades(error instanceof Error ? error.message : 'Erro ao carregar especialidades.');
      })
      .finally(() => {
        if (active) setLoadingEspecialidades(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const errorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 409) return 'Este e-mail ja esta cadastrado.';
      if (error.status === 400) return error.message || 'Confira os dados da solicitacao.';
      if (error.status === 0) return 'Nao foi possivel conectar ao servidor.';
      return error.message;
    }
    return 'Nao foi possivel enviar a solicitacao.';
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
        tipoUsuario: 'VOLUNTARIO',
        especialidadeId: data.especialidadeId,
        motivoVoluntariado: data.motivoVoluntariado,
      });

      setSucesso('Solicitacao enviada com sucesso. Aguarde a aprovacao de um voluntario responsavel para acessar o portal.');
      window.setTimeout(() => navigate('/login'), 3500);
    } catch (error) {
      setErro(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Voluntariado"
        title="Solicitar cadastro como voluntario"
        description="Envie sua solicitacao para analise. O acesso ao portal so sera liberado apos aprovacao."
      />

      <Section tone="white">
        <SectionHeader
          eyebrow="Como funciona"
          title="Sua conta nasce pendente"
          description="Sua solicitacao sera analisada por um voluntario responsavel. Depois da aprovacao, o login sera liberado."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {[
            ['1', 'Solicite cadastro', 'Preencha seus dados, especialidade e motivo para participar.'],
            ['2', 'Aguarde aprovacao', 'Um responsavel avalia a solicitacao antes de liberar acesso.'],
            ['3', 'Acesse o portal', 'Depois de aprovado, entre com e-mail e senha para acompanhar atendimentos.'],
          ].map(([step, title, desc]) => (
            <Card key={step} className="p-6">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 font-bold text-[#2563EB] ring-1 ring-blue-100">
                {step}
              </span>
              <h3 className="font-bold text-[#0F172A]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#475569]">{desc}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section tone="blue">
        <Card className="mx-auto max-w-3xl p-6 lg:p-8">
          {loadingEspecialidades && <LoadingState title="Carregando especialidades..." />}
          {erroEspecialidades && <ErrorState title="Erro ao carregar especialidades" description={erroEspecialidades} />}
          {sucesso && (
            <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-[#059669]">
              {sucesso}
            </div>
          )}
          {erro && (
            <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5">
            <Field label="Nome completo" error={errors.nome?.message}>
              <Input {...register('nome', { required: 'Nome obrigatorio' })} placeholder="Maria Silva" />
            </Field>
            <Field label="E-mail" error={errors.email?.message}>
              <Input
                type="email"
                {...register('email', {
                  required: 'E-mail obrigatorio',
                  pattern: { value: /^\S+@\S+$/i, message: 'E-mail invalido' },
                })}
                placeholder="maria@email.com"
              />
            </Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Senha" error={errors.senha?.message}>
                <Input
                  type="password"
                  {...register('senha', {
                    required: 'Senha obrigatoria',
                    minLength: { value: 6, message: 'Senha minima de 6 caracteres' },
                  })}
                  placeholder="Minimo 6 caracteres"
                />
              </Field>
              <Field label="Confirmar senha" error={errors.confirmarSenha?.message}>
                <Input
                  type="password"
                  {...register('confirmarSenha', {
                    required: 'Confirme sua senha',
                    validate: (value) => value === senha || 'As senhas precisam ser iguais',
                  })}
                  placeholder="Repita sua senha"
                />
              </Field>
            </div>
            <Field label="Especialidade" error={errors.especialidadeId?.message}>
              <Select
                disabled={loadingEspecialidades || Boolean(erroEspecialidades)}
                defaultValue=""
                {...register('especialidadeId', {
                  required: 'Selecione uma especialidade',
                  valueAsNumber: true,
                  validate: (value) => Number.isFinite(value) || 'Selecione uma especialidade',
                })}
              >
                <option value="" disabled>Selecione uma especialidade</option>
                {especialidades.map((especialidade) => (
                  <option key={especialidade.id} value={especialidade.id}>
                    {especialidade.nome}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Motivo do voluntariado" error={errors.motivoVoluntariado?.message}>
              <Textarea
                rows={5}
                {...register('motivoVoluntariado', {
                  required: 'Conte seu motivo para ser voluntario',
                  minLength: { value: 20, message: 'Minimo 20 caracteres' },
                })}
                placeholder="Quero contribuir com atendimento odontologico para pessoas que precisam."
              />
            </Field>
            <Button type="submit" disabled={loading || loadingEspecialidades || Boolean(erroEspecialidades)} size="large" fullWidth>
              {loading ? 'Enviando solicitacao...' : 'Enviar solicitacao de voluntariado'}
            </Button>
          </form>
        </Card>
      </Section>
    </PageShell>
  );
}

export default CadastroVoluntario;
