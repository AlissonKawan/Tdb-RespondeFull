package br.com.tdbresponde.security;

import br.com.tdbresponde.exception.ErrorResponse;
import br.com.tdbresponde.exception.UnauthorizedException;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.TipoUsuario;
import br.com.tdbresponde.resource.*;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import jakarta.ws.rs.ext.Provider;
import java.security.Principal;
import java.util.Set;

/** Proteção por padrão: somente métodos explicitamente públicos dispensam sessão. */
@Provider
@Priority(Priorities.AUTHENTICATION)
public class AuthenticationFilter implements ContainerRequestFilter {
    private static final Set<String> ATENDIMENTO_STAFF_METHODS = Set.of(
            "listar", "listarSolicitados", "listarPorVoluntario", "inserir", "atualizar",
            "atualizarStatusPrioridade", "encerrar", "assumir", "atualizarCheckin", "excluir");

    @Inject SessionService sessions;
    @Context ResourceInfo resource;

    @Override
    public void filter(ContainerRequestContext request) {
        Class<?> type = resource.getResourceClass();
        String method = resource.getResourceMethod().getName();
        if ("OPTIONS".equals(request.getMethod()) || isPublic(type, method)) return;
        ContaUsuario conta;
        try {
            conta = sessions.authenticate(SessionService.bearer(request.getHeaderString("Authorization")));
        } catch (UnauthorizedException e) {
            deny(request, 401, "NAO_AUTORIZADO", e.getMessage());
            return;
        }
        boolean adminOnly = type == ContaUsuarioResource.class
                || (type == VoluntarioResource.class && !"GET".equals(request.getMethod()))
                || (type == VoluntarioResource.class && "listarPendentes".equals(method))
                || ((type == EspecialidadeResource.class || type == CanalComunicacaoResource.class)
                    && !"GET".equals(request.getMethod()))
                || (type == AgendaConsultaResource.class && "setupDatabase".equals(method));
        boolean staffOnly = type == AgendaConsultaResource.class || type == ProntuarioResource.class
                || type == CronogramaResource.class || type == ContatoResource.class
                || type == VoluntarioResource.class
                || (type == AtendimentoResource.class && ATENDIMENTO_STAFF_METHODS.contains(method));
        if ((adminOnly && conta.getTipoUsuario() != TipoUsuario.ADMIN)
                || (staffOnly && conta.getTipoUsuario() == TipoUsuario.BENEFICIARIO)) {
            deny(request, 403, "ACESSO_NEGADO", "Seu perfil nao tem acesso a este recurso.");
            return;
        }
        boolean secure = request.getSecurityContext().isSecure();
        request.setSecurityContext(new SecurityContext() {
            public Principal getUserPrincipal() { return () -> Integer.toString(conta.getId()); }
            public boolean isUserInRole(String role) { return conta.getTipoUsuario().name().equals(role); }
            public boolean isSecure() { return secure; }
            public String getAuthenticationScheme() { return "Bearer"; }
        });
    }

    private boolean isPublic(Class<?> type, String method) {
        return type == SpaFallbackResource.class || type == PingResource.class || type == HealthResource.class
                || (type == AuthResource.class && ("login".equals(method) || "registrar".equals(method)))
                || (type == ContatoResource.class && "registrarMensagem".equals(method))
                || ((type == EspecialidadeResource.class || type == CanalComunicacaoResource.class)
                    && ("listar".equals(method) || "buscarPorId".equals(method)));
    }

    private void deny(ContainerRequestContext request, int status, String code, String message) {
        request.abortWith(Response.status(status).type(MediaType.APPLICATION_JSON_TYPE)
                .header("Cache-Control", "no-store")
                .entity(new ErrorResponse(code, message)).build());
    }
}
