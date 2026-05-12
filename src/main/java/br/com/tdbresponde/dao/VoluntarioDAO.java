package br.com.tdbresponde.dao;

import br.com.tdbresponde.exception.DatabaseException;
import br.com.tdbresponde.model.Especialidade;
import br.com.tdbresponde.model.Voluntario;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class VoluntarioDAO {

    @Inject
    DataSource dataSource;

    @Inject
    EspecialidadeDAO especialidadeDAO;

    public void inserir(Voluntario voluntario) {
        String sql = "INSERT INTO VOLUNTARIO (NOME, USUARIO, SENHA, ACESSO_SIGILO, DISPONIVEL, ID_CONTA) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        Connection conn = null;

        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false);

            try (PreparedStatement stmt = conn.prepareStatement(sql, new String[] { "ID" })) {
                stmt.setString(1, voluntario.getNome());
                stmt.setString(2, voluntario.getUsuario());
                stmt.setString(3, voluntario.getSenha());
                stmt.setBoolean(4, voluntario.getAcessoSigilo() != null && voluntario.getAcessoSigilo());
                stmt.setBoolean(5, voluntario.isDisponivel());

                if (voluntario.getContaId() != null) {
                    stmt.setInt(6, voluntario.getContaId());
                } else {
                    stmt.setNull(6, java.sql.Types.INTEGER);
                }

                stmt.executeUpdate();

                try (ResultSet rs = stmt.getGeneratedKeys()) {
                    if (rs.next()) {
                        voluntario.setId(rs.getInt(1));
                    } else {
                        throw new SQLException("Nenhuma chave gerada apos insert de voluntario");
                    }
                }
            }

            inserirEspecialidade(conn, voluntario);
            conn.commit();

        } catch (SQLException e) {
            rollback(conn);
            throw new DatabaseException("Erro ao inserir voluntario: " + e.getMessage(), e);
        } finally {
            fechar(conn);
        }
    }

    public Voluntario buscarPorId(int id) {
        String sql = "SELECT ID, NOME, USUARIO, SENHA, ACESSO_SIGILO, DISPONIVEL, ID_CONTA " +
                "FROM VOLUNTARIO WHERE ID = ?";

        Voluntario voluntario = null;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    voluntario = mapearVoluntario(rs);
                    carregarEspecialidade(voluntario);
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar voluntario: " + e.getMessage(), e);
        }

        return voluntario;
    }

    public Voluntario buscarPorContaId(int contaId) {
        String sql = "SELECT ID, NOME, USUARIO, SENHA, ACESSO_SIGILO, DISPONIVEL, ID_CONTA " +
                "FROM VOLUNTARIO WHERE ID_CONTA = ?";

        Voluntario voluntario = null;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, contaId);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    voluntario = mapearVoluntario(rs);
                    carregarEspecialidade(voluntario);
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar voluntario por conta: " + e.getMessage(), e);
        }

        return voluntario;
    }

    public List<Voluntario> buscarTodos() {
        String sql = "SELECT ID, NOME, USUARIO, SENHA, ACESSO_SIGILO, DISPONIVEL, ID_CONTA FROM VOLUNTARIO";

        List<Voluntario> voluntarios = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                Voluntario voluntario = mapearVoluntario(rs);
                carregarEspecialidade(voluntario);
                voluntarios.add(voluntario);
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar voluntarios: " + e.getMessage(), e);
        }

        return voluntarios;
    }

    public void atualizar(Voluntario voluntario) {
        String sql = "UPDATE VOLUNTARIO SET NOME = ?, USUARIO = ?, SENHA = ?, " +
                "ACESSO_SIGILO = ?, DISPONIVEL = ?, ID_CONTA = ? WHERE ID = ?";

        Connection conn = null;

        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false);

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, voluntario.getNome());
                stmt.setString(2, voluntario.getUsuario());
                stmt.setString(3, voluntario.getSenha());
                stmt.setBoolean(4, voluntario.getAcessoSigilo() != null && voluntario.getAcessoSigilo());
                stmt.setBoolean(5, voluntario.isDisponivel());

                if (voluntario.getContaId() != null) {
                    stmt.setInt(6, voluntario.getContaId());
                } else {
                    stmt.setNull(6, java.sql.Types.INTEGER);
                }

                stmt.setInt(7, voluntario.getId());
                stmt.executeUpdate();
            }

            excluirEspecialidades(conn, voluntario.getId());
            inserirEspecialidade(conn, voluntario);
            conn.commit();

        } catch (SQLException e) {
            rollback(conn);
            throw new DatabaseException("Erro ao atualizar voluntario: " + e.getMessage(), e);
        } finally {
            fechar(conn);
        }
    }

    public void excluir(int id) {
        String sql = "DELETE FROM VOLUNTARIO WHERE ID = ?";

        Connection conn = null;

        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false);

            excluirEspecialidades(conn, id);

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, id);
                stmt.executeUpdate();
            }

            conn.commit();

        } catch (SQLException e) {
            rollback(conn);
            throw new DatabaseException("Erro ao excluir voluntario: " + e.getMessage(), e);
        } finally {
            fechar(conn);
        }
    }

    private Voluntario mapearVoluntario(ResultSet rs) throws SQLException {
        Voluntario voluntario = new Voluntario();

        voluntario.setId(rs.getInt("ID"));
        voluntario.setNome(rs.getString("NOME"));
        voluntario.setUsuario(rs.getString("USUARIO"));
        voluntario.setSenha(rs.getString("SENHA"));
        voluntario.setAcessoSigilo(rs.getBoolean("ACESSO_SIGILO"));
        voluntario.setDisponivel(rs.getBoolean("DISPONIVEL"));

        int contaId = rs.getInt("ID_CONTA");
        if (!rs.wasNull()) {
            voluntario.setContaId(contaId);
        }

        return voluntario;
    }

    private void carregarEspecialidade(Voluntario voluntario) throws SQLException {
        String sql = "SELECT ESPECIALIDADE_ID FROM VOLUNTARIO_ESPECIALIDADE WHERE VOLUNTARIO_ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, voluntario.getId());

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Especialidade especialidade = especialidadeDAO.buscarPorId(rs.getInt("ESPECIALIDADE_ID"));
                    voluntario.setEspecialidade(especialidade);
                }
            }
        }
    }

    private void inserirEspecialidade(Connection conn, Voluntario voluntario) throws SQLException {
        if (voluntario.getEspecialidade() == null || voluntario.getEspecialidade().getId() <= 0) {
            return;
        }

        String sql = "INSERT INTO VOLUNTARIO_ESPECIALIDADE (VOLUNTARIO_ID, ESPECIALIDADE_ID) VALUES (?, ?)";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, voluntario.getId());
            stmt.setInt(2, voluntario.getEspecialidade().getId());
            stmt.executeUpdate();
        }
    }

    private void excluirEspecialidades(Connection conn, int voluntarioId) throws SQLException {
        String sql = "DELETE FROM VOLUNTARIO_ESPECIALIDADE WHERE VOLUNTARIO_ID = ?";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, voluntarioId);
            stmt.executeUpdate();
        }
    }

    private void rollback(Connection conn) {
        if (conn != null) {
            try {
                conn.rollback();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }

    private void fechar(Connection conn) {
        if (conn != null) {
            try {
                conn.setAutoCommit(true);
                conn.close();
            } catch (SQLException e) {
                e.printStackTrace();
            }
        }
    }
}