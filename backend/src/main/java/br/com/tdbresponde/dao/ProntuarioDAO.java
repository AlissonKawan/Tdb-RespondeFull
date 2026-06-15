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

    @Inject
    DataSource dataSource;

    public Prontuario inserir(Prontuario p) {
        String sql = "INSERT INTO PRONTUARIO " +
                "(VOLUNTARIO_ID, AGENDA_ID, PACIENTE, HISTORICO_MEDICO, TRATAMENTO_ATUAL) " +
                "VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"ID"})) {

            stmt.setInt(1, p.getVoluntarioId());
            stmt.setInt(2, p.getAgendaId());
            stmt.setString(3, p.getPaciente());
            stmt.setString(4, p.getHistoricoMedico());
            stmt.setString(5, p.getTratamentoAtual());

            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    p.setId(rs.getInt(1));
                }
            }
            return p;

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao salvar prontuário: " + e.getMessage(), e);
        }
    }

    public List<Prontuario> buscarPorAgenda(int agendaId) {
        String sql = "SELECT * FROM PRONTUARIO WHERE AGENDA_ID = ? ORDER BY DATA_REGISTRO DESC";
        List<Prontuario> lista = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, agendaId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Prontuario p = new Prontuario();
                    p.setId(rs.getInt("ID"));
                    p.setVoluntarioId(rs.getInt("VOLUNTARIO_ID"));
                    p.setAgendaId(rs.getInt("AGENDA_ID"));
                    p.setPaciente(rs.getString("PACIENTE"));
                    p.setHistoricoMedico(rs.getString("HISTORICO_MEDICO"));
                    p.setTratamentoAtual(rs.getString("TRATAMENTO_ATUAL"));
                    Timestamp ts = rs.getTimestamp("DATA_REGISTRO");
                    if (ts != null) {
                        p.setDataRegistro(ts.toLocalDateTime());
                    }
                    lista.add(p);
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar prontuários: " + e.getMessage(), e);
        }
        return lista;
    }
}
