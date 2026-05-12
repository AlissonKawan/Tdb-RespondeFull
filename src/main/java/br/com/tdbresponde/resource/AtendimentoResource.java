package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.AtendimentoBO;
import br.com.tdbresponde.dto.AtendimentoRequest;
import br.com.tdbresponde.dto.AtendimentoResponse;
import jakarta.inject.Inject;
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
import br.com.tdbresponde.model.Atendimento;

@Path("/atendimentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AtendimentoResource {

    @Inject
    AtendimentoBO bo;

    @GET
    public Response listar() {
        return Response.ok(bo.listar().stream()
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/solicitados")
    public Response listarSolicitados() {
        return Response.ok(bo.listarSolicitados().stream()
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/voluntario/{voluntarioId}")
    public Response listarPorVoluntario(@PathParam("voluntarioId") int voluntarioId) {
        return Response.ok(bo.listarPorVoluntario(voluntarioId).stream()
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        Atendimento atendimento = bo.buscarPorId(id);
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @POST
    public Response inserir(AtendimentoRequest request) {
        Atendimento atendimento = bo.inserir(request);
        return Response.status(Response.Status.CREATED)
                .entity(AtendimentoResponse.from(atendimento))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") int id, AtendimentoRequest request) {
        Atendimento atendimento = bo.atualizar(id, request);
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") int id) {
        bo.excluir(id);
        return Response.noContent().build();
    }
}
