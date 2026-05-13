package br.com.tdbresponde.dao;

import br.com.tdbresponde.exception.DatabaseException;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.TipoUsuario;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class ContaUsuarioDAO {

    @Inject
    DataSource dataSource;

    public void cadastrarConta(ContaUsuario conta) {
        try (Connection conn = dataSource.getConnection()) {
            cadastrarConta(conn, conta);
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao cadastrar conta: " + e.getMessage(), e);
        }
    }

    public void cadastrarConta(Connection conn, ContaUsuario conta) throws SQLException {
        String sql = "INSERT INTO T_CONTA_USUARIO " +
                "(NOME, EMAIL, SENHA_HASH, TIPO_USUARIO, ATIVO) " +
                "VALUES (?, ?, ?, ?, ?)";

        try (PreparedStatement stmt = conn.prepareStatement(sql, new String[] {"ID_CONTA"})) {

            stmt.setString(1, conta.getNome());
            stmt.setString(2, conta.getEmail());
            stmt.setString(3, conta.getSenhaHash());
            stmt.setString(4, conta.getTipoUsuario().name());
            stmt.setInt(5, conta.isAtivo() ? 1 : 0);
            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    conta.setId(rs.getInt(1));
                } else {
                    throw new SQLException("Nenhuma chave gerada apos insert de conta");
                }
            }
        }
    }

    public ContaUsuario buscarPorEmail(String email) {
        String sql = "SELECT ID_CONTA, NOME, EMAIL, SENHA_HASH, TIPO_USUARIO, ATIVO, DATA_CRIACAO " +
                "FROM T_CONTA_USUARIO WHERE LOWER(EMAIL) = LOWER(?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapearConta(rs);
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar conta por email: " + e.getMessage(), e);
        }

        return null;
    }

    public ContaUsuario buscarPorId(int id) {
        String sql = "SELECT ID_CONTA, NOME, EMAIL, SENHA_HASH, TIPO_USUARIO, ATIVO, DATA_CRIACAO " +
                "FROM T_CONTA_USUARIO WHERE ID_CONTA = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapearConta(rs);
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar conta: " + e.getMessage(), e);
        }

        return null;
    }

    public List<ContaUsuario> listar() {
        String sql = "SELECT ID_CONTA, NOME, EMAIL, SENHA_HASH, TIPO_USUARIO, ATIVO, DATA_CRIACAO " +
                "FROM T_CONTA_USUARIO ORDER BY ID_CONTA";
        List<ContaUsuario> contas = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                contas.add(mapearConta(rs));
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar contas: " + e.getMessage(), e);
        }

        return contas;
    }

    public void atualizar(ContaUsuario conta) {
        String sql = "UPDATE T_CONTA_USUARIO SET NOME = ?, EMAIL = ?, TIPO_USUARIO = ?, ATIVO = ? " +
                "WHERE ID_CONTA = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, conta.getNome());
            stmt.setString(2, conta.getEmail());
            stmt.setString(3, conta.getTipoUsuario().name());
            stmt.setInt(4, conta.isAtivo() ? 1 : 0);
            stmt.setInt(5, conta.getId());
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar conta: " + e.getMessage(), e);
        }
    }

    public void desativar(int id) {
        String sql = "UPDATE T_CONTA_USUARIO SET ATIVO = 0 WHERE ID_CONTA = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao desativar conta: " + e.getMessage(), e);
        }
    }

    public void ativar(int id) {
        String sql = "UPDATE T_CONTA_USUARIO SET ATIVO = 1 WHERE ID_CONTA = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao ativar conta: " + e.getMessage(), e);
        }
    }

    public boolean emailExiste(String email) {
        String sql = "SELECT 1 FROM T_CONTA_USUARIO WHERE LOWER(EMAIL) = LOWER(?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao verificar email: " + e.getMessage(), e);
        }
    }

    private ContaUsuario mapearConta(ResultSet rs) throws SQLException {
        ContaUsuario conta = new ContaUsuario();
        conta.setId(rs.getInt("ID_CONTA"));
        conta.setNome(rs.getString("NOME"));
        conta.setEmail(rs.getString("EMAIL"));
        conta.setSenhaHash(rs.getString("SENHA_HASH"));
        conta.setTipoUsuario(TipoUsuario.valueOf(rs.getString("TIPO_USUARIO")));
        conta.setAtivo(rs.getInt("ATIVO") == 1);

        Timestamp dataCriacao = rs.getTimestamp("DATA_CRIACAO");
        if (dataCriacao != null) {
            conta.setDataCriacao(dataCriacao.toLocalDateTime());
        }

        return conta;
    }
}
