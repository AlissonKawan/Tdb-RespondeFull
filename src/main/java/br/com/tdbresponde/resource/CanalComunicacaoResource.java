package br.com.tdbresponde.resource;

import br.com.tdbresponde.dao.CanalComunicacaoDAO;
import br.com.tdbresponde.dto.CanalComunicacaoRequest;
import br.com.tdbresponde.dto.CanalComunicacaoResponse;
import br.com.tdbresponde.exception.NotFoundException;
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
    CanalComunicacaoDAO dao;

    @GET
    public Response listar() {
        return Response.ok(dao.buscarTodos().stream()
                .map(CanalComunicacaoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        CanalComunicacao canal = dao.buscarPorId(id);
        if (canal == null) {
            throw new NotFoundException("Canal de comunicacao nao encontrado");
        }
        return Response.ok(CanalComunicacaoResponse.from(canal)).build();
    }

    @POST
    public Response inserir(CanalComunicacaoRequest request) {
        CanalComunicacao canal = toModel(request);
        dao.inserir(canal);
        return Response.status(Response.Status.CREATED)
                .entity(CanalComunicacaoResponse.from(canal))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") int id, CanalComunicacaoRequest request) {
        CanalComunicacao canal = toModel(request);
        canal.setId(id);
        dao.atualizar(canal);
        return Response.ok(CanalComunicacaoResponse.from(canal)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") int id) {
        dao.excluir(id);
        return Response.noContent().build();
    }

    private CanalComunicacao toModel(CanalComunicacaoRequest request) {
        CanalComunicacao canal = new CanalComunicacao();
        canal.setNome(request.nome);
        canal.setDescricao(request.descricao);
        return canal;
    }
}
