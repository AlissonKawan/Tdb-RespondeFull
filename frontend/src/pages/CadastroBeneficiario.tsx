import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Field, Input } from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/useAuth';
import { ApiError } from '../services/apiClient';

interface FormData {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

function CadastroBeneficiario() {
  const navigate = useNavigate();
  const { register: registerAccount } = useAuth();
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();
  const senha = watch('senha');

  const errorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 409) return 'Este e-mail ja esta cadastrado.';
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
      setSucesso('Cadastro criado com sucesso. Agora voce pode entrar e acompanhar seus atendimentos.');
      window.setTimeout(() => navigate('/login'), 2200);
    } catch (error) {
      setErro(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Beneficiario"
        title="Criar conta de beneficiario"
        description="Use esta conta para acompanhar seus atendimentos e conversar com o dentista responsavel."
      />

      <Section tone="white">
        <Card className="mx-auto max-w-3xl p-6 lg:p-8">
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
            <Button type="submit" disabled={loading} size="large" fullWidth>
              {loading ? 'Criando cadastro...' : 'Criar conta de beneficiario'}
            </Button>
          </form>
        </Card>
      </Section>
    </PageShell>
  );
}

export default CadastroBeneficiario;
