package br.com.tdbresponde.dao;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import javax.sql.DataSource;
import java.sql.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AtendimentoPerformanceDAOTest {
    DataSource source;
    Connection conn;
    PreparedStatement stmt;
    ResultSet rs;
    AtendimentoDAO dao;

    @BeforeEach void setup() throws Exception {
        source = mock(DataSource.class); conn = mock(Connection.class);
        stmt = mock(PreparedStatement.class); rs = mock(ResultSet.class);
        when(source.getConnection()).thenReturn(conn);
        when(conn.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs);
        dao = new AtendimentoDAO(); dao.dataSource = source;
    }

    @Test void listagemDoVoluntarioResumeUltimoRemetenteEmUmaConsulta() throws Exception {
        when(rs.next()).thenReturn(true, true, true, false);
        when(rs.getString("ULTIMA_MENSAGEM_REMETENTE")).thenReturn("BENEFICIARIO", "VOLUNTARIO", null);
        var result = dao.buscarPorVoluntario(80);
        assertEquals(java.util.List.of(true, false, false), result.stream().map(a -> a.getUltimaMensagemDoBeneficiario()).toList());
        var sql = ArgumentCaptor.forClass(String.class);
        verify(conn, times(1)).prepareStatement(sql.capture());
        assertTrue(sql.getValue().contains("KEEP (DENSE_RANK LAST ORDER BY M.DATA_HORA, M.ID)"));
        assertTrue(sql.getValue().contains("WHERE A.VOLUNTARIO_ID = ?"));
        verify(stmt).setInt(1, 80);
        verify(source, times(1)).getConnection();
        verify(rs).close(); verify(stmt).close(); verify(conn).close();
    }

    @Test void consultaRestritaPreservaFilaAbertaESomenteOVoluntarioAutenticado() throws Exception {
        dao.buscarConsultaveisPorVoluntario(80);
        var sql = ArgumentCaptor.forClass(String.class);
        verify(conn).prepareStatement(sql.capture());
        assertTrue(sql.getValue().contains("WHERE (A.VOLUNTARIO_ID IS NULL AND A.STATUS = 'ABERTO') OR A.VOLUNTARIO_ID = ?"));
        verify(stmt).setInt(1, 80);
    }

    @Test void contaSemVinculoNaoUsaIdDeContaNemRemoveFiltro() throws Exception {
        dao.buscarConsultaveisPorVoluntario(null);
        verify(stmt).setNull(1, Types.INTEGER);
        verify(stmt, never()).setInt(anyInt(), anyInt());
    }
}
