package dao;

import connection.ConnectionFactory;
import model.Voluntario;
import model.Especialidade;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class VoluntarioDAO {

    private final EspecialidadeDAO especialidadeDAO = new EspecialidadeDAO();

    // CREATE
    // CREATE - VoluntarioDAO (versão corrigida para Oracle)
    public void inserir(Voluntario voluntario) {
        String sql = "INSERT INTO voluntario (nome, usuario, senha, acesso_sigilo, disponivel, especialidade_id) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[] { "id" })) {   // ← ESSA É A LINHA QUE RESOLVE

            stmt.setString(1, voluntario.getNome());
            stmt.setString(2, voluntario.getUsuario());
            stmt.setString(3, voluntario.getSenha());
            stmt.setBoolean(4, voluntario.getAcessoSigilo() != null && voluntario.getAcessoSigilo());
            stmt.setBoolean(5, voluntario.isDisponivel());
            // Cuidado: se especialidade_id pode ser null
            if (voluntario.getEspecialidade() != null && voluntario.getEspecialidade().getId() > 0) {
                stmt.setInt(6, voluntario.getEspecialidade().getId());
            } else {
                stmt.setNull(6, java.sql.Types.INTEGER);
            }

            stmt.executeUpdate();

            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    voluntario.setId(generatedKeys.getInt(1));
                    System.out.println("ID gerado para Voluntário: " + voluntario.getId()); // debug temporário
                } else {
                    throw new SQLException("Nenhuma chave gerada após insert de voluntário");
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao inserir voluntário: " + e.getMessage(), e);
        }
    }

    // READ por ID
    public Voluntario buscarPorId(int id) {
        String sql = "SELECT * FROM voluntario WHERE id = ?";
        Voluntario voluntario = null;

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                voluntario = new Voluntario();
                voluntario.setId(rs.getInt("id"));
                voluntario.setNome(rs.getString("nome"));
                voluntario.setUsuario(rs.getString("usuario"));
                voluntario.setSenha(rs.getString("senha"));
                voluntario.setAcessoSigilo(rs.getBoolean("acesso_sigilo"));
                voluntario.setDisponivel(rs.getBoolean("disponivel"));

                int espId = rs.getInt("especialidade_id");
                if (!rs.wasNull()) {
                    Especialidade esp = especialidadeDAO.buscarPorId(espId);
                    voluntario.setEspecialidade(esp);
                }
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar voluntário: " + e.getMessage());
        }

        return voluntario;
    }

    // READ todos (simplificado – sem carregar especialidade em todos para performance)
    public List<Voluntario> buscarTodos() {
        String sql = "SELECT * FROM voluntario";
        List<Voluntario> voluntarios = new ArrayList<>();

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                Voluntario v = new Voluntario();
                v.setId(rs.getInt("id"));
                v.setNome(rs.getString("nome"));
                v.setUsuario(rs.getString("usuario"));
                v.setSenha(rs.getString("senha"));
                v.setAcessoSigilo(rs.getBoolean("acesso_sigilo"));
                v.setDisponivel(rs.getBoolean("disponivel"));
                // especialidade carregada lazy – só se precisar
                voluntarios.add(v);
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao listar voluntários: " + e.getMessage());
        }

        return voluntarios;
    }

    // UPDATE
    public void atualizar(Voluntario voluntario) {
        String sql = "UPDATE voluntario SET nome = ?, usuario = ?, senha = ?, " +
                "acesso_sigilo = ?, disponivel = ?, especialidade_id = ? WHERE id = ?";

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, voluntario.getNome());
            stmt.setString(2, voluntario.getUsuario());
            stmt.setString(3, voluntario.getSenha());
            stmt.setBoolean(4, voluntario.getAcessoSigilo() != null && voluntario.getAcessoSigilo());
            stmt.setBoolean(5, voluntario.isDisponivel());
            stmt.setObject(6, voluntario.getEspecialidade() != null ? voluntario.getEspecialidade().getId() : null, Types.INTEGER);
            stmt.setInt(7, voluntario.getId());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao atualizar voluntário: " + e.getMessage());
        }
    }

    // DELETE
    public void excluir(int id) {
        String sql = "DELETE FROM voluntario WHERE id = ?";

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao excluir voluntário: " + e.getMessage());
        }
    }
}