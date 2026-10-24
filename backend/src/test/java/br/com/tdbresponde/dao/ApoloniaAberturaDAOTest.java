package br.com.tdbresponde.dao;
import br.com.tdbresponde.model.*;
import br.com.tdbresponde.exception.*;
import org.junit.jupiter.api.*;
import javax.sql.DataSource;
import java.sql.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class ApoloniaAberturaDAOTest {
 AtendimentoDAO dao; Connection conn; PreparedStatement conta, perfil, detalhe, insertPessoa, insertMulher, insertAtendimento; ResultSet contaRs,perfilRs,detalheRs,keys;
 @BeforeEach void setup() throws Exception {
 dao=new AtendimentoDAO();dao.dataSource=mock(DataSource.class);conn=mock(Connection.class);when(dao.dataSource.getConnection()).thenReturn(conn);when(conn.getAutoCommit()).thenReturn(true);
 conta=mock(PreparedStatement.class);perfil=mock(PreparedStatement.class);detalhe=mock(PreparedStatement.class);insertPessoa=mock(PreparedStatement.class);insertMulher=mock(PreparedStatement.class);insertAtendimento=mock(PreparedStatement.class);
 contaRs=mock(ResultSet.class);perfilRs=mock(ResultSet.class);detalheRs=mock(ResultSet.class);keys=mock(ResultSet.class);
 when(conn.prepareStatement(contains("FOR UPDATE"))).thenReturn(conta);when(conta.executeQuery()).thenReturn(contaRs);when(contaRs.next()).thenReturn(true);when(contaRs.getString("TIPO_USUARIO")).thenReturn("BENEFICIARIO");when(contaRs.getString("TIPO_BENEFICIARIO")).thenReturn("MULHER_APOLONIA");when(contaRs.getBoolean("ATIVO")).thenReturn(true);when(contaRs.getString("NOME")).thenReturn("Aurora sintética");
 when(conn.prepareStatement(startsWith("SELECT ID, TIPO"))).thenReturn(perfil);when(perfil.executeQuery()).thenReturn(perfilRs);when(perfilRs.next()).thenReturn(true,false);when(perfilRs.getInt("ID")).thenReturn(20);when(perfilRs.getString("TIPO")).thenReturn("MULHER_APOLONIA");
 when(conn.prepareStatement(startsWith("SELECT 1 FROM MULHER"))).thenReturn(detalhe);when(detalhe.executeQuery()).thenReturn(detalheRs);when(detalheRs.next()).thenReturn(true);
 when(conn.prepareStatement(startsWith("INSERT INTO PESSOA_ATENDIDA"),any(String[].class))).thenReturn(insertPessoa);when(conn.prepareStatement(startsWith("INSERT INTO MULHER_APOLONIA"))).thenReturn(insertMulher);when(conn.prepareStatement(startsWith("INSERT INTO ATENDIMENTO"),any(String[].class))).thenReturn(insertAtendimento);when(insertAtendimento.getGeneratedKeys()).thenReturn(keys);when(insertPessoa.getGeneratedKeys()).thenReturn(keys);when(keys.next()).thenReturn(true);when(keys.getInt(1)).thenReturn(21);
 }
 Atendimento atendimento(){var a=new Atendimento();a.setDescricao("Relato sintético para teste.");return a;}
 @Test void perfilExistenteImutavelEPrioridadeNula() throws Exception {dao.abrirApolonia(7,atendimento());verify(conn).commit();verify(insertAtendimento).setNull(2,Types.INTEGER);verifyNoInteractions(insertPessoa,insertMulher);verify(conn,never()).prepareStatement(startsWith("UPDATE"));verify(conta).setInt(1,7);}
 @Test void primeiraAberturaCriaMinimoSemContatoRiscoOuBo() throws Exception {when(perfilRs.next()).thenReturn(false);dao.abrirApolonia(7,atendimento());verify(insertPessoa).setString(1,"Aurora sintética");verify(insertPessoa).setString(2,null);verify(insertPessoa).setString(3,null);verify(insertMulher).setNull(3,Types.INTEGER);verify(insertMulher).setObject(4,null,Types.NUMERIC);verify(conn).commit();}
 @Test void falhaReverteTodaTransacao() throws Exception {when(insertAtendimento.executeUpdate()).thenThrow(new SQLException("synthetic"));assertThrows(DatabaseException.class,()->dao.abrirApolonia(7,atendimento()));verify(conn).rollback();verify(conn,never()).commit();}
 @Test void contaInativaOuTipoForjadoNaoAbre() throws Exception {when(contaRs.getBoolean("ATIVO")).thenReturn(false);assertThrows(ForbiddenException.class,()->dao.abrirApolonia(7,atendimento()));verify(conn).rollback();verifyNoInteractions(perfil);}
 @Test void perfilIncompativelOuDuplicadoExigeRevisao() throws Exception {when(perfilRs.getString("TIPO")).thenReturn("CRIANCA");assertThrows(ConflictException.class,()->dao.abrirApolonia(7,atendimento()));verify(conn).rollback();}
 @Test void perfilDuplicadoNaoEscolhePrimeiro() throws Exception {when(perfilRs.next()).thenReturn(true,true);assertThrows(ConflictException.class,()->dao.abrirApolonia(7,atendimento()));verify(conn).rollback();}
 @Test void perfilParcialNaoSobrescreveIdentidade() throws Exception {when(detalheRs.next()).thenReturn(false);assertThrows(ConflictException.class,()->dao.abrirApolonia(7,atendimento()));verifyNoInteractions(insertPessoa,insertMulher);verify(conn).rollback();}
 @Test void prioridadeNulaLidaSemZero() throws Exception {when(conn.prepareStatement(startsWith("SELECT A.ID, A.PRIORIDADE"))).thenReturn(detalhe);when(detalheRs.wasNull()).thenReturn(true);assertNull(dao.buscarPorId(20).getPrioridade());}
 @Test void riscoNuloLidoSemZero() throws Exception {var d=new MulherApoloniaDAO();d.dataSource=dao.dataSource;when(conn.prepareStatement(startsWith("SELECT ma."))).thenReturn(detalhe);when(detalheRs.wasNull()).thenReturn(true);assertNull(d.buscarPorId(20).getNivelRisco());}
}
