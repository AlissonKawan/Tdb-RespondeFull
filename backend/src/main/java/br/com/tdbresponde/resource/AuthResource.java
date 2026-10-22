package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.ContaUsuarioBO;
import br.com.tdbresponde.dto.AuthUserResponse;
import br.com.tdbresponde.dto.LoginRequest;
import br.com.tdbresponde.dto.RegisterRequest;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.TipoUsuario;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.SecurityContext;
import br.com.tdbresponde.security.SessionService;
import br.com.tdbresponde.security.WebSocketTickets;
import br.com.tdbresponde.security.AtendimentoAccess;
import java.util.Map;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    ContaUsuarioBO bo;

    @Inject SessionService sessions;
    @Inject WebSocketTickets tickets;
    @Inject AtendimentoAccess access;
    @Context SecurityContext identity;

    @POST
    @Path("/register")
    public Response registrar(RegisterRequest request) {
        ContaUsuario conta = bo.registrar(request);

        Integer voluntarioId = null;
        Integer beneficiarioId = null;
        String statusCro = null;

        if (conta.getTipoUsuario() == TipoUsuario.VOLUNTARIO) {
            br.com.tdbresponde.model.Voluntario voluntario = bo.buscarVoluntarioPorContaId(conta.getId());
            if (voluntario != null) {
                voluntarioId = voluntario.getId();
                statusCro = voluntario.getStatusCro();
            }
        } else if (conta.getTipoUsuario() == TipoUsuario.BENEFICIARIO) {
            beneficiarioId = bo.buscarBeneficiarioIdDaConta(conta.getId());
        }

        AuthUserResponse authRes = AuthUserResponse.from(conta, voluntarioId, beneficiarioId);
        authRes.statusCro = statusCro;

        return Response.status(Response.Status.CREATED)
                .entity(authRes)
                .build();
    }

    @POST
    @Path("/login")
    public Response login(LoginRequest request) {
        ContaUsuario conta = bo.login(request);

        Integer voluntarioId = null;
        Integer beneficiarioId = null;
        String statusCro = null;

        if (conta.getTipoUsuario() == TipoUsuario.VOLUNTARIO) {
            br.com.tdbresponde.model.Voluntario voluntario = bo.buscarVoluntarioPorContaId(conta.getId());
            if (voluntario != null) {
                voluntarioId = voluntario.getId();
                statusCro = voluntario.getStatusCro();
            }
        } else if (conta.getTipoUsuario() == TipoUsuario.BENEFICIARIO) {
            beneficiarioId = bo.buscarBeneficiarioIdDaConta(conta.getId());
        }

        AuthUserResponse authRes = AuthUserResponse.from(conta, voluntarioId, beneficiarioId);
        authRes.statusCro = statusCro;

        SessionService.IssuedSession session = sessions.create(conta);
        return Response.ok(Map.of("user", authRes, "token", session.token(),
                "expiresAt", session.expiresAt().toString()))
                .header("Cache-Control", "no-store").build();
    }

    @GET
    @Path("/me")
    public Response me() {
        ContaUsuario conta = bo.buscarPorId(Integer.parseInt(identity.getUserPrincipal().getName()));
        Integer voluntarioId = null;
        Integer beneficiarioId = null;
        String statusCro = null;
        if (conta.getTipoUsuario() == TipoUsuario.VOLUNTARIO) {
            var voluntario = bo.buscarVoluntarioPorContaId(conta.getId());
            if (voluntario != null) {
                voluntarioId = voluntario.getId();
                statusCro = voluntario.getStatusCro();
            }
        } else if (conta.getTipoUsuario() == TipoUsuario.BENEFICIARIO) {
            beneficiarioId = bo.buscarBeneficiarioIdDaConta(conta.getId());
        }
        AuthUserResponse response = AuthUserResponse.from(conta, voluntarioId, beneficiarioId);
        response.statusCro = statusCro;
        return Response.ok(response).header("Cache-Control", "no-store").build();
    }

    @POST
    @Path("/logout")
    public Response logout(@HeaderParam("Authorization") String authorization) {
        String token = SessionService.bearer(authorization);
        sessions.revoke(token);
        if (token != null) ChatWebSocket.revokeSession(SessionService.hash(token));
        return Response.noContent().header("Cache-Control", "no-store").build();
    }

    public record TicketRequest(Integer atendimentoId) {}

    @POST
    @Path("/ws-ticket")
    public Response ticket(TicketRequest request, @HeaderParam("Authorization") String authorization) {
        if (request == null || request.atendimentoId() == null || request.atendimentoId() <= 0) {
            return Response.status(400).build();
        }
        access.conversar(request.atendimentoId(), identity);
        return Response.ok(Map.of("ticket", tickets.issue(SessionService.bearer(authorization),
                request.atendimentoId().toString()))).header("Cache-Control", "no-store").build();
    }
}
