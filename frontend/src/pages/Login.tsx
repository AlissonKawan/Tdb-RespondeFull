import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Field, Input } from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import { ApiError } from '../services/apiClient';
import type { LoginRequest } from '../types/auth';
import { useAuth } from '../context/useAuth';

type LoginAba = 'BENEFICIARIO' | 'VOLUNTARIO';

function Login() {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const [aba, setAba] = useState<LoginAba>('BENEFICIARIO');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();

  if (user) {
    if (user.tipoUsuario === 'VOLUNTARIO') return <Navigate to="/portal-voluntario" replace />;
    if (user.tipoUsuario === 'BENEFICIARIO') return <Navigate to="/portal-beneficiario" replace />;
    return <Navigate to="/voluntarios/pendentes" replace />;
  }

  const errorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      const normalizedMessage = error.message.toLowerCase();
      if (
        normalizedMessage.includes('inativa') ||
        normalizedMessage.includes('inativo') ||
        normalizedMessage.includes('pendente') ||
        normalizedMessage.includes('aprov')
      ) {
        return 'Sua solicitacao ainda esta em analise. Aguarde a aprovacao para acessar o portal.';
      }
      if (error.status === 404) return 'Conta nao encontrada.';
      if (error.status === 401) return 'Senha incorreta.';
      if (error.status === 403) return 'Sua solicitacao ainda esta em analise. Aguarde a aprovacao para acessar o portal.';
      if (error.status === 0) return 'Nao foi possivel conectar ao servidor.';
      return error.message;
    }
    return 'Nao foi possivel entrar. Tente novamente.';
  };

  const onSubmit = async (data: LoginRequest) => {
    setErro('');
    setLoading(true);
    try {
      const loggedUser = await login(data);
      if (loggedUser.tipoUsuario !== aba && loggedUser.tipoUsuario !== 'ADMIN') {
        logout();
        setErro(`Esta conta nao pertence ao acesso de ${aba === 'BENEFICIARIO' ? 'beneficiario' : 'voluntario'}. Selecione a aba correta para entrar.`);
        return;
      }

      if (!loggedUser.ativo) {
        logout();
        setErro('Sua solicitacao ainda esta em analise. Aguarde a aprovacao para acessar o portal.');
        return;
      }

      if (loggedUser.tipoUsuario === 'VOLUNTARIO') navigate('/portal-voluntario');
      else if (loggedUser.tipoUsuario === 'BENEFICIARIO') navigate('/portal-beneficiario');
      else navigate('/voluntarios/pendentes');
    } catch (error) {
      setErro(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Acesso"
        title="Entrar no sistema"
        description="Escolha seu tipo de acesso e entre com seu e-mail e senha."
      />

      <Section tone="white">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-6 lg:p-8">
            {erro && (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {erro}
              </div>
            )}
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-1">
              <button
                type="button"
                onClick={() => setAba('BENEFICIARIO')}
                className={`rounded-xl px-3 py-3 text-sm font-bold transition ${
                  aba === 'BENEFICIARIO' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                Beneficiario
              </button>
              <button
                type="button"
                onClick={() => setAba('VOLUNTARIO')}
                className={`rounded-xl px-3 py-3 text-sm font-bold transition ${
                  aba === 'VOLUNTARIO' ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                Voluntario
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-[#0F172A]">
                  {aba === 'BENEFICIARIO' ? 'Acesso do beneficiario' : 'Acesso do voluntario'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#475569]">
                  {aba === 'BENEFICIARIO'
                    ? 'Acompanhe seus atendimentos e converse com o dentista responsavel.'
                    : 'Veja seus atendimentos, chamados abertos e solicitacoes de novos voluntarios.'}
                </p>
              </div>
              <Field label="E-mail" error={errors.email?.message}>
                <Input
                  type="email"
                  {...register('email', {
                    required: 'Digite seu e-mail',
                    pattern: { value: /^\S+@\S+$/i, message: 'E-mail invalido' },
                  })}
                  placeholder="voce@email.com"
                  autoComplete="email"
                />
              </Field>
              <Field label="Senha" error={errors.senha?.message}>
                <Input
                  type="password"
                  {...register('senha', {
                    required: 'Digite sua senha',
                    minLength: { value: 6, message: 'Senha minima de 6 caracteres' },
                  })}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />
              </Field>
              <Button type="submit" disabled={loading} size="large" fullWidth>
                {loading ? 'Entrando...' : `Entrar como ${aba === 'BENEFICIARIO' ? 'beneficiario' : 'voluntario'}`}
              </Button>
            </form>
          </Card>

          <Card className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] p-8 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Conta nova</p>
            <h2 className="mt-3 text-3xl font-black">Precisa de acesso?</h2>
            <p className="mt-4 leading-7 text-blue-100">
              Beneficiarios podem acompanhar seus atendimentos. Voluntarios enviam uma solicitacao e aguardam aprovacao.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/quero-ser-voluntario" variant="secondary" size="large">
                Solicitar voluntariado
              </Button>
              <Button href="/cadastro-beneficiario" variant="ghost" size="large" className="bg-white/10 text-white hover:bg-white/15 hover:text-white">
                Criar conta beneficiario
              </Button>
            </div>
          </Card>
        </div>
      </Section>
    </PageShell>
  );
}

export default Login;
