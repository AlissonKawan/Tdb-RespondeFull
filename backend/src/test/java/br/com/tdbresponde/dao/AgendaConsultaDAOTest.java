package br.com.tdbresponde.dao;

import br.com.tdbresponde.exception.DatabaseException;
import br.com.tdbresponde.model.AgendaConsulta;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.*;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class AgendaConsultaDAOTest {

    private AgendaConsultaDAO dao;
    private DataSource dataSource;
    private Connection conn;
    private PreparedStatement stmt;
    private ResultSet rs;

    @BeforeEach
    void preparar() throws Exception {
        dao = new AgendaConsultaDAO();
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

    private AgendaConsulta agendaPadrao() {
        AgendaConsulta a = new AgendaConsulta();
        a.setVoluntarioId(10);
        a.setAtendimentoId(100);
        a.setPaciente("Maria Silva");
        a.setTipo("Avaliação Inicial");
        a.setDataConsulta(LocalDate.of(2026, 10, 20));
        a.setHorario("10:00");
        a.setStatus("CONFIRMADO");
        a.setTipoPessoa("MULHER_APOLONIA");
        return a;
    }

    @Test
    void inserirPersisteAtendimentoIdECapturaChaveGerada() throws Exception {
        when(stmt.getGeneratedKeys()).thenReturn(rs);
        when(rs.next()).thenReturn(true);
        when(rs.getInt(1)).thenReturn(99);

        AgendaConsulta resultado = dao.inserir(agendaPadrao());

        assertEquals(99, resultado.getId());
        verify(stmt).setInt(1, 10);
        verify(stmt).setInt(2, 100);
        verify(stmt).setString(3, "Maria Silva");
        verify(stmt).executeUpdate();
        verify(rs).close();
        verify(stmt).close();
        verify(conn).close();
    }

    @Test
    void inserirUsaNullQuandoAtendimentoIdNaoInformado() throws Exception {
        when(stmt.getGeneratedKeys()).thenReturn(rs);
        when(rs.next()).thenReturn(false);

        AgendaConsulta semAtendimento = agendaPadrao();
        semAtendimento.setAtendimentoId(null);

        dao.inserir(semAtendimento);

        verify(stmt).setNull(2, Types.INTEGER);
    }

    @Test
    void buscarPorAtendimentoMapeiaTodosOsCamposCorretamente() throws Exception {
        when(rs.next()).thenReturn(true, false);
        when(rs.getInt("ID")).thenReturn(55);
        when(rs.getInt("VOLUNTARIO_ID")).thenReturn(10);
        when(rs.getInt("ATENDIMENTO_ID")).thenReturn(100);
        when(rs.wasNull()).thenReturn(false);
        when(rs.getString("PACIENTE")).thenReturn("Maria Silva");
        when(rs.getString("TIPO")).thenReturn("Retorno");
        when(rs.getObject("DATA_CONSULTA", LocalDate.class)).thenReturn(LocalDate.of(2026, 10, 25));
        when(rs.getString("HORARIO")).thenReturn("14:00");
        when(rs.getString("STATUS")).thenReturn("AGUARDANDO");
        when(rs.getString("TIPO_PESSOA")).thenReturn("OUTRO");

        List<AgendaConsulta> lista = dao.buscarPorAtendimento(100);

        assertEquals(1, lista.size());
        assertEquals(55, lista.get(0).getId());
        assertEquals(100, lista.get(0).getAtendimentoId());
        assertEquals("Maria Silva", lista.get(0).getPaciente());
        verify(stmt).setInt(1, 100);
    }

    @Test
    void buscarPorIdRetornaNullQuandoNaoExiste() throws Exception {
        when(rs.next()).thenReturn(false);
        assertNull(dao.buscarPorId(999));
    }

    @Test
    void atualizarEExcluirExecutaStatementsEFechaConexao() throws Exception {
        AgendaConsulta a = agendaPadrao();
        a.setId(55);
        dao.atualizar(a);
        verify(stmt).setInt(1, 100);
        verify(stmt).setInt(8, 55);

        when(stmt.executeUpdate()).thenReturn(1);
        assertTrue(dao.excluir(55));
    }

    @Test
    void propagaDatabaseExceptionEmFalhaSqlOuObjetoNulo() throws Exception {
        assertThrows(DatabaseException.class, () -> dao.inserir(null));
        assertThrows(DatabaseException.class, () -> dao.atualizar(null));

        SQLException sqlEx = new SQLException("Falha simulada");
        when(stmt.executeQuery()).thenThrow(sqlEx);

        DatabaseException ex = assertThrows(DatabaseException.class, () -> dao.buscarPorAtendimento(100));
        assertSame(sqlEx, ex.getCause());
        verify(stmt).close();
        verify(conn).close();
    }
}
