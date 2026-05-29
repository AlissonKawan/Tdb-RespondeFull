package br.com.tdbresponde.client;

import br.com.tdbresponde.dto.ResumoSemanalDTO;
import br.com.tdbresponde.dto.TarefaCronogramaDTO;
import br.com.tdbresponde.dto.TarefaCronogramaResponseDTO;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;

import java.util.Map;

@Path("/cronograma/tarefas")
@RegisterRestClient(configKey = "cronograma-api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public interface CronogramaRestClient {

    @POST
    Map<String, Object> criarTarefa(TarefaCronogramaDTO tarefa);

    @GET
    @Path("/voluntario/{voluntario_id}")
    TarefaCronogramaResponseDTO listarTarefasPorVoluntario(
            @PathParam("voluntario_id") Long voluntarioId,
            @QueryParam("dia_semana") String diaSemana,
            @QueryParam("status") String status,
            @QueryParam("prioridade") String prioridade
    );

    @GET
    @Path("/{id_tarefa}")
    TarefaCronogramaDTO buscarTarefa(@PathParam("id_tarefa") Long idTarefa);

    @PUT
    @Path("/{id_tarefa}")
    Map<String, Object> atualizarTarefa(@PathParam("id_tarefa") Long idTarefa, TarefaCronogramaDTO tarefa);

    @DELETE
    @Path("/{id_tarefa}")
    Map<String, Object> excluirTarefa(@PathParam("id_tarefa") Long idTarefa);

    @GET
    @Path("/voluntario/{voluntario_id}/resumo")
    ResumoSemanalDTO resumoSemanal(@PathParam("voluntario_id") Long voluntarioId);
}
