package br.com.tdbresponde.dao;

import br.com.tdbresponde.dto.TarefaCronogramaDTO;
import br.com.tdbresponde.exception.DatabaseException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import javax.sql.DataSource;
import java.sql.*;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class CronogramaDAO {
    private static final String SELECT = "SELECT ID_TAREFA, ID_VOLUNTARIO, TIPO, DIA_SEMANA, TITULO, DESCRICAO, STATUS, PRIORIDADE, DATA_ATIVIDADE, HORA_INICIO, HORA_FIM, DATA_CRIACAO, DATA_ATUALIZACAO FROM T_TAREFA_CRONOGRAMA";
    private static final String ORDEM_DIA = "CASE DIA_SEMANA WHEN 'Domingo' THEN 1 WHEN 'Segunda-feira' THEN 2 WHEN 'Terca-feira' THEN 3 WHEN 'Quarta-feira' THEN 4 WHEN 'Quinta-feira' THEN 5 WHEN 'Sexta-feira' THEN 6 WHEN 'Sabado' THEN 7 END";
    private static final DateTimeFormatter DATA_FORMATO = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    @Inject
    DataSource dataSource;

    public long inserir(TarefaCronogramaDTO tarefa) {
        String sql = "INSERT INTO T_TAREFA_CRONOGRAMA (ID_VOLUNTARIO, TIPO, DIA_SEMANA, TITULO, DESCRICAO, STATUS, PRIORIDADE, DATA_ATIVIDADE, HORA_INICIO, HORA_FIM) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"ID_TAREFA"})) {
            stmt.setLong(1, tarefa.getIdVoluntario());
            preencher(stmt, tarefa, 2);
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) return rs.getLong(1);
                throw new SQLException("Nenhuma chave gerada para a tarefa.");
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao cadastrar tarefa do cronograma.", e);
        }
    }

    public List<TarefaCronogramaDTO> listarPorVoluntario(long voluntarioId, String diaSemana, String status, String prioridade) {
        StringBuilder sql = new StringBuilder(SELECT + " WHERE ID_VOLUNTARIO = ?");
        List<String> filtros = new ArrayList<>();
        adicionarFiltro(sql, filtros, "DIA_SEMANA", diaSemana);
        adicionarFiltro(sql, filtros, "STATUS", status);
        adicionarFiltro(sql, filtros, "PRIORIDADE", prioridade);
        sql.append(" ORDER BY ").append(ORDEM_DIA).append(", HORA_INICIO");
        try (Connection conn = dataSource.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql.toString())) {
            stmt.setLong(1, voluntarioId);
            for (int i = 0; i < filtros.size(); i++) stmt.setString(i + 2, filtros.get(i));
            try (ResultSet rs = stmt.executeQuery()) {
                List<TarefaCronogramaDTO> tarefas = new ArrayList<>();
                while (rs.next()) tarefas.add(mapear(rs));
                return tarefas;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar tarefas do cronograma.", e);
        }
    }

    public TarefaCronogramaDTO buscarPorId(long id) {
        try (Connection conn = dataSource.getConnection(); PreparedStatement stmt = conn.prepareStatement(SELECT + " WHERE ID_TAREFA = ?")) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() ? mapear(rs) : null;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar tarefa do cronograma.", e);
        }
    }

    public boolean atualizar(long id, TarefaCronogramaDTO tarefa) {
        String sql = "UPDATE T_TAREFA_CRONOGRAMA SET TIPO = ?, DIA_SEMANA = ?, TITULO = ?, DESCRICAO = ?, STATUS = ?, PRIORIDADE = ?, DATA_ATIVIDADE = ?, HORA_INICIO = ?, HORA_FIM = ?, DATA_ATUALIZACAO = CURRENT_TIMESTAMP WHERE ID_TAREFA = ?";
        try (Connection conn = dataSource.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            preencher(stmt, tarefa, 1);
            stmt.setLong(10, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar tarefa do cronograma.", e);
        }
    }

    public boolean excluir(long id) {
        try (Connection conn = dataSource.getConnection(); PreparedStatement stmt = conn.prepareStatement("DELETE FROM T_TAREFA_CRONOGRAMA WHERE ID_TAREFA = ?")) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao excluir tarefa do cronograma.", e);
        }
    }

    public Map<String, Map<String, Integer>> resumoSemanal(long voluntarioId) {
        String sql = "SELECT DIA_SEMANA, STATUS, COUNT(*) AS TOTAL FROM T_TAREFA_CRONOGRAMA WHERE ID_VOLUNTARIO = ? GROUP BY DIA_SEMANA, STATUS ORDER BY " + ORDEM_DIA;
        try (Connection conn = dataSource.getConnection(); PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, voluntarioId);
            try (ResultSet rs = stmt.executeQuery()) {
                Map<String, Map<String, Integer>> resumo = new LinkedHashMap<>();
                while (rs.next()) resumo.computeIfAbsent(rs.getString("DIA_SEMANA"), dia -> new LinkedHashMap<>())
                        .put(rs.getString("STATUS"), rs.getInt("TOTAL"));
                return resumo;
            }
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao consultar resumo do cronograma.", e);
        }
    }

    private void adicionarFiltro(StringBuilder sql, List<String> filtros, String coluna, String valor) {
        if (valor != null && !valor.isEmpty()) {
            sql.append(" AND ").append(coluna).append(" = ?");
            filtros.add(valor);
        }
    }

    private void preencher(PreparedStatement stmt, TarefaCronogramaDTO tarefa, int inicio) throws SQLException {
        stmt.setString(inicio, tarefa.getTipo());
        stmt.setString(inicio + 1, tarefa.getDiaSemana());
        stmt.setString(inicio + 2, tarefa.getTitulo());
        stmt.setString(inicio + 3, tarefa.getDescricao());
        stmt.setString(inicio + 4, tarefa.getStatus());
        stmt.setString(inicio + 5, tarefa.getPrioridade());
        stmt.setString(inicio + 6, tarefa.getDataAtividade());
        stmt.setString(inicio + 7, tarefa.getHoraInicio());
        stmt.setString(inicio + 8, tarefa.getHoraFim());
    }

    private TarefaCronogramaDTO mapear(ResultSet rs) throws SQLException {
        TarefaCronogramaDTO tarefa = new TarefaCronogramaDTO();
        tarefa.setIdTarefa(rs.getLong("ID_TAREFA"));
        tarefa.setIdVoluntario(rs.getLong("ID_VOLUNTARIO"));
        tarefa.setTipo(rs.getString("TIPO"));
        tarefa.setDiaSemana(rs.getString("DIA_SEMANA"));
        tarefa.setTitulo(rs.getString("TITULO"));
        tarefa.setDescricao(rs.getString("DESCRICAO"));
        String status = rs.getString("STATUS");
        if (List.of("Concluida", "Concluido", "Concluído", "Concluída").contains(status == null ? "" : status)) status = "Concluido";
        tarefa.setStatus(status);
        tarefa.setPrioridade(rs.getString("PRIORIDADE"));
        tarefa.setDataAtividade(rs.getString("DATA_ATIVIDADE"));
        tarefa.setHoraInicio(rs.getString("HORA_INICIO"));
        tarefa.setHoraFim(rs.getString("HORA_FIM"));
        tarefa.setDataCriacao(data(rs.getTimestamp("DATA_CRIACAO")));
        tarefa.setDataAtualizacao(data(rs.getTimestamp("DATA_ATUALIZACAO")));
        return tarefa;
    }

    private String data(Timestamp valor) {
        return valor == null ? null : valor.toLocalDateTime().format(DATA_FORMATO);
    }
}
