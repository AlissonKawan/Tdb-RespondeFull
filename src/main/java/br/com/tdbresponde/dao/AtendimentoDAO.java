package br.com.tdbresponde.dao;

import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.CanalComunicacao;
import br.com.tdbresponde.model.Voluntario;
import br.com.tdbresponde.exception.DatabaseException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import javax.sql.DataSource;
import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class AtendimentoDAO {

    @Inject
    DataSource dataSource;

    @Inject
    CanalComunicacaoDAO canalDAO;

    @Inject
    VoluntarioDAO voluntarioDAO;

    // CREATE
    public void inserir(Atendimento atendimento) {
        String sql = "INSERT INTO ATENDIMENTO " +
                "(PRIORIDADE, STATUS, DATA_ABERTURA, DATA_ENCERRAMENTO, " +
                "PESSOA_ATENDIDA_ID, VOLUNTARIO_ID, CANAL_COMUNICACAO_ID) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"ID"})) {

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
            throw new DatabaseException("Erro ao inserir atendimento: " + e.getMessage(), e);
        }
    }

    // READ por ID
    public Atendimento buscarPorId(int id) {
        String sql = "SELECT ID, PRIORIDADE, STATUS, DATA_ABERTURA, DATA_ENCERRAMENTO, " +
                "PESSOA_ATENDIDA_ID, VOLUNTARIO_ID, CANAL_COMUNICACAO_ID " +
                "FROM ATENDIMENTO WHERE ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return mapearResultSet(rs);
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar atendimento: " + e.getMessage(), e);
        }
        return null;
    }

    // READ todos
    public List<Atendimento> buscarTodos() {
        String sql = "SELECT ID, PRIORIDADE, STATUS, DATA_ABERTURA, DATA_ENCERRAMENTO, " +
                "PESSOA_ATENDIDA_ID, VOLUNTARIO_ID, CANAL_COMUNICACAO_ID " +
                "FROM ATENDIMENTO";

        List<Atendimento> lista = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                lista.add(mapearResultSet(rs));
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar atendimentos: " + e.getMessage(), e);
        }
        return lista;
    }

    public List<Atendimento> buscarSolicitados() {
        String sql = "SELECT ID, PRIORIDADE, STATUS, DATA_ABERTURA, DATA_ENCERRAMENTO, " +
                "PESSOA_ATENDIDA_ID, VOLUNTARIO_ID, CANAL_COMUNICACAO_ID " +
                "FROM ATENDIMENTO " +
                "WHERE VOLUNTARIO_ID IS NULL " +
                "OR UPPER(STATUS) IN ('SOLICITADO', 'ABERTO', 'PENDENTE') " +
                "ORDER BY DATA_ABERTURA DESC, PRIORIDADE ASC";

        List<Atendimento> lista = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                lista.add(mapearResultSet(rs));
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar atendimentos solicitados: " + e.getMessage(), e);
        }
        return lista;
    }

    public List<Atendimento> buscarPorVoluntario(int voluntarioId) {
        String sql = "SELECT ID, PRIORIDADE, STATUS, DATA_ABERTURA, DATA_ENCERRAMENTO, " +
                "PESSOA_ATENDIDA_ID, VOLUNTARIO_ID, CANAL_COMUNICACAO_ID " +
                "FROM ATENDIMENTO " +
                "WHERE VOLUNTARIO_ID = ? " +
                "ORDER BY DATA_ABERTURA DESC, ID DESC";

        List<Atendimento> lista = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, voluntarioId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapearResultSet(rs));
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar atendimentos do voluntario: " + e.getMessage(), e);
        }
        return lista;
    }

    // UPDATE
    public void atualizar(Atendimento atendimento) {
        String sql = "UPDATE ATENDIMENTO SET " +
                "PRIORIDADE = ?, STATUS = ?, DATA_ABERTURA = ?, DATA_ENCERRAMENTO = ?, " +
                "PESSOA_ATENDIDA_ID = ?, VOLUNTARIO_ID = ?, CANAL_COMUNICACAO_ID = ? " +
                "WHERE ID = ?";

        try (Connection conn = dataSource.getConnection();
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
            throw new DatabaseException("Erro ao atualizar atendimento: " + e.getMessage(), e);
        }
    }

    // DELETE
    public void excluir(int id) {
        String sql = "DELETE FROM ATENDIMENTO WHERE ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao excluir atendimento: " + e.getMessage(), e);
        }
    }

    // MAPEAMENTO
    private Atendimento mapearResultSet(ResultSet rs) throws SQLException {
        Atendimento a = new Atendimento();
        a.setId(rs.getInt("ID"));
        a.setPrioridade(rs.getInt("PRIORIDADE"));
        a.setStatus(rs.getString("STATUS"));
        a.setDataAbertura(rs.getObject("DATA_ABERTURA", LocalDate.class));
        a.setDataEncerramento(rs.getObject("DATA_ENCERRAMENTO", LocalDate.class));

        // Carrega canal pelo ID
        int canalId = rs.getInt("CANAL_COMUNICACAO_ID");
        if (!rs.wasNull()) {
            CanalComunicacao canal = canalDAO.buscarPorId(canalId);
            a.setCanalOrigem(canal);
        }

        // Carrega voluntario pelo ID
        int volId = rs.getInt("VOLUNTARIO_ID");
        if (!rs.wasNull()) {
            Voluntario v = voluntarioDAO.buscarPorId(volId);
            a.setVoluntario(v);
        }

        // pessoa_atendida: só seta o ID para evitar carregar tudo
        int pessoaId = rs.getInt("PESSOA_ATENDIDA_ID");
        if (!rs.wasNull()) {
            br.com.tdbresponde.model.CriancaAdolescente pessoa = new br.com.tdbresponde.model.CriancaAdolescente();
            pessoa.setId(pessoaId);
            a.setPessoaAtendida(pessoa);
        }

        return a;
    }
}
