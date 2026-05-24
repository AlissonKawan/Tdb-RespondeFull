package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.VoluntarioBO;
import br.com.tdbresponde.dto.AprovacaoVoluntarioRequest;
import br.com.tdbresponde.dto.RankingResponse;
import br.com.tdbresponde.dto.VoluntarioRequest;
import br.com.tdbresponde.dto.VoluntarioResponse;
import br.com.tdbresponde.dao.ContaUsuarioDAO;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.TipoUsuario;
import br.com.tdbresponde.exception.UnauthorizedException;
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
import br.com.tdbresponde.model.Voluntario;

@Path("/voluntarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class VoluntarioResource {

    @Inject
    VoluntarioBO bo;

    @Inject
    ContaUsuarioDAO contaUsuarioDAO;

    @GET
    public Response listar() {
        return Response.ok(bo.listar().stream()
                .map(VoluntarioResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/pendentes")
    public Response listarPendentes() {
        return Response.ok(bo.listarPendentes().stream()
                .map(VoluntarioResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/ativos")
    public Response listarAtivos() {
        return Response.ok(bo.listarAtivos().stream()
                .map(VoluntarioResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/ranking")
    public Response listarRanking(@jakarta.ws.rs.QueryParam("limite") @jakarta.ws.rs.DefaultValue("10") int limite) {
        return Response.ok(bo.buscarTopRanking(limite).stream()
                .map(RankingResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        Voluntario voluntario = bo.buscarPorId(id);
        return Response.ok(VoluntarioResponse.from(voluntario)).build();
    }

    @POST
    public Response inserir(VoluntarioRequest request) {
        Voluntario voluntario = bo.inserir(request);
        return Response.status(Response.Status.CREATED)
                .entity(VoluntarioResponse.from(voluntario))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") int id, VoluntarioRequest request) {
        Voluntario voluntario = bo.atualizar(id, request);
        return Response.ok(VoluntarioResponse.from(voluntario)).build();
    }

    @PUT
    @Path("/{id}/aprovar")
    public Response aprovar(@PathParam("id") int id, AprovacaoVoluntarioRequest request) {
        if (request == null || request.aprovadorId == null) {
            throw new UnauthorizedException("Aprovador nao identificado.");
        }

        ContaUsuario aprovador = contaUsuarioDAO.buscarPorId(request.aprovadorId);
        if (aprovador == null || aprovador.getTipoUsuario() != TipoUsuario.ADMIN) {
            throw new UnauthorizedException("Apenas administradores podem aprovar novos voluntarios.");
        }

        bo.aprovar(id);
        return Response.noContent().build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") int id) {
        bo.excluir(id);
        return Response.noContent().build();
    }
}
