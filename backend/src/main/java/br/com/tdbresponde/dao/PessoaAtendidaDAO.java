package br.com.tdbresponde.dao;

import br.com.tdbresponde.exception.DatabaseException;
import br.com.tdbresponde.model.CriancaAdolescente;
import br.com.tdbresponde.model.MulherApolonia;
import br.com.tdbresponde.model.PessoaAtendida;
import br.com.tdbresponde.model.PessoaAtendidaBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;

@ApplicationScoped
public class PessoaAtendidaDAO {

    @Inject
    DataSource dataSource;

    public void inserirPessoaAtendida(PessoaAtendida pessoa, String tipo) {
        String sql = "INSERT INTO pessoa_atendida " +
                "(nome_codificado, data_cadastro, telefone, email, tipo, id_conta) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[] {"id"})) {

            stmt.setString(1, pessoa.getNomeCodificado());
            stmt.setObject(2, pessoa.getData() != null ? pessoa.getData() : LocalDate.now());
            stmt.setString(3, pessoa.getTelefone());
            stmt.setString(4, pessoa.getEmail());
            stmt.setString(5, tipo);
            if (pessoa.getContaId() != null) {
                stmt.setInt(6, pessoa.getContaId());
            } else {
                stmt.setNull(6, java.sql.Types.INTEGER);
            }
            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    pessoa.setId(rs.getInt(1));
                } else {
                    throw new SQLException("Nenhuma chave gerada apos insert de pessoa atendida");
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao inserir pessoa atendida: " + e.getMessage(), e);
        }
    }

    public void inserirCriancaAdolescente(CriancaAdolescente crianca) {
        Connection conn = null;

        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false);

            int pessoaId = inserirPessoaAtendida(conn, crianca, "CRIANCA");

            String sqlCrianca = "INSERT INTO crianca_adolescente " +
                    "(pessoa_id, idade, nome_responsavel, escola, gravidade_bucal) " +
                    "VALUES (?, ?, ?, ?, ?)";

            try (PreparedStatement stmt = conn.prepareStatement(sqlCrianca)) {
                stmt.setInt(1, pessoaId);
                stmt.setInt(2, crianca.getIdade());
                stmt.setString(3, crianca.getNomeResponsavel());
                stmt.setString(4, crianca.getEscola());
                stmt.setInt(5, crianca.getGravidadeBucal());
                stmt.executeUpdate();
            }

            conn.commit();
            crianca.setId(pessoaId);

        } catch (SQLException e) {
            rollback(conn);
            throw new DatabaseException("Erro ao inserir crianca/adolescente: " + e.getMessage(), e);
        } finally {
            fechar(conn);
        }
    }

    public void inserirMulherApolonia(MulherApolonia mulher) {
        Connection conn = null;

        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false);

            int pessoaId = inserirPessoaAtendida(conn, mulher, "MULHER");

            String sqlMulher = "INSERT INTO mulher_apolonia " +
                    "(pessoa_id, codinome, nivel_risco, tem_boletim_ocorrencia, necessita_sigilo_absoluto) " +
                    "VALUES (?, ?, ?, ?, ?)";

            try (PreparedStatement stmt = conn.prepareStatement(sqlMulher)) {
                stmt.setInt(1, pessoaId);
                stmt.setString(2, mulher.getCodinome());
                stmt.setInt(3, mulher.getNivelRisco());
                stmt.setBoolean(4, mulher.isTemBoletimOcorrencia());
                stmt.setBoolean(5, mulher.isNecessitaSigiloAbsoluto());
                stmt.executeUpdate();
            }

            conn.commit();
            mulher.setId(pessoaId);

        } catch (SQLException e) {
            rollback(conn);
            throw new DatabaseException("Erro ao inserir mulher apolonia: " + e.getMessage(), e);
        } finally {
            fechar(conn);
        }
    }

    public PessoaAtendida buscarPorId(int id) {
        String sql = "SELECT id, nome_codificado, data_cadastro, telefone, email, id_conta " +
                "FROM pessoa_atendida WHERE id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapearPessoa(rs);
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar beneficiario: " + e.getMessage(), e);
        }

        return null;
    }

    public PessoaAtendida buscarPorContaId(int contaId) {
        String sql = "SELECT id, nome_codificado, data_cadastro, telefone, email, id_conta " +
                "FROM pessoa_atendida WHERE id_conta = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, contaId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapearPessoa(rs);
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar beneficiario por conta: " + e.getMessage(), e);
        }

        return null;
    }

    private PessoaAtendida mapearPessoa(ResultSet rs) throws SQLException {
        PessoaAtendidaBase pessoa = new PessoaAtendidaBase();
        pessoa.setId(rs.getInt("id"));
        pessoa.setNomeCodificado(rs.getString("nome_codificado"));
        pessoa.setData(rs.getObject("data_cadastro", LocalDate.class));
        pessoa.setTelefone(rs.getString("telefone"));
        pessoa.setEmail(rs.getString("email"));

        int contaId = rs.getInt("id_conta");
        if (!rs.wasNull()) {
            pessoa.setContaId(contaId);
        }

        return pessoa;
    }

    private int inserirPessoaAtendida(Connection conn, PessoaAtendida pessoa, String tipo) throws SQLException {
        String sql = "INSERT INTO pessoa_atendida " +
                "(nome_codificado, data_cadastro, telefone, email, tipo, id_conta) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (PreparedStatement stmt = conn.prepareStatement(sql, new String[] {"id"})) {
            stmt.setString(1, pessoa.getNomeCodificado());
            stmt.setObject(2, pessoa.getData() != null ? pessoa.getData() : LocalDate.now());
            stmt.setString(3, pessoa.getTelefone());
            stmt.setString(4, pessoa.getEmail());
            stmt.setString(5, tipo);
            if (pessoa.getContaId() != null) {
                stmt.setInt(6, pessoa.getContaId());
            } else {
                stmt.setNull(6, java.sql.Types.INTEGER);
            }
            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }
        }

        throw new SQLException("Nenhuma chave gerada apos insert de pessoa atendida");
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
