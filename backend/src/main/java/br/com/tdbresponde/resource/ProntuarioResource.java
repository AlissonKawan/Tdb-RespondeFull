package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.ProntuarioBO;
import br.com.tdbresponde.model.Prontuario;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import br.com.tdbresponde.bo.AgendaConsultaBO;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.security.AtendimentoAccess;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.SecurityContext;

@Path("/prontuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProntuarioResource {

    @Inject
    ProntuarioBO prontuarioBO;
    @Inject AtendimentoAccess access;
    @Inject AgendaConsultaBO agendas;
    @Context SecurityContext identity;

    @GET
    @Path("/agenda/{agendaId}")
    public Response buscarPorAgenda(@PathParam("agendaId") int agendaId) {
        access.agenda(agendas.buscarPorId(agendaId), identity);
        List<Prontuario> prontuarios = prontuarioBO.buscarPorAgenda(agendaId);
        return Response.ok(prontuarios).build();
    }

    @GET
    @Path("/atendimento/{atendimentoId}")
    public Response buscarPorAtendimento(@PathParam("atendimentoId") int atendimentoId) {
        access.alterar(atendimentoId, identity);
        List<Prontuario> prontuarios = prontuarioBO.buscarPorAtendimento(atendimentoId);
        return Response.ok(prontuarios).build();
    }

    @POST
    public Response registrarEvolucao(Prontuario prontuario) {
        if (prontuario == null) throw new BusinessException("Informe os dados do prontuario");
        access.listarPorVoluntario(prontuario.getVoluntarioId(), identity);
        if (prontuario.getAtendimentoId() != null && prontuario.getAtendimentoId() > 0) {
            access.alterar(prontuario.getAtendimentoId(), identity);
        }
        if (prontuario.getAgendaId() != null && prontuario.getAgendaId() > 0) {
            access.agenda(agendas.buscarPorId(prontuario.getAgendaId()), identity);
        }
        Prontuario novo = prontuarioBO.registrarEvolucao(prontuario);
        return Response.status(Response.Status.CREATED).entity(novo).build();
    }
}

