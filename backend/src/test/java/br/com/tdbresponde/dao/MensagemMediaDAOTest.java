package br.com.tdbresponde.dao;

import io.agroal.api.AgroalDataSource;
import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MensagemMediaDAOTest {
    @Test void vinculoDaMidiaUsaParametroEFechaRecursos() throws Exception {
        var source = mock(AgroalDataSource.class);
        var conn = mock(Connection.class); var stmt = mock(PreparedStatement.class); var rs = mock(ResultSet.class);
        when(source.getConnection()).thenReturn(conn);
        when(conn.prepareStatement("SELECT DISTINCT ATENDIMENTO_ID FROM MENSAGEM WHERE ARQUIVO_URL = ?")).thenReturn(stmt);
        when(stmt.executeQuery()).thenReturn(rs); when(rs.next()).thenReturn(true, false);
        when(rs.getInt("ATENDIMENTO_ID")).thenReturn(42);
        var dao = new MensagemDAO(); dao.dataSource = source;
        String url = "/mensagens/midia/foto' OR 1=1.png";
        assertEquals(List.of(42), dao.buscarAtendimentosPorArquivoUrl(url));
        verify(stmt).setString(1, url);
        verify(rs).close(); verify(stmt).close(); verify(conn).close();
    }
}
