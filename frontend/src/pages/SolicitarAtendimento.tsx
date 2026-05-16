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
import { listarCanais } from '../services/canaisService';
import { classificarMensagemIA, type CanalIA, type ClassificarMensagemIAResponse } from '../services/iaService';
import { relatarAtendimento } from '../services/relatoAtendimentoService';
import type { CanalComunicacaoApi, RelatarAtendimentoRequest, TipoPessoaRelato } from '../types/AtendimentoApi';

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

function normalizarCanal(nomeCanal?: string): CanalIA {
  const canal = (nomeCanal ?? '').toLowerCase();
  if (canal.includes('whatsapp') || canal.includes('whats')) return 'whatsapp';
  if (canal.includes('telefone')) return 'telefone';
  if (canal.includes('email') || canal.includes('e-mail')) return 'email';
  if (canal.includes('presencial')) return 'presencial';
  return 'whatsapp';
}

function normalizarPrioridadeParaIA(prioridade: number) {
  if (prioridade <= 1) return 1;
  if (prioridade === 2) return 2;
  return 3;
}

function calcularGravidade(form: FormState) {
  if (form.tipoPessoaAtendida === 'CRIANCA_ADOLESCENTE') return Number(form.gravidadeBucal) || 3;
  if (form.tipoPessoaAtendida === 'MULHER_APOLONIA') return Number(form.nivelRisco) || 3;
  return Number(form.prioridade) || 3;
}

function obterEstiloCategoriaIA(categoria?: string) {
  const estilos: Record<string, { card: string; badge: string; text: string; dot: string }> = {
    urgencia: {
      card: 'border-rose-200 bg-rose-50/80',
      badge: 'bg-rose-100 text-rose-800',
      text: 'text-rose-900',
      dot: 'bg-rose-500',
    },
    elogio: {
      card: 'border-emerald-200 bg-emerald-50/80',
      badge: 'bg-emerald-100 text-emerald-800',
      text: 'text-emerald-900',
      dot: 'bg-emerald-500',
    },
    reclamacao: {
      card: 'border-orange-200 bg-orange-50/80',
      badge: 'bg-orange-100 text-orange-800',
      text: 'text-orange-900',
      dot: 'bg-orange-500',
    },
    sugestao: {
      card: 'border-blue-200 bg-blue-50/80',
      badge: 'bg-blue-100 text-blue-800',
      text: 'text-blue-900',
      dot: 'bg-blue-500',
    },
    informativo: {
      card: 'border-slate-200 bg-slate-50/80',
      badge: 'bg-slate-100 text-slate-700',
      text: 'text-slate-900',
      dot: 'bg-slate-500',
    },
  };

  return estilos[categoria ?? ''] ?? estilos.informativo;
}

function montarPayload(form: FormState, idContaBeneficiario?: number): RelatarAtendimentoRequest {
  const payload: RelatarAtendimentoRequest = {
    idContaBeneficiario,
    nomeCodificado: form.nomeCodificado.trim(),
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
  if (!form.nomeCodificado.trim()) return 'Informe o nome codificado.';
  if (!form.telefone.trim()) return 'Informe um telefone para contato.';
  if (!form.email.trim()) return 'Informe um email para contato.';
  if (!form.canalComunicacaoId) return 'Escolha um canal de comunicacao.';
  if (!form.descricao.trim() || form.descricao.trim().length < 15) {
    return 'Descreva a situacao com pelo menos 15 caracteres.';
  }

  if (form.tipoPessoaAtendida === 'CRIANCA_ADOLESCENTE') {
    if (!form.idade || Number(form.idade) < 0) return 'Informe a idade da crianca ou adolescente.';
    if (!form.nomeResponsavel.trim()) return 'Informe o nome do responsavel.';
    if (!form.escola.trim()) return 'Informe a escola.';
  }

  if (form.tipoPessoaAtendida === 'MULHER_APOLONIA' && !form.codinome.trim()) {
    return 'Informe o codinome.';
  }

  return '';
}

function SolicitarAtendimento() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    nomeCodificado: user?.nome ?? '',
    email: user?.email ?? '',
  }));
  const [canais, setCanais] = useState<CanalComunicacaoApi[]>([]);
  const [carregandoCanais, setCarregandoCanais] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const [classificacaoIA, setClassificacaoIA] = useState<ClassificarMensagemIAResponse | null>(null);
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [erroIA, setErroIA] = useState(false);

  useEffect(() => {
    async function carregarCanais() {
      setCarregandoCanais(true);
      const canaisDisponiveis = await listarCanais();
      setCanais(canaisDisponiveis);
      setForm((current) => ({
        ...current,
        canalComunicacaoId: current.canalComunicacaoId || String(canaisDisponiveis[0]?.id ?? ''),
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

  const canalSelecionado = useMemo(
    () => canais.find((canal) => String(canal.id) === form.canalComunicacaoId),
    [canais, form.canalComunicacaoId],
  );

  useEffect(() => {
    const descricao = form.descricao.trim();

    if (descricao.length < 15) {
      setClassificacaoIA(null);
      setCarregandoIA(false);
      setErroIA(false);
      return;
    }

    const controller = new AbortController();
    setCarregandoIA(true);
    setErroIA(false);

    const timeoutId = window.setTimeout(async () => {
      const resultado = await classificarMensagemIA(
        {
          conteudo: descricao,
          enviado_por: 'BENEFICIARIO',
          canal: normalizarCanal(canalSelecionado?.nome),
          prioridade_atendimento: normalizarPrioridadeParaIA(Number(form.prioridade)),
          status_atendimento: 'ABERTO',
          tipo_pessoa: form.tipoPessoaAtendida,
          gravidade: calcularGravidade(form),
        },
        controller.signal,
      );

      if (controller.signal.aborted) return;

      setClassificacaoIA(resultado);
      setErroIA(!resultado);
      setCarregandoIA(false);
    }, 800);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    canalSelecionado?.nome,
    form.descricao,
    form.gravidadeBucal,
    form.nivelRisco,
    form.prioridade,
    form.tipoPessoaAtendida,
  ]);

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
      setClassificacaoIA(null);
      setErroIA(false);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Nao foi possivel enviar o relato.');
    } finally {
      setEnviando(false);
    }
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
          <Button variant="secondary" onClick={() => { logout(); navigate('/login'); }}>Sair</Button>
        </Container>
      </header>

      <PageHeader
        eyebrow="Atendimento"
        title="Relatar uma situacao"
        description="Preencha as informacoes com cuidado. A equipe usa esses dados para priorizar e encaminhar o atendimento."
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
              <Field label="Nome codificado">
                <Input
                  value={form.nomeCodificado}
                  onChange={(event) => updateField('nomeCodificado', event.target.value)}
                  placeholder="Ex.: Sol nascente"
                />
              </Field>

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

              <Field label="Canal de comunicacao">
                <Select
                  value={form.canalComunicacaoId}
                  onChange={(event) => updateField('canalComunicacaoId', event.target.value)}
                  disabled={carregandoCanais}
                >
                  {carregandoCanais && <option value="">Carregando canais...</option>}
                  {!carregandoCanais && canais.map((canal) => (
                    <option key={canal.id} value={canal.id}>{canal.nome}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Prioridade">
                <Select value={form.prioridade} onChange={(event) => updateField('prioridade', event.target.value)}>
                  <option value="1">1 - Urgente</option>
                  <option value="2">2 - Alta</option>
                  <option value="3">3 - Media</option>
                  <option value="4">4 - Baixa</option>
                  <option value="5">5 - Acompanhamento</option>
                </Select>
              </Field>
            </div>

            {form.tipoPessoaAtendida === 'CRIANCA_ADOLESCENTE' && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge tone="info">Crianca ou adolescente</Badge>
                  <p className="text-sm text-[#475569]">Campos especificos para cuidado odontologico e responsavel.</p>
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
                  <Field label="Nome do responsavel">
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
                  <Field label="Gravidade bucal">
                    <Select value={form.gravidadeBucal} onChange={(event) => updateField('gravidadeBucal', event.target.value)}>
                      <option value="1">1 - Leve</option>
                      <option value="2">2</option>
                      <option value="3">3 - Moderada</option>
                      <option value="4">4</option>
                      <option value="5">5 - Muito grave</option>
                    </Select>
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
                      <option value="2">2</option>
                      <option value="3">3 - Medio</option>
                      <option value="4">4</option>
                      <option value="5">5 - Alto</option>
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
                placeholder="Conte o que esta acontecendo, quando comecou e qual apoio precisa agora."
              />
            </Field>

            {(carregandoIA || classificacaoIA || erroIA) && (
              <div className={`rounded-xl border px-5 py-4 ${obterEstiloCategoriaIA(classificacaoIA?.categoria_prevista).card}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${obterEstiloCategoriaIA(classificacaoIA?.categoria_prevista).badge}`}>
                      Gerado por IA
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A]">Classificacao automatica do atendimento</h3>
                      {carregandoIA && (
                        <p className="mt-1 text-sm font-medium text-[#475569]">Analisando relato com IA...</p>
                      )}
                      {!carregandoIA && erroIA && (
                        <p className="mt-1 text-sm font-medium text-[#475569]">
                          Nao foi possivel classificar com IA agora. Voce ainda pode enviar o relato normalmente.
                        </p>
                      )}
                      {!carregandoIA && classificacaoIA && (
                        <p className="mt-1 text-sm text-[#475569]">
                          Essa classificacao e uma sugestao automatica para apoiar a triagem. O atendimento sera enviado normalmente.
                        </p>
                      )}
                    </div>
                  </div>

                  {!carregandoIA && classificacaoIA && (
                    <div className="grid gap-2 text-sm sm:min-w-48">
                      <div className="rounded-lg bg-white/70 px-3 py-2 shadow-sm">
                        <span className="block text-xs font-semibold uppercase text-[#64748B]">Categoria prevista</span>
                        <span className={`mt-1 flex items-center gap-2 font-bold ${obterEstiloCategoriaIA(classificacaoIA.categoria_prevista).text}`}>
                          <span className={`h-2.5 w-2.5 rounded-full ${obterEstiloCategoriaIA(classificacaoIA.categoria_prevista).dot}`} />
                          {classificacaoIA.categoria_prevista}
                        </span>
                      </div>
                      <div className="rounded-lg bg-white/70 px-3 py-2 shadow-sm">
                        <span className="block text-xs font-semibold uppercase text-[#64748B]">Confianca</span>
                        <span className="mt-1 block font-bold text-[#0F172A]">{Math.round(classificacaoIA.confianca * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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
              <p className="text-sm text-[#475569]">Campos de risco e prioridade usam escala de 1 a 5.</p>
              <Button type="submit" size="large" disabled={enviando || carregandoCanais}>
                {enviando ? 'Enviando...' : 'Enviar relato'}
              </Button>
            </div>
          </form>
        </Card>
      </Section>
    </PageShell>
  );
}

export default SolicitarAtendimento;
