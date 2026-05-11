package br.com.tdbresponde.dao;

import br.com.tdbresponde.model.Especialidade;
import br.com.tdbresponde.exception.DatabaseException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class EspecialidadeDAO {

    @Inject
    DataSource dataSource;

    // CREATE
    public void inserir(Especialidade especialidade) {
        String sql = "INSERT INTO ESPECIALIDADE (NOME, DESCRICAO) VALUES (?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[] {"ID"})) {

            stmt.setString(1, especialidade.getNome());
            stmt.setString(2, especialidade.getDescricao());

            stmt.executeUpdate();

            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    especialidade.setId(generatedKeys.getInt(1));  // agora deve vir o número correto
                } else {
                    throw new SQLException("Nenhuma chave gerada retornada após insert");
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao inserir especialidade: " + e.getMessage(), e);
        }
    }

    // READ por ID
    public Especialidade buscarPorId(int id) {
        String sql = "SELECT ID, NOME, DESCRICAO FROM ESPECIALIDADE WHERE ID = ?";
        Especialidade especialidade = null;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                especialidade = new Especialidade();
                especialidade.setId(rs.getInt("ID"));
                especialidade.setNome(rs.getString("NOME"));
                especialidade.setDescricao(rs.getString("DESCRICAO"));
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar especialidade: " + e.getMessage(), e);
        }

        return especialidade;
    }

    // READ todos
    public List<Especialidade> buscarTodos() {
        String sql = "SELECT ID, NOME, DESCRICAO FROM ESPECIALIDADE";
        List<Especialidade> especialidades = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                Especialidade esp = new Especialidade();
                esp.setId(rs.getInt("ID"));
                esp.setNome(rs.getString("NOME"));
                esp.setDescricao(rs.getString("DESCRICAO"));
                especialidades.add(esp);
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar especialidades: " + e.getMessage(), e);
        }

        return especialidades;
    }

    // UPDATE
    public void atualizar(Especialidade especialidade) {
        String sql = "UPDATE ESPECIALIDADE SET NOME = ?, DESCRICAO = ? WHERE ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, especialidade.getNome());
            stmt.setString(2, especialidade.getDescricao());
            stmt.setInt(3, especialidade.getId());

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar especialidade: " + e.getMessage(), e);
        }
    }

    // DELETE
    public void excluir(int id) {
        String sql = "DELETE FROM ESPECIALIDADE WHERE ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao excluir especialidade: " + e.getMessage(), e);
        }
    }
}
