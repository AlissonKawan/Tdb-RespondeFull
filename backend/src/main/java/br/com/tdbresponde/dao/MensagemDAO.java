package br.com.tdbresponde.dao;

import br.com.tdbresponde.exception.DatabaseException;
import br.com.tdbresponde.model.Mensagem;
import io.agroal.api.AgroalDataSource;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class MensagemDAO {
    @org.eclipse.microprofile.config.inject.ConfigProperty(name = "tdb.schema.init.enabled", defaultValue = "true")
    boolean schemaInitEnabled;

    @Inject
    AgroalDataSource dataSource;

    @PostConstruct
    void init() {
        if (!schemaInitEnabled) return;
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            
            // Tenta adicionar a coluna CLOB, ignorando erro se já existir ou se tabela for nova
            try {
                stmt.execute("ALTER TABLE MENSAGEM ADD (CONTEUDO_CLOB CLOB)");
                stmt.execute("UPDATE MENSAGEM SET CONTEUDO_CLOB = CONTEUDO");
                stmt.execute("ALTER TABLE MENSAGEM DROP COLUMN CONTEUDO");
                stmt.execute("ALTER TABLE MENSAGEM RENAME COLUMN CONTEUDO_CLOB TO CONTEUDO");
                System.out.println("Tabela MENSAGEM alterada com sucesso para CLOB");
            } catch (Exception e) {
                System.out.println("Aviso na conversao para CLOB (pode ja ser CLOB): " + e.getMessage());
            }

            adicionarColunaSeNecessario(stmt,
                    "ALTER TABLE MENSAGEM ADD (TIPO_MENSAGEM VARCHAR2(20) DEFAULT 'TEXTO' NOT NULL)",
                    "TIPO_MENSAGEM");
            adicionarColunaSeNecessario(stmt,
                    "ALTER TABLE MENSAGEM ADD (ARQUIVO_URL VARCHAR2(1000))",
                    "ARQUIVO_URL");
            adicionarColunaSeNecessario(stmt,
                    "ALTER TABLE MENSAGEM ADD (MIME_TYPE VARCHAR2(100))",
                    "MIME_TYPE");

        } catch (Exception e) {
            System.out.println("Erro na inicializacao da tabela MENSAGEM: " + e.getMessage());
        }
    }

    private void adicionarColunaSeNecessario(Statement stmt, String sql, String coluna) {
        try {
            stmt.execute(sql);
            System.out.println("Coluna " + coluna + " adicionada a tabela MENSAGEM");
        } catch (SQLException e) {
            System.out.println("Aviso ao adicionar " + coluna + " (pode ja existir): " + e.getMessage());
        }
    }

    private static final String SELECT_BASE =
            "SELECT M.ID, M.ATENDIMENTO_ID, M.CONTEUDO, M.DATA_HORA, M.ENVIADO_POR, " +
            "M.TIPO_MENSAGEM, M.ARQUIVO_URL, M.MIME_TYPE FROM MENSAGEM M ";

    public void inserir(Mensagem mensagem) {
        String sql = "INSERT INTO MENSAGEM (ATENDIMENTO_ID, CONTEUDO, DATA_HORA, ENVIADO_POR, " +
                "TIPO_MENSAGEM, ARQUIVO_URL, MIME_TYPE) VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection()) {
            try (PreparedStatement stmt = conn.prepareStatement(sql, new String[] { "ID" })) {
                stmt.setInt(1, mensagem.getAtendimento().getId());
                stmt.setString(2, mensagem.getConteudo());
                stmt.setObject(3, mensagem.getDataHora());
                stmt.setString(4, mensagem.getEnviadoPor());
                stmt.setString(5, mensagem.getTipoMensagem() == null ? "TEXTO" : mensagem.getTipoMensagem());
                stmt.setString(6, mensagem.getArquivoUrl());
                stmt.setString(7, mensagem.getMimeType());
                stmt.executeUpdate();

                try (ResultSet rs = stmt.getGeneratedKeys()) {
                    if (rs.next()) {
                        mensagem.setId(rs.getInt(1));
                    } else {
                        throw new SQLException("Nenhuma chave gerada apos insert de mensagem");
                    }
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao inserir mensagem: " + e.getMessage(), e);
        }
    }

    public List<Integer> buscarAtendimentosPorArquivoUrl(String arquivoUrl) {
        String sql = "SELECT DISTINCT ATENDIMENTO_ID FROM MENSAGEM WHERE ARQUIVO_URL = ?";
        List<Integer> ids = new ArrayList<>();
        try (Connection conn = dataSource.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, arquivoUrl);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) ids.add(rs.getInt("ATENDIMENTO_ID"));
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao verificar o vinculo da midia.", e);
        }
        return ids;
    }

    public Mensagem buscarPorId(int id) {
        String sql = SELECT_BASE + "WHERE M.ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapearResultSet(rs);
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar mensagem: " + e.getMessage(), e);
        }
        return null;
    }

    public List<Mensagem> buscarPorAtendimento(int atendimentoId) {
        String sql = SELECT_BASE + "WHERE M.ATENDIMENTO_ID = ? ORDER BY M.DATA_HORA ASC, M.ID ASC";
        List<Mensagem> mensagens = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, atendimentoId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    mensagens.add(mapearResultSet(rs));
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar mensagens do atendimento: " + e.getMessage(), e);
        }
        return mensagens;
    }

    /** Pagina das mensagens mais recentes; o cursor pertence obrigatoriamente a esta conversa. */
    public List<Mensagem> buscarPaginaPorAtendimento(int atendimentoId, int limite, Integer antesId) {
        String cursor = antesId == null ? "" :
                "AND EXISTS (SELECT 1 FROM MENSAGEM CURSOR_M WHERE CURSOR_M.ID = ? " +
                "AND CURSOR_M.ATENDIMENTO_ID = PAGINA.ATENDIMENTO_ID " +
                "AND (PAGINA.DATA_HORA < CURSOR_M.DATA_HORA OR " +
                "(PAGINA.DATA_HORA = CURSOR_M.DATA_HORA AND PAGINA.ID < CURSOR_M.ID))) ";
        String sql = SELECT_BASE + "WHERE M.ID IN (SELECT ID FROM (SELECT PAGINA.ID FROM MENSAGEM PAGINA " +
                "WHERE PAGINA.ATENDIMENTO_ID = ? " + cursor +
                "ORDER BY PAGINA.DATA_HORA DESC, PAGINA.ID DESC) WHERE ROWNUM <= ?) " +
                "ORDER BY M.DATA_HORA ASC, M.ID ASC";
        var mensagens = new java.util.LinkedHashMap<Integer, Mensagem>();
        try (Connection conn = dataSource.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            int parametro = 1;
            stmt.setInt(parametro++, atendimentoId);
            if (antesId != null) stmt.setInt(parametro++, antesId);
            stmt.setInt(parametro, limite);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Mensagem mensagem = mapearResultSet(rs);
                    mensagens.putIfAbsent(mensagem.getId(), mensagem);
                }
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao carregar mensagens do atendimento.", e);
        }
        return new ArrayList<>(mensagens.values());
    }

    public void atualizar(Mensagem mensagem) {
        String sql = "UPDATE MENSAGEM SET CONTEUDO = ?, DATA_HORA = ?, ENVIADO_POR = ? WHERE ID = ?";

        try (Connection conn = dataSource.getConnection()) {
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, mensagem.getConteudo());
                stmt.setObject(2, mensagem.getDataHora());
                stmt.setString(3, mensagem.getEnviadoPor());
                stmt.setInt(4, mensagem.getId());
                stmt.executeUpdate();
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar mensagem: " + e.getMessage(), e);
        }
    }

    public void excluir(int id) {
        String sql = "DELETE FROM MENSAGEM WHERE ID = ?";

        try (Connection conn = dataSource.getConnection()) {

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, id);
                stmt.executeUpdate();
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao excluir mensagem: " + e.getMessage(), e);
        }
    }

    private Mensagem mapearResultSet(ResultSet rs) throws SQLException {
        Mensagem mensagem = new Mensagem();
        mensagem.setId(rs.getInt("ID"));
        mensagem.setConteudo(rs.getString("CONTEUDO"));
        mensagem.setDataHora(rs.getObject("DATA_HORA", LocalDateTime.class));
        mensagem.setEnviadoPor(rs.getString("ENVIADO_POR"));
        String tipoMensagem = rs.getString("TIPO_MENSAGEM");
        mensagem.setTipoMensagem(tipoMensagem == null ? "TEXTO" : tipoMensagem);
        mensagem.setArquivoUrl(rs.getString("ARQUIVO_URL"));
        mensagem.setMimeType(rs.getString("MIME_TYPE"));

        int atendimentoId = rs.getInt("ATENDIMENTO_ID");
        if (!rs.wasNull()) {
            br.com.tdbresponde.model.Atendimento atendimento = new br.com.tdbresponde.model.Atendimento();
            atendimento.setId(atendimentoId);
            mensagem.setAtendimento(atendimento);
        }

        return mensagem;
    }

}
