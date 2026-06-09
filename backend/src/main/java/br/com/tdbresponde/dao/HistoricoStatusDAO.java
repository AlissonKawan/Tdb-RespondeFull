package br.com.tdbresponde.dao;

import br.com.tdbresponde.model.HistoricoStatus;
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.Voluntario;
import br.com.tdbresponde.exception.DatabaseException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import javax.sql.DataSource;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class HistoricoStatusDAO {

    @Inject
    DataSource dataSource;

    @Inject
    VoluntarioDAO voluntarioDAO;

    // CREATE
    public void inserir(HistoricoStatus historico) {
        String sql = "INSERT INTO historico_status " +
                "(atendimento_id, status_anterior, status_novo, alterado_por_id, data_hora) " +
                "VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"id"})) {

            stmt.setInt(1, historico.getAtendimento().getId());
            stmt.setString(2, historico.getStatusAnterior());
            stmt.setString(3, historico.getStatusNovo());
            stmt.setInt(4, historico.getAlteradoPor().getId());

            // ← CORREÇÃO: Oracle precisa de Timestamp explícito, não LocalDateTime direto
            stmt.setTimestamp(5, Timestamp.valueOf(historico.getDataHora()));

            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    historico.setId(rs.getInt(1));
                } else {
                    throw new SQLException("Nenhuma chave gerada após insert de histórico");
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao inserir histórico de status: " + e.getMessage(), e);
        }
    }

    // READ por ID
    public HistoricoStatus buscarPorId(int id) {
        String sql = "SELECT H.id, H.atendimento_id, H.status_anterior, H.status_novo, H.alterado_por_id, H.data_hora, V.ID AS VOL_ID, V.NOME AS VOL_NOME, V.USUARIO AS VOL_USR " +
                     "FROM historico_status H " +
                     "LEFT JOIN VOLUNTARIO V ON H.alterado_por_id = V.ID " +
                     "WHERE H.id = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                return mapearResultSet(rs);
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar histórico de status: " + e.getMessage(), e);
        }
        return null;
    }

    // READ todos os históricos de um atendimento
    public List<HistoricoStatus> buscarPorAtendimento(int atendimentoId) {
        String sql = "SELECT H.id, H.atendimento_id, H.status_anterior, H.status_novo, H.alterado_por_id, H.data_hora, V.ID AS VOL_ID, V.NOME AS VOL_NOME, V.USUARIO AS VOL_USR " +
                     "FROM historico_status H " +
                     "LEFT JOIN VOLUNTARIO V ON H.alterado_por_id = V.ID " +
                     "WHERE H.atendimento_id = ? ORDER BY H.data_hora ASC";
        List<HistoricoStatus> historicos = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, atendimentoId);
            ResultSet rs = stmt.executeQuery();

            while (rs.next()) {
                historicos.add(mapearResultSet(rs));
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar histórico do atendimento: " + e.getMessage(), e);
        }
        return historicos;
    }

    // UPDATE
    public void atualizar(HistoricoStatus historico) {
        throw new UnsupportedOperationException("Histórico de status não deve ser alterado");
    }

    // DELETE
    public void excluir(int id) {
        throw new UnsupportedOperationException("Não é permitido excluir registros de histórico");
    }

    // MAPEAMENTO
    private HistoricoStatus mapearResultSet(ResultSet rs) throws SQLException {
        HistoricoStatus h = new HistoricoStatus();
        h.setId(rs.getInt("id"));
        h.setStatusAnterior(rs.getString("status_anterior"));
        h.setStatusNovo(rs.getString("status_novo"));

        // Converte Timestamp do banco de volta para LocalDateTime no Java
        Timestamp ts = rs.getTimestamp("data_hora");
        if (ts != null) {
            h.setDataHora(ts.toLocalDateTime());
        }

        // Carrega atendimento lazy só seta o ID
        int atendimentoId = rs.getInt("atendimento_id");
        if (!rs.wasNull()) {
            Atendimento a = new Atendimento();
            a.setId(atendimentoId);
            h.setAtendimento(a);
        }

        // Carrega voluntário completo
        int voluntarioId = rs.getInt("alterado_por_id");
        if (!rs.wasNull()) {
            Voluntario v = new Voluntario();
            v.setId(rs.getInt("VOL_ID"));
            try {
                v.setNome(rs.getString("VOL_NOME"));
                v.setUsuario(rs.getString("VOL_USR"));
            } catch (SQLException e) {}
            h.setAlteradoPor(v);
        }

        return h;
    }
}