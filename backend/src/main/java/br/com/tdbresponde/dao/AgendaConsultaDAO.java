package br.com.tdbresponde.dao;

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
        String sql = "INSERT INTO AGENDA_CONSULTA " +
                "(VOLUNTARIO_ID, PACIENTE, TIPO, DATA_CONSULTA, HORARIO, STATUS, TIPO_PESSOA) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"ID"})) {

            stmt.setInt(1, agenda.getVoluntarioId());
            stmt.setString(2, agenda.getPaciente());
            stmt.setString(3, agenda.getTipo());
            stmt.setObject(4, agenda.getDataConsulta());
            stmt.setString(5, agenda.getHorario());
            stmt.setString(6, agenda.getStatus());
            stmt.setString(7, agenda.getTipoPessoa());

            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
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
                    AgendaConsulta a = new AgendaConsulta();
                    a.setId(rs.getInt("ID"));
                    a.setVoluntarioId(rs.getInt("VOLUNTARIO_ID"));
                    a.setPaciente(rs.getString("PACIENTE"));
                    a.setTipo(rs.getString("TIPO"));
                    a.setDataConsulta(rs.getObject("DATA_CONSULTA", LocalDate.class));
                    a.setHorario(rs.getString("HORARIO"));
                    a.setStatus(rs.getString("STATUS"));
                    a.setTipoPessoa(rs.getString("TIPO_PESSOA"));
                    lista.add(a);
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar agendas do voluntario: " + e.getMessage(), e);
        }
        return lista;
    }

    public AgendaConsulta atualizar(AgendaConsulta agenda) {
        String sql = "UPDATE AGENDA_CONSULTA SET PACIENTE = ?, TIPO = ?, DATA_CONSULTA = ?, HORARIO = ?, STATUS = ?, TIPO_PESSOA = ? WHERE ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, agenda.getPaciente());
            stmt.setString(2, agenda.getTipo());
            stmt.setObject(3, agenda.getDataConsulta());
            stmt.setString(4, agenda.getHorario());
            stmt.setString(5, agenda.getStatus());
            stmt.setString(6, agenda.getTipoPessoa());
            stmt.setInt(7, agenda.getId());

            stmt.executeUpdate();
            return agenda;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar agenda: " + e.getMessage(), e);
        }
    }

    public void excluir(int id) {
        String sql = "DELETE FROM AGENDA_CONSULTA WHERE ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao excluir agenda: " + e.getMessage(), e);
        }
    }
}
