package br.com.tdbresponde.dao;

import br.com.tdbresponde.dto.TarefaCronogramaDTO;
import br.com.tdbresponde.exception.DatabaseException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import javax.sql.DataSource;
import java.sql.*;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CronogramaDAOTest {
    private CronogramaDAO dao;
    private DataSource dataSource;
    private Connection conn;
    private PreparedStatement stmt;
    private ResultSet rs;

    @BeforeEach
    void preparar() throws Exception {
        dao = new CronogramaDAO();
        dataSource = mock(DataSource.class);
        conn = mock(Connection.class);
        stmt = mock(PreparedStatement.class);
        rs = mock(ResultSet.class);
        dao.dataSource = dataSource;
        when(dataSource.getConnection()).thenReturn(conn);
        when(conn.prepareStatement(anyString())).thenReturn(stmt);
        when(conn.prepareStatement(anyString(), any(String[].class))).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs);
    }

    @Test
    void criarCapturaIdEPreservaTodosOsCampos() throws Exception {
        when(stmt.getGeneratedKeys()).thenReturn(rs);
        when(rs.next()).thenReturn(true);
        when(rs.getLong(1)).thenReturn(42L);
        var tarefa = tarefa();
        assertEquals(42L, dao.inserir(tarefa));
        verify(stmt).setLong(1, 10L);
        verify(stmt).setString(6, "Pendente");
        verify(stmt).setString(8, "2026-10-12");
        verify(stmt).setString(9, "09:00");
        verify(stmt).setString(10, "10:00");
        verify(stmt).executeUpdate();
        verify(rs).close();
        verify(stmt).close();
        verify(conn).close();
    }

    @Test
    void listarUsaParametrosMesmoComFiltroContendoSql() throws Exception {
        assertTrue(dao.listarPorVoluntario(10L, null, "Pendente' OR 1=1", "Alta").isEmpty());
        var sql = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(conn).prepareStatement(sql.capture());
        assertFalse(sql.getValue().contains("OR 1=1"));
        assertTrue(sql.getValue().contains("STATUS = ? AND PRIORIDADE = ?"));
        assertTrue(sql.getValue().contains("ORDER BY CASE DIA_SEMANA"));
        verify(stmt).setLong(1, 10L);
        verify(stmt).setString(2, "Pendente' OR 1=1");
        verify(stmt).setString(3, "Alta");
    }

    @Test
    void buscarMapeiaDatasEConclusaoLegada() throws Exception {
        when(rs.next()).thenReturn(true);
        when(rs.getLong("ID_TAREFA")).thenReturn(42L);
        when(rs.getLong("ID_VOLUNTARIO")).thenReturn(10L);
        when(rs.getString("STATUS")).thenReturn("Concluida");
        when(rs.getString("DATA_ATIVIDADE")).thenReturn("2026-10-12");
        when(rs.getTimestamp("DATA_CRIACAO")).thenReturn(Timestamp.valueOf(LocalDateTime.of(2026, 10, 12, 9, 0)));
        var tarefa = dao.buscarPorId(42L);
        assertEquals(42L, tarefa.getIdTarefa());
        assertEquals("Concluido", tarefa.getStatus());
        assertEquals("2026-10-12", tarefa.getDataAtividade());
        assertEquals("2026-10-12T09:00:00", tarefa.getDataCriacao());
        assertNull(tarefa.getDataAtualizacao());
    }

    @Test
    void atualizarNaoTrocaProprietarioEUsaQuantidadeAfetada() throws Exception {
        when(stmt.executeUpdate()).thenReturn(1);
        assertTrue(dao.atualizar(42L, tarefa()));
        var sql = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(conn).prepareStatement(sql.capture());
        assertFalse(sql.getValue().contains("ID_VOLUNTARIO ="));
        assertTrue(sql.getValue().contains("DATA_ATUALIZACAO = CURRENT_TIMESTAMP"));
        verify(stmt).setLong(10, 42L);
        when(stmt.executeUpdate()).thenReturn(0);
        assertFalse(dao.atualizar(42L, tarefa()));
    }

    @Test
    void excluirRetornaSeRegistroExistia() throws Exception {
        when(stmt.executeUpdate()).thenReturn(1, 0);
        assertTrue(dao.excluir(42L));
        assertFalse(dao.excluir(99L));
    }

    @Test
    void resumoAgrupaContagensPorDiaEStatus() throws Exception {
        when(rs.next()).thenReturn(true, true, false);
        when(rs.getString("DIA_SEMANA")).thenReturn("Segunda-feira");
        when(rs.getString("STATUS")).thenReturn("Pendente", "Concluida");
        when(rs.getInt("TOTAL")).thenReturn(2, 1);
        var resumo = dao.resumoSemanal(10L);
        assertEquals(2, resumo.get("Segunda-feira").get("Pendente"));
        assertEquals(1, resumo.get("Segunda-feira").get("Concluida"));
    }

    @Test
    void falhaSqlFechaRecursosEPropagaCausa() throws Exception {
        var causa = new SQLException("Teste");
        when(stmt.executeQuery()).thenThrow(causa);
        var erro = assertThrows(DatabaseException.class, () -> dao.buscarPorId(42L));
        assertSame(causa, erro.getCause());
        verify(stmt).close();
        verify(conn).close();
    }

    private TarefaCronogramaDTO tarefa() {
        var tarefa = new TarefaCronogramaDTO();
        tarefa.setIdVoluntario(10L);
        tarefa.setTipo("Consulta");
        tarefa.setDiaSemana("Segunda-feira");
        tarefa.setTitulo("Consulta");
        tarefa.setStatus("Pendente");
        tarefa.setPrioridade("Alta");
        tarefa.setDataAtividade("2026-10-12");
        tarefa.setHoraInicio("09:00");
        tarefa.setHoraFim("10:00");
        return tarefa;
    }
}
