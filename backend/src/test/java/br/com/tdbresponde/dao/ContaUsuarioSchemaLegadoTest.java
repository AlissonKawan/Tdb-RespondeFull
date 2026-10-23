package br.com.tdbresponde.dao;

import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.TipoUsuario;
import br.com.tdbresponde.exception.DatabaseException;
import br.com.tdbresponde.exception.PrivacidadeIndisponivelException;
import br.com.tdbresponde.exception.PrivacidadeIndisponivelExceptionMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import javax.sql.DataSource;
import java.sql.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ContaUsuarioSchemaLegadoTest {
    ContaUsuarioDAO dao;
    Connection conn;
    PreparedStatement stmt;
    ResultSet rs;
    ResultSetMetaData metadata;

    @BeforeEach void setup() throws Exception {
        dao = new ContaUsuarioDAO(); dao.dataSource = mock(DataSource.class);
        conn = mock(Connection.class); stmt = mock(PreparedStatement.class);
        rs = mock(ResultSet.class); metadata = mock(ResultSetMetaData.class);
        when(dao.dataSource.getConnection()).thenReturn(conn);
        when(conn.prepareStatement(anyString())).thenAnswer(call -> preparar(call.getArgument(0)));
        when(conn.prepareStatement(anyString(), any(String[].class))).thenAnswer(call -> preparar(call.getArgument(0)));
        when(stmt.executeQuery()).thenReturn(rs);
        when(stmt.getGeneratedKeys()).thenReturn(rs);
        when(rs.next()).thenReturn(true, false);
        when(rs.getMetaData()).thenReturn(metadata);
        String[] colunas = {"ID_CONTA", "NOME", "EMAIL", "SENHA_HASH", "TIPO_USUARIO", "ATIVO", "DATA_CRIACAO"};
        when(metadata.getColumnCount()).thenReturn(colunas.length);
        for (int i = 0; i < colunas.length; i++) when(metadata.getColumnLabel(i + 1)).thenReturn(colunas[i]);
        when(rs.getInt("ID_CONTA")).thenReturn(42);
        when(rs.getInt(1)).thenReturn(42);
        when(rs.getInt("ATIVO")).thenReturn(1);
        when(rs.getString(anyString())).thenAnswer(call -> switch ((String) call.getArgument(0)) {
            case "NOME" -> "Pessoa existente";
            case "EMAIL" -> "pessoa@example.test";
            case "SENHA_HASH" -> "hash-de-teste";
            case "TIPO_USUARIO" -> "BENEFICIARIO";
            default -> throw new SQLException("Coluna ausente no schema legado", "42000", 904);
        });
    }

    PreparedStatement preparar(String sql) throws SQLException {
        if (sql.matches("(?s).*\\b(USUARIO|TIPO_BENEFICIARIO|MODO_IDENTIFICACAO)\\b.*")) {
            throw new SQLException("ORA-00904: \"MODO_IDENTIFICACAO\": invalid identifier", "42000", 904);
        }
        return stmt;
    }

    @Test void buscaPorEmailFuncionaSemColunasNovas() {
        var conta = dao.buscarPorEmail("pessoa@example.test");
        assertEquals(42, conta.getId());
        assertNull(conta.getUsuario()); assertNull(conta.getModoIdentificacao());
    }

    @Test void revalidacaoDeSessaoPorIdFuncionaSemColunasNovas() {
        assertEquals(42, dao.buscarPorId(42).getId());
    }

    @Test void listagemAdministrativaFuncionaSemColunasNovas() {
        assertEquals(1, dao.listar().size());
    }

    @Test void cadastroAnteriorNaoExigeColunasNovas() {
        var conta = new ContaUsuario(); conta.setNome("Pessoa existente");
        conta.setEmail("pessoa@example.test"); conta.setSenhaHash("hash-de-teste");
        conta.setTipoUsuario(TipoUsuario.BENEFICIARIO);
        dao.cadastrarConta(conta);
        assertEquals(42, conta.getId());
    }

    @Test void acessoPorUsuarioSemMigracaoRetornaIndisponibilidadeExplicita() {
        assertThrows(PrivacidadeIndisponivelException.class, () -> dao.buscarPorUsuario("aurora"));
    }

    void schemaMigrado() throws Exception {
        when(conn.prepareStatement(anyString())).thenReturn(stmt);
        when(conn.prepareStatement(anyString(), any(String[].class))).thenReturn(stmt);
        when(metadata.getColumnCount()).thenReturn(10);
        when(metadata.getColumnLabel(8)).thenReturn("USUARIO");
        when(metadata.getColumnLabel(9)).thenReturn("TIPO_BENEFICIARIO");
        when(metadata.getColumnLabel(10)).thenReturn("MODO_IDENTIFICACAO");
        doReturn("aurora").when(rs).getString("USUARIO");
        doReturn("MULHER_APOLONIA").when(rs).getString("TIPO_BENEFICIARIO");
        doReturn("CODINOME").when(rs).getString("MODO_IDENTIFICACAO");
    }

    @Test void schemaMigradoPreservaIdentificacaoELoginPorUsuario() throws Exception {
        schemaMigrado();
        var conta = dao.buscarPorUsuario("aurora");
        assertEquals("aurora", conta.getUsuario());
        assertEquals("MULHER_APOLONIA", conta.getTipoBeneficiario());
        assertEquals("CODINOME", conta.getModoIdentificacao());
        verify(stmt).setString(1, "aurora");
    }

    @Test void migracaoParcialNaoLiberaCadastroPorUsuario() throws Exception {
        schemaMigrado(); when(metadata.getColumnCount()).thenReturn(9);
        assertThrows(PrivacidadeIndisponivelException.class, () -> dao.buscarPorUsuario("aurora"));
        verify(rs, never()).next();
    }

    @Test void cadastroMigradoContinuaPersistindoCamposDePrivacidade() throws Exception {
        schemaMigrado();
        var conta = new ContaUsuario(); conta.setNome("Aurora"); conta.setSenhaHash("hash-de-teste");
        conta.setTipoUsuario(TipoUsuario.BENEFICIARIO); conta.setUsuario("aurora");
        conta.setTipoBeneficiario("MULHER_APOLONIA"); conta.setModoIdentificacao("CODINOME");
        dao.cadastrarConta(conta);
        verify(stmt).setString(6, "aurora");
        verify(stmt).setString(7, "MULHER_APOLONIA");
        verify(stmt).setString(8, "CODINOME");
        assertEquals(42, conta.getId());
    }

    @Test void falhaDeConexaoNaoEConvertidaEmSchemaAusente() throws Exception {
        var falha = new SQLException("Falha de conexão", "08000", 17002);
        when(dao.dataSource.getConnection()).thenThrow(falha);
        var erro = assertThrows(DatabaseException.class, () -> dao.buscarPorUsuario("aurora"));
        assertSame(falha, erro.getCause());
    }

    @Test void respostaDeIndisponibilidadeUsa503SemExporSql() {
        var erro = new PrivacidadeIndisponivelException();
        try (var response = new PrivacidadeIndisponivelExceptionMapper().toResponse(erro)) {
            assertEquals(503, response.getStatus());
            assertEquals("no-store", response.getHeaderString("Cache-Control"));
            assertFalse(erro.getMessage().contains("MODO_IDENTIFICACAO"));
        }
    }
}
