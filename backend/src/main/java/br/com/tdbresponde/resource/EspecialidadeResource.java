package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.EspecialidadeBO;
import br.com.tdbresponde.dto.EspecialidadeRequest;
import br.com.tdbresponde.dto.EspecialidadeResponse;
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
import br.com.tdbresponde.model.Especialidade;

@Path("/especialidades")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EspecialidadeResource {

    @Inject
    EspecialidadeBO bo;

    @GET
    public Response listar() {
        return Response.ok(bo.listar().stream()
                .map(EspecialidadeResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        Especialidade especialidade = bo.buscarPorId(id);
        return Response.ok(EspecialidadeResponse.from(especialidade)).build();
    }

    @POST
    public Response inserir(EspecialidadeRequest request) {
        Especialidade especialidade = bo.inserir(request);
        return Response.status(Response.Status.CREATED)
                .entity(EspecialidadeResponse.from(especialidade))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") int id, EspecialidadeRequest request) {
        Especialidade especialidade = bo.atualizar(id, request);
        return Response.ok(EspecialidadeResponse.from(especialidade)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") int id) {
        bo.excluir(id);
        return Response.noContent().build();
    }
}
