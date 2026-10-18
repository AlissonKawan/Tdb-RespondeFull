package br.com.tdbresponde.dao;
//primeiro commit da feature/otimizacao-daos

import br.com.tdbresponde.model.AgendaConsulta;
import br.com.tdbresponde.exception.DatabaseException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import javax.sql.DataSource;
import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class AgendaConsultaDAO {

    @Inject
    DataSource dataSource;

    public AgendaConsulta inserir(AgendaConsulta agenda) {
        if (agenda == null) {
            throw new DatabaseException("Não é possível inserir uma agenda nula.", new IllegalArgumentException("Agenda nula"));
        }
        String sql = "INSERT INTO AGENDA_CONSULTA " +
                "(VOLUNTARIO_ID, ATENDIMENTO_ID, PACIENTE, TIPO, DATA_CONSULTA, HORARIO, STATUS, TIPO_PESSOA) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"ID"})) {

            stmt.setInt(1, agenda.getVoluntarioId());
            if (agenda.getAtendimentoId() != null && agenda.getAtendimentoId() > 0) {
                stmt.setInt(2, agenda.getAtendimentoId());
            } else {
                stmt.setNull(2, Types.INTEGER);
            }
            stmt.setString(3, agenda.getPaciente());
            stmt.setString(4, agenda.getTipo());
            stmt.setObject(5, agenda.getDataConsulta());
            stmt.setString(6, agenda.getHorario());
            stmt.setString(7, agenda.getStatus());
            stmt.setString(8, agenda.getTipoPessoa());

            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs != null && rs.next()) {
                    agenda.setId(rs.getInt(1));
                }
            }
            return agenda;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao inserir agenda: " + e.getMessage(), e);
        }
    }

    public List<AgendaConsulta> buscarPorVoluntario(int voluntarioId) {
        String sql = "SELECT * FROM AGENDA_CONSULTA WHERE VOLUNTARIO_ID = ? ORDER BY DATA_CONSULTA ASC, HORARIO ASC";
        List<AgendaConsulta> lista = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, voluntarioId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapearResultSet(rs));
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar agendas do voluntario: " + e.getMessage(), e);
        }
        return lista;
    }

    public List<AgendaConsulta> buscarPorAtendimento(int atendimentoId) {
        String sql = "SELECT * FROM AGENDA_CONSULTA WHERE ATENDIMENTO_ID = ? ORDER BY DATA_CONSULTA ASC, HORARIO ASC";
        List<AgendaConsulta> lista = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, atendimentoId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapearResultSet(rs));
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar agendas do atendimento: " + e.getMessage(), e);
        }
        return lista;
    }

    public AgendaConsulta buscarPorId(int id) {
        String sql = "SELECT * FROM AGENDA_CONSULTA WHERE ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return mapearResultSet(rs);
                }
            }
            return null;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar agenda por ID: " + e.getMessage(), e);
        }
    }

    public AgendaConsulta atualizar(AgendaConsulta agenda) {
        if (agenda == null) {
            throw new DatabaseException("Não é possível atualizar uma agenda nula.", new IllegalArgumentException("Agenda nula"));
        }
        String sql = "UPDATE AGENDA_CONSULTA SET ATENDIMENTO_ID = ?, PACIENTE = ?, TIPO = ?, DATA_CONSULTA = ?, HORARIO = ?, STATUS = ?, TIPO_PESSOA = ? WHERE ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            if (agenda.getAtendimentoId() != null && agenda.getAtendimentoId() > 0) {
                stmt.setInt(1, agenda.getAtendimentoId());
            } else {
                stmt.setNull(1, Types.INTEGER);
            }
            stmt.setString(2, agenda.getPaciente());
            stmt.setString(3, agenda.getTipo());
            stmt.setObject(4, agenda.getDataConsulta());
            stmt.setString(5, agenda.getHorario());
            stmt.setString(6, agenda.getStatus());
            stmt.setString(7, agenda.getTipoPessoa());
            stmt.setInt(8, agenda.getId());

            stmt.executeUpdate();
            return agenda;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar agenda: " + e.getMessage(), e);
        }
    }

    public boolean excluir(int id) {
        String sql = "DELETE FROM AGENDA_CONSULTA WHERE ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            return stmt.executeUpdate() > 0;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao excluir agenda: " + e.getMessage(), e);
        }
    }

    private AgendaConsulta mapearResultSet(ResultSet rs) throws SQLException {
        AgendaConsulta a = new AgendaConsulta();
        a.setId(rs.getInt("ID"));
        a.setVoluntarioId(rs.getInt("VOLUNTARIO_ID"));
        int atendimentoId = rs.getInt("ATENDIMENTO_ID");
        if (!rs.wasNull() && atendimentoId > 0) {
            a.setAtendimentoId(atendimentoId);
        }
        a.setPaciente(rs.getString("PACIENTE"));
        a.setTipo(rs.getString("TIPO"));
        a.setDataConsulta(rs.getObject("DATA_CONSULTA", LocalDate.class));
        a.setHorario(rs.getString("HORARIO"));
        a.setStatus(rs.getString("STATUS"));
        a.setTipoPessoa(rs.getString("TIPO_PESSOA"));
        return a;
    }
}

