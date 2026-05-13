package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.ContaUsuarioBO;
import br.com.tdbresponde.dto.AuthUserResponse;
import br.com.tdbresponde.dto.ContaUsuarioRequest;
import br.com.tdbresponde.model.ContaUsuario;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ContaUsuarioResource {

    @Inject
    ContaUsuarioBO bo;

    @GET
    public Response listar() {
        return Response.ok(bo.listar().stream()
                .map(AuthUserResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        ContaUsuario conta = bo.buscarPorId(id);
        return Response.ok(AuthUserResponse.from(conta)).build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") int id, ContaUsuarioRequest request) {
        ContaUsuario conta = bo.atualizar(id, request);
        return Response.ok(AuthUserResponse.from(conta)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response desativar(@PathParam("id") int id) {
        bo.desativar(id);
        return Response.noContent().build();
    }
}
