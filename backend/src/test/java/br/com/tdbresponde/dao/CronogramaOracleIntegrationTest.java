package br.com.tdbresponde.dao;

import br.com.tdbresponde.dto.TarefaCronogramaDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import javax.sql.DataSource;
import java.lang.reflect.Proxy;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Validação opt-in no Oracle configurado localmente, sem iniciar o Quarkus.
 * As escritas usam uma única transação, encerrada com rollback.
 * Credenciais são lidas do ambiente/.env e nunca aparecem nos relatórios.
 */
@EnabledIfEnvironmentVariable(named = "TDB_ORACLE_VALIDATION", matches = "true")
class CronogramaOracleIntegrationTest {
    @Test
    void validarCrudFiltrosResumoERollbackNoOracle() throws Exception {
        Map<String, String> config = configuracao();
        DriverManager.setLoginTimeout(15);
        long idCriado = -1;
        try (Connection conn = conectar(config)) {
            System.out.println("Oracle conectado: " + conn.getMetaData().getDatabaseProductName());
            verificarSchema(conn);
            long voluntarioId;
            try (var stmt = conn.prepareStatement("SELECT ID FROM VOLUNTARIO ORDER BY ID FETCH FIRST 1 ROWS ONLY");
                 var rs = stmt.executeQuery()) {
                assertTrue(rs.next(), "É necessário um voluntário existente para validar o cronograma.");
                voluntarioId = rs.getLong(1);
            }
            conn.setAutoCommit(false);
            try {
                CronogramaDAO dao = new CronogramaDAO();
                // O DAO fecha os handles, mas esta conexão física pertence à transação do teste.
                Connection handle = (Connection) Proxy.newProxyInstance(Connection.class.getClassLoader(),
                        new Class<?>[]{Connection.class}, (proxy, method, args) -> {
                            if (method.getName().equals("close")) return null;
                            try {
                                return method.invoke(conn, args);
                            } catch (java.lang.reflect.InvocationTargetException e) {
                                throw e.getCause();
                            }
                        });
                dao.dataSource = (DataSource) Proxy.newProxyInstance(DataSource.class.getClassLoader(),
                        new Class<?>[]{DataSource.class}, (proxy, method, args) -> {
                            if (method.getName().equals("getConnection")) return handle;
                            throw new UnsupportedOperationException(method.getName());
                        });
                TarefaCronogramaDTO tarefa = new TarefaCronogramaDTO();
                tarefa.setIdVoluntario(voluntarioId);
                tarefa.setTipo("Outros");
                tarefa.setDiaSemana("Segunda-feira");
                tarefa.setTitulo("Validação Java " + UUID.randomUUID());
                tarefa.setDescricao("Registro temporário com rollback");
                tarefa.setPrioridade("Alta");
                tarefa.setStatus("Pendente");
                tarefa.setDataAtividade("2026-10-12");
                tarefa.setHoraInicio("09:00");
                tarefa.setHoraFim("10:00");
                idCriado = dao.inserir(tarefa);
                assertTrue(idCriado > 0);
                var criada = dao.buscarPorId(idCriado);
                assertNotNull(criada);
                assertEquals(tarefa.getTitulo(), criada.getTitulo());
                assertEquals("2026-10-12", criada.getDataAtividade());
                assertEquals("09:00", criada.getHoraInicio());
                assertNotNull(criada.getDataCriacao());
                final long id = idCriado;
                assertTrue(dao.listarPorVoluntario(voluntarioId, "Segunda-feira", "Pendente", "Alta")
                        .stream().anyMatch(t -> t.getIdTarefa() == id));
                assertTrue(dao.listarPorVoluntario(voluntarioId, "Segunda-feira", "Pendente", "Baixa")
                        .stream().noneMatch(t -> t.getIdTarefa() == id));
                var antes = dao.resumoSemanal(voluntarioId);
                assertTrue(antes.get("Segunda-feira").get("Pendente") >= 1);
                tarefa.setStatus("Concluida");
                tarefa.setTitulo(tarefa.getTitulo() + " editada");
                assertTrue(dao.atualizar(idCriado, tarefa));
                var atualizada = dao.buscarPorId(idCriado);
                assertEquals("Concluido", atualizada.getStatus());
                assertEquals(tarefa.getTitulo(), atualizada.getTitulo());
                assertNotNull(atualizada.getDataAtualizacao());
                assertTrue(dao.resumoSemanal(voluntarioId).get("Segunda-feira").get("Concluida") >= 1);
                assertTrue(dao.excluir(idCriado));
                assertNull(dao.buscarPorId(idCriado));
                assertFalse(dao.excluir(idCriado));
                System.out.println("Oracle: criação, ID gerado, leitura, filtros, edição, conclusão, resumo e exclusão passaram.");
            } finally {
                conn.rollback();
                System.out.println("Oracle: rollback executado.");
            }
        }
        try (Connection conn = conectar(config);
             var stmt = conn.prepareStatement("SELECT COUNT(*) FROM T_TAREFA_CRONOGRAMA WHERE ID_TAREFA = ?")) {
            stmt.setLong(1, idCriado);
            try (var rs = stmt.executeQuery()) {
                assertTrue(rs.next());
                assertEquals(0, rs.getInt(1), "A validação não pode deixar tarefas no banco.");
            }
            // Confirma que a remoção do classificador não interfere na leitura de contatos.
            try (var contatos = conn.prepareStatement("SELECT ID_MENSAGEM_CONTATO, NOME, EMAIL, MENSAGEM, DATA_ENVIO, LIDA FROM T_MENSAGEM_CONTATO WHERE 1 = 0");
                 var rs = contatos.executeQuery()) {
                assertFalse(rs.next());
            }
            System.out.println("Oracle: ausência do registro temporário e consulta de contatos confirmadas.");
        }
    }

    private void verificarSchema(Connection conn) throws SQLException {
        try (var stmt = conn.prepareStatement("SELECT COLUMN_NAME, DATA_TYPE FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'T_TAREFA_CRONOGRAMA' ORDER BY COLUMN_ID");
             var rs = stmt.executeQuery()) {
            Map<String, String> colunas = new HashMap<>();
            while (rs.next()) colunas.put(rs.getString(1), rs.getString(2));
            assertFalse(colunas.isEmpty(), "A tabela T_TAREFA_CRONOGRAMA precisa existir no Oracle configurado.");
            for (String coluna : new String[]{"ID_TAREFA", "ID_VOLUNTARIO", "TIPO", "DIA_SEMANA", "TITULO", "DESCRICAO", "STATUS", "PRIORIDADE", "DATA_ATIVIDADE", "HORA_INICIO", "HORA_FIM", "DATA_CRIACAO", "DATA_ATUALIZACAO"}) {
                assertTrue(colunas.containsKey(coluna), "Coluna ausente: " + coluna);
            }
            System.out.println("Oracle: schema do cronograma conferido; DATA_ATIVIDADE=" + colunas.get("DATA_ATIVIDADE"));
        }
    }

    private Connection conectar(Map<String, String> config) throws SQLException {
        try {
            return DriverManager.getConnection(config.get("DB_URL"), config.get("DB_USERNAME"), config.get("DB_PASSWORD"));
        } catch (SQLException e) {
            // Evita imprimir URLs ou valores de configuração em falhas de conexão.
            throw new SQLException("Falha ao conectar ao Oracle; código=" + e.getErrorCode() + "; estado=" + e.getSQLState(), e.getSQLState(), e.getErrorCode());
        }
    }

    private Map<String, String> configuracao() throws Exception {
        Map<String, String> config = new HashMap<>();
        for (Path arquivo : new Path[]{Path.of("..", ".env"), Path.of(".env")}) {
            if (!Files.isRegularFile(arquivo)) continue;
            for (String linha : Files.readAllLines(arquivo)) {
                String valor = linha.strip();
                int separador = valor.indexOf('=');
                if (separador <= 0 || valor.startsWith("#")) continue;
                String chave = valor.substring(0, separador).strip();
                if (!chave.matches("DB_URL|DB_USERNAME|DB_PASSWORD")) continue;
                valor = valor.substring(separador + 1).strip();
                if (valor.length() >= 2 && ((valor.startsWith("\"") && valor.endsWith("\"")) || (valor.startsWith("'") && valor.endsWith("'")))) {
                    valor = valor.substring(1, valor.length() - 1);
                }
                config.put(chave, valor);
            }
        }
        for (String chave : new String[]{"DB_URL", "DB_USERNAME", "DB_PASSWORD"}) {
            String ambiente = System.getenv(chave);
            if (ambiente != null && !ambiente.isBlank()) config.put(chave, ambiente);
            assertTrue(config.containsKey(chave) && !config.get(chave).isBlank(), "Configuração local ausente: " + chave);
        }
        return config;
    }
}
