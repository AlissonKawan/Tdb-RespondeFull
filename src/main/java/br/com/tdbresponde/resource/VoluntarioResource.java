package br.com.tdbresponde.resource;

import br.com.tdbresponde.dao.VoluntarioDAO;
import br.com.tdbresponde.dto.VoluntarioRequest;
import br.com.tdbresponde.dto.VoluntarioResponse;
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
import br.com.tdbresponde.model.Voluntario;

@Path("/voluntarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class VoluntarioResource {

    @Inject
    VoluntarioDAO dao;

    @GET
    public Response listar() {
        return Response.ok(dao.buscarTodos().stream()
                .map(VoluntarioResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        Voluntario voluntario = dao.buscarPorId(id);
        if (voluntario == null) {
            throw new NotFoundException("Voluntario nao encontrado");
        }
        return Response.ok(VoluntarioResponse.from(voluntario)).build();
    }

    @POST
    public Response inserir(VoluntarioRequest request) {
        Voluntario voluntario = toModel(request);
        dao.inserir(voluntario);
        return Response.status(Response.Status.CREATED)
                .entity(VoluntarioResponse.from(voluntario))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") int id, VoluntarioRequest request) {
        Voluntario voluntario = toModel(request);
        voluntario.setId(id);
        dao.atualizar(voluntario);
        return Response.ok(VoluntarioResponse.from(voluntario)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") int id) {
        dao.excluir(id);
        return Response.noContent().build();
    }

    private Voluntario toModel(VoluntarioRequest request) {
        Voluntario voluntario = new Voluntario();
        voluntario.setNome(request.nome);
        voluntario.setUsuario(request.usuario);
        voluntario.setSenha(request.senha);
        voluntario.setAcessoSigilo(request.acessoSigilo);
        voluntario.setDisponivel(request.disponivel);
        if (request.especialidadeId != null) {
            Especialidade especialidade = new Especialidade();
            especialidade.setId(request.especialidadeId);
            voluntario.setEspecialidade(especialidade);
        }
        return voluntario;
    }
}
