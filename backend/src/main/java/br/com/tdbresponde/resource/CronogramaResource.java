package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.CronogramaBO;
import br.com.tdbresponde.dto.ResumoSemanalDTO;
import br.com.tdbresponde.dto.TarefaCronogramaDTO;
import br.com.tdbresponde.dto.TarefaCronogramaResponseDTO;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@Path("/api/cronograma/tarefas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CronogramaResource {

    @Inject
    CronogramaBO cronogramaBO;

    @POST
    public Response criarTarefa(TarefaCronogramaDTO tarefa) {
        Map<String, Object> result = cronogramaBO.criarTarefa(tarefa);
        return Response.status(Response.Status.CREATED).entity(result).build();
    }

    @GET
    @Path("/voluntario/{voluntario_id}")
    public Response listarTarefasPorVoluntario(
            @PathParam("voluntario_id") Long voluntarioId,
            @QueryParam("dia_semana") String diaSemana,
            @QueryParam("status") String status,
            @QueryParam("prioridade") String prioridade
    ) {
        TarefaCronogramaResponseDTO result = cronogramaBO.listarTarefasPorVoluntario(voluntarioId, diaSemana, status, prioridade);
        return Response.ok(result).build();
    }

    @GET
    @Path("/{id_tarefa}")
    public Response buscarTarefa(@PathParam("id_tarefa") Long idTarefa) {
        TarefaCronogramaDTO result = cronogramaBO.buscarTarefa(idTarefa);
        return Response.ok(result).build();
    }

    @PUT
    @Path("/{id_tarefa}")
    public Response atualizarTarefa(@PathParam("id_tarefa") Long idTarefa, TarefaCronogramaDTO tarefa) {
        Map<String, Object> result = cronogramaBO.atualizarTarefa(idTarefa, tarefa);
        return Response.ok(result).build();
    }

    @DELETE
    @Path("/{id_tarefa}")
    public Response excluirTarefa(@PathParam("id_tarefa") Long idTarefa) {
        Map<String, Object> result = cronogramaBO.excluirTarefa(idTarefa);
        return Response.ok(result).build();
    }

    @GET
    @Path("/voluntario/{voluntario_id}/resumo")
    public Response resumoSemanal(@PathParam("voluntario_id") Long voluntarioId) {
        ResumoSemanalDTO result = cronogramaBO.resumoSemanal(voluntarioId);
        return Response.ok(result).build();
    }
}
