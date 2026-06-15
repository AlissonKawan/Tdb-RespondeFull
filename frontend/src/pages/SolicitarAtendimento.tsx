import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/useAuth';
import { useConfirm } from '../hooks/useConfirm';
import { listarCanais } from '../services/canaisService';
import { relatarAtendimento } from '../services/relatoAtendimentoService';
import type { RelatarAtendimentoRequest, TipoPessoaRelato } from '../types/AtendimentoApi';

type FormState = {
  nomeCodificado: string;
  telefone: string;
  email: string;
  tipoPessoaAtendida: TipoPessoaRelato;
  canalComunicacaoId: string;
  prioridade: string;
  descricao: string;
  idade: string;
  nomeResponsavel: string;
  escola: string;
  gravidadeBucal: string;
  codinome: string;
  nivelRisco: string;
  temBoletimOcorrencia: string;
  necessitaSigiloAbsoluto: string;
};

const initialForm: FormState = {
  nomeCodificado: '',
  telefone: '',
  email: '',
  tipoPessoaAtendida: 'CRIANCA_ADOLESCENTE',
  canalComunicacaoId: '',
  prioridade: '3',
  descricao: '',
  idade: '',
  nomeResponsavel: '',
  escola: '',
  gravidadeBucal: '3',
  codinome: '',
  nivelRisco: '3',
  temBoletimOcorrencia: 'false',
  necessitaSigiloAbsoluto: 'false',
};

function toBoolean(value: string) {
  return value === 'true';
}

function montarPayload(form: FormState, idContaBeneficiario?: number): RelatarAtendimentoRequest {
  const payload: RelatarAtendimentoRequest = {
    idContaBeneficiario,
    nomeCodificado: form.tipoPessoaAtendida === 'MULHER_APOLONIA' ? form.codinome.trim() : form.nomeCodificado.trim(),
    telefone: form.telefone.trim(),
    email: form.email.trim(),
    tipo: form.tipoPessoaAtendida,
    canalComunicacaoId: Number(form.canalComunicacaoId),
    prioridade: Number(form.prioridade),
    descricao: form.descricao.trim(),
  };

  if (form.tipoPessoaAtendida === 'CRIANCA_ADOLESCENTE') {
    payload.idade = Number(form.idade);
    payload.nomeResponsavel = form.nomeResponsavel.trim();
    payload.escola = form.escola.trim();
    payload.gravidadeBucal = Number(form.gravidadeBucal);
  }

  if (form.tipoPessoaAtendida === 'MULHER_APOLONIA') {
    payload.codinome = form.codinome.trim();
    payload.nivelRisco = Number(form.nivelRisco);
    payload.temBoletimOcorrencia = toBoolean(form.temBoletimOcorrencia);
    payload.necessitaSigiloAbsoluto = toBoolean(form.necessitaSigiloAbsoluto);
  }

  return payload;
}

function validar(form: FormState) {
  if (form.tipoPessoaAtendida !== 'MULHER_APOLONIA' && !form.nomeCodificado.trim()) {
    return 'Informe o nome da pessoa atendida.';
  }
  if (!form.telefone.trim()) return 'Informe um telefone para contato.';
  if (!form.email.trim()) return 'Informe um email para contato.';
  if (!form.canalComunicacaoId) return 'Erro ao carregar canal de comunicação.';
  if (!form.descricao.trim() || form.descricao.trim().length < 15) {
    return 'Descreva a situacao com pelo menos 15 caracteres.';
  }

  if (form.tipoPessoaAtendida === 'CRIANCA_ADOLESCENTE') {
    if (!form.idade || Number(form.idade) < 0) return 'Informe a idade da crianca ou adolescente.';
    if (!form.nomeResponsavel.trim()) return 'Informe o nome do responsável.';
    if (!form.escola.trim()) return 'Informe a escola.';
  }

  if (form.tipoPessoaAtendida === 'MULHER_APOLONIA' && !form.codinome.trim()) {
    return 'Informe o codinome.';
  }

  return '';
}

export default function SolicitarAtendimento() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { confirm, ConfirmModal } = useConfirm();
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    nomeCodificado: user?.nome ?? '',
    email: user?.email ?? '',
  }));
  const [carregandoCanais, setCarregandoCanais] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregarCanais() {
      setCarregandoCanais(true);
      const canaisDisponiveis = await listarCanais();
      
      const canalWeb = canaisDisponiveis.find(c => 
        c.nome.toLowerCase().includes('form') || 
        c.nome.toLowerCase().includes('web') || 
        c.nome.toLowerCase().includes('sistema')
      );

      setForm((current) => ({
        ...current,
        canalComunicacaoId: current.canalComunicacaoId || String(canalWeb?.id ?? canaisDisponiveis[0]?.id ?? ''),
      }));
      setCarregandoCanais(false);
    }

    void carregarCanais();
  }, []);

  const tipoSelecionado = useMemo(() => {
    const labels: Record<TipoPessoaRelato, string> = {
      CRIANCA_ADOLESCENTE: 'Crianca ou adolescente',
      MULHER_APOLONIA: 'Mulher Apolonia',
      OUTRO: 'Outro atendimento',
    };
    return labels[form.tipoPessoaAtendida];
  }, [form.tipoPessoaAtendida]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErro('');
    setSucesso('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validar(form);

    if (validationError) {
      setErro(validationError);
      return;
    }

    confirm({
      title: 'Enviar Solicitação',
      message: 'Confirma o envio desta solicitação de atendimento?',
      confirmText: 'Enviar',
      tone: 'primary',
      onConfirm: async () => {
        setEnviando(true);
        setErro('');
        setSucesso('');

        try {
          await relatarAtendimento(montarPayload(form, user?.id));
          setSucesso('Relato enviado com sucesso. Aguarde um voluntário assumir o atendimento.');
          setForm((current) => ({
            ...initialForm,
            nomeCodificado: current.nomeCodificado,
            telefone: current.telefone,
            email: current.email,
            canalComunicacaoId: current.canalComunicacaoId,
          }));
        } catch (error) {
          setErro(error instanceof Error ? error.message : 'Não foi possível enviar o relato.');
        } finally {
          setEnviando(false);
        }
      }
    });
  };

  return (
    <PageShell>
      <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <Container className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={() => navigate('/portal-beneficiario')} className="text-sm font-semibold text-[#2563EB] hover:text-[#1E3A8A]">
              Voltar para o portal
            </button>
            <p className="mt-1 text-sm text-[#475569]">Sessao de {user?.nome}</p>
          </div>
          <Button variant="secondary" onClick={() => {
            confirm({
              title: 'Sair da conta',
              message: 'Tem certeza que deseja encerrar a sua sessão?',
              confirmText: 'Sair',
              tone: 'danger',
              onConfirm: () => { logout(); navigate('/login'); }
            });
          }}>Sair</Button>
        </Container>
      </header>

      <PageHeader
        eyebrow="Atendimento"
        title="Relatar uma situacao"
        description="Preencha as informações com cuidado. A equipe usa esses dados para priorizar e encaminhar o atendimento."
      />

      <Section tone="white">
        <Card className="mx-auto max-w-4xl overflow-hidden">
          <div className="border-b border-[#E2E8F0] bg-slate-50 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0F172A]">Dados do relato</h2>
                <p className="mt-1 text-sm text-[#475569]">Identificacao protegida e triagem inicial.</p>
              </div>
              <Badge tone="info">{tipoSelecionado}</Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              {form.tipoPessoaAtendida !== 'MULHER_APOLONIA' && (
                <Field label="Nome da pessoa atendida">
                  <Input
                    value={form.nomeCodificado}
                    onChange={(event) => updateField('nomeCodificado', event.target.value)}
                    placeholder="Ex.: Joao Silva"
                  />
                </Field>
              )}

              <Field label="Telefone">
                <Input
                  value={form.telefone}
                  onChange={(event) => updateField('telefone', event.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </Field>

              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="voce@email.com"
                />
              </Field>

              <Field label="Tipo da pessoa atendida">
                <Select
                  value={form.tipoPessoaAtendida}
                  onChange={(event) => updateField('tipoPessoaAtendida', event.target.value as TipoPessoaRelato)}
                >
                  <option value="CRIANCA_ADOLESCENTE">Crianca ou adolescente</option>
                  <option value="MULHER_APOLONIA">Mulher Apolonia</option>
                  <option value="OUTRO">Outro</option>
                </Select>
              </Field>
            </div>

            {form.tipoPessoaAtendida === 'CRIANCA_ADOLESCENTE' && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge tone="info">Crianca ou adolescente</Badge>
                  <p className="text-sm text-[#475569]">Campos específicos para cuidado odontológico e responsável.</p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Idade">
                    <Input
                      type="number"
                      min={0}
                      value={form.idade}
                      onChange={(event) => updateField('idade', event.target.value)}
                      placeholder="Ex.: 12"
                    />
                  </Field>
                  <Field label="Nome do responsável">
                    <Input
                      value={form.nomeResponsavel}
                      onChange={(event) => updateField('nomeResponsavel', event.target.value)}
                      placeholder="Nome de quem acompanha"
                    />
                  </Field>
                  <Field label="Escola">
                    <Input
                      value={form.escola}
                      onChange={(event) => updateField('escola', event.target.value)}
                      placeholder="Nome da escola"
                    />
                  </Field>
                </div>
              </div>
            )}

            {form.tipoPessoaAtendida === 'MULHER_APOLONIA' && (
              <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-5">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge tone="danger">Sigilo sensivel</Badge>
                  <p className="text-sm text-[#475569]">Essas respostas ajudam a proteger a seguranca da solicitante.</p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Codinome">
                    <Input
                      value={form.codinome}
                      onChange={(event) => updateField('codinome', event.target.value)}
                      placeholder="Ex.: Aurora"
                    />
                  </Field>
                  <Field label="Nivel de risco">
                    <Select value={form.nivelRisco} onChange={(event) => updateField('nivelRisco', event.target.value)}>
                      <option value="1">1 - Baixo</option>
                      <option value="2">2 - Moderado</option>
                      <option value="3">3 - Medio</option>
                      <option value="4">4 - Alto</option>
                      <option value="5">5 - Critico</option>
                    </Select>
                  </Field>
                  <Field label="Tem boletim de ocorrencia?">
                    <Select value={form.temBoletimOcorrencia} onChange={(event) => updateField('temBoletimOcorrencia', event.target.value)}>
                      <option value="false">Nao</option>
                      <option value="true">Sim</option>
                    </Select>
                  </Field>
                  <Field label="Necessita sigilo absoluto?">
                    <Select value={form.necessitaSigiloAbsoluto} onChange={(event) => updateField('necessitaSigiloAbsoluto', event.target.value)}>
                      <option value="false">Nao</option>
                      <option value="true">Sim</option>
                    </Select>
                  </Field>
                </div>
              </div>
            )}

            <Field label="Descricao da situacao">
              <Textarea
                rows={6}
                value={form.descricao}
                onChange={(event) => updateField('descricao', event.target.value)}
                placeholder="Conte o que está acontecendo, quando começou e qual apoio precisa agora."
              />
            </Field>

            {sucesso && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {sucesso}
              </div>
            )}

            {erro && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {erro}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-[#E2E8F0] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#475569]">Campos de risco usam escala de 1 a 5.</p>
              <Button type="submit" size="large" disabled={enviando || carregandoCanais}>
                {enviando ? 'Enviando...' : 'Enviar relato'}
              </Button>
            </div>
          </form>
        </Card>
      </Section>
      <ConfirmModal />
    </PageShell>
  );
}

