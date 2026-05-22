package br.com.tdbresponde.resource;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
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

    // outer map: atendimentoId, inner map: usuarioId -> Session
    private static final Map<Integer, Map<String, Session>> sessions = new ConcurrentHashMap<>();

    @OnOpen
    public void onOpen(Session session, @PathParam("atendimentoId") Integer atendimentoId, @PathParam("usuarioId") String usuarioId) {
        sessions.computeIfAbsent(atendimentoId, k -> new ConcurrentHashMap<>()).put(usuarioId, session);
        System.out.println("WebSocket aberto para atendimento " + atendimentoId + " usuario " + usuarioId);
    }

    @OnClose
    public void onClose(Session session, @PathParam("atendimentoId") Integer atendimentoId, @PathParam("usuarioId") String usuarioId) {
        Map<String, Session> atendimentoSessions = sessions.get(atendimentoId);
        if (atendimentoSessions != null) {
            atendimentoSessions.remove(usuarioId);
            if (atendimentoSessions.isEmpty()) {
                sessions.remove(atendimentoId);
            }
        }
        System.out.println("WebSocket fechado para atendimento " + atendimentoId + " usuario " + usuarioId);
    }

    @OnError
    public void onError(Session session, @PathParam("atendimentoId") Integer atendimentoId, @PathParam("usuarioId") String usuarioId, Throwable throwable) {
        Map<String, Session> atendimentoSessions = sessions.get(atendimentoId);
        if (atendimentoSessions != null) {
            atendimentoSessions.remove(usuarioId);
            if (atendimentoSessions.isEmpty()) {
                sessions.remove(atendimentoId);
            }
        }
        System.out.println("WebSocket erro para atendimento " + atendimentoId + " usuario " + usuarioId + ": " + throwable.getMessage());
    }

    @OnMessage
    public void onMessage(String message, @PathParam("atendimentoId") Integer atendimentoId, @PathParam("usuarioId") String usuarioId) {
        // Nao usaremos mensagens recebidas via WS do frontend para salvar no DB no momento,
        // apenas usaremos a REST API e faremos o broadcast por aqui.
    }

    public static void broadcastText(Integer atendimentoId, String json) {
        Map<String, Session> atendimentoSessions = sessions.get(atendimentoId);
        if (atendimentoSessions != null) {
            atendimentoSessions.values().forEach(s -> {
                s.getAsyncRemote().sendText(json, result ->  {
                    if (result.getException() != null) {
                        System.out.println("Nao foi possivel enviar mensagem: " + result.getException());
                    }
                });
            });
        }
    }
}
