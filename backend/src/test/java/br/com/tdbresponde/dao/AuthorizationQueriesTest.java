package br.com.tdbresponde.dao;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import javax.sql.DataSource;
import java.sql.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthorizationQueriesTest {
    DataSource source;
    Connection conn;
    PreparedStatement stmt;
    ResultSet rs;

    @BeforeEach void setup() throws Exception {
        source = mock(DataSource.class); conn = mock(Connection.class);
        stmt = mock(PreparedStatement.class); rs = mock(ResultSet.class);
        when(source.getConnection()).thenReturn(conn);
        when(conn.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs);
    }

    @Test void acessoAoAtendimentoUsaUmaConsultaSemHistoricoOuDetalhesClinicos() throws Exception {
        when(rs.next()).thenReturn(true);
        when(rs.getInt("ID")).thenReturn(42); when(rs.getString("STATUS")).thenReturn("EM_ATENDIMENTO");
        when(rs.getInt("PESSOA_ATENDIDA_ID")).thenReturn(10); when(rs.getInt("ID_CONTA")).thenReturn(7);
        when(rs.getInt("VOLUNTARIO_ID")).thenReturn(80);
        when(rs.getInt("CONTA_VOLUNTARIO")).thenReturn(8);
        var dao = new AtendimentoDAO(); dao.dataSource = source;
        var result = dao.buscarParaAutorizacao(42);
        assertEquals(42, result.getId());
        assertEquals(7, result.getPessoaAtendida().getContaId());
        assertEquals(80, result.getVoluntario().getId());
        assertEquals(8, result.getVoluntario().getContaId());
        var sql = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(conn, times(1)).prepareStatement(sql.capture());
        assertFalse(sql.getValue().contains("MENSAGEM"));
        assertFalse(sql.getValue().contains("MAX("));
        assertFalse(sql.getValue().contains("TELEFONE"));
        verify(stmt).setInt(1, 42);
        verify(rs).close(); verify(stmt).close(); verify(conn).close();
    }

    @Test void atendimentoAusenteRetornaNullSemSegundaConsulta() throws Exception {
        var dao = new AtendimentoDAO(); dao.dataSource = source;
        assertNull(dao.buscarParaAutorizacao(42));
        verify(conn, times(1)).prepareStatement(anyString());
    }

    @Test void vinculoDoVoluntarioBuscaSomenteIdSemCarregarEspecialidades() throws Exception {
        when(rs.next()).thenReturn(true); when(rs.getInt("ID")).thenReturn(80);
        var dao = new VoluntarioDAO(); dao.dataSource = source;
        assertEquals(80, dao.buscarIdPorContaId(8));
        verify(conn, times(1)).prepareStatement("SELECT ID FROM VOLUNTARIO WHERE ID_CONTA = ?");
        verify(stmt).setInt(1, 8);
        verify(source, times(1)).getConnection();
        verify(rs).close(); verify(stmt).close(); verify(conn).close();
    }

    @Test void contaSemVoluntarioNaoUsaIdDaContaComoFallback() {
        var dao = new VoluntarioDAO(); dao.dataSource = source;
        assertNull(dao.buscarIdPorContaId(8));
    }
}
