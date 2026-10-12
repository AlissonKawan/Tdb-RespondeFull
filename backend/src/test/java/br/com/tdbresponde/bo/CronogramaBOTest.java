package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.CronogramaDAO;
import br.com.tdbresponde.dto.TarefaCronogramaDTO;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.DatabaseException;
import br.com.tdbresponde.exception.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CronogramaBOTest {
    private CronogramaBO bo;
    private CronogramaDAO dao;

    @BeforeEach
    void preparar() {
        bo = new CronogramaBO();
        dao = mock(CronogramaDAO.class);
        bo.dao = dao;
    }

    @Test
    void criarSempreIniciaPendente() {
        TarefaCronogramaDTO tarefa = tarefa();
        tarefa.setStatus("Concluido");
        when(dao.inserir(tarefa)).thenReturn(42L);
        assertEquals(42L, bo.criarTarefa(tarefa).get("id_tarefa"));
        assertEquals("Pendente", tarefa.getStatus());
        verify(dao).inserir(tarefa);
    }

    @Test
    void validarCamposAntesDePersistir() {
        assertThrows(BusinessException.class, () -> bo.criarTarefa(null));
        TarefaCronogramaDTO tarefa = tarefa();
        tarefa.setTitulo(" ");
        assertThrows(BusinessException.class, () -> bo.criarTarefa(tarefa));
        tarefa.setTitulo("Consulta");
        tarefa.setDiaSemana("Invalido");
        assertThrows(BusinessException.class, () -> bo.criarTarefa(tarefa));
        tarefa.setDiaSemana("Segunda-feira");
        tarefa.setPrioridade("Invalida");
        assertThrows(BusinessException.class, () -> bo.criarTarefa(tarefa));
        verifyNoInteractions(dao);
    }

    @Test
    void listarPreservaFiltrosETotal() {
        when(dao.listarPorVoluntario(10L, "Segunda-feira", "Pendente", "Alta")).thenReturn(List.of(tarefa()));
        var resposta = bo.listarTarefasPorVoluntario(10L, "Segunda-feira", "Pendente", "Alta");
        assertEquals(10L, resposta.getVoluntario_id());
        assertEquals(1, resposta.getTotal());
        assertEquals("Consulta", resposta.getTarefas().get(0).getTitulo());
    }

    @Test
    void buscarInexistenteRetornaNaoEncontrado() {
        assertThrows(NotFoundException.class, () -> bo.buscarTarefa(99L));
    }

    @Test
    void atualizarNormalizaVariantesDeConclusao() {
        for (String status : List.of("Concluido", "Concluida", "Concluído", "Concluída", "CONCLUIDO", "CONCLUIDA")) {
            TarefaCronogramaDTO tarefa = tarefa();
            tarefa.setStatus(status);
            when(dao.atualizar(1L, tarefa)).thenReturn(true);
            assertEquals(1L, bo.atualizarTarefa(1L, tarefa).get("id_tarefa"));
            assertEquals("Concluida", tarefa.getStatus());
        }
    }

    @Test
    void atualizarInexistenteRetornaNaoEncontrado() {
        TarefaCronogramaDTO tarefa = tarefa();
        assertThrows(NotFoundException.class, () -> bo.atualizarTarefa(99L, tarefa));
    }

    @Test
    void statusInvalidoNaoExecutaUpdate() {
        TarefaCronogramaDTO tarefa = tarefa();
        tarefa.setStatus("Invalido");
        assertThrows(BusinessException.class, () -> bo.atualizarTarefa(1L, tarefa));
        verifyNoInteractions(dao);
    }

    @Test
    void excluirRetornaIdOuNaoEncontrado() {
        when(dao.excluir(1L)).thenReturn(true);
        assertEquals(1L, bo.excluirTarefa(1L).get("id_tarefa"));
        assertThrows(NotFoundException.class, () -> bo.excluirTarefa(99L));
    }

    @Test
    void resumoPreservaAgrupamentoPorDiaEStatus() {
        var resumo = Map.of("Segunda-feira", Map.of("Pendente", 2, "Concluida", 1));
        when(dao.resumoSemanal(10L)).thenReturn(resumo);
        var resposta = bo.resumoSemanal(10L);
        assertEquals(10L, resposta.getVoluntario_id());
        assertEquals(resumo, resposta.getResumo());
    }

    @Test
    void erroDoBancoPermaneceErroDoBanco() {
        when(dao.buscarPorId(1L)).thenThrow(new DatabaseException("Falha", new java.sql.SQLException()));
        assertThrows(DatabaseException.class, () -> bo.buscarTarefa(1L));
    }

    @Test
    void idsInvalidosNaoAcessamBanco() {
        assertThrows(BusinessException.class, () -> bo.buscarTarefa(0L));
        assertThrows(BusinessException.class, () -> bo.excluirTarefa(-1L));
        assertThrows(BusinessException.class, () -> bo.resumoSemanal(null));
        assertThrows(BusinessException.class, () -> bo.listarTarefasPorVoluntario(0L, null, null, null));
        verifyNoInteractions(dao);
    }

    private TarefaCronogramaDTO tarefa() {
        var tarefa = new TarefaCronogramaDTO();
        tarefa.setIdVoluntario(10L);
        tarefa.setTipo("Consulta");
        tarefa.setDiaSemana("Segunda-feira");
        tarefa.setTitulo("Consulta");
        tarefa.setPrioridade("Alta");
        tarefa.setStatus("Pendente");
        return tarefa;
    }
}
