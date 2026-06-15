package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.AgendaConsultaBO;
import br.com.tdbresponde.model.AgendaConsulta;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.sql.Connection;
import java.sql.Statement;
import javax.sql.DataSource;

@Path("/agendas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AgendaConsultaResource {

    @Inject
    AgendaConsultaBO agendaBO;
    
    @Inject
    DataSource dataSource;

    @GET
    @Path("/setup")
    public Response setupDatabase() {
        StringBuilder result = new StringBuilder();
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            String createTable = "CREATE TABLE AGENDA_CONSULTA (" +
                "ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY, " +
                "VOLUNTARIO_ID NUMBER NOT NULL, " +
                "PACIENTE VARCHAR2(255) NOT NULL, " +
                "TIPO VARCHAR2(100) NOT NULL, " +
                "DATA_CONSULTA DATE NOT NULL, " +
                "HORARIO VARCHAR2(10) NOT NULL, " +
                "STATUS VARCHAR2(50) NOT NULL, " +
                "TIPO_PESSOA VARCHAR2(50) " +
                ")";
            stmt.execute(createTable);
            result.append("Tabela AGENDA_CONSULTA criada com sucesso.\n");
        } catch (Exception e) {
            result.append("Erro ao criar tabela: ").append(e.getMessage()).append("\n");
        }

        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE INDEX IDX_AGENDA_VOL ON AGENDA_CONSULTA(VOLUNTARIO_ID)");
            result.append("Índice VOLUNTARIO_ID criado.\n");
        } catch (Exception e) {
            result.append("Erro ao criar índice VOLUNTARIO_ID: ").append(e.getMessage()).append("\n");
        }

        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE INDEX IDX_AGENDA_DATA ON AGENDA_CONSULTA(DATA_CONSULTA)");
            result.append("Índice DATA_CONSULTA criado.\n");
        } catch (Exception e) {
            result.append("Erro ao criar índice DATA_CONSULTA: ").append(e.getMessage()).append("\n");
        }
        
        return Response.ok(result.toString()).build();
    }

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
