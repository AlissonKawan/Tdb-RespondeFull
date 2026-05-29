package br.com.tdbresponde.bo;

import br.com.tdbresponde.client.CronogramaRestClient;
import br.com.tdbresponde.dto.ResumoSemanalDTO;
import br.com.tdbresponde.dto.TarefaCronogramaDTO;
import br.com.tdbresponde.exception.NotFoundException;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.HashMap;
import java.util.Map;

@QuarkusTest
public class CronogramaBOTest {

    @Inject
    CronogramaBO cronogramaBO;

    @InjectMock
    @RestClient
    CronogramaRestClient restClient;

    @Test
    public void testBuscarTarefaSucesso() {
        TarefaCronogramaDTO mockTarefa = new TarefaCronogramaDTO();
        mockTarefa.setIdTarefa(1L);
        mockTarefa.setTitulo("Teste");

        Mockito.when(restClient.buscarTarefa(1L)).thenReturn(mockTarefa);

        TarefaCronogramaDTO result = cronogramaBO.buscarTarefa(1L);

        Assertions.assertNotNull(result);
        Assertions.assertEquals(1L, result.getIdTarefa());
        Assertions.assertEquals("Teste", result.getTitulo());
    }

    @Test
    public void testBuscarTarefaNaoEncontrada() {
        Response notFoundResponse = Response.status(404).build();
        Mockito.when(restClient.buscarTarefa(99L)).thenThrow(new WebApplicationException(notFoundResponse));

        Assertions.assertThrows(NotFoundException.class, () -> {
            cronogramaBO.buscarTarefa(99L);
        });
    }

    @Test
    public void testResumoSemanalSucesso() {
        ResumoSemanalDTO mockResumo = new ResumoSemanalDTO();
        mockResumo.setVoluntario_id(1L);
        Map<String, Map<String, Integer>> resumoMap = new HashMap<>();
        Map<String, Integer> statusCount = new HashMap<>();
        statusCount.put("Pendente", 2);
        resumoMap.put("Segunda-feira", statusCount);
        mockResumo.setResumo(resumoMap);

        Mockito.when(restClient.resumoSemanal(1L)).thenReturn(mockResumo);

        ResumoSemanalDTO result = cronogramaBO.resumoSemanal(1L);
        Assertions.assertNotNull(result);
        Assertions.assertEquals(1L, result.getVoluntario_id());
        Assertions.assertTrue(result.getResumo().containsKey("Segunda-feira"));
    }
}
