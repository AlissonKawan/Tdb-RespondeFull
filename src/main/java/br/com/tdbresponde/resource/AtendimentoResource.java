package br.com.tdbresponde.resource;

import br.com.tdbresponde.dao.AtendimentoDAO;
import br.com.tdbresponde.dto.AtendimentoRequest;
import br.com.tdbresponde.dto.AtendimentoResponse;
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
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.CanalComunicacao;
import br.com.tdbresponde.model.CriancaAdolescente;
import br.com.tdbresponde.model.Voluntario;

@Path("/atendimentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AtendimentoResource {

    @Inject
    AtendimentoDAO dao;

    @GET
    public Response listar() {
        return Response.ok(dao.buscarTodos().stream()
                .map(AtendimentoResponse::from)
                .toList()).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") int id) {
        Atendimento atendimento = dao.buscarPorId(id);
        if (atendimento == null) {
            throw new NotFoundException("Atendimento nao encontrado");
        }
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @POST
    public Response inserir(AtendimentoRequest request) {
        Atendimento atendimento = toModel(request);
        dao.inserir(atendimento);
        return Response.status(Response.Status.CREATED)
                .entity(AtendimentoResponse.from(atendimento))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") int id, AtendimentoRequest request) {
        Atendimento atendimento = toModel(request);
        atendimento.setId(id);
        dao.atualizar(atendimento);
        return Response.ok(AtendimentoResponse.from(atendimento)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") int id) {
        dao.excluir(id);
        return Response.noContent().build();
    }

    private Atendimento toModel(AtendimentoRequest request) {
        Atendimento atendimento = new Atendimento();
        atendimento.setPrioridade(request.prioridade);
        atendimento.setStatus(request.status);
        atendimento.setDataAbertura(request.dataAbertura);
        atendimento.setDataEncerramento(request.dataEncerramento);
        if (request.pessoaAtendidaId != null) {
            CriancaAdolescente pessoa = new CriancaAdolescente();
            pessoa.setId(request.pessoaAtendidaId);
            atendimento.setPessoaAtendida(pessoa);
        }
        if (request.voluntarioId != null) {
            Voluntario voluntario = new Voluntario();
            voluntario.setId(request.voluntarioId);
            atendimento.setVoluntario(voluntario);
        }
        if (request.canalComunicacaoId != null) {
            CanalComunicacao canal = new CanalComunicacao();
            canal.setId(request.canalComunicacaoId);
            atendimento.setCanalOrigem(canal);
        }
        return atendimento;
    }
}
