import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import { programImages } from '../config/programImages';
import { useAuth } from '../context/useAuth';
import { useConfirm } from '../hooks/useConfirm';
import { relatarAtendimento } from '../services/relatoAtendimentoService';
import type { RelatarAtendimentoRequest, TipoPessoaRelato } from '../types/AtendimentoApi';

type FormState = {
  nomeCodificado: string;
  telefone: string;
  email: string;
  tipoPessoaAtendida: TipoPessoaRelato;
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
  identificacao: string;
  contatoSeguro: string;
};

const initialForm: FormState = {
  nomeCodificado: '',
  telefone: '',
  email: '',
  tipoPessoaAtendida: 'CRIANCA_ADOLESCENTE',
  prioridade: '3',
  descricao: '',
  idade: '',
  nomeResponsavel: '',
  escola: '',
  gravidadeBucal: '3',
  codinome: '',
  nivelRisco: '3',
  temBoletimOcorrencia: '',
  necessitaSigiloAbsoluto: 'true',
  identificacao: '',
  contatoSeguro: 'APLICACAO',
};

function toBoolean(value: string) {
  return value === 'true';
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

function montarPayload(form: FormState, idContaBeneficiario?: number): RelatarAtendimentoRequest {
  const payload: RelatarAtendimentoRequest = {
    idContaBeneficiario,
    nomeCodificado: form.tipoPessoaAtendida === 'MULHER_APOLONIA' ? form.codinome.trim() : form.nomeCodificado.trim(),
    telefone: form.tipoPessoaAtendida === 'MULHER_APOLONIA' && form.contatoSeguro === 'APLICACAO' ? '' : form.telefone.trim(),
    email: form.tipoPessoaAtendida === 'MULHER_APOLONIA' && form.contatoSeguro === 'APLICACAO' ? '' : form.email.trim(),
    tipo: form.tipoPessoaAtendida,
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
    payload.temBoletimOcorrencia = form.temBoletimOcorrencia === '' ? undefined : toBoolean(form.temBoletimOcorrencia);
    payload.necessitaSigiloAbsoluto = toBoolean(form.necessitaSigiloAbsoluto);
  }

  return payload;
}

function validar(form: FormState) {
  if (form.tipoPessoaAtendida !== 'MULHER_APOLONIA' && !form.nomeCodificado.trim()) {
    return 'Informe o nome da pessoa atendida.';
  }
  if (form.tipoPessoaAtendida !== 'MULHER_APOLONIA') {
    if (!form.telefone.trim()) return 'Informe um telefone para contato.';
    if (!form.email.trim()) return 'Informe um email para contato.';
  }
  if (form.tipoPessoaAtendida === 'MULHER_APOLONIA' && !form.identificacao) {
    return 'Escolha como deseja se apresentar.';
  }
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { confirm, confirmDialog } = useConfirm();
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    nomeCodificado: user?.nome ?? '',
    email: user?.tipoBeneficiario === 'MULHER_APOLONIA' ? '' : user?.email ?? '',
    tipoPessoaAtendida: user?.tipoBeneficiario ?? initialForm.tipoPessoaAtendida,
    identificacao: user?.modoIdentificacao ?? '',
    codinome: user?.tipoBeneficiario === 'MULHER_APOLONIA' ? user.nome : '',
  }));
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  const tipoSelecionado = form.tipoPessoaAtendida === 'MULHER_APOLONIA'
    ? 'Programa Apolônia'
    : 'Criança ou adolescente';

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErro('');
    setSucesso('');
  };

  const selectCarePath = (tipo: Extract<TipoPessoaRelato, 'CRIANCA_ADOLESCENTE' | 'MULHER_APOLONIA'>) => {
    setForm((current) => ({
      ...current,
      tipoPessoaAtendida: tipo,
      nomeCodificado: tipo === 'MULHER_APOLONIA'
        ? ''
        : current.nomeCodificado || user?.nome || '',
      telefone: '',
      email: tipo === 'MULHER_APOLONIA' ? '' : user?.email ?? '',
      identificacao: '',
      codinome: '',
      contatoSeguro: 'APLICACAO',
    }));
    setErro('');
    setSucesso('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (enviando || confirmDialog) return;
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
      details: [
        { label: 'Programa', value: tipoSelecionado },
        { label: 'Identificação compartilhada', value: form.tipoPessoaAtendida === 'MULHER_APOLONIA' ? form.codinome : form.nomeCodificado },
        { label: 'Contato', value: form.tipoPessoaAtendida === 'MULHER_APOLONIA' && form.contatoSeguro === 'APLICACAO' ? 'Somente pela aplicação' : [form.telefone, form.email].filter(Boolean).join(' / ') || 'Somente pela aplicação' },
        ...(form.tipoPessoaAtendida === 'MULHER_APOLONIA' ? [{ label: 'Boletim de ocorrência', value: form.temBoletimOcorrencia === '' ? 'Prefiro não responder' : form.temBoletimOcorrencia === 'true' ? 'Sim' : 'Não' }] : []),
      ],
      onConfirm: async () => {
        setEnviando(true);
        setErro('');
        setSucesso('');

        try {
          await relatarAtendimento(montarPayload(form, user?.id));
          setSucesso('Relato enviado com sucesso. Aguarde um voluntário assumir o atendimento.');
          setForm((current) => ({
            ...current,
            descricao: '',
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
      <PageHeader
        variant="compact"
        eyebrow="Atendimento"
        title="Relatar uma situação"
        description="Preencha as informações com cuidado. A equipe usa esses dados para priorizar e encaminhar o atendimento."
        actions={
          <Button variant="secondary" onClick={() => navigate('/portal-beneficiario')}>
            Voltar para o portal
          </Button>
        }
      />

      <Section tone="white">
        <Card className="mx-auto max-w-4xl overflow-hidden">
          <div className="border-b border-border bg-slate-50 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Dados do relato</h2>
                <p className="mt-1 text-sm text-muted-foreground">Identificacao protegida e triagem inicial.</p>
              </div>
              <Badge tone="info">{tipoSelecionado}</Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-8">
            <fieldset aria-describedby="care-path-description">
              <legend className="text-base font-bold text-foreground">Quem precisa de atendimento?</legend>
              <p id="care-path-description" className="mt-1 text-sm leading-6 text-muted-foreground">
                Escolha o caminho mais adequado. As próximas perguntas serão adaptadas à sua situação.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label
                  className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-ui-lg border-2 transition-[border-color,background-color,box-shadow] duration-fast focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
                    form.tipoPessoaAtendida === 'CRIANCA_ADOLESCENTE'
                      ? 'border-primary bg-blue-50/70 shadow-sm'
                      : 'border-border bg-surface hover:border-blue-200 hover:bg-blue-50/30'
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="tipoPessoaAtendida"
                    value="CRIANCA_ADOLESCENTE"
                    checked={form.tipoPessoaAtendida === 'CRIANCA_ADOLESCENTE'}
                    onChange={() => selectCarePath('CRIANCA_ADOLESCENTE')}
                  />
                  <img
                    src={programImages.dentistaDoBem}
                    alt="Adolescente em atendimento odontológico do programa Dentista do Bem"
                    loading="lazy"
                    className="h-36 w-full object-cover object-center transition-transform duration-normal group-hover:scale-[1.02]"
                  />
                  <span className="flex flex-1 flex-col p-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-ui bg-blue-100 text-primary ring-1 ring-blue-200" aria-hidden="true">
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="9" cy="8" r="3" />
                        <circle cx="17" cy="10" r="2.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M14 15.5c3.7-.8 5.8.7 6.5 4.5" />
                      </svg>
                    </span>
                    <span className="mt-4 text-base font-bold text-foreground">Criança ou Adolescente</span>
                    <span className="mt-1 text-sm leading-6 text-muted-foreground">
                      Atendimento odontológico com informações do responsável e contexto escolar.
                    </span>
                    <span className="mt-auto pt-3 text-xs font-bold uppercase tracking-wide text-primary">
                      {form.tipoPessoaAtendida === 'CRIANCA_ADOLESCENTE' ? 'Selecionado' : 'Selecionar este atendimento'}
                    </span>
                  </span>
                </label>

                <label
                  className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-ui-lg border-2 transition-[border-color,background-color,box-shadow] duration-fast focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
                    form.tipoPessoaAtendida === 'MULHER_APOLONIA'
                      ? 'border-rose-500 bg-rose-50/75 shadow-sm'
                      : 'border-border bg-surface hover:border-rose-200 hover:bg-rose-50/30'
                  }`}
                >
                  <input
                    className="sr-only"
                    type="radio"
                    name="tipoPessoaAtendida"
                    value="MULHER_APOLONIA"
                    checked={form.tipoPessoaAtendida === 'MULHER_APOLONIA'}
                    onChange={() => selectCarePath('MULHER_APOLONIA')}
                  />
                  <img
                    src={programImages.apoloniasDoBem}
                    alt="Mulher sorrindo, representando o acolhimento do programa Apolônias do Bem"
                    loading="lazy"
                    className="h-36 w-full object-cover object-[center_32%] transition-transform duration-normal group-hover:scale-[1.02]"
                  />
                  <span className="flex flex-1 flex-col p-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-ui bg-rose-100 text-rose-700 ring-1 ring-rose-200" aria-hidden="true">
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" />
                      </svg>
                    </span>
                    <span className="mt-4 text-base font-bold text-foreground">Mulher em Vulnerabilidade</span>
                    <span className="text-sm font-semibold text-rose-700">Programa Apolônia</span>
                    <span className="mt-1 text-sm leading-6 text-muted-foreground">
                      Você escolhe como se apresentar e quais dados é seguro compartilhar.
                    </span>
                    <span className="mt-auto pt-3 text-xs font-bold uppercase tracking-wide text-rose-700">
                      {form.tipoPessoaAtendida === 'MULHER_APOLONIA' ? 'Selecionado com sigilo' : 'Selecionar atendimento sigiloso'}
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>

            {form.tipoPessoaAtendida === 'MULHER_APOLONIA' && <Field label="Como podemos entrar em contato?" hint="Você pode acompanhar as respostas somente pela aplicação. Se informar contatos, eles poderão ser vistos pela equipe de voluntários que consulta a fila de atendimento.">
              <Select value={form.contatoSeguro} onChange={event => updateField('contatoSeguro', event.target.value)}>
                <option value="APLICACAO">Somente pela aplicação</option>
                <option value="INFORMADO">Quero informar um contato seguro</option>
              </Select>
            </Field>}
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

              {(form.tipoPessoaAtendida !== 'MULHER_APOLONIA' || form.contatoSeguro === 'INFORMADO') && <><Field label="Telefone">
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={15}
                  value={form.telefone}
                  onChange={(event) => updateField('telefone', formatPhone(event.target.value))}
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
              </>}

            </div>

            {form.tipoPessoaAtendida === 'CRIANCA_ADOLESCENTE' && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge tone="info">Crianca ou adolescente</Badge>
                  <p className="text-sm text-muted-foreground">Campos específicos para cuidado odontológico e responsável.</p>
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
              <div className="rounded-ui-lg border border-rose-200 bg-rose-50/70 p-5">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge tone="danger">Sigilo sensivel</Badge>
                  <p className="text-sm text-rose-900">Compartilhe apenas o que for seguro. Sua escolha de nome identifica este atendimento; evite dados pessoais no relato e nos anexos se não quiser se identificar.</p>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Como deseja se apresentar?">
                    <Select value={form.identificacao} onChange={event => {
                      const modo = event.target.value;
                      setForm(current => ({ ...current, identificacao: modo, codinome: modo === 'GERADO' ? `Pessoa ${crypto.randomUUID().slice(0, 8)}` : '' }));
                    }}>
                      <option value="">Escolha uma opção</option>
                      <option value="NOME">Quero usar meu nome</option>
                      <option value="CODINOME">Quero escolher um codinome</option>
                      <option value="GERADO">Prefiro um nome gerado pelo sistema</option>
                    </Select>
                  </Field>
                  {form.identificacao && <Field label={form.identificacao === 'NOME' ? 'Nome que deseja compartilhar' : 'Codinome'} hint="Este nome será exibido à equipe, inclusive na fila de atendimento.">
                    <Input
                      required
                      autoComplete="off"
                      maxLength={50}
                      readOnly={form.identificacao === 'GERADO'}
                      value={form.codinome}
                      onChange={(event) => updateField('codinome', event.target.value)}
                      placeholder="Ex.: Aurora"
                    />
                  </Field>}
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
                      <option value="">Prefiro não responder</option>
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

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Campos de risco usam escala de 1 a 5.</p>
              <Button type="submit" size="large" disabled={enviando || Boolean(confirmDialog)}>
                {enviando ? 'Enviando...' : 'Enviar relato'}
              </Button>
            </div>
          </form>
        </Card>
      </Section>
      {confirmDialog}
    </PageShell>
  );
}

