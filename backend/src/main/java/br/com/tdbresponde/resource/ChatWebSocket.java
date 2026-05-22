package br.com.tdbresponde.resource;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.websocket.OnClose;
import jakarta.websocket.OnError;
import jakarta.websocket.OnMessage;
import jakarta.websocket.OnOpen;
import jakarta.websocket.Session;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ServerEndpoint("/chat/{atendimentoId}/{usuarioId}")
@ApplicationScoped
public class ChatWebSocket {

    // Chaves String para evitar problemas de autoboxing int/Integer no ConcurrentHashMap
    private static final Map<String, Map<String, Session>> sessions = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session, @PathParam("atendimentoId") String atendimentoId, @PathParam("usuarioId") String usuarioId) {
        sessions.computeIfAbsent(atendimentoId, k -> new ConcurrentHashMap<>()).put(usuarioId, session);
        System.out.println("[WS] Conectado: atendimento=" + atendimentoId + " usuario=" + usuarioId + " | Salas ativas: " + sessions.keySet());
    }

    @OnClose
    public void onClose(Session session, @PathParam("atendimentoId") String atendimentoId, @PathParam("usuarioId") String usuarioId) {
        Map<String, Session> atendimentoSessions = sessions.get(atendimentoId);
        if (atendimentoSessions != null) {
            // Apenas remove se a session armazenada for a mesma que esta sendo fechada
            // Evita race condition do React StrictMode (mount/unmount/mount)
            Session stored = atendimentoSessions.get(usuarioId);
            if (stored != null && stored.equals(session)) {
                atendimentoSessions.remove(usuarioId);
                if (atendimentoSessions.isEmpty()) {
                    sessions.remove(atendimentoId);
                }
            }
        }
        System.out.println("[WS] Desconectado: atendimento=" + atendimentoId + " usuario=" + usuarioId + " | Salas ativas: " + sessions.keySet());
    }

    @OnError
    public void onError(Session session, @PathParam("atendimentoId") String atendimentoId, @PathParam("usuarioId") String usuarioId, Throwable throwable) {
        Map<String, Session> atendimentoSessions = sessions.get(atendimentoId);
        if (atendimentoSessions != null) {
            atendimentoSessions.remove(usuarioId);
            if (atendimentoSessions.isEmpty()) {
                sessions.remove(atendimentoId);
            }
        }
        System.out.println("[WS] Erro: atendimento=" + atendimentoId + " usuario=" + usuarioId + ": " + throwable.getMessage());
    }

    @OnMessage
    public void onMessage(String message, @PathParam("atendimentoId") String atendimentoId, @PathParam("usuarioId") String usuarioId) {
        // Nao usaremos mensagens recebidas via WS do frontend para salvar no DB no momento,
        // apenas usaremos a REST API e faremos o broadcast por aqui.
    }

    public static void broadcastText(String atendimentoId, String json) {
        Map<String, Session> atendimentoSessions = sessions.get(atendimentoId);
        if (atendimentoSessions != null && !atendimentoSessions.isEmpty()) {
            System.out.println("[WS] Broadcast para sala " + atendimentoId + " (" + atendimentoSessions.size() + " clientes)");
            atendimentoSessions.values().forEach(s -> {
                if (s.isOpen()) {
                    s.getAsyncRemote().sendText(json, result -> {
                        if (result.getException() != null) {
                            System.out.println("[WS] Falha no envio: " + result.getException());
                        }
                    });
                }
            });
        } else {
            System.out.println("[WS] Broadcast ignorado: sala " + atendimentoId + " vazia ou inexistente. Salas ativas: " + sessions.keySet());
        }
    }
}
