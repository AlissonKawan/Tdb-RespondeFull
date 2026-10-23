package br.com.tdbresponde.dao;

import br.com.tdbresponde.exception.DatabaseException;
import io.agroal.api.AgroalDataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.sql.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MensagemPaginationDAOTest {
    AgroalDataSource source;
    Connection conn;
    PreparedStatement stmt;
    ResultSet rs;
    MensagemDAO dao;

    @BeforeEach void setup() throws Exception {
        source = mock(AgroalDataSource.class); conn = mock(Connection.class);
        stmt = mock(PreparedStatement.class); rs = mock(ResultSet.class);
        when(source.getConnection()).thenReturn(conn);
        when(conn.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs);
        dao = new MensagemDAO(); dao.dataSource = source;
    }

    @Test void limitaMensagensSemCanaisEDevolveUmaOcorrenciaPorId() throws Exception {
        when(rs.next()).thenReturn(true, true, true, false);
        when(rs.getInt("ID")).thenReturn(30, 30, 31);
        var result = dao.buscarPaginaPorAtendimento(42, 50, null);
        assertEquals(java.util.List.of(30, 31), result.stream().map(m -> m.getId()).toList());
        var sql = ArgumentCaptor.forClass(String.class);
        verify(conn).prepareStatement(sql.capture());
        assertTrue(sql.getValue().contains("WHERE M.ID IN (SELECT ID FROM (SELECT PAGINA.ID"));
        assertTrue(sql.getValue().contains("ORDER BY PAGINA.DATA_HORA DESC, PAGINA.ID DESC) WHERE ROWNUM <= ?"));
        assertTrue(sql.getValue().endsWith("ORDER BY M.DATA_HORA ASC, M.ID ASC"));
        assertFalse(sql.getValue().contains("CANAL"));
        verify(stmt).setInt(1, 42); verify(stmt).setInt(2, 50);
        verify(rs).close(); verify(stmt).close(); verify(conn).close();
    }

    @Test void cursorUsaParametrosEExigeVinculoComOMesmoAtendimento() throws Exception {
        assertTrue(dao.buscarPaginaPorAtendimento(42, 50, 81).isEmpty());
        var sql = ArgumentCaptor.forClass(String.class);
        verify(conn).prepareStatement(sql.capture());
        assertTrue(sql.getValue().contains("CURSOR_M.ATENDIMENTO_ID = PAGINA.ATENDIMENTO_ID"));
        assertTrue(sql.getValue().contains("PAGINA.DATA_HORA = CURSOR_M.DATA_HORA AND PAGINA.ID < CURSOR_M.ID"));
        verify(stmt).setInt(1, 42); verify(stmt).setInt(2, 81); verify(stmt).setInt(3, 50);
    }

    @Test void falhaDeBancoMantemCausaEFechaRecursos() throws Exception {
        var causa = new SQLException("falha simulada");
        when(stmt.executeQuery()).thenThrow(causa);
        var erro = assertThrows(DatabaseException.class, () -> dao.buscarPaginaPorAtendimento(42, 50, null));
        assertSame(causa, erro.getCause());
        verify(stmt).close(); verify(conn).close();
    }
}
