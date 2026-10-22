package br.com.tdbresponde.dao;

import br.com.tdbresponde.model.Prontuario;
import br.com.tdbresponde.exception.DatabaseException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import javax.sql.DataSource;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class ProntuarioDAO {

    private static final String SELECT_BASE = "SELECT ID, VOLUNTARIO_ID, AGENDA_ID, ATENDIMENTO_ID, PACIENTE, " +
            "HISTORICO_MEDICO, TRATAMENTO_ATUAL, DATA_REGISTRO FROM PRONTUARIO ";

    @Inject
    DataSource dataSource;

    public Prontuario inserir(Prontuario p) {
        if (p == null) {
            throw new DatabaseException("Não é possível inserir um prontuário nulo.", new IllegalArgumentException("Prontuario nulo"));
        }
        String sql = "INSERT INTO PRONTUARIO " +
                "(VOLUNTARIO_ID, AGENDA_ID, ATENDIMENTO_ID, PACIENTE, HISTORICO_MEDICO, TRATAMENTO_ATUAL) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"ID"})) {

            stmt.setInt(1, p.getVoluntarioId());
            if (p.getAgendaId() != null && p.getAgendaId() > 0) {
                stmt.setInt(2, p.getAgendaId());
            } else {
                stmt.setNull(2, Types.INTEGER);
            }
            if (p.getAtendimentoId() != null && p.getAtendimentoId() > 0) {
                stmt.setInt(3, p.getAtendimentoId());
            } else {
                stmt.setNull(3, Types.INTEGER);
            }
            stmt.setString(4, p.getPaciente());
            stmt.setString(5, p.getHistoricoMedico());
            stmt.setString(6, p.getTratamentoAtual());

            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs != null && rs.next()) {
                    p.setId(rs.getInt(1));
                }
            }
            if (p.getDataRegistro() == null) {
                p.setDataRegistro(LocalDateTime.now());
            }
            return p;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao salvar prontuário: " + e.getMessage(), e);
        }
    }

    public List<Prontuario> buscarPorAgenda(int agendaId) {
        String sql = SELECT_BASE +
                "WHERE AGENDA_ID = ? " +
                "OR (ATENDIMENTO_ID IS NOT NULL AND ATENDIMENTO_ID = (SELECT ATENDIMENTO_ID FROM AGENDA_CONSULTA WHERE ID = ?)) " +
                "ORDER BY DATA_REGISTRO DESC, ID DESC";
        List<Prontuario> lista = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, agendaId);
            stmt.setInt(2, agendaId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapearResultSet(rs));
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar prontuários da agenda: " + e.getMessage(), e);
        }
        return lista;
    }

    public List<Prontuario> buscarPorAtendimento(int atendimentoId) {
        String sql = SELECT_BASE +
                "WHERE ATENDIMENTO_ID = ? " +
                "OR AGENDA_ID IN (SELECT ID FROM AGENDA_CONSULTA WHERE ATENDIMENTO_ID = ?) " +
                "ORDER BY DATA_REGISTRO DESC, ID DESC";
        List<Prontuario> lista = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, atendimentoId);
            stmt.setInt(2, atendimentoId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapearResultSet(rs));
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar prontuários do atendimento: " + e.getMessage(), e);
        }
        return lista;
    }

    private Prontuario mapearResultSet(ResultSet rs) throws SQLException {
        Prontuario p = new Prontuario();
        p.setId(rs.getInt("ID"));
        p.setVoluntarioId(rs.getInt("VOLUNTARIO_ID"));
        int agendaId = rs.getInt("AGENDA_ID");
        if (!rs.wasNull() && agendaId > 0) {
            p.setAgendaId(agendaId);
        }
        int atendimentoId = rs.getInt("ATENDIMENTO_ID");
        if (!rs.wasNull() && atendimentoId > 0) {
            p.setAtendimentoId(atendimentoId);
        }
        p.setPaciente(rs.getString("PACIENTE"));
        p.setHistoricoMedico(rs.getString("HISTORICO_MEDICO"));
        p.setTratamentoAtual(rs.getString("TRATAMENTO_ATUAL"));
        Timestamp ts = rs.getTimestamp("DATA_REGISTRO");
        if (ts != null) {
            p.setDataRegistro(ts.toLocalDateTime());
        }
        return p;
    }
}

