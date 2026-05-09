package dao;

import connection.ConnectionFactory;
import model.Mensagem;
import model.CanalComunicacao;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class MensagemDAO {

    private final CanalComunicacaoDAO canalDAO = new CanalComunicacaoDAO();

    // CREATE
    public void inserir(Mensagem mensagem) {
        String sql = "INSERT INTO mensagem " +
                "(atendimento_id, conteudo, data_hora, enviado_por, canal_comunicacao_id) " +
                "VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"id"})) {

            stmt.setInt(1, mensagem.getAtendimento().getId());
            stmt.setString(2, mensagem.getConteudo());
            stmt.setObject(3, mensagem.getDataHora());
            stmt.setString(4, mensagem.getEnviadoPor());
            stmt.setInt(5, mensagem.getCanal().getId());

            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    mensagem.setId(rs.getInt(1));
                } else {
                    throw new SQLException("Nenhuma chave gerada após insert de mensagem");
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao inserir mensagem: " + e.getMessage(), e);
        }
    }

    // READ por ID
    public Mensagem buscarPorId(int id) {
        String sql = "SELECT * FROM mensagem WHERE id = ?";

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return mapearResultSet(rs);
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar mensagem: " + e.getMessage(), e);
        }
        return null;
    }

    // READ todas as mensagens de um atendimento
    public List<Mensagem> buscarPorAtendimento(int atendimentoId) {
        String sql = "SELECT * FROM mensagem WHERE atendimento_id = ? ORDER BY data_hora ASC";
        List<Mensagem> mensagens = new ArrayList<>();

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, atendimentoId);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                mensagens.add(mapearResultSet(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao listar mensagens do atendimento: " + e.getMessage(), e);
        }
        return mensagens;
    }

    // UPDATE
    public void atualizar(Mensagem mensagem) {
        String sql = "UPDATE mensagem SET conteudo = ?, data_hora = ?, " +
                "enviado_por = ?, canal_comunicacao_id = ? WHERE id = ?";

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, mensagem.getConteudo());
            stmt.setObject(2, mensagem.getDataHora());
            stmt.setString(3, mensagem.getEnviadoPor());
            stmt.setInt(4, mensagem.getCanal().getId());
            stmt.setInt(5, mensagem.getId());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao atualizar mensagem: " + e.getMessage(), e);
        }
    }

    // DELETE
    public void excluir(int id) {
        String sql = "DELETE FROM mensagem WHERE id = ?";

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao excluir mensagem: " + e.getMessage(), e);
        }
    }

    // MAPEAMENTO
    private Mensagem mapearResultSet(ResultSet rs) throws SQLException {
        Mensagem m = new Mensagem();
        m.setId(rs.getInt("id"));
        m.setConteudo(rs.getString("conteudo"));
        m.setDataHora(rs.getObject("data_hora", LocalDateTime.class));
        m.setEnviadoPor(rs.getString("enviado_por"));

        // Carrega canal pelo ID
        int canalId = rs.getInt("canal_comunicacao_id");
        if (!rs.wasNull()) {
            CanalComunicacao canal = canalDAO.buscarPorId(canalId);
            m.setCanal(canal);
        }

        // Atendimento: seta só o ID (lazy) para não causar loop infinito de carregamento
        int atendimentoId = rs.getInt("atendimento_id");
        if (!rs.wasNull()) {
            model.Atendimento a = new model.Atendimento();
            a.setId(atendimentoId);
            m.setAtendimento(a);
        }

        return m;
    }
}