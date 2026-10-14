package br.com.tdbresponde.security;

import br.com.tdbresponde.exception.UnauthorizedException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@ApplicationScoped
public class WebSocketTickets {
    @Inject SessionService sessions;
    private final Map<String, Ticket> tickets = new HashMap<>();
    private final SecureRandom random = new SecureRandom();
    private record Ticket(String sessionKey, String room, Instant expiresAt) {}

    public synchronized String issue(String token, String room) {
        sessions.authenticate(token);
        tickets.values().removeIf(t -> !t.expiresAt().isAfter(Instant.now()));
        if (tickets.size() >= 10_000) throw new IllegalStateException("Limite de conexoes pendentes.");
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String value = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tickets.put(SessionService.hash(value), new Ticket(SessionService.hash(token), room, Instant.now().plusSeconds(30)));
        return value;
    }

    public synchronized String consume(String value, String room) {
        Ticket ticket = value == null ? null : tickets.remove(SessionService.hash(value));
        if (ticket == null || !ticket.room().equals(room) || !ticket.expiresAt().isAfter(Instant.now())
                || !sessions.isValid(ticket.sessionKey())) {
            throw new UnauthorizedException("Conexao nao autorizada.");
        }
        return ticket.sessionKey();
    }
}
