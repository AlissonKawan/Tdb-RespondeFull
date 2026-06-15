package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.ProntuarioBO;
import br.com.tdbresponde.model.Prontuario;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/prontuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProntuarioResource {

    @Inject
    ProntuarioBO prontuarioBO;

    @GET
    @Path("/agenda/{agendaId}")
    public Response buscarPorAgenda(@PathParam("agendaId") int agendaId) {
        List<Prontuario> prontuarios = prontuarioBO.buscarPorAgenda(agendaId);
        return Response.ok(prontuarios).build();
    }

    @POST
    public Response registrarEvolucao(Prontuario prontuario) {
        Prontuario novo = prontuarioBO.registrarEvolucao(prontuario);
        return Response.status(Response.Status.CREATED).entity(novo).build();
    }
}
