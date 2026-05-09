package br.com.tdbresponde.resource;

import br.com.tdbresponde.dao.EspecialidadeDAO;
import br.com.tdbresponde.dto.EspecialidadeRequest;
import br.com.tdbresponde.dto.EspecialidadeResponse;
import br.com.tdbresponde.exception.NotFoundException;
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
    EspecialidadeDAO dao;

    @GET
    public Response listar() {
        return Response.ok(dao.buscarTodos().stream()
                .map(EspecialidadeResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        Especialidade especialidade = dao.buscarPorId(id);
        if (especialidade == null) {
            throw new NotFoundException("Especialidade nao encontrada");
        }
        return Response.ok(EspecialidadeResponse.from(especialidade)).build();
    }

    @POST
    public Response inserir(EspecialidadeRequest request) {
        Especialidade especialidade = toModel(request);
        dao.inserir(especialidade);
        return Response.status(Response.Status.CREATED)
                .entity(EspecialidadeResponse.from(especialidade))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") int id, EspecialidadeRequest request) {
        Especialidade especialidade = toModel(request);
        especialidade.setId(id);
        dao.atualizar(especialidade);
        return Response.ok(EspecialidadeResponse.from(especialidade)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") int id) {
        dao.excluir(id);
        return Response.noContent().build();
    }

    private Especialidade toModel(EspecialidadeRequest request) {
        Especialidade especialidade = new Especialidade();
        especialidade.setNome(request.nome);
        especialidade.setDescricao(request.descricao);
        return especialidade;
    }
}
