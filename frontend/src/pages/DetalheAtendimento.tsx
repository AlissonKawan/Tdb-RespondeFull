import { useEffect, useLayoutEffect, useMemo, useState, useRef, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ErrorState, LoadingState } from '../components/ui/FeedbackState';
import { Field, Input, Select, Textarea } from '../components/ui/Input';
import { Dialog } from '../components/ui/ConfirmDialog';
import AtendimentoIcon from '../components/atendimento/AtendimentoIcon';
import AtendimentoPanel, { PainelSecao } from '../components/atendimento/AtendimentoPanel';
import ImagemAmpliada from '../components/chat/ImagemAmpliada';
import './DetalheAtendimento.css';
import { useAuth } from '../context/useAuth';
import { useConfirm } from '../hooks/useConfirm';
import { atendimentoService } from '../services/atendimentoService';
import { agendaService, type AgendaConsulta } from '../services/agendaService';
import { prontuarioService, type Prontuario } from '../services/prontuarioService';
import { mensagensService } from '../services/mensagensService';
import { ApiError } from '../services/apiClient';
import { openChatSocket } from '../services/chatSocket';
import type { AtendimentoApi, Mensagem, MensagemRequest } from '../types/AtendimentoApi';

const STATUS_OPTIONS = ['ABERTO', 'EM_ATENDIMENTO', 'ENCERRADO', 'CANCELADO'] as const;
const TAMANHO_PAGINA_MENSAGENS = 50;
const ERRO_HISTORICO_MENSAGENS = 'Não foi possível carregar mensagens anteriores. Role a conversa novamente para tentar.';

function statusTone(status?: string) {
  if (status === 'ENCERRADO') return 'neutral';
  if (status === 'CANCELADO') return 'danger';
  if (status === 'EM_ATENDIMENTO') return 'success';
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
    '3': '3 - Média',
    '4': '4 - Baixa',
    '5': '5 - Acompanhamento',
  };
  return prioridade === undefined || prioridade === '' ? 'Não avaliada' : labels[String(prioridade)] ?? String(prioridade);
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
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 border-b border-border/60 py-1 last:border-0">
      <dt className="text-xs leading-5 text-muted-foreground">{label}</dt>
      <dd className="break-words text-xs font-medium leading-5 text-foreground">{value || 'Não informado'}</dd>
    </div>
  );
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

function MidiaMensagem({ mensagem }: { mensagem: Mensagem }) {
  const [src, setSrc] = useState('');
  const [erro, setErro] = useState(false);
  const [visualizando, setVisualizando] = useState(false);
  const [visivel, setVisivel] = useState(false);
  const placeholderRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const elemento = placeholderRef.current;
    if (!elemento || typeof IntersectionObserver === 'undefined') {
      setVisivel(true);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisivel(true);
        observer.disconnect();
      }
    }, { root: elemento.closest('[role="log"]'), rootMargin: '300px' });
    observer.observe(elemento);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visivel || !mensagem.arquivoUrl) return;
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
  }, [mensagem.arquivoUrl, visivel]);

  if (erro) {
    return <p className="mt-2 text-xs font-semibold">Não foi possível carregar esta mídia.</p>;
  }
  if (!src) {
    return <p ref={placeholderRef} className="mt-2 text-xs opacity-75">Carregando mídia...</p>;
  }
  if (mensagem.tipoMensagem === 'IMAGEM') {
    return (
      <>
        <button
          type="button"
          className="mt-2 block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setVisualizando(true)}
          aria-label="Ampliar foto na conversa"
        >
          <img src={src} alt="Foto enviada" className="max-h-60 max-w-full cursor-zoom-in object-cover sm:max-w-xs" />
        </button>
        {visualizando && <ImagemAmpliada src={src} legenda={mensagem.conteudo} onClose={() => setVisualizando(false)} />}
      </>
    );
  }
  return <audio controls src={src} className="mt-2 max-w-full" preload="metadata" />;
}

function DetalheAtendimento() {
  const { id } = useParams();
  const atendimentoId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { confirm, confirmDialog } = useConfirm();

  const [atendimento, setAtendimento] = useState<AtendimentoApi | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [painelAberto, setPainelAberto] = useState(() => window.matchMedia('(min-width: 1280px)').matches);
  const painelButtonRef = useRef<HTMLButtonElement>(null);
  const [modalProntuario, setModalProntuario] = useState<'historico' | 'evolucao' | null>(null);
  const [erroAgenda, setErroAgenda] = useState('');
  const [erroProntuario, setErroProntuario] = useState('');

  const [assumindo, setAssumindo] = useState(false);

  // Ref síncrona para rastrear IDs de mensagens já exibidas.
  // Usamos um ref (e não o state) porque o state é assíncrono —
  // quando duas mensagens WebSocket chegam quase ao mesmo tempo,
  // o React pode ainda não ter aplicado o state da primeira quando
  // a segunda chega, fazendo o check "prev.some()" falhar.
  // O ref é atualizado instantaneamente, evitando duplicatas.
  const seenIdsRef = useRef<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historicoRef = useRef<HTMLDivElement>(null);
  const paginaAnteriorRef = useRef<{ antesId?: number; temMais: boolean; carregando: boolean }>({ temMais: false, carregando: false });
  const ancoraHistoricoRef = useRef<{ altura: number; topo: number } | null>(null);
  const geracaoCargaRef = useRef(0);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const inputFotoRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useLayoutEffect(() => {
    const ancora = ancoraHistoricoRef.current;
    if (ancora && historicoRef.current) {
      historicoRef.current.scrollTop = ancora.topo + historicoRef.current.scrollHeight - ancora.altura;
      ancoraHistoricoRef.current = null;
      return;
    }
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
    }
  }, [mensagens]);

  useEffect(() => () => { geracaoCargaRef.current++; }, [atendimentoId, user?.id]);

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
  const [prioridadeEdit, setPrioridadeEdit] = useState('');

  // --- Estados de Agenda e Prontuário no Atendimento ---
  const [agendasAtendimento, setAgendasAtendimento] = useState<AgendaConsulta[]>([]);
  const [referenciaAgenda, setReferenciaAgenda] = useState(() => Date.now());
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

  const ehAdmin = user?.tipoUsuario === 'ADMIN';
  const podeAlterar = user?.tipoUsuario === 'VOLUNTARIO' || ehAdmin;
  const remetenteAtual = getSender(user?.tipoUsuario);
  const chatBloqueado = atendimento?.status === 'ENCERRADO' || atendimento?.status === 'CANCELADO';

  const voluntarioId = user?.voluntarioId;
  const voluntarioSemVinculo = user?.tipoUsuario === 'VOLUNTARIO' && !voluntarioId;
  const podeAcessarConversa = Boolean(atendimento && (
    user?.tipoUsuario === 'ADMIN' || user?.tipoUsuario === 'BENEFICIARIO'
    || (user?.tipoUsuario === 'VOLUNTARIO' && voluntarioId != null && voluntarioId === atendimento.voluntarioId)
  ));

  const carregarAgendaEProntuario = (idAtend: number) => {
    if (!podeAlterar || !Number.isFinite(idAtend) || idAtend <= 0) return;

    if (typeof agendaService?.buscarPorAtendimento === 'function') {
      setLoadingAgenda(true);
      setErroAgenda('');
      agendaService.buscarPorAtendimento(idAtend)
        .then(lista => {
          if (Array.isArray(lista)) {
            setAgendasAtendimento(lista);
            setReferenciaAgenda(Date.now());
          }
        })
        .catch(() => setErroAgenda('Não foi possível carregar a agenda. Tente novamente.'))
        .finally(() => setLoadingAgenda(false));
    }

    if (typeof prontuarioService?.buscarPorAtendimento === 'function') {
      setLoadingProntuario(true);
      setErroProntuario('');
      prontuarioService.buscarPorAtendimento(idAtend)
        .then(lista => {
          if (Array.isArray(lista)) setProntuarios(lista);
        })
        .catch(() => setErroProntuario('Não foi possível carregar o prontuário. Tente novamente.'))
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
    const geracao = ++geracaoCargaRef.current;
    if (!Number.isFinite(atendimentoId) || atendimentoId <= 0) {
      setErro('Atendimento inválido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro('');
    try {
      // As permissoes sao verificadas no servidor; as duas leituras podem iniciar juntas.
      const [dadosAtendimento, resultadoMensagens] = await Promise.all([
        atendimentoService.buscarPorId(atendimentoId),
        mensagensService.getMensagensAtendimento(atendimentoId, { limite: TAMANHO_PAGINA_MENSAGENS }).then(
          mensagens => ({ mensagens, erro: undefined as unknown }),
          (erro: unknown) => ({ mensagens: [] as Mensagem[], erro }),
        ),
      ]);
      if (geracao !== geracaoCargaRef.current) return;
      const podeConversar = user?.tipoUsuario === 'ADMIN'
        || user?.tipoUsuario === 'BENEFICIARIO'
        || (user?.tipoUsuario === 'VOLUNTARIO' && user.voluntarioId != null && user.voluntarioId === dadosAtendimento.voluntarioId);
      if (resultadoMensagens.erro && (podeConversar
        || !(resultadoMensagens.erro instanceof ApiError && resultadoMensagens.erro.status === 403))) {
        throw resultadoMensagens.erro;
      }
      const dadosMensagens = podeConversar ? resultadoMensagens.mensagens : [];
      paginaAnteriorRef.current = {
        antesId: dadosMensagens[0]?.id,
        temMais: dadosMensagens.length === TAMANHO_PAGINA_MENSAGENS,
        carregando: false,
      };
      seenIdsRef.current = new Set(dadosMensagens.map(m => m.id));
      setAtendimento(dadosAtendimento);
      setMensagens(dadosMensagens);
      setStatusEdit(dadosAtendimento.status ?? 'ABERTO');
      setPrioridadeEdit(String(dadosAtendimento.prioridade ?? ''));

      if (podeConversar) carregarAgendaEProntuario(atendimentoId);

    } catch (error) {
      if (geracao !== geracaoCargaRef.current) return;
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
      if (geracao === geracaoCargaRef.current) setLoading(false);
    }
  };

  const carregarMensagensAnteriores = async () => {
    const pagina = paginaAnteriorRef.current;
    const historico = historicoRef.current;
    if (!historico || historico.scrollTop > 80 || !pagina.temMais || pagina.carregando) return;
    pagina.carregando = true;
    const geracao = geracaoCargaRef.current;
    try {
      const anteriores = await mensagensService.getMensagensAtendimento(atendimentoId, {
        limite: TAMANHO_PAGINA_MENSAGENS, antesId: pagina.antesId,
      });
      if (geracao !== geracaoCargaRef.current || pagina !== paginaAnteriorRef.current) return;
      setFeedback(atual => atual === ERRO_HISTORICO_MENSAGENS ? '' : atual);
      pagina.antesId = anteriores[0]?.id ?? pagina.antesId;
      pagina.temMais = anteriores.length === TAMANHO_PAGINA_MENSAGENS;
      const novas = anteriores.filter(mensagem => !seenIdsRef.current.has(mensagem.id));
      novas.forEach(mensagem => seenIdsRef.current.add(mensagem.id));
      if (novas.length) {
        ancoraHistoricoRef.current = { altura: historico.scrollHeight, topo: historico.scrollTop };
        setMensagens(atuais => [...novas, ...atuais]);
      }
    } catch {
      if (geracao === geracaoCargaRef.current) {
        setFeedback(ERRO_HISTORICO_MENSAGENS);
      }
    } finally {
      pagina.carregando = false;
    }
  };

  useEffect(() => {
    void carregarDados();
  }, [atendimentoId, user?.id]);

  useEffect(() => {
    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;

    async function connect() {
      if (cancelled || !atendimentoId || !podeAcessarConversa) return;

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
                  paginaAnteriorRef.current = { temMais: false, carregando: false };
                  setMensagens(msgs);
                }
              })
              .catch(() => {
                if (!cancelled) setFeedback('Não foi possível atualizar as mensagens. Tentaremos reconectar a conversa.');
              });
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
  }, [atendimentoId, remetenteAtual, podeAcessarConversa]);

  const pessoaAtendida = useMemo(() => (
    atendimento?.pessoaAtendidaNome
    ?? atendimento?.beneficiarioNome
    ?? atendimento?.pacienteNome
    ?? (ehAdmin && atendimento?.pessoaAtendidaId ? `Pessoa #${atendimento.pessoaAtendidaId}` : 'Não informada')
  ), [atendimento, ehAdmin]);

  const semAlteracoes = Boolean(
    atendimento
    && statusEdit === (atendimento.status ?? 'ABERTO')
    && prioridadeEdit === String(atendimento.prioridade ?? ''),
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
      const upload = await mensagensService.uploadMidia(atendimentoId, arquivo);
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
      const upload = await mensagensService.uploadMidia(atendimentoId, audio, extensao);
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
        prioridade: prioridadeEdit ? Number(prioridadeEdit) : undefined,
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

  const handleAlterarCheckin = async (status: string) => {
    if (!atendimento) return;
    setSalvandoCheckin(true);
    setFeedback('');
    try {
      const atualizado = await atendimentoService.atualizarCheckin(atendimento.id, status);
      setAtendimento((prev) => prev ? { ...prev, statusCheckin: atualizado.statusCheckin, horarioEnvioCheckin: atualizado.horarioEnvioCheckin } : prev);

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
    const responsavel = user?.voluntarioId ?? (user?.tipoUsuario === 'ADMIN' ? atendimento.voluntarioId : undefined);
    if (!responsavel) {
      setErroFormAgenda('É necessário um voluntário responsável para agendar a consulta.');
      return;
    }

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
        voluntarioId: responsavel,
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
      setReferenciaAgenda(Date.now());
    } catch (error) {
      setErroFormAgenda(error instanceof Error && error.message ? error.message : 'Erro ao salvar consulta na agenda.');
    } finally {
      setSalvandoAgenda(false);
    }
  };

  const salvarEvolucaoProntuario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!atendimento || !podeAlterar) return;
    const responsavel = user?.voluntarioId ?? (user?.tipoUsuario === 'ADMIN' ? atendimento.voluntarioId : undefined);
    if (!responsavel) {
      setErroFormProntuario('É necessário um voluntário responsável para registrar a evolução.');
      return;
    }

    if (!tratamentoAtualInput.trim()) {
      setErroFormProntuario('Descreva o procedimento ou evolução clínica realizada.');
      return;
    }

    setSalvandoProntuario(true);
    setErroFormProntuario('');
    try {
      const agendaPrincipal = agendasAtendimento[agendasAtendimento.length - 1];
      const novoProntuario: Prontuario = {
        voluntarioId: responsavel,
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
      setModalProntuario(null);
    } catch (error) {
      setErroFormProntuario(error instanceof Error && error.message ? error.message : 'Erro ao registrar evolução no prontuário.');
    } finally {
      setSalvandoProntuario(false);
    }
  };

  const ultimaEvolucao = prontuarios[0] ?? null;
  const consultaFutura = (agenda: AgendaConsulta) => !['CONCLUIDO', 'ENCERRADO'].includes(agenda.status)
    && new Date(`${agenda.dataConsulta}T${agenda.horario}`).getTime() >= referenciaAgenda;
  const agendasOrdenadas = [...agendasAtendimento].sort((a, b) => {
    const aFutura = consultaFutura(a);
    const bFutura = consultaFutura(b);
    if (aFutura !== bFutura) return aFutura ? -1 : 1;
    const ordem = `${a.dataConsulta}T${a.horario}`.localeCompare(`${b.dataConsulta}T${b.horario}`);
    return aFutura ? ordem : -ordem;
  });
  const proximaAgenda = agendasOrdenadas.find(consultaFutura);
  const responsavel = atendimento?.nomeVoluntario ?? atendimento?.voluntario?.nome ?? 'Aguardando voluntário';
  const statusClass = (status: string) => status === 'EM_ATENDIMENTO' ? 'bg-success/10 text-success' : status === 'CANCELADO' ? 'bg-danger/10 text-danger' : status === 'ENCERRADO' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary';
  const fecharPainel = () => {
    setPainelAberto(false);
    painelButtonRef.current?.focus();
  };
  const copiarDados = async () => {
    if (!atendimento) return;
    try {
      await navigator.clipboard.writeText([
        ...(ehAdmin ? [`Atendimento #${atendimento.id}`] : []), `Beneficiário: ${pessoaAtendida}`,
        `E-mail: ${atendimento.pessoaAtendidaEmail || 'Não informado'}`,
        `Telefone: ${atendimento.pessoaAtendidaTelefone || 'Não informado'}`,
        `Status: ${labelStatus(atendimento.status)}`, `Prioridade: ${labelPrioridade(atendimento.prioridade)}`,
        `Responsável: ${responsavel}`,
        `Abertura: ${formatDate(atendimento.dataAbertura ?? atendimento.dataCriacao)}`,
      ].join('\n'));
      setFeedback('Dados do atendimento copiados.');
    } catch {
      setFeedback('Não foi possível copiar os dados. Verifique a permissão da área de transferência.');
    }
  };
  const confirmarEncerramento = () => {
    if (!atendimento) return;
    confirm({
      title: 'Encerrar Atendimento',
      message: 'Tem certeza que deseja encerrar este atendimento? Ele ficará como somente leitura e não será possível enviar novas mensagens.',
      confirmText: 'Confirmar e encerrar', tone: 'danger',
      details: [
        { label: 'Status atual', value: labelStatus(atendimento.status) },
        { label: 'Novo status', value: labelStatus('ENCERRADO'), tone: 'danger' },
        { label: 'Impacto', value: 'Atendimento e chat finalizados', tone: 'danger' },
      ],
      onConfirm: () => void salvarAtendimento(true),
    });
  };

  return (
    <PageShell>
      {loading && <div className="p-4"><LoadingState title="Carregando atendimento..." count={1} className="md:grid-cols-1 xl:grid-cols-1" /></div>}
      {erro && <div className="p-4">
        <ErrorState title="Não foi possível abrir o atendimento" description={erro} />
        <Button variant="secondary" onClick={() => void carregarDados()}>Tentar novamente</Button>
      </div>}
      {!loading && !erro && atendimento && (
        <div className="atendimento-workspace" data-panel-open={painelAberto}>
          <div className="flex min-h-0 min-w-0 flex-col gap-3">
            <header className="flex shrink-0 items-start gap-3">
              <button type="button" onClick={() => navigate(-1)} className="atendimento-icon-button" aria-label="Voltar"><AtendimentoIcon name="back" /></button>
              <div className="min-w-0 flex-1">
                {ehAdmin && <p className="text-xs font-semibold text-primary">Atendimento #{atendimento.id}</p>}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="break-words text-xl font-bold leading-tight tracking-tight text-foreground lg:text-2xl">Atendimento de {pessoaAtendida}</h1>
                  <Badge tone={statusTone(atendimento.status)}>{labelStatus(atendimento.status)}</Badge>
                </div>
                <p className="mt-1 hidden text-sm text-muted-foreground sm:block">Acompanhe a conversa e ajude no que for necessário.</p>
              </div>
              <button ref={painelButtonRef} type="button" onClick={() => painelAberto ? fecharPainel() : setPainelAberto(true)} aria-expanded={painelAberto} aria-controls="detalhes-atendimento" aria-label={painelAberto ? 'Ocultar detalhes do atendimento' : 'Abrir detalhes do atendimento'} className="atendimento-icon-button"><AtendimentoIcon name="panel" /></button>
            </header>

            <div className="grid shrink-0 grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-border bg-surface px-4 py-3 text-xs sm:grid-cols-3 2xl:grid-cols-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning"><AtendimentoIcon name="priority" className="h-4 w-4" /></span>
                <div>
                  <p className="text-muted-foreground">Prioridade</p>
                  <p className="font-semibold">{labelPrioridade(atendimento.prioridade)}</p>
                </div>
              </div>
              <div className="col-span-2 flex min-w-0 items-center gap-2.5 sm:col-span-1">
                <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary sm:flex"><AtendimentoIcon name="user" className="h-4 w-4" /></span>
                <div>
                  <p className="text-muted-foreground">Responsável</p>
                  <p className="break-words font-semibold">{responsavel}</p>
                </div>
              </div>
              <div className="hidden min-w-0 items-center gap-2.5 2xl:flex">
                <AtendimentoIcon name="calendar" className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-muted-foreground">Aberto em</p>
                  <p className="font-semibold">{formatDate(atendimento.dataAbertura ?? atendimento.dataCriacao)}</p>
                </div>
              </div>
            </div>
            {feedback && <p role="status" className="shrink-0 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground">{feedback}</p>}
            <Card className="flex min-h-0 flex-1 flex-col overflow-hidden shadow-sm">
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold text-foreground"><AtendimentoIcon name="chat" className="h-4 w-4 text-primary" />Conversa</h2>
                </div>
                <span className="text-xs text-muted-foreground">
                  {mensagens.length}{' '}
                  {mensagens.length === 1 ? 'mensagem' : 'mensagens'}
                </span>
              </div>

              <div
                ref={historicoRef}
                tabIndex={0}
                onScroll={() => void carregarMensagensAnteriores()}
                className="atendimento-chat-background min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 sm:p-5"
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

                {mensagens.map((mensagem, index) => {
                  const minha = mensagem.enviadoPor === remetenteAtual;
                  const novaData = index === 0 || new Date(mensagens[index - 1].dataHora).toDateString() !== new Date(mensagem.dataHora).toDateString();
                  const tipoMensagem = mensagem.tipoMensagem ?? 'TEXTO';
                  return (
                    <div key={mensagem.id}>
                      {novaData && <div className="mb-4 text-center">
                        <span className="inline-block rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">{new Date(mensagem.dataHora).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>}
                      <div className={`flex items-start gap-2 ${minha ? 'flex-row-reverse' : ''}`}>
                        <span aria-hidden="true" className={`mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:flex ${minha ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                          {(minha ? user?.nome : mensagem.enviadoPor === 'BENEFICIARIO' ? pessoaAtendida : labelRemetente(mensagem.enviadoPor))?.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                        </span>
                        <article className={`min-w-0 max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[80%] 2xl:max-w-[72%] ${minha
                            ? 'rounded-tr-md border border-primary/10 bg-primary/10 text-foreground'
                            : 'rounded-tl-md border border-border bg-surface text-foreground'
                          }`}
                        >
                          <header className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs ${minha ? 'text-primary' : 'text-muted-foreground'}`}>
                            <span className="font-semibold">
                              {minha ? `Você · ${labelRemetente(mensagem.enviadoPor)}` : mensagem.enviadoPor === 'BENEFICIARIO' ? pessoaAtendida : labelRemetente(mensagem.enviadoPor)}
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
                    </div>
                  );
                })}
                <div ref={messagesEndRef} aria-hidden="true" />
              </div>

              <form onSubmit={enviarMensagem} className="shrink-0 border-t border-border bg-surface p-2.5 sm:p-3">
                {chatBloqueado && (
                  <div className="mb-4 rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
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
                  <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger" role="status">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger motion-reduce:animate-none" aria-hidden="true" />
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
                <div className="flex items-end gap-1 rounded-2xl border border-border bg-background p-2 shadow-sm transition-[border-color,box-shadow] duration-fast focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20">
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
                    className="min-h-11 min-w-0 max-h-32 flex-1 resize-none overflow-y-auto bg-transparent px-3 py-2.5 text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:text-muted-foreground"
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
          <AtendimentoPanel open={painelAberto} onClose={fecharPainel}>
            {podeAlterar ? (
              <section className="atendimento-section space-y-3 p-3" aria-label="Status e prioridade">
                <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-end gap-2">
                  <div>
                    <label htmlFor="atendimento-status" className="mb-2 block text-sm font-bold">Status do atendimento</label>
                    <div className={`atendimento-status rounded-xl ${statusClass(statusEdit)}`}>
                      <Select id="atendimento-status" value={statusEdit} disabled={salvando} onChange={event => setStatusEdit(event.target.value)}>{STATUS_OPTIONS.map(status => <option key={status} value={status}>{labelStatus(status)}</option>)}</Select>
                      <AtendimentoIcon name="chevron" className="h-4 w-4" />
                    </div>
                  </div>
                  <Field label="Prioridade">
                    <Select value={prioridadeEdit} disabled={salvando} onChange={event => setPrioridadeEdit(event.target.value)} className="!py-2 !text-sm"><option value="" disabled={Boolean(atendimento.prioridade)}>Não avaliada</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{labelPrioridade(value)}</option>)}</Select>
                  </Field>
                </div>
                {!semAlteracoes && <p className="text-xs text-muted-foreground">Alterações pendentes. Salve para aplicar.</p>}
                {(!semAlteracoes || salvando) && <Button fullWidth size="sm" disabled={semAlteracoes} isLoading={salvando} loadingText="Salvando..." onClick={confirmarAlteracaoAtendimento}>Salvar alterações</Button>}
              </section>
            ) : <div className="atendimento-section p-3">
              <p className="text-sm font-bold">Status do atendimento</p>
              <p className="mt-2">
                <Badge tone={statusTone(atendimento.status)}>{labelStatus(atendimento.status)}</Badge>
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Status e prioridade são gerenciados pela equipe responsável.</p>
            </div>}

            <section className="atendimento-section p-3" aria-labelledby="informacoes-atendimento">
              <h3 id="informacoes-atendimento" className="mb-1 text-sm font-bold">Informações do atendimento</h3>
              <dl>
                <InfoItem label="Nome" value={pessoaAtendida} />
                <InfoItem label="E-mail" value={atendimento.pessoaAtendidaEmail} />
                <InfoItem label="Telefone" value={atendimento.pessoaAtendidaTelefone} />
                <InfoItem label="Prioridade" value={labelPrioridade(atendimento.prioridade)} />
                <InfoItem label="Responsável" value={responsavel} />
                <InfoItem label="Aberto em" value={formatDate(atendimento.dataAbertura ?? atendimento.dataCriacao)} />
                {atendimento.dataEncerramento && <InfoItem label="Encerrado em" value={formatDate(atendimento.dataEncerramento)} />}
              </dl>
            </section>
            <PainelSecao title="Descrição do atendimento" icon="chat" defaultOpen={false}>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{atendimento.descricao || 'Sem descrição cadastrada.'}</p>
            </PainelSecao>

            {podeAlterar && atendimento.status === 'ABERTO' && !atendimento.voluntarioId && <section className="atendimento-section space-y-2 p-3">
              <h3 className="text-sm font-bold">Acolher caso</h3>
              <p className="text-xs leading-5 text-muted-foreground">Este atendimento aguarda um profissional voluntário.</p>
              <Button fullWidth disabled={voluntarioSemVinculo} isLoading={assumindo} loadingText="Assumindo..." onClick={confirmarAssumirAtendimento}>Assumir atendimento</Button>
              {voluntarioSemVinculo && <p className="text-xs text-danger">Sua conta precisa estar vinculada a um voluntário para assumir casos.</p>}
            </section>}

            {podeAlterar && <>
              <PainelSecao title="Agenda vinculada" icon="calendar">
                {loadingAgenda ? <p role="status" className="text-xs text-muted-foreground">Carregando agenda...</p> : erroAgenda ? <div>
                  <p role="alert" className="text-xs text-danger">{erroAgenda}</p>
                  <Button variant="ghost" size="sm" onClick={() => carregarAgendaEProntuario(atendimento.id)}>Tentar novamente</Button>
                </div> : agendasAtendimento.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-muted/40 p-3">
                  <p className="text-sm font-medium">Nenhuma consulta agendada para este atendimento.</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Vincule uma consulta para acompanhar os próximos passos.</p>
                </div> : <>
                  <Badge tone="success">Vinculada</Badge>
                  {agendasOrdenadas.map(ag => <article key={ag.id} className="rounded-xl border border-border bg-muted/30 p-3">
                    {ag === proximaAgenda && <p className="mb-2 text-xs font-semibold text-primary">Próxima consulta</p>}
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-sm font-bold">{ag.tipo}</h4>
                      <Badge tone={ag.status === 'CONCLUIDO' ? 'success' : 'info'}>{{ AGUARDANDO: 'Aguardando', CONFIRMADO: 'Confirmado', CONCLUIDO: 'Concluído', ENCERRADO: 'Encerrado' }[ag.status] ?? ag.status}</Badge>
                    </div>
                    <dl>
                      <InfoItem label="Data e horário" value={`${ag.dataConsulta.split('-').reverse().join('/')} às ${ag.horario}`} />
                      <InfoItem label="Profissional" value={ag.voluntarioId === atendimento.voluntarioId ? responsavel : ehAdmin ? `Profissional #${ag.voluntarioId}` : 'Outro voluntário da rede'} />
                    </dl>
                    <Button variant="secondary" size="sm" fullWidth className="mt-2" onClick={() => abrirModalEditarAgenda(ag)}>Visualizar / reagendar</Button>
                  </article>)}
                </>}
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={abrirModalNovaAgenda}>{agendasAtendimento.length ? 'Agendar retorno' : 'Agendar Consulta'}</Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/agenda')}>Ver agenda</Button>
                </div>
              </PainelSecao>

              <PainelSecao title="Prontuário rápido" icon="record">
                {loadingProntuario ? <p role="status" className="text-xs text-muted-foreground">Carregando prontuário...</p> : erroProntuario ? <div>
                  <p role="alert" className="text-xs text-danger">{erroProntuario}</p>
                  <Button variant="ghost" size="sm" onClick={() => carregarAgendaEProntuario(atendimento.id)}>Tentar novamente</Button>
                </div> : ultimaEvolucao ? <dl>
                  <InfoItem label="Histórico / anamnese" value={ultimaEvolucao.historicoMedico} />
                  <InfoItem label="Última evolução" value={ultimaEvolucao.tratamentoAtual} />
                  <InfoItem label="Registrada em" value={formatDate(ultimaEvolucao.dataRegistro)} />
                </dl> : <p className="rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">Nenhum histórico clínico registrado neste atendimento.</p>}
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setModalProntuario('evolucao')}>Registrar evolução</Button>
                  <Button variant="ghost" size="sm" onClick={() => setModalProntuario('historico')}>Ver prontuário completo</Button>
                </div>
              </PainelSecao>
            </>}

            <section className="atendimento-section space-y-3 p-3" aria-labelledby="acoes-atendimento">
              <h3 id="acoes-atendimento" className="text-sm font-bold">Ações rápidas</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button variant="secondary" size="sm" onClick={() => void copiarDados()}><AtendimentoIcon name="copy" className="h-4 w-4" />Copiar dados</Button>
                {podeAlterar && <Button variant="secondary" size="sm" disabled={salvando || atendimento.status === 'ENCERRADO'} onClick={confirmarEncerramento} className="!border-danger/20 !bg-danger/10 !text-danger sm:col-span-2"><AtendimentoIcon name="end" className="h-4 w-4" />Encerrar atendimento</Button>}
              </div>
            </section>

            {podeAlterar && <PainelSecao title="Acompanhamento da consulta" icon="calendar" defaultOpen={false}>
              <p className="text-xs text-muted-foreground">Status atual: <strong className="text-foreground">{labelStatusCheckin(atendimento.statusCheckin)}</strong></p>
              {atendimento.horarioEnvioCheckin && <p className="text-xs text-muted-foreground">Atualizado em: {formatDate(atendimento.horarioEnvioCheckin)}</p>}
              <div className="grid grid-cols-2 gap-2">
                {[['CONFIRMADO', 'Confirmou'], ['NAO_COMPARECERA', 'Não vai'], ['REAGENDAMENTO_SOLICITADO', 'Solicitar reagendamento'], ['SEM_RESPOSTA', 'Sem resposta']].map(([value, label]) => <Button key={value} variant="secondary" size="sm" disabled={salvandoCheckin} onClick={() => void handleAlterarCheckin(value)}>{label}</Button>)}
              </div>
            </PainelSecao>}

            <PainelSecao title="Histórico de atividades" icon="history">
              <ol className="space-y-3 border-l border-border pl-3 text-xs">
                {(atendimento.dataAbertura || atendimento.dataCriacao) && <li>
                  <p className="font-semibold">Atendimento aberto</p>
                  <time className="text-muted-foreground">{formatDate(atendimento.dataAbertura ?? atendimento.dataCriacao)}</time>
                </li>}
                {atendimento.dataAtualizacao && <li>
                  <p className="font-semibold">Última atualização registrada</p>
                  <time className="text-muted-foreground">{formatDate(atendimento.dataAtualizacao)}</time>
                </li>}
                {atendimento.dataEncerramento && <li>
                  <p className="font-semibold">Encerramento registrado</p>
                  <time className="text-muted-foreground">{formatDate(atendimento.dataEncerramento)}</time>
                </li>}
              </ol>
              <p className="text-xs leading-5 text-muted-foreground">O histórico detalhado de alterações de status e responsável ainda não está disponível.</p>
            </PainelSecao>

            {modalAgendaAberto && <Dialog title={editandoAgendaId ? 'Editar Consulta do Atendimento' : 'Agendar Consulta para Atendimento'} description={ehAdmin ? `Paciente: ${pessoaAtendida} · Atendimento #${atendimento.id}` : `Paciente: ${pessoaAtendida}`} onClose={() => { if (!salvandoAgenda) setModalAgendaAberto(false); }}>
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
            </Dialog>}

            {modalProntuario && podeAlterar && <Dialog title={modalProntuario === 'evolucao' ? 'Registrar evolução no prontuário' : 'Prontuário do atendimento'} description={`Paciente: ${pessoaAtendida} · Registros vinculados a este atendimento`} maxWidthClassName="max-w-2xl" onClose={() => { if (!salvandoProntuario) setModalProntuario(null); }}>
              {modalProntuario === 'evolucao' ? <form onSubmit={salvarEvolucaoProntuario} noValidate className="space-y-4">
                <Field label="Histórico médico / anamnese" hint="Informe os alertas clínicos relevantes, separados por vírgula.">
                  <Input disabled={salvandoProntuario} value={historicoMedicoInput} onChange={event => setHistoricoMedicoInput(event.target.value)} placeholder="Ex: Alérgico a Dipirona, Diabético" />
                </Field>
                <Field label="Procedimento / evolução clínica realizada" error={erroFormProntuario || undefined}>
                  <Textarea disabled={salvandoProntuario} value={tratamentoAtualInput} onChange={event => { setTratamentoAtualInput(event.target.value); if (erroFormProntuario) setErroFormProntuario(''); }} className="min-h-32" placeholder="Descreva a situação atual do prontuário, dentes avaliados/tratados e conduta..." />
                </Field>
                <Button type="submit" isLoading={salvandoProntuario} loadingText="Salvando evolução...">Salvar Evolução no Prontuário</Button>
              </form> : loadingProntuario ? <p role="status">Carregando prontuário...</p> : erroProntuario ? <p role="alert" className="text-sm text-danger">{erroProntuario}</p> : prontuarios.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum histórico clínico registrado neste atendimento.</p> : <div className="space-y-3">
                {prontuarios.map((item, index) => <article key={item.id ?? index} className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {formatDate(item.dataRegistro)}
                    {ehAdmin && item.agendaId ? ` · Consulta #${item.agendaId}` : ''}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm">
                    <strong>Histórico / anamnese: </strong>
                    {item.historicoMedico || 'Não informado'}
                  </p>
                  <p className="whitespace-pre-wrap break-words text-sm">
                    <strong>Evolução: </strong>
                    {item.tratamentoAtual}
                  </p>
                </article>)}
              </div>}
            </Dialog>}
            {confirmDialog}
          </AtendimentoPanel>
        </div>
      )}
    </PageShell>
  );
}

export default DetalheAtendimento;
