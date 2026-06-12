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

        return Response.ok(authRes).build();
    }
}
