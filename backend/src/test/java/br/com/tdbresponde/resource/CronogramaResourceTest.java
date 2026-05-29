package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.CronogramaBO;
import br.com.tdbresponde.dto.TarefaCronogramaDTO;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
public class CronogramaResourceTest {

    @InjectMock
    CronogramaBO cronogramaBO;

    @Test
    public void testBuscarTarefaEndpoint() {
        TarefaCronogramaDTO mockTarefa = new TarefaCronogramaDTO();
        mockTarefa.setIdTarefa(1L);
        mockTarefa.setTitulo("Atividade Social");

        Mockito.when(cronogramaBO.buscarTarefa(1L)).thenReturn(mockTarefa);

        given()
          .when().get("/api/cronograma/tarefas/1")
          .then()
             .statusCode(200)
             .body("titulo", is("Atividade Social"));
    }

    @Test
    public void testCriarTarefaEndpoint() {
        TarefaCronogramaDTO mockTarefa = new TarefaCronogramaDTO();
        mockTarefa.setTitulo("Nova Tarefa");
        
        java.util.Map<String, Object> responseMap = new java.util.HashMap<>();
        responseMap.put("mensagem", "Tarefa criada com sucesso!");
        responseMap.put("id_tarefa", 1);

        Mockito.when(cronogramaBO.criarTarefa(Mockito.any(TarefaCronogramaDTO.class))).thenReturn(responseMap);

        given()
          .contentType(ContentType.JSON)
          .body("{\"titulo\": \"Nova Tarefa\", \"dia_semana\": \"Segunda-feira\"}")
          .when().post("/api/cronograma/tarefas")
          .then()
             .statusCode(201)
             .body("mensagem", is("Tarefa criada com sucesso!"));
    }
}
