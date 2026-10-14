import { useEffect, useMemo, useState, useRef, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ErrorState, LoadingState } from '../components/ui/FeedbackState';
import { Field, Select } from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/useAuth';
import { useConfirm } from '../hooks/useConfirm';
import { atendimentoService } from '../services/atendimentoService';
import { mensagensService } from '../services/mensagensService';
import { openChatSocket } from '../services/chatSocket';
import type { AtendimentoApi, Mensagem, MensagemRequest } from '../types/AtendimentoApi';

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

function formatTime(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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

function labelRemetente(remetente?: string) {
  const labels: Record<string, string> = {
    VOLUNTARIO: 'Dentista Voluntário',
    BENEFICIARIO: 'Beneficiário',
    ADMIN: 'Administração',
  };
  return remetente ? labels[remetente] ?? 'Equipe de atendimento' : 'Equipe de atendimento';
}

function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-foreground">{value || 'Não informado'}</p>
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
    AGUARDANDO_RESPOSTA: 'Aguardando resposta',
  };
  return status ? labels[status] ?? status : 'Não enviado';
}

function iaPrevisaoConfig(previsao?: string) {
  if (!previsao) return null;
  const iconClass = 'h-5 w-5';
  const map: Record<string, { cor: string; bg: string; border: string; iconBg: string; icone: ReactNode }> = {
    CONFIRMADO: {
      cor: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" className={iconClass} stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    NAO_COMPARECERA: {
      cor: 'text-red-800', bg: 'bg-red-50', border: 'border-red-200', iconBg: 'bg-red-100',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" className={iconClass} stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="m9 9 6 6m0-6-6 6" strokeLinecap="round" />
        </svg>
      ),
    },
    REAGENDAMENTO_SOLICITADO: {
      cor: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-100',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" className={iconClass} stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="4" y="5.5" width="16" height="14" rx="2" />
          <path d="M8 3.5v4m8-4v4M4 10h16m-5 3-3 3-2-2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    SEM_RESPOSTA: {
      cor: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', iconBg: 'bg-slate-200',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" className={iconClass} stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <circle cx="8" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="16" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    AGUARDANDO_RESPOSTA: {
      cor: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" className={iconClass} stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M8 3h8M8 21h8M9 3v3.2c0 1.3.6 2.5 1.6 3.2L12 10.5l1.4-1.1c1-.8 1.6-2 1.6-3.2V3m0 18v-3.2c0-1.3-.6-2.5-1.6-3.2L12 13.5l-1.4 1.1c-1 .8-1.6 2-1.6 3.2V21" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  };
  return map[previsao] ?? map.SEM_RESPOSTA;
}

function DetalheAtendimento() {
  const { id } = useParams();
  const atendimentoId = Number(id);
  const { user, isBeneficiario } = useAuth();
  const navigate = useNavigate();
  const { confirm, confirmDialog } = useConfirm();

  const [atendimento, setAtendimento] = useState<AtendimentoApi | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [assumindo, setAssumindo] = useState(false);

  // Ref síncrona para rastrear IDs de mensagens já exibidas.
  // Usamos um ref (e não o state) porque o state é assíncrono —
  // quando duas mensagens WebSocket chegam quase ao mesmo tempo,
  // o React pode ainda não ter aplicado o state da primeira quando
  // a segunda chega, fazendo o check "prev.some()" falhar.
  // O ref é atualizado instantaneamente, evitando duplicatas.
  const seenIdsRef = useRef<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens]);

  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState('');
  const [conteudo, setConteudo] = useState('');
  const isSubmittingRef = useRef(false);
  
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


  const carregarDados = async () => {
    if (!Number.isFinite(atendimentoId) || atendimentoId <= 0) {
      setErro('Atendimento inválido.');
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
          msgErro = 'Houve uma falha interna no servidor ao carregar este atendimento. A equipe técnica já foi notificada.';
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

    async function connect() {
      if (cancelled || !atendimentoId) return;

      const clientId = `${remetenteAtual}-${Math.random().toString(36).substring(7)}`;

      try {
        socket = await openChatSocket(atendimentoId, clientId);
        if (cancelled) { socket.close(); return; }
      } catch {
        if (!cancelled) reconnectTimeout = setTimeout(() => { void connect(); }, 10000);
        return;
      }

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

  const semAlteracoes = Boolean(
    atendimento
      && statusEdit === (atendimento.status ?? 'ABERTO')
      && prioridadeEdit === String(atendimento.prioridade ?? 3),
  );

  const confirmarAssumirAtendimento = () => {
    confirm({
      title: 'Assumir Atendimento',
      message: 'Você deseja assumir a responsabilidade por este caso? Ele passará para a sua fila de atendimentos ativos e o beneficiário será notificado.',
      confirmText: 'Sim, assumir caso',
      tone: 'primary',
      details: [
        { label: 'Beneficiário', value: pessoaAtendida },
        { label: 'Status atual', value: labelStatus(atendimento?.status), tone: 'primary' },
      ],
      onConfirm: () => void assumirEsteAtendimento(),
    });
  };

  const enviarMensagem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!conteudo.trim() || chatBloqueado || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setTimeout(() => { isSubmittingRef.current = false; }, 500);

    const texto = conteudo.trim();
    setConteudo('');
    if (composerRef.current) composerRef.current.style.height = '44px';
    setFeedback('');

    try {
      const novaMensagem = await mensagensService.enviarMensagem(atendimentoId, {
        conteudo: texto,
        enviadoPor: remetenteAtual,
      });
      
      if (!seenIdsRef.current.has(novaMensagem.id)) {
        seenIdsRef.current.add(novaMensagem.id);
        setMensagens((atuais) => {
          if (!atuais.some(m => m.id === novaMensagem.id)) {
            return [...atuais, novaMensagem];
          }
          return atuais;
        });
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.');
      setConteudo(texto); // Restaura o texto
    }
  };

  const ajustarAlturaComposer = (element: HTMLTextAreaElement) => {
    element.style.height = '44px';
    element.style.height = `${Math.min(element.scrollHeight, 128)}px`;
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!conteudo.trim() || chatBloqueado) return;
    event.currentTarget.form?.requestSubmit();
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

  const confirmarAlteracaoAtendimento = () => {
    if (!atendimento || semAlteracoes) return;

    const statusAtual = atendimento.status ?? 'ABERTO';
    const statusFinal = statusEdit;
    const acaoCritica = statusFinal === 'ENCERRADO' || statusFinal === 'CANCELADO';
    confirm({
      title: 'Confirmar mudança de status',
      message: acaoCritica
        ? 'Esta alteração finaliza o atendimento e bloqueia novas mensagens no chat. Revise os dados antes de confirmar.'
        : 'Revise a transição abaixo. O beneficiário poderá acompanhar o novo status do atendimento.',
      confirmText: acaoCritica ? 'Confirmar e finalizar' : 'Confirmar alteração',
      tone: acaoCritica ? 'danger' : 'primary',
      details: [
        { label: 'Status atual', value: labelStatus(statusAtual) },
        { label: 'Novo status', value: labelStatus(statusFinal), tone: acaoCritica ? 'danger' : 'primary' },
        { label: 'Prioridade', value: labelPrioridade(prioridadeEdit) },
      ],
      onConfirm: () => void salvarAtendimento(false),
    });
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
      <PageHeader
        variant="compact"
        eyebrow="Atendimento"
        title={atendimento ? `Atendimento de ${pessoaAtendida}` : 'Carregando detalhes...'}
        description="Acompanhe status, responsável e mensagens deste atendimento."
        actions={
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        }
      />

      <Section tone="white">
        {loading && <LoadingState title="Carregando atendimento..." />}
        {erro && <ErrorState title="Não foi possível abrir o atendimento" description={erro} />}

        {!loading && !erro && atendimento && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-bold text-foreground">Detalhes do Atendimento</h2>
                      <Badge tone={statusTone(atendimento.status)}>{labelStatus(atendimento.status)}</Badge>
                    </div>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {atendimento.descricao || 'Sem descricao cadastrada.'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {!isBeneficiario && <InfoItem label="Prioridade" value={labelPrioridade(atendimento.prioridade)} />}
                  <InfoItem label="Data de abertura" value={formatDate(atendimento.dataAbertura ?? atendimento.dataCriacao)} />
                  <InfoItem label="Data de encerramento" value={atendimento.dataEncerramento ? formatDate(atendimento.dataEncerramento) : 'Em aberto'} />
                  <InfoItem label="Canal" value={(atendimento.canalOrigem?.nome ?? atendimento.canal)?.toLowerCase().includes('sistema web') ? 'TDB - Responde' : (atendimento.canalOrigem?.nome ?? atendimento.canal)} />
                  <InfoItem label="Voluntário responsável" value={atendimento.nomeVoluntario ?? atendimento.voluntario?.nome ?? 'Aguardando voluntário'} />
                  <InfoItem label="Pessoa atendida" value={pessoaAtendida} />
                  <InfoItem label="Email da pessoa" value={atendimento.pessoaAtendidaEmail} />
                  <InfoItem label="Telefone da pessoa" value={atendimento.pessoaAtendidaTelefone} />
                </div>
              </Card>

              <Card className="overflow-hidden shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-border bg-surface px-5 py-4 sm:px-6">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Mensagens</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Conversa vinculada ao atendimento.</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    Canal ativo
                  </span>
                </div>

                <div
                  className="max-h-[540px] min-h-72 space-y-3 overflow-y-auto bg-muted/35 p-4 sm:p-6"
                  role="log"
                  aria-live="polite"
                  aria-relevant="additions"
                  aria-label="Histórico de mensagens"
                >
                  {mensagens.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-border bg-surface/80 px-4 py-10 text-center text-sm text-muted-foreground">
                      Nenhuma mensagem enviada ainda.
                    </div>
                  )}

                  {mensagens.map((mensagem) => {
                    const minha = mensagem.enviadoPor === remetenteAtual;
                    return (
                      <div key={mensagem.id} className={`flex ${minha ? 'justify-end' : 'justify-start'}`}>
                        <article className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[78%] ${
                          minha
                            ? 'rounded-br-md bg-primary text-primary-foreground'
                            : 'rounded-bl-md border border-border bg-surface text-foreground'
                        }`}
                        >
                          <header className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs ${minha ? 'text-blue-100' : 'text-muted-foreground'}`}>
                            <span className="font-semibold">
                              {minha ? 'Você · ' : ''}{labelRemetente(mensagem.enviadoPor)}
                            </span>
                            <time dateTime={mensagem.dataHora}>{formatTime(mensagem.dataHora)}</time>
                          </header>
                          <p className="mt-1.5 whitespace-pre-wrap break-words leading-6">{mensagem.conteudo}</p>
                        </article>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} aria-hidden="true" />
                </div>

                <form onSubmit={enviarMensagem} className="border-t border-border bg-surface p-4 sm:p-5">
                  {chatBloqueado && (
                    <div className="mb-4 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
                      Este atendimento está {labelStatus(atendimento.status).toLowerCase()}. O envio de mensagens está bloqueado.
                    </div>
                  )}
                  <label htmlFor="chat-composer" className="sr-only">Nova mensagem</label>
                  <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm transition-[border-color,box-shadow] duration-fast focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20">
                    <textarea
                      ref={composerRef}
                      id="chat-composer"
                      rows={1}
                      value={conteudo}
                      onChange={(event) => {
                        setConteudo(event.target.value);
                        ajustarAlturaComposer(event.target);
                      }}
                      onKeyDown={handleComposerKeyDown}
                      disabled={chatBloqueado}
                      placeholder="Escreva sua mensagem..."
                      className="min-h-11 max-h-32 flex-1 resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-base leading-6 text-foreground outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-muted-foreground"
                    />
                    <Button
                      type="submit"
                      disabled={chatBloqueado || !conteudo.trim()}
                      className="h-11 w-11 shrink-0 rounded-full !px-0"
                      aria-label="Enviar mensagem"
                      title="Enviar mensagem"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="m4 4 16 8-16 8 3-8-3-8Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M7 12h13" strokeLinecap="round" />
                      </svg>
                      <span className="sr-only">Enviar mensagem</span>
                    </Button>
                  </div>
                  <p className="mt-2 px-1 text-xs text-muted-foreground">Enter envia · Shift + Enter adiciona uma nova linha</p>
                </form>
              </Card>
            </div>

            <aside className="space-y-6">
              {feedback && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-primary">
                  {feedback}
                </div>
              )}

              {podeAlterar && atendimento.status === 'ABERTO' && !atendimento.voluntarioId && (
                <Card className="p-6 border border-blue-200 bg-blue-50/50">
                  <h2 className="text-xl font-bold text-foreground">Acolher caso</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Este atendimento está aberto e aguardando um profissional voluntário.</p>
                  <div className="mt-4">
                    <Button 
                      fullWidth 
                      disabled={voluntarioSemVinculo}
                      isLoading={assumindo}
                      loadingText="Assumindo..."
                      onClick={confirmarAssumirAtendimento}
                    >
                      Assumir atendimento
                    </Button>
                    {voluntarioSemVinculo && (
                      <p className="mt-2 text-xs text-red-500">Sua conta de voluntário precisa estar vinculada para assumir casos.</p>
                    )}
                  </div>
                </Card>
              )}

              {podeAlterar && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-foreground">Acoes do atendimento</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Somente voluntários e administradores podem alterar estes campos.</p>

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

                    <Button
                      fullWidth
                      disabled={semAlteracoes}
                      isLoading={salvando}
                      loadingText="Salvando..."
                      onClick={confirmarAlteracaoAtendimento}
                    >
                      Salvar alterações
                    </Button>

                    <Button
                      fullWidth
                      variant="danger"
                      disabled={salvando || atendimento.status === 'ENCERRADO'}
                      onClick={() => {
                        confirm({
                          title: 'Encerrar Atendimento',
                          message: 'Tem certeza que deseja encerrar este atendimento? Ele ficará como somente leitura e não será possível enviar novas mensagens.',
                          confirmText: 'Confirmar e encerrar',
                          tone: 'danger',
                          details: [
                            { label: 'Status atual', value: labelStatus(atendimento.status) },
                            { label: 'Novo status', value: labelStatus('ENCERRADO'), tone: 'danger' },
                            { label: 'Impacto', value: 'Atendimento e chat finalizados', tone: 'danger' },
                          ],
                          onConfirm: () => void salvarAtendimento(true)
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
                  <h2 className="text-xl font-bold text-foreground">Check-in via WhatsApp</h2>
                  
                  <div className="mt-4 text-sm text-muted-foreground">
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
                      <div className={`mt-4 flex gap-3 rounded-xl border px-4 py-3 ${cfg.bg} ${cfg.border}`}>
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.iconBg} ${cfg.cor}`}>
                          {cfg.icone}
                        </span>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold uppercase tracking-widest ${cfg.cor}`}>
                            Previsão da Inteligência Artificial
                          </p>
                          <p className={`mt-1 text-sm font-semibold ${cfg.cor}`}>
                            {labelStatusCheckin(atendimento.previsaoCheckin)}
                            {pct !== null && <span className="ml-2 font-medium opacity-75">({pct}% de confiança)</span>}
                          </p>
                        </div>
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

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        disabled={salvandoCheckin}
                        onClick={() => void handleAlterarCheckin('CONFIRMADO')}
                        className="!border-emerald-200 !bg-emerald-50 !text-emerald-800 hover:!bg-emerald-100"
                      >
                        Confirmou
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={salvandoCheckin}
                        onClick={() => void handleAlterarCheckin('NAO_COMPARECERA')}
                        className="!border-red-200 !bg-red-50 !text-red-800 hover:!bg-red-100"
                      >
                        Não vai
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={salvandoCheckin}
                        onClick={() => void handleAlterarCheckin('REAGENDAMENTO_SOLICITADO')}
                        className="!border-amber-200 !bg-amber-50 !text-amber-800 hover:!bg-amber-100"
                      >
                        Reagendar
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={salvandoCheckin}
                        onClick={() => void handleAlterarCheckin('SEM_RESPOSTA')}
                        className="!border-slate-200 !bg-slate-50 !text-slate-700 hover:!bg-slate-100"
                      >
                        Sem resposta
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {!podeAlterar && (
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-foreground">Acompanhamento</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Você pode acompanhar os detalhes e conversar pelo chat. Alterações de status e prioridade ficam com a equipe responsável.
                  </p>
                </Card>
              )}
            </aside>
          </div>
        )}
      </Section>
      {confirmDialog}
    </PageShell>
  );
}

export default DetalheAtendimento;
