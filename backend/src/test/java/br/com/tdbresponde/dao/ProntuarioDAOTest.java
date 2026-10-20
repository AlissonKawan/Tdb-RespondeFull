package br.com.tdbresponde.dao;

import br.com.tdbresponde.exception.DatabaseException;
import br.com.tdbresponde.model.Prontuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class ProntuarioDAOTest {

    private ProntuarioDAO dao;
    private DataSource dataSource;
    private Connection conn;
    private PreparedStatement stmt;
    private ResultSet rs;

    @BeforeEach
    void preparar() throws Exception {
        dao = new ProntuarioDAO();
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
    void inserirPersisteAgendaEAtendimentoEDefineDataRegistro() throws Exception {
        when(stmt.getGeneratedKeys()).thenReturn(rs);
        when(rs.next()).thenReturn(true);
        when(rs.getInt(1)).thenReturn(88);

        Prontuario p = new Prontuario();
        p.setVoluntarioId(10);
        p.setAgendaId(50);
        p.setAtendimentoId(100);
        p.setPaciente("Maria Silva");
        p.setHistoricoMedico("Hipertensa");
        p.setTratamentoAtual("Limpeza e profilaxia");

        Prontuario salvo = dao.inserir(p);

        assertEquals(88, salvo.getId());
        assertNotNull(salvo.getDataRegistro());
        verify(stmt).setInt(1, 10);
        verify(stmt).setInt(2, 50);
        verify(stmt).setInt(3, 100);
        verify(stmt).setString(4, "Maria Silva");
        verify(stmt).setString(5, "Hipertensa");
        verify(stmt).setString(6, "Limpeza e profilaxia");
    }

    @Test
    void inserirUsaNullQuandoAgendaIdNaoForInformado() throws Exception {
        when(stmt.getGeneratedKeys()).thenReturn(rs);
        when(rs.next()).thenReturn(false);

        Prontuario p = new Prontuario();
        p.setVoluntarioId(10);
        p.setAgendaId(null);
        p.setAtendimentoId(100);
        p.setPaciente("Maria");
        p.setTratamentoAtual("Avaliação");

        dao.inserir(p);

        verify(stmt).setNull(2, Types.INTEGER);
        verify(stmt).setInt(3, 100);
    }

    @Test
    void buscarPorAtendimentoMapeiaResultadoCompletamente() throws Exception {
        when(rs.next()).thenReturn(true, false);
        when(rs.getInt("ID")).thenReturn(12);
        when(rs.getInt("VOLUNTARIO_ID")).thenReturn(10);
        when(rs.getInt("AGENDA_ID")).thenReturn(50);
        when(rs.getInt("ATENDIMENTO_ID")).thenReturn(100);
        when(rs.wasNull()).thenReturn(false);
        when(rs.getString("PACIENTE")).thenReturn("Maria Silva");
        when(rs.getString("HISTORICO_MEDICO")).thenReturn("Sem alergias");
        when(rs.getString("TRATAMENTO_ATUAL")).thenReturn("Canal no dente 21");
        when(rs.getTimestamp("DATA_REGISTRO")).thenReturn(Timestamp.valueOf(LocalDateTime.of(2026, 10, 18, 14, 0)));

        List<Prontuario> lista = dao.buscarPorAtendimento(100);

        assertEquals(1, lista.size());
        assertEquals(12, lista.get(0).getId());
        assertEquals(50, lista.get(0).getAgendaId());
        assertEquals(100, lista.get(0).getAtendimentoId());
        assertEquals("Canal no dente 21", lista.get(0).getTratamentoAtual());
        verify(stmt).setInt(1, 100);
        verify(stmt).setInt(2, 100);
    }

    @Test
    void propagaDatabaseExceptionEmFalhaSqlOuObjetoNulo() throws Exception {
        assertThrows(DatabaseException.class, () -> dao.inserir(null));

        SQLException sqlEx = new SQLException("Erro banco");
        when(stmt.executeQuery()).thenThrow(sqlEx);

        DatabaseException ex = assertThrows(DatabaseException.class, () -> dao.buscarPorAgenda(50));
        assertSame(sqlEx, ex.getCause());
        verify(stmt).close();
        verify(conn).close();
    }
}
