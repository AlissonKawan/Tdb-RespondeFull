package br.com.tdbresponde.dao;

import br.com.tdbresponde.exception.DatabaseException;
import io.agroal.api.AgroalDataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.sql.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MensagemPlataformaDAOTest {
    MensagemDAO dao;
    Connection conn;
    PreparedStatement stmt;
    ResultSet rs;

    @BeforeEach void setup() throws Exception {
        dao = new MensagemDAO();
        dao.dataSource = mock(AgroalDataSource.class);
        conn = mock(Connection.class);
        stmt = mock(PreparedStatement.class);
        rs = mock(ResultSet.class);
        when(dao.dataSource.getConnection()).thenReturn(conn);
        when(conn.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs);
    }

    @Test void paginaPreservaCursorDaConversaSemConsultarCanais() throws Exception {
        when(rs.next()).thenReturn(true, false);
        when(rs.getInt("ID")).thenReturn(90);
        when(rs.getInt("ATENDIMENTO_ID")).thenReturn(42);
        when(rs.getString("CONTEUDO")).thenReturn("Mensagem da plataforma");
        var mensagens = dao.buscarPaginaPorAtendimento(42, 30, 100);
        assertEquals(1, mensagens.size());
        assertEquals("Mensagem da plataforma", mensagens.get(0).getConteudo());
        var sql = ArgumentCaptor.forClass(String.class);
        verify(conn).prepareStatement(sql.capture());
        assertFalse(sql.getValue().contains("CANAL"));
        assertTrue(sql.getValue().contains("CURSOR_M.ATENDIMENTO_ID = PAGINA.ATENDIMENTO_ID"));
        assertTrue(sql.getValue().contains("PAGINA.ID < CURSOR_M.ID"));
        assertTrue(sql.getValue().contains("ROWNUM <= ?"));
        verify(stmt).setInt(1, 42);
        verify(stmt).setInt(2, 100);
        verify(stmt).setInt(3, 30);
        verify(rs, never()).getInt("CANAL_ID");
    }

    @Test void leituraLegadaTambemRetornaUmaMensagemSemJoinDeCanais() throws Exception {
        dao.buscarPorAtendimento(42);
        var sql = ArgumentCaptor.forClass(String.class);
        verify(conn).prepareStatement(sql.capture());
        assertFalse(sql.getValue().contains("JOIN"));
        assertTrue(sql.getValue().contains("ORDER BY M.DATA_HORA ASC, M.ID ASC"));
    }

    @Test void falhaDeLeituraContinuaSendoPropagada() throws Exception {
        when(stmt.executeQuery()).thenThrow(new SQLException("indisponivel"));
        assertThrows(DatabaseException.class, () -> dao.buscarPaginaPorAtendimento(42, 30, null));
        verify(stmt).close();
        verify(conn).close();
    }
}
