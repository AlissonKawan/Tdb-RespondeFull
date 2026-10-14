package br.com.tdbresponde.security;

import br.com.tdbresponde.dao.ContaUsuarioDAO;
import br.com.tdbresponde.exception.UnauthorizedException;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.TipoUsuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SessionServiceTest {
    SessionService service;
    ContaUsuario user;
    @BeforeEach void setup() {
        service = new SessionService();
        service.clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
        service.contas = mock(ContaUsuarioDAO.class);
        user = new ContaUsuario(); user.setId(7); user.setAtivo(true); user.setTipoUsuario(TipoUsuario.VOLUNTARIO);
        when(service.contas.buscarPorId(7)).thenReturn(user);
    }
    @Test void validatesRevokesAndRejectsForgery() {
        var issued = service.create(user);
        assertSame(user, service.authenticate(issued.token()));
        assertThrows(UnauthorizedException.class, () -> service.authenticate("forjado"));
        service.revoke(issued.token());
        assertThrows(UnauthorizedException.class, () -> service.authenticate(issued.token()));
    }
    @Test void expiresAtServerEvenIfBrowserKeepsUser() {
        var issued = service.create(user);
        service.clock = Clock.fixed(issued.expiresAt(), ZoneOffset.UTC);
        assertThrows(UnauthorizedException.class, () -> service.authenticate(issued.token()));
    }
    @Test void rechecksDisabledAccount() {
        var issued = service.create(user);
        user.setAtivo(false);
        assertThrows(UnauthorizedException.class, () -> service.authenticate(issued.token()));
        user.setAtivo(true);
        assertThrows(UnauthorizedException.class, () -> service.authenticate(issued.token()));
    }
    @Test void ticketsAreBoundToRoomSingleUseAndRevocable() {
        var issued = service.create(user);
        WebSocketTickets tickets = new WebSocketTickets(); tickets.sessions = service;
        String ticket = tickets.issue(issued.token(), "12");
        assertNotNull(tickets.consume(ticket, "12"));
        assertThrows(UnauthorizedException.class, () -> tickets.consume(ticket, "12"));
        String wrongRoom = tickets.issue(issued.token(), "12");
        assertThrows(UnauthorizedException.class, () -> tickets.consume(wrongRoom, "13"));
        String revoked = tickets.issue(issued.token(), "12");
        service.revoke(issued.token());
        assertThrows(UnauthorizedException.class, () -> tickets.consume(revoked, "12"));
    }
}
