package br.com.tdbresponde.security;

import br.com.tdbresponde.dao.ContaUsuarioDAO;
import br.com.tdbresponde.exception.UnauthorizedException;
import br.com.tdbresponde.model.ContaUsuario;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/** Sessões opacas locais à instância; reiniciar o servidor exige novo login. */
@ApplicationScoped
public class SessionService {
    private static final Duration TTL = Duration.ofHours(8);
    private static final int MAX_SESSIONS = 10_000;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, Entry> sessions = new HashMap<>();
    Clock clock = Clock.systemUTC();

    @Inject
    ContaUsuarioDAO contas;

    public record IssuedSession(String token, Instant expiresAt) {}
    private record Entry(int accountId, Instant expiresAt) {}

    public synchronized IssuedSession create(ContaUsuario conta) {
        if (conta == null || !conta.isAtivo()) throw unauthorized();
        sessions.values().removeIf(entry -> !entry.expiresAt().isAfter(clock.instant()));
        if (sessions.size() >= MAX_SESSIONS) {
            throw new IllegalStateException("Limite de sessoes atingido. Tente novamente mais tarde.");
        }
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expiresAt = clock.instant().plus(TTL);
        sessions.put(hash(token), new Entry(conta.getId(), expiresAt));
        return new IssuedSession(token, expiresAt);
    }

    public ContaUsuario authenticate(String token) {
        Entry entry;
        synchronized (this) { entry = token == null ? null : sessions.get(hash(token)); }
        if (entry == null || !entry.expiresAt().isAfter(clock.instant())) {
            revoke(token);
            throw unauthorized();
        }
        // Revalida conta e papel a cada requisição; não confia no perfil do navegador.
        ContaUsuario conta = contas.buscarPorId(entry.accountId());
        if (conta == null || !conta.isAtivo()) {
            revoke(token);
            throw unauthorized();
        }
        return conta;
    }

    public boolean isValid(String key) {
        Entry entry;
        synchronized (this) { entry = sessions.get(key); }
        if (entry == null || !entry.expiresAt().isAfter(clock.instant())) return false;
        ContaUsuario conta = contas.buscarPorId(entry.accountId());
        if (conta == null || !conta.isAtivo()) {
            synchronized (this) { sessions.remove(key); }
            return false;
        }
        return true;
    }

    public synchronized void revoke(String token) {
        if (token != null) sessions.remove(hash(token));
    }

    public static String bearer(String header) {
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7);
        return token.matches("[A-Za-z0-9_-]{43}") ? token : null;
    }

    public static String hash(String token) {
        try {
            return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }

    private UnauthorizedException unauthorized() {
        return new UnauthorizedException("Sessao invalida ou expirada. Entre novamente.");
    }
}
