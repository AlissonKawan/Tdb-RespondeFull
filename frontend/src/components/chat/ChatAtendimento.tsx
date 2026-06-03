import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../ui/FeedbackState';
import { Textarea } from '../ui/Input';
import { mensagensService } from '../../services/mensagensService';
import type { Mensagem } from '../../types/AtendimentoApi';
import { API_BASE_URL } from '../../config/api';

interface ChatAtendimentoProps {
  atendimentoId: number;
  enviadoPor: 'BENEFICIARIO' | 'VOLUNTARIO';
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ChatAtendimento({ atendimentoId, enviadoPor }: ChatAtendimentoProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  // Ref síncrona para rastrear IDs de mensagens já exibidas.
  // Usamos um ref (e não o state) porque o state é assíncrono —
  // quando duas mensagens WebSocket chegam quase ao mesmo tempo,
  // o React pode ainda não ter aplicado o state da primeira quando
  // a segunda chega, fazendo o check "prev.some()" falhar.
  // O ref é atualizado instantaneamente, evitando duplicatas.
  const seenIdsRef = useRef<Set<number>>(new Set());

  const mensagensOrdenadas = useMemo(
      () =>
          [...mensagens].sort((a, b) => {
            const dataA = new Date(a.dataHora).getTime();
            const dataB = new Date(b.dataHora).getTime();
            return (Number.isNaN(dataA) ? 0 : dataA) - (Number.isNaN(dataB) ? 0 : dataB);
          }),
      [mensagens],
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagensOrdenadas]);

  const carregarMensagens = useCallback(
      async (mostrarLoading = false) => {
        setErro('');

        if (mostrarLoading) {
          setLoading(true);
        }

        try {
          const msgs = await mensagensService.getMensagensAtendimento(atendimentoId);
          // Sincroniza o ref com todos os IDs carregados do servidor
          const novosIds = new Set<number>(msgs.map(m => m.id));
          seenIdsRef.current = novosIds;
          setMensagens(msgs);
        } catch (error) {
          setErro(error instanceof Error ? error.message : 'Nao foi possivel carregar as mensagens.');
        } finally {
          if (mostrarLoading) {
            setLoading(false);
          }
        }
      },
      [atendimentoId],
  );


  useEffect(() => {
    void carregarMensagens(true);
  }, [carregarMensagens]);

  useEffect(() => {
    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;

    const wsUrlBase = API_BASE_URL.replace(/\/$/, '').replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://');

    function connect() {
      if (cancelled) return;

      const clientId = `${enviadoPor}-${Math.random().toString(36).substring(7)}`;
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
          console.log('[WebSocket] Mensagem recebida:', event.data);
          const msg = JSON.parse(event.data) as Mensagem;
          // Verifica de forma SÍNCRONA se já vimos essa mensagem.
          // Diferente do state (que é assíncrono), o ref atualiza na hora,
          // então mesmo que 2 WebSockets recebam a mesma msg ao mesmo tempo,
          // o segundo já vai ver o ID no Set e pular.
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
          // Auto-reconnect com backoff: 3s, 6s, 9s... max 30s
          reconnectAttempt++;
          const delay = Math.min(reconnectAttempt * 3000, 30000);
          console.log(`[WebSocket] Reconectando em ${delay / 1000}s...`);
          reconnectTimeout = setTimeout(() => {
            // Recarrega mensagens para pegar as que foram perdidas enquanto desconectado
            mensagensService.getMensagensAtendimento(atendimentoId)
              .then((msgs) => { if (!cancelled) setMensagens(msgs); })
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
  }, [atendimentoId, enviadoPor]);

  const enviar = async () => {
    const conteudo = novaMensagem.trim();
    if (!conteudo) return;

    setErro('');
    setEnviando(true);
    try {
      await mensagensService.enviarMensagem(atendimentoId, { conteudo, enviadoPor });
      setNovaMensagem('');
      // Nao precisa recarregar via HTTP — o WebSocket ja vai entregar a mensagem nova
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Nao foi possivel enviar a mensagem.');
      // Em caso de erro, recarrega para garantir consistencia
      await carregarMensagens(false);
    } finally {
      setEnviando(false);
    }
  };

  return (
      <Card className="p-5 lg:p-6">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#2563EB]">Chat</p>
            <h2 className="mt-1 text-2xl font-bold text-[#0F172A]">Mensagens do atendimento</h2>
          </div>
          <Button
              type="button"
              variant="secondary"
              onClick={() => void carregarMensagens(true)}
              disabled={loading || enviando}
          >
            Atualizar mensagens
          </Button>
        </div>

        <div className="mt-5 min-h-80 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          {loading && <LoadingState title="Carregando mensagens..." />}
          {erro && <ErrorState title="Erro no chat" description={erro} />}
          {!loading && !erro && mensagensOrdenadas.length === 0 && (
              <EmptyState title="Nenhuma mensagem ainda." description="Envie a primeira mensagem para iniciar a conversa." />
          )}

          {!loading && !erro && mensagensOrdenadas.length > 0 && (
              <div className="flex max-h-[420px] flex-col gap-3 overflow-y-auto pr-1">
                {mensagensOrdenadas.map((mensagem) => {
                  const minhaMensagem = mensagem.enviadoPor === enviadoPor;
                  return (
                      <div key={mensagem.id} className={`flex ${minhaMensagem ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                minhaMensagem
                                    ? 'bg-[#2563EB] text-white shadow-blue-600/20'
                                    : 'border border-[#E2E8F0] bg-white text-[#0F172A]'
                            }`}
                        >
                          <p className="whitespace-pre-wrap leading-6">{mensagem.conteudo}</p>
                          <p className={`mt-2 text-[11px] ${minhaMensagem ? 'text-blue-100' : 'text-slate-400'}`}>
                            {mensagem.enviadoPor} {formatDate(mensagem.dataHora)}
                          </p>
                        </div>
                      </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Textarea
              rows={3}
              value={novaMensagem}
              onChange={(event) => setNovaMensagem(event.target.value)}
              placeholder="Escreva sua mensagem..."
              disabled={enviando}
          />
          <Button type="button" size="large" onClick={enviar} disabled={enviando || !novaMensagem.trim()}>
            {enviando ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </Card>
  );
}

export default ChatAtendimento;