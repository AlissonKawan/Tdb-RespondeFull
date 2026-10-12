package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.CronogramaBO;
import br.com.tdbresponde.dto.TarefaCronogramaDTO;
import br.com.tdbresponde.dto.TarefaCronogramaResponseDTO;
import br.com.tdbresponde.dto.ResumoSemanalDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CronogramaResourceTest {
    private CronogramaResource resource;
    private CronogramaBO bo;
    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void preparar() {
        resource = new CronogramaResource();
        bo = mock(CronogramaBO.class);
        resource.cronogramaBO = bo;
    }

    @Test
    void criarPreservaContratoJsonE201() throws Exception {
        var tarefa = mapper.readValue("{\"id_voluntario\":10,\"tipo\":\"Consulta\",\"dia_semana\":\"Segunda-feira\",\"titulo\":\"Consulta\",\"prioridade\":\"Alta\"}", TarefaCronogramaDTO.class);
        when(bo.criarTarefa(tarefa)).thenReturn(Map.of("mensagem", "Tarefa cadastrada com sucesso!", "id_tarefa", 42L));
        var resposta = resource.criarTarefa(tarefa);
        assertEquals(201, resposta.getStatus());
        assertEquals(42L, ((Map<?, ?>) resposta.getEntity()).get("id_tarefa"));
        assertEquals(10L, tarefa.getIdVoluntario());
    }

    @Test
    void listarPreservaSnakeCaseEFiltros() throws Exception {
        var tarefa = new TarefaCronogramaDTO();
        tarefa.setIdTarefa(42L);
        tarefa.setIdVoluntario(10L);
        var lista = new TarefaCronogramaResponseDTO();
        lista.setVoluntario_id(10L);
        lista.setTotal(1);
        lista.setTarefas(List.of(tarefa));
        when(bo.listarTarefasPorVoluntario(10L, "Segunda-feira", "Pendente", "Alta")).thenReturn(lista);
        var resposta = resource.listarTarefasPorVoluntario(10L, "Segunda-feira", "Pendente", "Alta");
        var json = mapper.valueToTree(resposta.getEntity());
        assertEquals(200, resposta.getStatus());
        assertEquals(10, json.get("voluntario_id").asInt());
        assertEquals(42, json.get("tarefas").get(0).get("id_tarefa").asInt());
        verify(bo).listarTarefasPorVoluntario(10L, "Segunda-feira", "Pendente", "Alta");
    }

    @Test
    void buscarAtualizarExcluirEResumoDelegamAoJava() {
        var tarefa = new TarefaCronogramaDTO();
        when(bo.buscarTarefa(42L)).thenReturn(tarefa);
        when(bo.atualizarTarefa(42L, tarefa)).thenReturn(Map.of("id_tarefa", 42L));
        when(bo.excluirTarefa(42L)).thenReturn(Map.of("id_tarefa", 42L));
        var resumo = new ResumoSemanalDTO();
        resumo.setVoluntario_id(10L);
        resumo.setResumo(Map.of("Segunda-feira", Map.of("Pendente", 1)));
        when(bo.resumoSemanal(10L)).thenReturn(resumo);
        assertSame(tarefa, resource.buscarTarefa(42L).getEntity());
        assertEquals(200, resource.atualizarTarefa(42L, tarefa).getStatus());
        assertEquals(200, resource.excluirTarefa(42L).getStatus());
        assertSame(resumo, resource.resumoSemanal(10L).getEntity());
    }
}
