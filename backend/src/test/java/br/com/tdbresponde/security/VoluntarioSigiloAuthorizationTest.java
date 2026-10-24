package br.com.tdbresponde.security;

import br.com.tdbresponde.dto.VoluntarioRequest;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.TipoUsuario;
import br.com.tdbresponde.resource.VoluntarioResource;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.SecurityContext;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class VoluntarioSigiloAuthorizationTest {
    private ContainerRequestContext requisicao(TipoUsuario papel) throws Exception {
        AuthenticationFilter filtro = new AuthenticationFilter();
        filtro.sessions = mock(SessionService.class);
        filtro.resource = mock(ResourceInfo.class);
        doReturn(VoluntarioResource.class).when(filtro.resource).getResourceClass();
        when(filtro.resource.getResourceMethod()).thenReturn(
                VoluntarioResource.class.getMethod("atualizar", int.class, VoluntarioRequest.class));
        ContaUsuario conta = new ContaUsuario();
        conta.setId(70); conta.setTipoUsuario(papel); conta.setAtivo(true);
        when(filtro.sessions.authenticate(anyString())).thenReturn(conta);
        ContainerRequestContext request = mock(ContainerRequestContext.class);
        when(request.getMethod()).thenReturn("PUT");
        when(request.getHeaderString("Authorization")).thenReturn("Bearer " + "x".repeat(43));
        when(request.getSecurityContext()).thenReturn(mock(SecurityContext.class));
        filtro.filter(request);
        return request;
    }

    @Test
    void somenteAdministradorPodeEditarPermissaoPelaRotaDeVoluntarios() throws Exception {
        ContainerRequestContext request = requisicao(TipoUsuario.ADMIN);
        verify(request, never()).abortWith(any());
        ArgumentCaptor<SecurityContext> contexto = ArgumentCaptor.forClass(SecurityContext.class);
        verify(request).setSecurityContext(contexto.capture());
        assertTrue(contexto.getValue().isUserInRole("ADMIN"));
    }

    @Test
    void voluntarioEBeneficiarioNaoPodemEditarPermissao() throws Exception {
        for (TipoUsuario papel : new TipoUsuario[]{TipoUsuario.VOLUNTARIO, TipoUsuario.BENEFICIARIO}) {
            ContainerRequestContext request = requisicao(papel);
            ArgumentCaptor<Response> resposta = ArgumentCaptor.forClass(Response.class);
            verify(request).abortWith(resposta.capture());
            assertEquals(403, resposta.getValue().getStatus());
            verify(request, never()).setSecurityContext(any());
        }
    }
}
