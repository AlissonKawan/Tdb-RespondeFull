package br.com.tdbresponde.dao;

import br.com.tdbresponde.exception.DatabaseException;
import br.com.tdbresponde.model.CanalComunicacao;
import br.com.tdbresponde.model.Mensagem;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class MensagemDAO {

    @Inject
    DataSource dataSource;

    @Inject
    CanalComunicacaoDAO canalDAO;

    public void inserir(Mensagem mensagem) {
        String sql = "INSERT INTO MENSAGEM (ATENDIMENTO_ID, CONTEUDO, DATA_HORA, ENVIADO_POR) " +
                "VALUES (?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection()) {
            try (PreparedStatement stmt = conn.prepareStatement(sql, new String[] { "ID" })) {
                stmt.setInt(1, mensagem.getAtendimento().getId());
                stmt.setString(2, mensagem.getConteudo());
                stmt.setObject(3, mensagem.getDataHora());
                stmt.setString(4, mensagem.getEnviadoPor());
                stmt.executeUpdate();

                try (ResultSet rs = stmt.getGeneratedKeys()) {
                    if (rs.next()) {
                        mensagem.setId(rs.getInt(1));
                    } else {
                        throw new SQLException("Nenhuma chave gerada apos insert de mensagem");
                    }
                }
            }

            inserirCanal(conn, mensagem);
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao inserir mensagem: " + e.getMessage(), e);
        }
    }

    public Mensagem buscarPorId(int id) {
        String sql = "SELECT ID, ATENDIMENTO_ID, CONTEUDO, DATA_HORA, ENVIADO_POR " +
                "FROM MENSAGEM WHERE ID = ?";

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
        String sql = "SELECT ID, ATENDIMENTO_ID, CONTEUDO, DATA_HORA, ENVIADO_POR " +
                "FROM MENSAGEM WHERE ATENDIMENTO_ID = ? ORDER BY DATA_HORA ASC";
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

            excluirCanais(conn, mensagem.getId());
            inserirCanal(conn, mensagem);
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar mensagem: " + e.getMessage(), e);
        }
    }

    public void excluir(int id) {
        String sql = "DELETE FROM MENSAGEM WHERE ID = ?";

        try (Connection conn = dataSource.getConnection()) {
            excluirCanais(conn, id);

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

        int atendimentoId = rs.getInt("ATENDIMENTO_ID");
        if (!rs.wasNull()) {
            br.com.tdbresponde.model.Atendimento atendimento = new br.com.tdbresponde.model.Atendimento();
            atendimento.setId(atendimentoId);
            mensagem.setAtendimento(atendimento);
        }

        carregarCanal(mensagem);
        return mensagem;
    }

    private void carregarCanal(Mensagem mensagem) throws SQLException {
        String sql = "SELECT CANAL_ID FROM MENSAGEM_CANAL WHERE MENSAGEM_ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, mensagem.getId());
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    CanalComunicacao canal = canalDAO.buscarPorId(rs.getInt("CANAL_ID"));
                    mensagem.setCanal(canal);
                }
            }
        }
    }

    private void inserirCanal(Connection conn, Mensagem mensagem) throws SQLException {
        if (mensagem.getCanal() == null || mensagem.getCanal().getId() <= 0) {
            return;
        }

        String sql = "INSERT INTO MENSAGEM_CANAL (MENSAGEM_ID, CANAL_ID) VALUES (?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, mensagem.getId());
            stmt.setInt(2, mensagem.getCanal().getId());
            stmt.executeUpdate();
        }
    }

    private void excluirCanais(Connection conn, int mensagemId) throws SQLException {
        String sql = "DELETE FROM MENSAGEM_CANAL WHERE MENSAGEM_ID = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, mensagemId);
            stmt.executeUpdate();
        }
    }

}
