package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.AgendaConsultaBO;
import br.com.tdbresponde.model.AgendaConsulta;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/agendas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AgendaConsultaResource {

    @Inject
    AgendaConsultaBO agendaBO;

    @GET
    @Path("/voluntario/{voluntarioId}")
    public Response buscarPorVoluntario(@PathParam("voluntarioId") int voluntarioId) {
        List<AgendaConsulta> agendas = agendaBO.buscarPorVoluntario(voluntarioId);
        return Response.ok(agendas).build();
    }

    @POST
    public Response criar(AgendaConsulta agenda) {
        AgendaConsulta criada = agendaBO.cadastrar(agenda);
        return Response.status(Response.Status.CREATED).entity(criada).build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") int id, AgendaConsulta agenda) {
        AgendaConsulta atualizada = agendaBO.atualizar(id, agenda);
        return Response.ok(atualizada).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") int id) {
        agendaBO.excluir(id);
        return Response.noContent().build();
    }
}
