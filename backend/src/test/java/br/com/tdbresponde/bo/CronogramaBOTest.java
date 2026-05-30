package br.com.tdbresponde.bo;

import br.com.tdbresponde.client.CronogramaRestClient;
import br.com.tdbresponde.dto.ResumoSemanalDTO;
import br.com.tdbresponde.dto.TarefaCronogramaDTO;
import br.com.tdbresponde.exception.NotFoundException;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.core.Response;
import br.com.tdbresponde.exception.BusinessException;
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

    @Test
    public void testCriarTarefaErroValidacao() {
        TarefaCronogramaDTO tarefaInvalida = new TarefaCronogramaDTO();
        
        Map<String, Object> errorBody = new HashMap<>();
        errorBody.put("mensagem", "Campo 'titulo' é obrigatório.");
        
        Response badRequestResponse = Response.status(400).entity(errorBody).build();
        Mockito.when(restClient.criarTarefa(Mockito.any(TarefaCronogramaDTO.class)))
               .thenThrow(new WebApplicationException(badRequestResponse));

        BusinessException exception = Assertions.assertThrows(BusinessException.class, () -> {
            cronogramaBO.criarTarefa(tarefaInvalida);
        });
        
        Assertions.assertTrue(exception.getMessage().contains("Campo 'titulo' é obrigatório."));
    }

    @Test
    public void testAtualizarTarefaErroServidor() {
        TarefaCronogramaDTO mockTarefa = new TarefaCronogramaDTO();
        Response serverErrorResponse = Response.status(500).build();
        Mockito.when(restClient.atualizarTarefa(Mockito.eq(1L), Mockito.any(TarefaCronogramaDTO.class)))
               .thenThrow(new WebApplicationException(serverErrorResponse));

        BusinessException exception = Assertions.assertThrows(BusinessException.class, () -> {
            cronogramaBO.atualizarTarefa(1L, mockTarefa);
        });
        
        Assertions.assertTrue(exception.getMessage().contains("Erro 500 na API de Cronograma"));
    }

    @Test
    public void testExcluirTarefaErroConexao() {
        Mockito.when(restClient.excluirTarefa(1L)).thenThrow(new ProcessingException("Connection refused"));

        BusinessException exception = Assertions.assertThrows(BusinessException.class, () -> {
            cronogramaBO.excluirTarefa(1L);
        });
        
        Assertions.assertTrue(exception.getMessage().contains("Não foi possível conectar à API de Cronograma"));
    }
}
