package dao;

import connection.ConnectionFactory;
import model.MulherApolonia;
import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class MulherApoloniaDAO {

    // CREATE
    public void inserir(MulherApolonia mulher) {
        Connection conn = null;
        try {
            conn = ConnectionFactory.getConnection();
            conn.setAutoCommit(false);

            // INSERIR NA PESSOA_ATENDIDA
            String sqlPessoa = "INSERT INTO pessoa_atendida " +
                    "(nome_codificado, data_cadastro, telefone, email, tipo) " +
                    "VALUES (?, ?, ?, ?, ?)";

            int pessoaId;
            try (PreparedStatement stmt = conn.prepareStatement(sqlPessoa, new String[]{"id"})) {
                stmt.setString(1, mulher.getCodinome());
                stmt.setObject(2, mulher.getData());
                stmt.setString(3, mulher.getTelefone());
                stmt.setString(4, mulher.getEmail());
                stmt.setString(5, "MULHER");
                stmt.executeUpdate();

                try (ResultSet rs = stmt.getGeneratedKeys()) {
                    if (rs.next()) {
                        pessoaId = rs.getInt(1);
                    } else {
                        throw new SQLException("Falha ao obter ID gerado");
                    }
                }
            }

            // INSERIR NA MULHER_APOLONIA
            String sqlMulher = "INSERT INTO mulher_apolonia " +
                    "(pessoa_id, codinome, nivel_risco, tem_boletim_ocorrencia, " +
                    "necessita_sigilo_absoluto) " +
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
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            }
            throw new RuntimeException("Erro ao inserir: " + e.getMessage(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) { e.printStackTrace(); }
            }
        }
    }

    // READ por ID
    public MulherApolonia buscarPorId(int id) {
        String sql = "SELECT ma.pessoa_id, ma.codinome, ma.nivel_risco, " +
                "ma.tem_boletim_ocorrencia, ma.necessita_sigilo_absoluto, " +
                "pa.nome_codificado, pa.data_cadastro, pa.telefone, pa.email " +
                "FROM mulher_apolonia ma " +
                "JOIN pessoa_atendida pa ON ma.pessoa_id = pa.id " +
                "WHERE ma.pessoa_id = ?";

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return mapearResultSet(rs);
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao buscar: " + e.getMessage(), e);
        }
        return null;
    }

    // READ todos
    public List<MulherApolonia> buscarTodos() {
        String sql = "SELECT ma.pessoa_id, ma.codinome, ma.nivel_risco, " +
                "ma.tem_boletim_ocorrencia, ma.necessita_sigilo_absoluto, " +
                "pa.nome_codificado, pa.data_cadastro, pa.telefone, pa.email " +
                "FROM mulher_apolonia ma " +
                "JOIN pessoa_atendida pa ON ma.pessoa_id = pa.id";

        List<MulherApolonia> lista = new ArrayList<>();

        try (Connection conn = ConnectionFactory.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                lista.add(mapearResultSet(rs));
            }

        } catch (SQLException e) {
            throw new RuntimeException("Erro ao listar: " + e.getMessage(), e);
        }
        return lista;
    }

    // UPDATE
    public void atualizar(MulherApolonia mulher) {
        Connection conn = null;
        try {
            conn = ConnectionFactory.getConnection();
            conn.setAutoCommit(false);

            // Atualiza PESSOA_ATENDIDA
            String sqlPessoa = "UPDATE pessoa_atendida SET " +
                    "nome_codificado = ?, data_cadastro = ?, telefone = ?, email = ? " +
                    "WHERE id = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sqlPessoa)) {
                stmt.setString(1, mulher.getCodinome());
                stmt.setObject(2, mulher.getData());
                stmt.setString(3, mulher.getTelefone());
                stmt.setString(4, mulher.getEmail());
                stmt.setInt(5, mulher.getId());
                stmt.executeUpdate();
            }

            // Atualiza MULHER_APOLONIA
            String sqlMulher = "UPDATE mulher_apolonia SET " +
                    "codinome = ?, nivel_risco = ?, tem_boletim_ocorrencia = ?, " +
                    "necessita_sigilo_absoluto = ? " +
                    "WHERE pessoa_id = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sqlMulher)) {
                stmt.setString(1, mulher.getCodinome());
                stmt.setInt(2, mulher.getNivelRisco());
                stmt.setBoolean(3, mulher.isTemBoletimOcorrencia());
                stmt.setBoolean(4, mulher.isNecessitaSigiloAbsoluto());
                stmt.setInt(5, mulher.getId());
                stmt.executeUpdate();
            }

            conn.commit();

        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            }
            throw new RuntimeException("Erro ao atualizar: " + e.getMessage(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) { e.printStackTrace(); }
            }
        }
    }

    // DELETE
    public void excluir(int id) {
        Connection conn = null;
        try {
            conn = ConnectionFactory.getConnection();
            conn.setAutoCommit(false);

            // Filho primeiro
            String sqlMulher = "DELETE FROM mulher_apolonia WHERE pessoa_id = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sqlMulher)) {
                stmt.setInt(1, id);
                stmt.executeUpdate();
            }

            // Depois pai
            String sqlPessoa = "DELETE FROM pessoa_atendida WHERE id = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sqlPessoa)) {
                stmt.setInt(1, id);
                stmt.executeUpdate();
            }

            conn.commit();

        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            }
            throw new RuntimeException("Erro ao excluir: " + e.getMessage(), e);
        } finally {
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException e) { e.printStackTrace(); }
            }
        }
    }

    // MAPEAMENTO
    private MulherApolonia mapearResultSet(ResultSet rs) throws SQLException {
        MulherApolonia m = new MulherApolonia();
        m.setId(rs.getInt("pessoa_id"));
        m.setCodinome(rs.getString("codinome"));
        m.setNivelRisco(rs.getInt("nivel_risco"));
        m.setTemBoletimOcorrencia(rs.getBoolean("tem_boletim_ocorrencia"));
        m.setNecessitaSigiloAbsoluto(rs.getBoolean("necessita_sigilo_absoluto"));
        m.setNomeCodificado(rs.getString("nome_codificado"));
        m.setData(rs.getObject("data_cadastro", LocalDate.class));
        m.setTelefone(rs.getString("telefone"));
        m.setEmail(rs.getString("email"));
        return m;
    }
}