import { useEffect, useMemo, useState, useRef, type FormEvent } from 'react';
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
import { useConfirm } from '../hooks/useConfirm';
import { atendimentoService } from '../services/atendimentoService';
import { mensagensService } from '../services/mensagensService';
import type { AtendimentoApi, Mensagem, MensagemRequest } from '../types/AtendimentoApi';
import { classificarMensagemIA, type CanalIA, type ClassificarMensagemIAResponse, type TipoPessoaIA } from '../services/iaService';

const STATUS_OPTIONS = ['ABERTO', 'EM_ATENDIMENTO', 'ENCERRADO', 'CANCELADO'] as const;

function statusTone(status?: string) {
  if (status === 'ENCERRADO') return 'success';
  if (status === 'CANCELADO') return 'danger';
  if (status === 'EM_ATENDIMENTO') return 'warning';
  return 'info';
}

function formatDate(value?: string | null) {
  if (!value) return 'Não informada';
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
  return status ? labels[status] ?? status : 'Não informado';
}

function labelPrioridade(prioridade?: string | number) {
  const labels: Record<string, string> = {
    '1': '1 - Urgente',
    '2': '2 - Alta',
    '3': '3 - Media',
    '4': '4 - Baixa',
    '5': '5 - Acompanhamento',
  };
  return prioridade === undefined ? 'Não informada' : labels[String(prioridade)] ?? String(prioridade);
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
      <p className="mt-1 break-words text-sm font-semibold text-[#0F172A]">{value || 'Não informado'}</p>
    </div>
  );
}

function normalizarTelefone(tel?: string) {
  if (!tel) return '';
  let limpo = tel.replace(/\D/g, '');
  if (limpo.length > 0 && !limpo.startsWith('55')) {
    limpo = '55' + limpo;
  }
  return limpo;
}

function labelStatusCheckin(status?: string) {
  const labels: Record<string, string> = {
    NAO_ENVIADO: 'Não enviado',
    ENVIADO: 'Enviado',
    CONFIRMADO: 'Confirmado',
    NAO_COMPARECERA: 'Não comparecerá',
    REAGENDAMENTO_SOLICITADO: 'Reagendamento solicitado',
    SEM_RESPOSTA: 'Sem resposta',
  };
  return status ? labels[status] ?? status : 'Não enviado';
}

function iaPrevisaoConfig(previsao?: string) {
  if (!previsao) return null;
  const map: Record<string, { cor: string; bg: string; border: string; icone: string }> = {
    CONFIRMADO:               { cor: 'text-emerald-800', bg: 'bg-emerald-50',  border: 'border-emerald-200', icone: 'V' },
    NAO_COMPARECERA:          { cor: 'text-red-800',     bg: 'bg-red-50',      border: 'border-red-200',     icone: 'X' },
    REAGENDAMENTO_SOLICITADO: { cor: 'text-amber-800',   bg: 'bg-amber-50',    border: 'border-amber-200',   icone: '~' },
    SEM_RESPOSTA:             { cor: 'text-slate-700',   bg: 'bg-slate-50',    border: 'border-slate-200',   icone: '?' },
    AGUARDANDO_RESPOSTA:      { cor: 'text-blue-800',    bg: 'bg-blue-50',     border: 'border-blue-200',    icone: '...' },
  };
  return map[previsao] ?? { cor: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', icone: '?' };
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

function DetalheAtendimento() {
  const { id } = useParams();
  const atendimentoId = Number(id);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { confirm, ConfirmModal } = useConfirm();

  const [atendimento, setAtendimento] = useState<AtendimentoApi | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [classificacaoIA, setClassificacaoIA] = useState<ClassificarMensagemIAResponse | null>(null);
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [erroIA, setErroIA] = useState(false);
  const [assumindo, setAssumindo] = useState(false);

  // Ref síncrona para rastrear IDs de mensagens já exibidas.
  // Usamos um ref (e não o state) porque o state é assíncrono —
  // quando duas mensagens WebSocket chegam quase ao mesmo tempo,
  // o React pode ainda não ter aplicado o state da primeira quando
  // a segunda chega, fazendo o check "prev.some()" falhar.
  // O ref é atualizado instantaneamente, evitando duplicatas.
  const seenIdsRef = useRef<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens]);

  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvandoCheckin, setSalvandoCheckin] = useState(false);
  const [statusEdit, setStatusEdit] = useState('ABERTO');
  const [prioridadeEdit, setPrioridadeEdit] = useState('3');

  const podeAlterar = user?.tipoUsuario === 'VOLUNTARIO' || user?.tipoUsuario === 'ADMIN';
  const remetenteAtual = getSender(user?.tipoUsuario);
  const chatBloqueado = atendimento?.status === 'ENCERRADO' || atendimento?.status === 'CANCELADO';

  const voluntarioId = user?.voluntarioId;
  const voluntarioSemVinculo = user?.tipoUsuario === 'VOLUNTARIO' && !voluntarioId;

  const assumirEsteAtendimento = async () => {
    if (!voluntarioId) {
      setFeedback('Não foi possível assumir: sua conta não possui vínculo de voluntário.');
      return;
    }

    setAssumindo(true);
    setFeedback('');
    try {
      await atendimentoService.assumirAtendimento(atendimentoId, voluntarioId);
      setFeedback('Atendimento assumido com sucesso!');
      await carregarDados(); // Recarrega os dados do atendimento
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível assumir o atendimento.');
    } finally {
      setAssumindo(false);
    }
  };

  useEffect(() => {
    if (!podeAlterar || !atendimento || atendimento.status !== 'ABERTO' || atendimento.voluntarioId) {
      setClassificacaoIA(null);
      setCarregandoIA(false);
      setErroIA(false);
      return;
    }

    const descricao = atendimento.descricao?.trim();
    if (!descricao || descricao.length < 15) {
      setClassificacaoIA(null);
      setCarregandoIA(false);
      setErroIA(false);
      return;
    }

    const controller = new AbortController();
    setCarregandoIA(true);
    setErroIA(false);

    // Normalização do canal
    const canalOriginal = (atendimento.canalOrigem?.nome ?? atendimento.canal ?? '').toLowerCase();
    let canalIA: CanalIA = 'whatsapp';
    if (canalOriginal.includes('whatsapp') || canalOriginal.includes('whats')) canalIA = 'whatsapp';
    else if (canalOriginal.includes('telefone')) canalIA = 'telefone';
    else if (canalOriginal.includes('email') || canalOriginal.includes('e-mail')) canalIA = 'email';
    else if (canalOriginal.includes('presencial')) canalIA = 'presencial';

    // Normalização de prioridade
    const prioridadeOriginal = Number(atendimento.prioridade) || 3;
    let prioridadeIA = 3;
    if (prioridadeOriginal <= 1) prioridadeIA = 1;
    else if (prioridadeOriginal === 2) prioridadeIA = 2;

    // Tipo de pessoa e gravidade
    const tipoPessoa: TipoPessoaIA = (atendimento.tipoPessoa === 'CRIANCA_ADOLESCENTE' || atendimento.tipoPessoa === 'MULHER_APOLONIA')
      ? atendimento.tipoPessoa
      : 'OUTRO';
    const gravidade = atendimento.gravidade ?? 3;

    const timeoutId = window.setTimeout(async () => {
      try {
        const resultado = await classificarMensagemIA(
          {
            conteudo: descricao,
            enviado_por: 'BENEFICIARIO',
            canal: canalIA,
            prioridade_atendimento: prioridadeIA,
            status_atendimento: 'ABERTO',
            tipo_pessoa: tipoPessoa,
            gravidade: gravidade,
          },
          controller.signal,
        );

        if (controller.signal.aborted) return;

        setClassificacaoIA(resultado);
        setErroIA(!resultado);
      } catch (err) {
        if (controller.signal.aborted) return;
        setErroIA(true);
      } finally {
        if (!controller.signal.aborted) {
          setCarregandoIA(false);
        }
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [atendimento, podeAlterar]);

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
      seenIdsRef.current = new Set(dadosMensagens.map(m => m.id));
      setAtendimento(dadosAtendimento);
      setMensagens(dadosMensagens);
      setStatusEdit(dadosAtendimento.status ?? 'ABERTO');
      setPrioridadeEdit(String(dadosAtendimento.prioridade ?? 3));

      // Busca a previsao de checkin em background para não travar a tela
      atendimentoService.preverCheckinIA(atendimentoId).then(previsao => {
        setAtendimento(prev => prev ? { ...prev, ...previsao } : prev);
      }).catch(() => {});
    } catch (error) {
      let msgErro = 'Não foi possível carregar os detalhes deste atendimento. Tente novamente mais tarde.';
      if (error instanceof Error) {
        if (error.message.includes('Error injecting') || error.message.includes('Internal Server Error') || error.message.includes('500')) {
          msgErro = 'Houve uma falha interna no servidor ao carregar este atendimento. A equipe tecnica ja foi notificada.';
        } else {
          msgErro = error.message;
        }
      }
      setErro(msgErro);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void carregarDados();
  }, [atendimentoId]);

  useEffect(() => {
    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;

    // A URL base precisa ser limpa e trocada de http para ws
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:8080' : 'https://tdb-respondefull.onrender.com');
    const wsUrlBase = baseUrl.replace(/\/$/, '').replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://');

    function connect() {
      if (cancelled || !atendimentoId) return;

      const clientId = `${remetenteAtual}-${Math.random().toString(36).substring(7)}`;
      const wsUrl = `${wsUrlBase}/chat/${atendimentoId}/${clientId}`;

      console.log(`[WebSocket] Conectando a: ${wsUrl} (tentativa ${reconnectAttempt})`);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (cancelled) {
          socket?.close();
          return;
        }
        reconnectAttempt = 0;
        console.log('[WebSocket] Conectado com sucesso! clientId=' + clientId);
      };

      socket.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(event.data) as Mensagem;
          // Verifica de forma SÍNCRONA se já vimos essa mensagem.
          if (seenIdsRef.current.has(msg.id)) return;
          seenIdsRef.current.add(msg.id);
          setMensagens((prev) => [...prev, msg]);
        } catch (e) {
          console.error('[WebSocket] Erro ao fazer parse:', e);
        }
      };

      socket.onerror = (error) => {
        console.error('[WebSocket] Erro:', error);
      };

      socket.onclose = (event) => {
        console.log(`[WebSocket] Fechado: code=${event.code} cancelled=${cancelled}`);
        if (!cancelled) {
          reconnectAttempt++;
          const delay = Math.min(reconnectAttempt * 3000, 30000);
          console.log(`[WebSocket] Reconectando em ${delay / 1000}s...`);
          reconnectTimeout = setTimeout(() => {
            mensagensService.getMensagensAtendimento(atendimentoId)
              .then((msgs) => {
                if (!cancelled) {
                  seenIdsRef.current = new Set(msgs.map(m => m.id));
                  setMensagens(msgs);
                }
              })
              .catch(() => {});
            connect();
          }, delay);
        }
      };
    }

    connect();

    return () => {
      console.log('[WebSocket] Cleanup - encerrando conexao e auto-reconnect');
      cancelled = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      socket?.close();
    };
  }, [atendimentoId, remetenteAtual]);

  const pessoaAtendida = useMemo(() => (
    atendimento?.pessoaAtendidaNome
      ?? atendimento?.beneficiarioNome
      ?? atendimento?.pacienteNome
      ?? (atendimento?.pessoaAtendidaId ? `Pessoa #${atendimento.pessoaAtendidaId}` : 'Não informada')
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
      if (!seenIdsRef.current.has(novaMensagem.id)) {
        seenIdsRef.current.add(novaMensagem.id);
        setMensagens((atuais) => [...atuais, novaMensagem]);
      }
      setConteudo('');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.');
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
      setFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar o atendimento.');
    } finally {
      setSalvando(false);
    }
  };

  const handleAlterarCheckin = async (status: string, abrirWhats = false) => {
    if (!atendimento) return;
    setSalvandoCheckin(true);
    setFeedback('');
    try {
      const atualizado = await atendimentoService.atualizarCheckin(atendimento.id, status);
      setAtendimento((prev) => prev ? { ...prev, statusCheckin: atualizado.statusCheckin, horarioEnvioCheckin: atualizado.horarioEnvioCheckin } : prev);
      
      if (abrirWhats && atualizado.pessoaAtendidaTelefone) {
        const telefone = normalizarTelefone(atualizado.pessoaAtendidaTelefone);
        const nome = atualizado.pessoaAtendidaNome || 'paciente';
        const msg = encodeURIComponent(`Olá, ${nome}! Tudo bem? Passando para confirmar sua consulta...`);
        window.open(`https://wa.me/${telefone}?text=${msg}`, '_blank');
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar o check-in.');
    } finally {
      setSalvandoCheckin(false);
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
            <p className="mt-1 text-sm text-[#475569]">Sessão de {user?.nome}</p>
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
        title={atendimento ? `Atendimento de ${pessoaAtendida}` : 'Carregando detalhes...'}
        description="Acompanhe status, responsável e mensagens deste atendimento."
      />

      <Section tone="white">
        {loading && <LoadingState title="Carregando atendimento..." />}
        {erro && <ErrorState title="Não foi possível abrir o atendimento" description={erro} />}

        {!loading && !erro && atendimento && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex flex-col gap-4 border-b border-[#E2E8F0] pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-bold text-[#0F172A]">Detalhes do Atendimento</h2>
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
                  <InfoItem label="Voluntário responsável" value={atendimento.nomeVoluntario ?? atendimento.voluntario?.nome ?? 'Aguardando voluntário'} />
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
                  <div ref={messagesEndRef} />
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

              {podeAlterar && atendimento.status === 'ABERTO' && !atendimento.voluntarioId && (
                <Card className="p-6 border border-blue-200 bg-blue-50/50">
                  <h2 className="text-xl font-bold text-[#0F172A]">Acolher caso</h2>
                  <p className="mt-1 text-sm text-[#475569]">Este atendimento está aberto e aguardando um profissional voluntário.</p>
                  <div className="mt-4">
                    <Button 
                      fullWidth 
                      disabled={assumindo || voluntarioSemVinculo} 
                      onClick={() => void assumirEsteAtendimento()}
                    >
                      {assumindo ? 'Assumindo...' : 'Assumir atendimento'}
                    </Button>
                    {voluntarioSemVinculo && (
                      <p className="mt-2 text-xs text-red-500">Sua conta de voluntário precisa estar vinculada para assumir casos.</p>
                    )}
                  </div>
                </Card>
              )}

              {podeAlterar && atendimento.status === 'ABERTO' && !atendimento.voluntarioId && (carregandoIA || classificacaoIA || erroIA) && (
                <Card className={`p-6 border ${obterEstiloCategoriaIA(classificacaoIA?.categoria_prevista).card}`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${obterEstiloCategoriaIA(classificacaoIA?.categoria_prevista).badge}`}>
                        IA: Classificação
                      </span>
                      {carregandoIA && (
                        <span className="text-xs text-slate-500 animate-pulse">Analisando relato...</span>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-[#0F172A]">Sugestão de Categoria</h3>
                      {carregandoIA && (
                        <p className="mt-1 text-sm text-[#475569]">Analisando o relato inicial do beneficiário...</p>
                      )}
                      {!carregandoIA && erroIA && (
                        <p className="mt-1 text-sm text-red-600">Falha ao obter classificação da IA.</p>
                      )}
                      {!carregandoIA && classificacaoIA && (
                        <p className="mt-1 text-sm text-[#475569]">
                          A inteligência artificial analisou o relato original e sugere a categoria abaixo para apoiar a triagem do caso.
                        </p>
                      )}
                    </div>

                    {!carregandoIA && classificacaoIA && (
                      <div className="grid gap-3 text-sm">
                        <div className="rounded-xl bg-white/80 p-3 shadow-sm border border-slate-100/50">
                          <span className="block text-xs font-bold uppercase tracking-wider text-[#64748B]">Categoria Prevista</span>
                          <span className={`mt-1.5 flex items-center gap-2 text-base font-bold ${obterEstiloCategoriaIA(classificacaoIA.categoria_prevista).text}`}>
                            <span className={`h-2.5 w-2.5 rounded-full ${obterEstiloCategoriaIA(classificacaoIA.categoria_prevista).dot}`} />
                            {classificacaoIA.categoria_prevista.toUpperCase()}
                          </span>
                        </div>
                        <div className="rounded-xl bg-white/80 p-3 shadow-sm border border-slate-100/50">
                          <span className="block text-xs font-bold uppercase tracking-wider text-[#64748B]">Nível de Confiança</span>
                          <span className="mt-1.5 block text-lg font-extrabold text-[#0F172A]">{Math.round(classificacaoIA.confianca * 100)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {podeAlterar && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-[#0F172A]">Acoes do atendimento</h2>
                  <p className="mt-1 text-sm text-[#475569]">Somente voluntários e administradores podem alterar estes campos.</p>

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

                    <Button fullWidth disabled={salvando} onClick={() => {
                      confirm({
                        title: 'Salvar Alterações',
                        message: 'Deseja confirmar as alterações feitas neste atendimento?',
                        confirmText: 'Salvar',
                        tone: 'primary',
                        onConfirm: () => salvarAtendimento(false)
                      });
                    }}>
                      {salvando ? 'Salvando...' : 'Salvar alteracoes'}
                    </Button>

                    <Button
                      fullWidth
                      variant="danger"
                      disabled={salvando || atendimento.status === 'ENCERRADO'}
                      onClick={() => {
                        confirm({
                          title: 'Encerrar Atendimento',
                          message: 'Tem certeza que deseja encerrar este atendimento? Ele ficará como somente leitura e não será possível enviar novas mensagens.',
                          confirmText: 'Encerrar',
                          tone: 'danger',
                          onConfirm: () => salvarAtendimento(true)
                        });
                      }}
                    >
                      Encerrar atendimento
                    </Button>
                  </div>
                </Card>
              )}

              {podeAlterar && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-[#0F172A]">Check-in via WhatsApp</h2>
                  
                  <div className="mt-4 text-sm text-[#475569]">
                    <p>Status atual: <strong>{labelStatusCheckin(atendimento.statusCheckin)}</strong></p>
                    {atendimento.horarioEnvioCheckin && (
                      <p>Enviado em: {formatDate(atendimento.horarioEnvioCheckin)}</p>
                    )}
                  </div>

                  {(() => {
                    const cfg = iaPrevisaoConfig(atendimento.previsaoCheckin);
                    if (!cfg) return null;
                    const pct = atendimento.confiancaCheckin !== undefined
                      ? Math.round(atendimento.confiancaCheckin * 100)
                      : null;
                    return (
                      <div className={`mt-4 rounded-xl border px-4 py-3 ${cfg.bg} ${cfg.border}`}>
                        <p className={`text-xs font-bold uppercase tracking-widest ${cfg.cor}`}>
                          Previsao da Inteligencia Artificial
                        </p>
                        <p className={`mt-1 text-sm font-semibold ${cfg.cor}`}>
                          [{cfg.icone}] {labelStatusCheckin(atendimento.previsaoCheckin)}
                          {pct !== null && <span className="ml-2 opacity-75">({pct}% de confianca)</span>}
                        </p>
                      </div>
                    );
                  })()}

                  <div className="mt-5 space-y-3">
                    <Button
                      fullWidth
                      disabled={salvandoCheckin || !atendimento.pessoaAtendidaTelefone}
                      onClick={() => void handleAlterarCheckin('AGUARDANDO_RESPOSTA', true)}
                    >
                      {salvandoCheckin ? 'Processando...' : 'Abrir WhatsApp'}
                    </Button>

                    {!atendimento.pessoaAtendidaTelefone && (
                      <p className="text-xs text-red-500">Telefone não preenchido para abrir WhatsApp.</p>
                    )}

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Button
                        variant="secondary"
                        disabled={salvandoCheckin}
                        onClick={() => void handleAlterarCheckin('CONFIRMADO')}
                      >
                        Confirmou
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={salvandoCheckin}
                        onClick={() => void handleAlterarCheckin('NAO_COMPARECERA')}
                      >
                        Não vai
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={salvandoCheckin}
                        onClick={() => void handleAlterarCheckin('REAGENDAMENTO_SOLICITADO')}
                      >
                        Reagendar
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={salvandoCheckin}
                        onClick={() => void handleAlterarCheckin('SEM_RESPOSTA')}
                      >
                        Sem resposta
                      </Button>
                    </div>
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
      <ConfirmModal />
    </PageShell>
  );
}

export default DetalheAtendimento;
