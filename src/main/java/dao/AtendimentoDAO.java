package dao;

import connection.ConnectionFactory;
import model.Atendimento;
import model.CanalComunicacao;
import model.Voluntario;
import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class AtendimentoDAO {

    private final CanalComunicacaoDAO canalDAO = new CanalComunicacaoDAO();
    private final VoluntarioDAO voluntarioDAO = new VoluntarioDAO();

    // CREATE
    public void inserir(Atendimento atendimento) {
        String sql = "INSERT INTO atendimento " +
                "(prioridade, status, data_abertura, data_encerramento, " +
                "pessoa_atendida_id, voluntario_id, canal_comunicacao_id) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"id"})) {

            stmt.setInt(1, atendimento.getPrioridade());
            stmt.setString(2, atendimento.getStatus());
            stmt.setObject(3, atendimento.getDataAbertura());
            stmt.setObject(4, atendimento.getDataEncerramento()); // pode ser null
            stmt.setInt(5, atendimento.getPessoaAtendida().getId());
            if (atendimento.getVoluntario() != null) {
                stmt.setInt(6, atendimento.getVoluntario().getId());
            } else {
                stmt.setNull(6, Types.INTEGER);
            }
            stmt.setInt(7, atendimento.getCanalOrigem().getId());

            stmt.executeUpdate();

            // Captura o ID gerado pelo Oracle
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    atendimento.setId(rs.getInt(1));
                } else {
                    throw new SQLException("Nenhuma chave gerada após insert de atendimento");
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao inserir atendimento: " + e.getMessage(), e);
        }
    }

    // READ por ID
    public Atendimento buscarPorId(int id) {
        String sql = "SELECT id, prioridade, status, data_abertura, data_encerramento, " +
                "pessoa_atendida_id, voluntario_id, canal_comunicacao_id " +
                "FROM atendimento WHERE id = ?";

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return mapearResultSet(rs);
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar atendimento: " + e.getMessage(), e);
        }
        return null;
    }

    // READ todos
    public List<Atendimento> buscarTodos() {
        String sql = "SELECT id, prioridade, status, data_abertura, data_encerramento, " +
                "pessoa_atendida_id, voluntario_id, canal_comunicacao_id " +
                "FROM atendimento";

        List<Atendimento> lista = new ArrayList<>();

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                lista.add(mapearResultSet(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao listar atendimentos: " + e.getMessage(), e);
        }
        return lista;
    }

    // UPDATE
    public void atualizar(Atendimento atendimento) {
        String sql = "UPDATE atendimento SET " +
                "prioridade = ?, status = ?, data_abertura = ?, data_encerramento = ?, " +
                "pessoa_atendida_id = ?, voluntario_id = ?, canal_comunicacao_id = ? " +
                "WHERE id = ?";

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, atendimento.getPrioridade());
            stmt.setString(2, atendimento.getStatus());
            stmt.setObject(3, atendimento.getDataAbertura());
            stmt.setObject(4, atendimento.getDataEncerramento());
            stmt.setInt(5, atendimento.getPessoaAtendida().getId());
            if (atendimento.getVoluntario() != null) {
                stmt.setInt(6, atendimento.getVoluntario().getId());
            } else {
                stmt.setNull(6, Types.INTEGER);
            }
            stmt.setInt(7, atendimento.getCanalOrigem().getId());
            stmt.setInt(8, atendimento.getId());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao atualizar atendimento: " + e.getMessage(), e);
        }
    }

    // DELETE
    public void excluir(int id) {
        String sql = "DELETE FROM atendimento WHERE id = ?";

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao excluir atendimento: " + e.getMessage(), e);
        }
    }

    // MAPEAMENTO
    private Atendimento mapearResultSet(ResultSet rs) throws SQLException {
        Atendimento a = new Atendimento();
        a.setId(rs.getInt("id"));
        a.setPrioridade(rs.getInt("prioridade"));
        a.setStatus(rs.getString("status"));
        a.setDataAbertura(rs.getObject("data_abertura", LocalDate.class));
        a.setDataEncerramento(rs.getObject("data_encerramento", LocalDate.class));

        // Carrega canal pelo ID
        int canalId = rs.getInt("canal_comunicacao_id");
        if (!rs.wasNull()) {
            CanalComunicacao canal = canalDAO.buscarPorId(canalId);
            a.setCanalOrigem(canal);
        }

        // Carrega voluntario pelo ID
        int volId = rs.getInt("voluntario_id");
        if (!rs.wasNull()) {
            Voluntario v = voluntarioDAO.buscarPorId(volId);
            a.setVoluntario(v);
        }

        // pessoa_atendida: só seta o ID para evitar carregar tudo
        int pessoaId = rs.getInt("pessoa_atendida_id");
        if (!rs.wasNull()) {
            model.CriancaAdolescente pessoa = new model.CriancaAdolescente();
            pessoa.setId(pessoaId);
            a.setPessoaAtendida(pessoa);
        }

        return a;
    }
}