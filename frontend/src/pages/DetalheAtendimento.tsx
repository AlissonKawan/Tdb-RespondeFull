import { useEffect, useMemo, useState, useRef, type ChangeEvent, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Section from '../components/layout/Section';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ErrorState, LoadingState } from '../components/ui/FeedbackState';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../context/useAuth';
import { useConfirm } from '../hooks/useConfirm';
import { atendimentoService } from '../services/atendimentoService';
import { agendaService, type AgendaConsulta } from '../services/agendaService';
import { prontuarioService, type Prontuario } from '../services/prontuarioService';
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

function MidiaMensagem({ mensagem }: { mensagem: Mensagem }) {
  const [src, setSrc] = useState('');
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (!mensagem.arquivoUrl) return;
    let ativo = true;
    let objectUrl = '';

    mensagensService.carregarMidia(mensagem.arquivoUrl)
      .then((blob) => {
        if (!ativo) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (ativo) setErro(true);
      });

    return () => {
      ativo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mensagem.arquivoUrl]);

  if (erro) {
    return <p className="mt-2 text-xs font-semibold">Não foi possível carregar esta mídia.</p>;
  }
  if (!src) {
    return <p className="mt-2 text-xs opacity-75">Carregando mídia...</p>;
  }
  if (mensagem.tipoMensagem === 'IMAGEM') {
    return (
      <button
        type="button"
        className="mt-2 block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => window.open(src, '_blank', 'noopener,noreferrer')}
        aria-label="Abrir foto em uma nova aba"
      >
        <img src={src} alt="Foto enviada" className="max-h-60 max-w-full cursor-pointer object-cover sm:max-w-xs" />
      </button>
    );
  }
  return <audio controls src={src} className="mt-2 max-w-full" preload="metadata" />;
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
  const inputFotoRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens]);

  useEffect(() => () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const [erro, setErro] = useState('');
  const [feedback, setFeedback] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [gravando, setGravando] = useState(false);
  const [enviandoMidia, setEnviandoMidia] = useState(false);
  const isSubmittingRef = useRef(false);
  
  const [salvando, setSalvando] = useState(false);
  const [salvandoCheckin, setSalvandoCheckin] = useState(false);
  const [statusEdit, setStatusEdit] = useState('ABERTO');
  const [prioridadeEdit, setPrioridadeEdit] = useState('3');

  // --- Estados de Agenda e Prontuário no Atendimento ---
  const [agendasAtendimento, setAgendasAtendimento] = useState<AgendaConsulta[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [modalAgendaAberto, setModalAgendaAberto] = useState(false);
  const [editandoAgendaId, setEditandoAgendaId] = useState<number | null>(null);
  const [agendaTipo, setAgendaTipo] = useState('Avaliação Inicial');
  const [agendaData, setAgendaData] = useState(() => new Date().toISOString().split('T')[0]);
  const [agendaHorario, setAgendaHorario] = useState('08:00');
  const [agendaStatus, setAgendaStatus] = useState('AGUARDANDO');
  const [erroFormAgenda, setErroFormAgenda] = useState('');
  const [salvandoAgenda, setSalvandoAgenda] = useState(false);

  const [prontuarios, setProntuarios] = useState<Prontuario[]>([]);
  const [loadingProntuario, setLoadingProntuario] = useState(false);
  const [historicoMedicoInput, setHistoricoMedicoInput] = useState('');
  const [tratamentoAtualInput, setTratamentoAtualInput] = useState('');
  const [erroFormProntuario, setErroFormProntuario] = useState('');
  const [salvandoProntuario, setSalvandoProntuario] = useState(false);

  const podeAlterar = user?.tipoUsuario === 'VOLUNTARIO' || user?.tipoUsuario === 'ADMIN';
  const remetenteAtual = getSender(user?.tipoUsuario);
  const chatBloqueado = atendimento?.status === 'ENCERRADO' || atendimento?.status === 'CANCELADO';

  const voluntarioId = user?.voluntarioId;
  const voluntarioSemVinculo = user?.tipoUsuario === 'VOLUNTARIO' && !voluntarioId;

  const carregarAgendaEProntuario = (idAtend: number) => {
    if (!podeAlterar || !Number.isFinite(idAtend) || idAtend <= 0) return;

    if (typeof agendaService?.buscarPorAtendimento === 'function') {
      setLoadingAgenda(true);
      agendaService.buscarPorAtendimento(idAtend)
        .then(lista => {
          if (Array.isArray(lista)) setAgendasAtendimento(lista);
        })
        .catch(() => {})
        .finally(() => setLoadingAgenda(false));
    }

    if (typeof prontuarioService?.buscarPorAtendimento === 'function') {
      setLoadingProntuario(true);
      prontuarioService.buscarPorAtendimento(idAtend)
        .then(lista => {
          if (Array.isArray(lista)) setProntuarios(lista);
        })
        .catch(() => {})
        .finally(() => setLoadingProntuario(false));
    }
  };

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

      carregarAgendaEProntuario(atendimentoId);

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

  const adicionarMensagem = (novaMensagem: Mensagem) => {
    if (seenIdsRef.current.has(novaMensagem.id)) return;
    seenIdsRef.current.add(novaMensagem.id);
    setMensagens((atuais) => (
      atuais.some((mensagem) => mensagem.id === novaMensagem.id)
        ? atuais
        : [...atuais, novaMensagem]
    ));
  };

  const enviarPayload = async (payload: MensagemRequest) => {
    const novaMensagem = await mensagensService.enviarMensagem(atendimentoId, payload);
    adicionarMensagem(novaMensagem);
  };

  const enviarMensagem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!conteudo.trim() || chatBloqueado || enviandoMidia || gravando || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setTimeout(() => { isSubmittingRef.current = false; }, 500);

    const texto = conteudo.trim();
    setConteudo('');
    if (composerRef.current) composerRef.current.style.height = '44px';
    setFeedback('');

    try {
      await enviarPayload({
        conteudo: texto,
        enviadoPor: remetenteAtual,
      });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.');
      setConteudo(texto); // Restaura o texto
    }
  };

  const selecionarFoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    event.target.value = '';
    if (!arquivo || chatBloqueado || enviandoMidia) return;
    if (!arquivo.type.startsWith('image/')) {
      setFeedback('Selecione um arquivo de imagem válido.');
      return;
    }

    const legenda = conteudo.trim();
    setEnviandoMidia(true);
    setFeedback('');
    try {
      const upload = await mensagensService.uploadMidia(arquivo);
      await enviarPayload({
        conteudo: legenda,
        enviadoPor: remetenteAtual,
        tipoMensagem: 'IMAGEM',
        arquivoUrl: upload.arquivoUrl,
        mimeType: upload.mimeType,
      });
      setConteudo('');
      if (composerRef.current) composerRef.current.style.height = '44px';
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível enviar a foto.');
    } finally {
      setEnviandoMidia(false);
    }
  };

  const liberarMicrofone = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const iniciarGravacao = async () => {
    if (chatBloqueado || enviandoMidia || gravando) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setFeedback('A gravação de áudio não é compatível com este navegador.');
      return;
    }

    setFeedback('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = (evento) => {
        if (evento.data.size > 0) audioChunksRef.current.push(evento.data);
      };
      recorder.start();
      setGravando(true);
    } catch {
      liberarMicrofone();
      setFeedback('Não foi possível acessar o microfone. Verifique a permissão do navegador.');
    }
  };

  const pararGravacao = () => new Promise<Blob>((resolve, reject) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') {
      reject(new Error('Nenhuma gravação está em andamento.'));
      return;
    }
    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      liberarMicrofone();
      setGravando(false);
      if (blob.size === 0) reject(new Error('O áudio gravado ficou vazio. Tente novamente.'));
      else resolve(blob);
    };
    recorder.onerror = () => {
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      liberarMicrofone();
      setGravando(false);
      reject(new Error('A gravação de áudio foi interrompida.'));
    };
    recorder.stop();
  });

  const cancelarGravacao = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === 'recording') {
      recorder.onstop = () => {
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        liberarMicrofone();
      };
      recorder.stop();
    } else {
      liberarMicrofone();
    }
    setGravando(false);
  };

  const enviarAudio = async () => {
    if (!gravando || enviandoMidia) return;
    setEnviandoMidia(true);
    setFeedback('');
    try {
      const audio = await pararGravacao();
      const extensao = audio.type.includes('mp4') ? 'mp4' : 'webm';
      const upload = await mensagensService.uploadMidia(audio, extensao);
      await enviarPayload({
        conteudo: '',
        enviadoPor: remetenteAtual,
        tipoMensagem: 'AUDIO',
        arquivoUrl: upload.arquivoUrl,
        mimeType: upload.mimeType,
      });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível enviar o áudio.');
    } finally {
      setEnviandoMidia(false);
    }
  };

  const ajustarAlturaComposer = (element: HTMLTextAreaElement) => {
    element.style.height = '44px';
    element.style.height = `${Math.min(element.scrollHeight, 128)}px`;
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!conteudo.trim() || chatBloqueado || enviandoMidia || gravando) return;
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

  const abrirModalNovaAgenda = () => {
    setEditandoAgendaId(null);
    setAgendaTipo('Avaliação Inicial');
    setAgendaData(new Date().toISOString().split('T')[0]);
    setAgendaHorario('08:00');
    setAgendaStatus('AGUARDANDO');
    setErroFormAgenda('');
    setModalAgendaAberto(true);
  };

  const abrirModalEditarAgenda = (agenda: AgendaConsulta) => {
    setEditandoAgendaId(agenda.id ?? null);
    setAgendaTipo(agenda.tipo || 'Avaliação Inicial');
    setAgendaData(agenda.dataConsulta || new Date().toISOString().split('T')[0]);
    setAgendaHorario(agenda.horario || '08:00');
    setAgendaStatus(agenda.status || 'AGUARDANDO');
    setErroFormAgenda('');
    setModalAgendaAberto(true);
  };

  const salvarAgendaDoAtendimento = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!atendimento || !podeAlterar) return;

    if (!agendaTipo.trim()) {
      setErroFormAgenda('Informe o tipo da consulta.');
      return;
    }
    if (!agendaData.trim()) {
      setErroFormAgenda('Informe a data da consulta.');
      return;
    }
    if (!agendaHorario.trim() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(agendaHorario.trim())) {
      setErroFormAgenda('Informe um horário válido no formato HH:mm.');
      return;
    }

    setSalvandoAgenda(true);
    setErroFormAgenda('');
    try {
      const payload: AgendaConsulta = {
        voluntarioId: user?.id ?? user?.voluntarioId ?? atendimento.voluntarioId ?? 1,
        atendimentoId: atendimento.id,
        paciente: pessoaAtendida,
        tipo: agendaTipo.trim(),
        dataConsulta: agendaData.trim(),
        horario: agendaHorario.trim(),
        status: agendaStatus,
        tipoPessoa: atendimento.tipoPessoa || 'OUTRO',
      };

      if (editandoAgendaId) {
        const atualizada = await agendaService.atualizar(editandoAgendaId, payload);
        setAgendasAtendimento(prev => prev.map(a => a.id === editandoAgendaId ? atualizada : a));
        setFeedback('Consulta da agenda atualizada com sucesso!');
      } else {
        const criada = await agendaService.criar(payload);
        setAgendasAtendimento(prev => [...prev, criada]);
        setFeedback('Consulta agendada e vinculada ao atendimento com sucesso!');
      }
      setModalAgendaAberto(false);
    } catch (error) {
      setErroFormAgenda(error instanceof Error && error.message ? error.message : 'Erro ao salvar consulta na agenda.');
    } finally {
      setSalvandoAgenda(false);
    }
  };

  const salvarEvolucaoProntuario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!atendimento || !podeAlterar) return;

    if (!tratamentoAtualInput.trim()) {
      setErroFormProntuario('Descreva o procedimento ou evolução clínica realizada.');
      return;
    }

    setSalvandoProntuario(true);
    setErroFormProntuario('');
    try {
      const agendaPrincipal = agendasAtendimento[agendasAtendimento.length - 1];
      const novoProntuario: Prontuario = {
        voluntarioId: user?.id ?? user?.voluntarioId ?? atendimento.voluntarioId ?? 1,
        atendimentoId: atendimento.id,
        agendaId: agendaPrincipal?.id ?? null,
        paciente: pessoaAtendida,
        historicoMedico: historicoMedicoInput.trim(),
        tratamentoAtual: tratamentoAtualInput.trim(),
      };
      const criado = await prontuarioService.registrarEvolucao(novoProntuario);
      setProntuarios(prev => [criado, ...prev]);
      setHistoricoMedicoInput('');
      setTratamentoAtualInput('');
      setFeedback('Evolução registrada no prontuário com sucesso!');
    } catch (error) {
      setErroFormProntuario(error instanceof Error && error.message ? error.message : 'Erro ao registrar evolução no prontuário.');
    } finally {
      setSalvandoProntuario(false);
    }
  };

  const alertasMedicosAtuais = useMemo(() => {
    const tags = new Set<string>();
    prontuarios.forEach(p => {
      if (p.historicoMedico) {
        p.historicoMedico.split(',').forEach(tag => {
          const t = tag.trim();
          if (t) tags.add(t);
        });
      }
    });
    return Array.from(tags);
  }, [prontuarios]);

  const ultimaEvolucao = prontuarios.length > 0 ? prontuarios[0] : null;

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
        {loading && <LoadingState title="Carregando atendimento..." count={1} className="md:grid-cols-1 xl:grid-cols-1" />}
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

              {podeAlterar && (
                <Card className="p-6 border border-slate-200 shadow-sm">
                  <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-foreground">Prontuário Clínico do Paciente</h2>
                        <Badge tone={prontuarios.length > 0 ? 'success' : 'neutral'}>
                          {prontuarios.length > 0 ? `${prontuarios.length} registro(s)` : 'Sem registros'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Situação clínica atual e evoluções odontológicas vinculadas a este atendimento e agenda.
                      </p>
                    </div>
                  </div>

                  {/* Situação Atual do Prontuário */}
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-red-700">
                        Alertas Médicos / Anamnese
                      </p>
                      {alertasMedicosAtuais.length > 0 ? (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {alertasMedicosAtuais.map((alerta, idx) => (
                            <Badge key={idx} tone="danger">{alerta}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-600">Nenhum alerta médico ou alergia registrado até o momento.</p>
                      )}
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                        Situação Atual / Último Tratamento
                      </p>
                      {ultimaEvolucao ? (
                        <div className="mt-2">
                          <p className="text-sm font-semibold text-slate-800 whitespace-pre-wrap">{ultimaEvolucao.tratamentoAtual}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Registrado em: {ultimaEvolucao.dataRegistro ? formatDate(ultimaEvolucao.dataRegistro) : 'Recente'}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-600">Nenhuma evolução clínica registrada para este paciente ainda.</p>
                      )}
                    </div>
                  </div>

                  {/* Formulário para Registrar Nova Evolução Direto no Atendimento */}
                  <form onSubmit={salvarEvolucaoProntuario} noValidate className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                      Registrar Evolução no Prontuário
                    </h3>
                    <div className="grid gap-4">
                      <Field label="Alertas Médicos / Anamnese" hint="Separe múltiplos alertas por vírgula (ex: Alérgico a Penicilina, Hipertenso)">
                        <Input
                          disabled={salvandoProntuario}
                          value={historicoMedicoInput}
                          onChange={(e) => setHistoricoMedicoInput(e.target.value)}
                          placeholder="Ex: Alérgico a Dipirona, Diabético"
                        />
                      </Field>
                      <Field label="Procedimento / Evolução Clínica Realizada" error={erroFormProntuario || undefined}>
                        <Textarea
                          disabled={salvandoProntuario}
                          value={tratamentoAtualInput}
                          onChange={(e) => {
                            setTratamentoAtualInput(e.target.value);
                            if (erroFormProntuario) setErroFormProntuario('');
                          }}
                          className="min-h-[88px]"
                          placeholder="Descreva a situação atual do prontuário, dentes avaliados/tratados e conduta..."
                        />
                      </Field>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={salvandoProntuario}>
                        {salvandoProntuario ? 'Salvando evolução...' : 'Salvar Evolução no Prontuário'}
                      </Button>
                    </div>
                  </form>

                  {/* Histórico de Evoluções */}
                  <div className="mt-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
                      Histórico Clínico do Caso
                    </h3>
                    {loadingProntuario && prontuarios.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Carregando prontuário...</p>
                    ) : prontuarios.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                        Nenhum histórico clínico registrado neste atendimento.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {prontuarios.map((item, idx) => (
                          <div key={item.id ?? idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                                {item.dataRegistro ? formatDate(item.dataRegistro) : 'Agora'}
                              </span>
                              {item.agendaId ? (
                                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                  Consulta #{item.agendaId}
                                </span>
                              ) : null}
                            </div>
                            {item.historicoMedico && (
                              <div className="mb-2 flex flex-wrap gap-1.5">
                                {item.historicoMedico.split(',').map((tag, i) => tag.trim() ? (
                                  <Badge key={i} tone="danger">{tag.trim()}</Badge>
                                ) : null)}
                              </div>
                            )}
                            <p className="text-sm text-slate-800 whitespace-pre-wrap">{item.tratamentoAtual}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              )}

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
                    const tipoMensagem = mensagem.tipoMensagem ?? 'TEXTO';
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
                          {tipoMensagem === 'TEXTO' && (
                            <p className="mt-1.5 whitespace-pre-wrap break-words leading-6">{mensagem.conteudo}</p>
                          )}
                          {(tipoMensagem === 'IMAGEM' || tipoMensagem === 'AUDIO') && mensagem.arquivoUrl && (
                            <MidiaMensagem mensagem={mensagem} />
                          )}
                          {tipoMensagem === 'IMAGEM' && mensagem.conteudo?.trim() && (
                            <p className="mt-2 whitespace-pre-wrap break-words leading-6">{mensagem.conteudo}</p>
                          )}
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
                  <input
                    ref={inputFotoRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={selecionarFoto}
                    disabled={chatBloqueado || enviandoMidia || gravando}
                    aria-label="Selecionar foto"
                  />
                  {gravando && (
                    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="status">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
                      <span className="mr-auto font-semibold">Gravando...</span>
                      <Button type="button" variant="secondary" onClick={cancelarGravacao} disabled={enviandoMidia}>
                        Cancelar
                      </Button>
                      <Button type="button" onClick={() => void enviarAudio()} disabled={enviandoMidia}>
                        {enviandoMidia ? 'Enviando...' : 'Enviar áudio'}
                      </Button>
                    </div>
                  )}
                  <label htmlFor="chat-composer" className="sr-only">Nova mensagem</label>
                  <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm transition-[border-color,box-shadow] duration-fast focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20">
                    <button
                      type="button"
                      onClick={() => inputFotoRef.current?.click()}
                      disabled={chatBloqueado || enviandoMidia || gravando}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Enviar foto"
                      title="Enviar foto"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        <path d="M19 13.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => void iniciarGravacao()}
                      disabled={chatBloqueado || enviandoMidia || gravando}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Gravar áudio"
                      title="Gravar áudio"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <rect x="9" y="3" width="6" height="11" rx="3" />
                        <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" strokeLinecap="round" />
                      </svg>
                    </button>
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
                      disabled={chatBloqueado || enviandoMidia || gravando}
                      placeholder="Escreva sua mensagem..."
                      className="min-h-11 max-h-32 flex-1 resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-base leading-6 text-foreground outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-muted-foreground"
                    />
                    <Button
                      type="submit"
                      disabled={chatBloqueado || enviandoMidia || gravando || !conteudo.trim()}
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
                  <p className="mt-2 px-1 text-xs text-muted-foreground">
                    {enviandoMidia ? 'Enviando mídia...' : 'Enter envia · Shift + Enter adiciona uma nova linha'}
                  </p>
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
                <Card className="p-6 border-l-4 border-l-primary">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xl font-bold text-foreground">Agenda do Atendimento</h2>
                    <Badge tone={agendasAtendimento.length > 0 ? 'success' : 'warning'}>
                      {agendasAtendimento.length > 0 ? 'Vinculada' : 'Pendente'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Todo atendimento deve possuir um agendamento de consulta vinculado.
                  </p>

                  {loadingAgenda && agendasAtendimento.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">Verificando agenda...</p>
                  ) : agendasAtendimento.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      <p className="font-semibold">Nenhuma consulta agendada para este atendimento.</p>
                      <p className="mt-1 text-xs text-amber-800">
                        Agende a consulta deste paciente para integrá-lo à sua agenda clínica.
                      </p>
                      <Button fullWidth className="mt-3" onClick={abrirModalNovaAgenda}>
                        Agendar Consulta
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {agendasAtendimento.map((ag) => (
                        <div key={ag.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900">{ag.tipo}</span>
                            <Badge tone={ag.status === 'CONCLUIDO' ? 'success' : ag.status === 'AGUARDANDO' ? 'warning' : 'info'}>
                              {ag.status}
                            </Badge>
                          </div>
                          <p className="mt-1.5 text-slate-700 font-medium">
                            Data: <strong>{ag.dataConsulta}</strong> às <strong>{ag.horario}</strong>
                          </p>
                          <div className="mt-3 flex gap-2">
                            <Button variant="secondary" onClick={() => abrirModalEditarAgenda(ag)}>
                              Editar Horário
                            </Button>
                            <Button variant="ghost" onClick={() => navigate('/agenda')}>
                              Ver na Agenda
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button variant="secondary" fullWidth onClick={abrirModalNovaAgenda}>
                        Agendar Nova Consulta / Retorno
                      </Button>
                    </div>
                  )}
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

      {modalAgendaAberto && atendimento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                {editandoAgendaId ? 'Editar Consulta do Atendimento' : 'Agendar Consulta para Atendimento'}
              </h2>
              <button
                type="button"
                onClick={() => !salvandoAgenda && setModalAgendaAberto(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Fechar modal"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Paciente: <strong>{pessoaAtendida}</strong> · Atendimento <strong>#{atendimento.id}</strong>
            </p>
            <form onSubmit={salvarAgendaDoAtendimento} noValidate className="space-y-4">
              <Field label="Tipo de Consulta">
                <Input
                  disabled={salvandoAgenda}
                  value={agendaTipo}
                  onChange={(e) => setAgendaTipo(e.target.value)}
                  placeholder="Ex: Avaliação Inicial"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Data da Consulta">
                  <Input
                    type="date"
                    disabled={salvandoAgenda}
                    value={agendaData}
                    onChange={(e) => setAgendaData(e.target.value)}
                  />
                </Field>
                <Field label="Horário">
                  <Input
                    type="time"
                    disabled={salvandoAgenda}
                    value={agendaHorario}
                    onChange={(e) => setAgendaHorario(e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Status da Consulta">
                <Select
                  disabled={salvandoAgenda}
                  value={agendaStatus}
                  onChange={(e) => setAgendaStatus(e.target.value)}
                >
                  <option value="AGUARDANDO">Aguardando</option>
                  <option value="CONFIRMADO">Confirmado</option>
                  <option value="CONCLUIDO">Concluído (Atendido)</option>
                  <option value="ENCERRADO">Encerrado / Desistência</option>
                </Select>
              </Field>
              {erroFormAgenda && (
                <p role="alert" className="text-sm font-medium text-danger">{erroFormAgenda}</p>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <Button type="button" variant="secondary" disabled={salvandoAgenda} onClick={() => setModalAgendaAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={salvandoAgenda}>
                  {salvandoAgenda ? 'Salvando...' : 'Salvar Agendamento'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {confirmDialog}
    </PageShell>
  );
}

export default DetalheAtendimento;

