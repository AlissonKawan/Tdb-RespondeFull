package br.com.tdbresponde.resource;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.websocket.CloseReason;
import br.com.tdbresponde.security.SessionService;
import br.com.tdbresponde.security.WebSocketTickets;
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

    @Inject WebSocketTickets tickets;
    @Inject SessionService authSessions;

    // Chaves String para evitar problemas de autoboxing int/Integer no ConcurrentHashMap
    private static final Map<String, Map<String, Session>> sessions = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session, @PathParam("atendimentoId") String atendimentoId, @PathParam("usuarioId") String usuarioId) {
        try {
            var values = session.getRequestParameterMap().get("ticket");
            String key = tickets.consume(values == null || values.size() != 1 ? null : values.get(0), atendimentoId);
            session.getUserProperties().put("authKey", key);
            session.getUserProperties().put("authService", authSessions);
        } catch (RuntimeException e) {
            closeUnauthorized(session);
            return;
        }
        // O identificador do cliente na URL não é identidade; cada conexão tem sua própria chave.
        sessions.compute(atendimentoId, (id, room) -> {
            if (room == null) room = new ConcurrentHashMap<>();
            room.put(session.getId(), session);
            return room;
        });
        System.out.println("[WS] Conectado: atendimento=" + atendimentoId + " usuario=" + usuarioId + " | Salas ativas: " + sessions.keySet());
    }

    @OnClose
    public void onClose(Session session, @PathParam("atendimentoId") String atendimentoId, @PathParam("usuarioId") String usuarioId) {
        removeSession(atendimentoId, session);
        System.out.println("[WS] Desconectado: atendimento=" + atendimentoId + " usuario=" + usuarioId + " | Salas ativas: " + sessions.keySet());
    }

    @OnError
    public void onError(Session session, @PathParam("atendimentoId") String atendimentoId, @PathParam("usuarioId") String usuarioId, Throwable throwable) {
        removeSession(atendimentoId, session);
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
                SessionService service = (SessionService) s.getUserProperties().get("authService");
                String key = (String) s.getUserProperties().get("authKey");
                if (service == null || key == null || !service.isValid(key)) {
                    closeUnauthorized(s);
                    removeSession(atendimentoId, s);
                    return;
                }
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

    private static void closeUnauthorized(Session session) {
        try {
            session.close(new CloseReason(CloseReason.CloseCodes.VIOLATED_POLICY, "Sessao invalida ou expirada"));
        } catch (java.io.IOException ignored) { }
    }

    public static void revokeSession(String key) {
        sessions.forEach((room, peers) -> peers.values().forEach(session -> {
            if (key.equals(session.getUserProperties().get("authKey"))) {
                closeUnauthorized(session);
                removeSession(room, session);
            }
        }));
    }

    private static void removeSession(String room, Session session) {
        sessions.computeIfPresent(room, (id, peers) -> {
            peers.remove(session.getId(), session);
            return peers.isEmpty() ? null : peers;
        });
    }
}
