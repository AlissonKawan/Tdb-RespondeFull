import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Container from '../components/ui/Container';
import { ErrorState, LoadingState } from '../components/ui/FeedbackState';
import { Field, Select, Textarea } from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/useAuth';
import { atendimentoService } from '../services/atendimentoService';
import { mensagensService } from '../services/mensagensService';
import type { AtendimentoApi, Mensagem, MensagemRequest } from '../types/AtendimentoApi';

const STATUS_OPTIONS = ['ABERTO', 'EM_ATENDIMENTO', 'ENCERRADO', 'CANCELADO'] as const;

function statusTone(status?: string) {
  if (status === 'ENCERRADO') return 'success';
  if (status === 'CANCELADO') return 'danger';
  if (status === 'EM_ATENDIMENTO') return 'warning';
  return 'info';
}

function formatDate(value?: string | null) {
  if (!value) return 'Nao informada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR');
}

function labelStatus(status?: string) {
  const labels: Record<string, string> = {
    ABERTO: 'Aberto',
    EM_ATENDIMENTO: 'Em atendimento',
    ENCERRADO: 'Encerrado',
    CANCELADO: 'Cancelado',
  };
  return status ? labels[status] ?? status : 'Nao informado';
}

function labelPrioridade(prioridade?: string | number) {
  const labels: Record<string, string> = {
    '1': '1 - Urgente',
    '2': '2 - Alta',
    '3': '3 - Media',
    '4': '4 - Baixa',
    '5': '5 - Acompanhamento',
  };
  return prioridade === undefined ? 'Nao informada' : labels[String(prioridade)] ?? String(prioridade);
}

function getSender(tipoUsuario?: string): MensagemRequest['enviadoPor'] {
  if (tipoUsuario === 'VOLUNTARIO') return 'VOLUNTARIO';
  if (tipoUsuario === 'ADMIN') return 'ADMIN';
  return 'BENEFICIARIO';
}

function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-[#64748B]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#0F172A]">{value || 'Nao informado'}</p>
    </div>
  );
}

function DetalheAtendimento() {
  const { id } = useParams();
  const atendimentoId = Number(id);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [atendimento, setAtendimento] = useState<AtendimentoApi | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [statusEdit, setStatusEdit] = useState('ABERTO');
  const [prioridadeEdit, setPrioridadeEdit] = useState('3');

  const podeAlterar = user?.tipoUsuario === 'VOLUNTARIO' || user?.tipoUsuario === 'ADMIN';
  const remetenteAtual = getSender(user?.tipoUsuario);
  const chatBloqueado = atendimento?.status === 'ENCERRADO' || atendimento?.status === 'CANCELADO';

  const carregarDados = async () => {
    if (!Number.isFinite(atendimentoId) || atendimentoId <= 0) {
      setErro('Atendimento invalido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro('');
    try {
      const [dadosAtendimento, dadosMensagens] = await Promise.all([
        atendimentoService.buscarPorId(atendimentoId),
        mensagensService.getMensagensAtendimento(atendimentoId),
      ]);
      setAtendimento(dadosAtendimento);
      setMensagens(dadosMensagens);
      setStatusEdit(dadosAtendimento.status ?? 'ABERTO');
      setPrioridadeEdit(String(dadosAtendimento.prioridade ?? 3));
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Nao foi possivel carregar o atendimento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregarDados();
  }, [atendimentoId]);

  const pessoaAtendida = useMemo(() => (
    atendimento?.pessoaAtendidaNome
      ?? atendimento?.beneficiarioNome
      ?? atendimento?.pacienteNome
      ?? (atendimento?.pessoaAtendidaId ? `Pessoa #${atendimento.pessoaAtendidaId}` : 'Nao informada')
  ), [atendimento]);

  const enviarMensagem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!conteudo.trim() || chatBloqueado) return;

    setEnviando(true);
    setFeedback('');
    try {
      const novaMensagem = await mensagensService.enviarMensagem(atendimentoId, {
        conteudo: conteudo.trim(),
        enviadoPor: remetenteAtual,
      });
      setMensagens((atuais) => [...atuais, novaMensagem]);
      setConteudo('');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel enviar a mensagem.');
    } finally {
      setEnviando(false);
    }
  };

  const salvarAtendimento = async (encerrar = false) => {
    if (!atendimento || !podeAlterar) return;

    const novoStatus = encerrar ? 'ENCERRADO' : statusEdit;
    setSalvando(true);
    setFeedback('');
    try {
      const atualizado = await atendimentoService.atualizarStatusPrioridade(atendimento.id, {
        status: novoStatus,
        prioridade: Number(prioridadeEdit),
      });
      setAtendimento(atualizado);
      setStatusEdit(atualizado.status ?? novoStatus);
      setPrioridadeEdit(String(atualizado.prioridade ?? prioridadeEdit));
      setFeedback(encerrar ? 'Atendimento encerrado com sucesso.' : 'Atendimento atualizado com sucesso.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Nao foi possivel atualizar o atendimento.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <PageShell>
      <header className="border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
        <Container className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={() => navigate(-1)} className="text-sm font-semibold text-[#2563EB] hover:text-[#1E3A8A]">
              Voltar
            </button>
            <p className="mt-1 text-sm text-[#475569]">Sessao de {user?.nome}</p>
          </div>
          <Button variant="secondary" onClick={() => { logout(); navigate('/login'); }}>Sair</Button>
        </Container>
      </header>

      <PageHeader
        eyebrow="Atendimento"
        title={`Atendimento ${id ?? ''}`}
        description="Acompanhe status, responsavel e mensagens deste atendimento."
      />

      <Section tone="white">
        {loading && <LoadingState title="Carregando atendimento..." />}
        {erro && <ErrorState title="Nao foi possivel abrir o atendimento" description={erro} />}

        {!loading && !erro && atendimento && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex flex-col gap-4 border-b border-[#E2E8F0] pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-bold text-[#0F172A]">Atendimento #{atendimento.id}</h2>
                      <Badge tone={statusTone(atendimento.status)}>{labelStatus(atendimento.status)}</Badge>
                    </div>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-[#475569]">
                      {atendimento.descricao || 'Sem descricao cadastrada.'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoItem label="Prioridade" value={labelPrioridade(atendimento.prioridade)} />
                  <InfoItem label="Data de abertura" value={formatDate(atendimento.dataAbertura ?? atendimento.dataCriacao)} />
                  <InfoItem label="Data de encerramento" value={atendimento.dataEncerramento ? formatDate(atendimento.dataEncerramento) : 'Em aberto'} />
                  <InfoItem label="Canal" value={atendimento.canalOrigem?.nome ?? atendimento.canal} />
                  <InfoItem label="Voluntario responsavel" value={atendimento.nomeVoluntario ?? atendimento.voluntario?.nome ?? 'Aguardando voluntario'} />
                  <InfoItem label="Pessoa atendida" value={pessoaAtendida} />
                  <InfoItem label="Email da pessoa" value={atendimento.pessoaAtendidaEmail} />
                  <InfoItem label="Telefone da pessoa" value={atendimento.pessoaAtendidaTelefone} />
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="border-b border-[#E2E8F0] bg-slate-50 px-6 py-5">
                  <h2 className="text-xl font-bold text-[#0F172A]">Mensagens</h2>
                  <p className="mt-1 text-sm text-[#475569]">Conversa vinculada ao atendimento.</p>
                </div>

                <div className="max-h-[520px] space-y-4 overflow-y-auto p-6">
                  {mensagens.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-[#E2E8F0] px-4 py-8 text-center text-sm text-[#64748B]">
                      Nenhuma mensagem enviada ainda.
                    </div>
                  )}

                  {mensagens.map((mensagem) => {
                    const minha = mensagem.enviadoPor === remetenteAtual;
                    return (
                      <div key={mensagem.id} className={`flex ${minha ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          minha
                            ? 'bg-[#2563EB] text-white'
                            : 'border border-[#E2E8F0] bg-white text-[#0F172A]'
                        }`}
                        >
                          <p className="text-xs font-bold uppercase tracking-widest opacity-75">{mensagem.enviadoPor}</p>
                          <p className="mt-1 whitespace-pre-wrap leading-6">{mensagem.conteudo}</p>
                          <p className={`mt-2 text-xs ${minha ? 'text-blue-100' : 'text-[#64748B]'}`}>
                            {formatDate(mensagem.dataHora)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={enviarMensagem} className="border-t border-[#E2E8F0] p-6">
                  {chatBloqueado && (
                    <div className="mb-4 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
                      Este atendimento esta {labelStatus(atendimento.status).toLowerCase()}. O envio de mensagens esta bloqueado.
                    </div>
                  )}
                  <Field label="Nova mensagem">
                    <Textarea
                      rows={4}
                      value={conteudo}
                      onChange={(event) => setConteudo(event.target.value)}
                      disabled={chatBloqueado || enviando}
                      placeholder="Escreva sua mensagem..."
                    />
                  </Field>
                  <div className="mt-4 flex justify-end">
                    <Button type="submit" disabled={chatBloqueado || enviando || !conteudo.trim()}>
                      {enviando ? 'Enviando...' : 'Enviar mensagem'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            <aside className="space-y-6">
              {feedback && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-[#2563EB]">
                  {feedback}
                </div>
              )}

              {podeAlterar && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-[#0F172A]">Acoes do atendimento</h2>
                  <p className="mt-1 text-sm text-[#475569]">Somente voluntarios e administradores podem alterar estes campos.</p>

                  <div className="mt-5 space-y-4">
                    <Field label="Status">
                      <Select value={statusEdit} onChange={(event) => setStatusEdit(event.target.value)}>
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>{labelStatus(status)}</option>
                        ))}
                      </Select>
                    </Field>

                    <Field label="Prioridade">
                      <Select value={prioridadeEdit} onChange={(event) => setPrioridadeEdit(event.target.value)}>
                        <option value="1">1 - Urgente</option>
                        <option value="2">2 - Alta</option>
                        <option value="3">3 - Media</option>
                        <option value="4">4 - Baixa</option>
                        <option value="5">5 - Acompanhamento</option>
                      </Select>
                    </Field>

                    <Button fullWidth disabled={salvando} onClick={() => void salvarAtendimento(false)}>
                      {salvando ? 'Salvando...' : 'Salvar alteracoes'}
                    </Button>

                    <Button
                      fullWidth
                      variant="danger"
                      disabled={salvando || atendimento.status === 'ENCERRADO'}
                      onClick={() => void salvarAtendimento(true)}
                    >
                      Encerrar atendimento
                    </Button>
                  </div>
                </Card>
              )}

              {!podeAlterar && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-[#0F172A]">Acompanhamento</h2>
                  <p className="mt-2 text-sm leading-6 text-[#475569]">
                    Voce pode acompanhar os detalhes e conversar pelo chat. Alteracoes de status e prioridade ficam com a equipe responsavel.
                  </p>
                </Card>
              )}
            </aside>
          </div>
        )}
      </Section>
    </PageShell>
  );
}

export default DetalheAtendimento;
