package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.CanalComunicacaoBO;
import br.com.tdbresponde.dto.CanalComunicacaoRequest;
import br.com.tdbresponde.dto.CanalComunicacaoResponse;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.inject.Inject;
import br.com.tdbresponde.model.CanalComunicacao;

@Path("/canais")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CanalComunicacaoResource {

    @Inject
    CanalComunicacaoBO bo;

    @GET
    public Response listar() {
        return Response.ok(bo.listar().stream()
                .map(CanalComunicacaoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        CanalComunicacao canal = bo.buscarPorId(id);
        return Response.ok(CanalComunicacaoResponse.from(canal)).build();
    }

    @POST
    public Response inserir(CanalComunicacaoRequest request) {
        CanalComunicacao canal = bo.inserir(request);
        return Response.status(Response.Status.CREATED)
                .entity(CanalComunicacaoResponse.from(canal))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") int id, CanalComunicacaoRequest request) {
        CanalComunicacao canal = bo.atualizar(id, request);
        return Response.ok(CanalComunicacaoResponse.from(canal)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") int id) {
        bo.excluir(id);
        return Response.noContent().build();
    }
}
