package br.com.tdbresponde.dao;

import br.com.tdbresponde.model.MulherApolonia;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import javax.sql.DataSource;
import java.sql.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MulherApoloniaPrivacidadeDAOTest {
    MulherApoloniaDAO dao;
    Connection conn;
    PreparedStatement stmt;
    ResultSet rs;

    @BeforeEach void setup() throws Exception {
        dao = new MulherApoloniaDAO(); dao.dataSource = mock(DataSource.class);
        conn = mock(Connection.class); stmt = mock(PreparedStatement.class); rs = mock(ResultSet.class);
        when(dao.dataSource.getConnection()).thenReturn(conn);
        when(conn.prepareStatement(anyString())).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs);
        when(rs.next()).thenReturn(true, false);
    }

    @Test void leituraDeBoletimNuloPreservaAusenciaDeResposta() throws Exception {
        when(rs.wasNull()).thenReturn(true);
        assertNull(dao.buscarPorId(7).getTemBoletimOcorrencia());
    }

    @Test void leituraDeBoletimNegativoPreservaRespostaExplicita() throws Exception {
        when(rs.wasNull()).thenReturn(false);
        when(rs.getBoolean("tem_boletim_ocorrencia")).thenReturn(false);
        assertEquals(Boolean.FALSE, dao.buscarPorId(7).getTemBoletimOcorrencia());
    }

    @Test void atualizacaoEnviaNullAoJdbcSemConverterParaZero() throws Exception {
        var mulher = new MulherApolonia(); mulher.setId(7); mulher.setCodinome("Aurora");
        dao.atualizar(mulher);
        verify(stmt).setObject(3, null, Types.NUMERIC);
        verify(conn).commit();
    }
}
