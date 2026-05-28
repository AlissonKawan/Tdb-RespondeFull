package br.com.tdbresponde.dao;

import br.com.tdbresponde.exception.DatabaseException;
import br.com.tdbresponde.model.Especialidade;
import br.com.tdbresponde.model.Voluntario;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class VoluntarioDAO {

    private static final String COLUNAS_VOLUNTARIO =
            "ID, NOME, USUARIO, SENHA, ACESSO_SIGILO, DISPONIVEL, ID_CONTA, STATUS_APROVACAO, MOTIVO_VOLUNTARIADO, CODIGO_INDICACAO, PONTOS_INDICACAO, ID_VOLUNTARIO_INDICADOR";

    @Inject
    DataSource dataSource;

    @Inject
    EspecialidadeDAO especialidadeDAO;

    public void inserir(Voluntario voluntario) {
        try (Connection conn = dataSource.getConnection()) {
            inserir(conn, voluntario);
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao inserir voluntario: " + e.getMessage(), e);
        }
    }

    public void inserir(Connection conn, Voluntario voluntario) throws SQLException {
        String sql = "INSERT INTO VOLUNTARIO " +
                "(NOME, USUARIO, SENHA, ACESSO_SIGILO, DISPONIVEL, ID_CONTA, STATUS_APROVACAO, MOTIVO_VOLUNTARIADO, CODIGO_INDICACAO, PONTOS_INDICACAO, ID_VOLUNTARIO_INDICADOR) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (PreparedStatement stmt = conn.prepareStatement(sql, new String[] { "ID" })) {
            stmt.setString(1, voluntario.getNome());
            stmt.setString(2, voluntario.getUsuario());
            stmt.setString(3, voluntario.getSenha());
            stmt.setInt(4, voluntario.getAcessoSigilo() != null && voluntario.getAcessoSigilo() ? 1 : 0);
            stmt.setInt(5, voluntario.isDisponivel() ? 1 : 0);

            if (voluntario.getContaId() != null) {
                stmt.setInt(6, voluntario.getContaId());
            } else {
                stmt.setNull(6, java.sql.Types.INTEGER);
            }
            stmt.setString(7, voluntario.getStatusAprovacao());
            stmt.setString(8, voluntario.getMotivoVoluntariado());
            stmt.setString(9, voluntario.getCodigoIndicacao());
            stmt.setInt(10, voluntario.getPontosIndicacao() != null ? voluntario.getPontosIndicacao() : 0);

            if (voluntario.getIdVoluntarioIndicador() != null) {
                stmt.setInt(11, voluntario.getIdVoluntarioIndicador());
            } else {
                stmt.setNull(11, java.sql.Types.INTEGER);
            }

            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    voluntario.setId(rs.getInt(1));
                } else {
                    throw new SQLException("Nenhuma chave gerada apos insert de voluntario");
                }
            }
        }

        inserirEspecialidade(conn, voluntario);
    }

    public Voluntario buscarPorId(int id) {
        String sql = "SELECT " + COLUNAS_VOLUNTARIO + " " +
                "FROM VOLUNTARIO WHERE ID = ?";

        Voluntario voluntario = null;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    voluntario = mapearVoluntario(rs);
                    carregarEspecialidadesLista(java.util.Collections.singletonList(voluntario));
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar voluntario: " + e.getMessage(), e);
        }

        return voluntario;
    }

    public Voluntario buscarPorContaId(int contaId) {
        String sql = "SELECT " + COLUNAS_VOLUNTARIO + " " +
                "FROM VOLUNTARIO WHERE ID_CONTA = ?";

        Voluntario voluntario = null;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, contaId);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    voluntario = mapearVoluntario(rs);
                    carregarEspecialidadesLista(java.util.Collections.singletonList(voluntario));
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar voluntario por conta: " + e.getMessage(), e);
        }

        return voluntario;
    }

    public Voluntario buscarPorCodigoIndicacao(String codigo) {
        String sql = "SELECT " + COLUNAS_VOLUNTARIO + " " +
                "FROM VOLUNTARIO WHERE CODIGO_INDICACAO = ?";

        Voluntario voluntario = null;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, codigo);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    voluntario = mapearVoluntario(rs);
                    carregarEspecialidadesLista(java.util.Collections.singletonList(voluntario));
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar voluntario por codigo indicacao: " + e.getMessage(), e);
        }

        return voluntario;
    }

    public List<Voluntario> buscarTodos() {
        String sql = "SELECT " + COLUNAS_VOLUNTARIO + " FROM VOLUNTARIO";

        List<Voluntario> voluntarios = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                Voluntario voluntario = mapearVoluntario(rs);
                    carregarEspecialidadesLista(java.util.Collections.singletonList(voluntario));
                voluntarios.add(voluntario);
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar voluntarios: " + e.getMessage(), e);
        }

        return voluntarios;
    }

    public List<Voluntario> buscarAtivos() {
        String sql = "SELECT " + COLUNAS_VOLUNTARIO + " FROM VOLUNTARIO " +
                "WHERE DISPONIVEL = 1 AND STATUS_APROVACAO = 'APROVADO' ORDER BY NOME";

        List<Voluntario> voluntarios = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                Voluntario voluntario = mapearVoluntario(rs);
                    carregarEspecialidadesLista(java.util.Collections.singletonList(voluntario));
                voluntarios.add(voluntario);
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar voluntarios ativos: " + e.getMessage(), e);
        }

        return voluntarios;
    }

    public List<Voluntario> buscarTopRanking(int limite) {
        String sql = "SELECT " + COLUNAS_VOLUNTARIO + " FROM VOLUNTARIO " +
                "WHERE PONTOS_INDICACAO > 0 " +
                "ORDER BY PONTOS_INDICACAO DESC " +
                "FETCH FIRST ? ROWS ONLY";

        List<Voluntario> voluntarios = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, limite);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Voluntario voluntario = mapearVoluntario(rs);
                    carregarEspecialidadesLista(java.util.Collections.singletonList(voluntario));
                    voluntarios.add(voluntario);
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar top ranking: " + e.getMessage(), e);
        }

        return voluntarios;
    }

    public void atualizar(Voluntario voluntario) {
        String sql = "UPDATE VOLUNTARIO SET NOME = ?, USUARIO = ?, SENHA = ?, " +
                "ACESSO_SIGILO = ?, DISPONIVEL = ?, ID_CONTA = ?, STATUS_APROVACAO = ?, MOTIVO_VOLUNTARIADO = ?, CODIGO_INDICACAO = ?, PONTOS_INDICACAO = ?, ID_VOLUNTARIO_INDICADOR = ? " +
                "WHERE ID = ?";

        Connection conn = null;

        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false);

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, voluntario.getNome());
                stmt.setString(2, voluntario.getUsuario());
                stmt.setString(3, voluntario.getSenha());
                stmt.setInt(4, voluntario.getAcessoSigilo() != null && voluntario.getAcessoSigilo() ? 1 : 0);
                stmt.setInt(5, voluntario.isDisponivel() ? 1 : 0);

                if (voluntario.getContaId() != null) {
                    stmt.setInt(6, voluntario.getContaId());
                } else {
                    stmt.setNull(6, java.sql.Types.INTEGER);
                }

                stmt.setString(7, voluntario.getStatusAprovacao());
                stmt.setString(8, voluntario.getMotivoVoluntariado());
                stmt.setString(9, voluntario.getCodigoIndicacao());
                stmt.setInt(10, voluntario.getPontosIndicacao() != null ? voluntario.getPontosIndicacao() : 0);

                if (voluntario.getIdVoluntarioIndicador() != null) {
                    stmt.setInt(11, voluntario.getIdVoluntarioIndicador());
                } else {
                    stmt.setNull(11, java.sql.Types.INTEGER);
                }

                stmt.setInt(12, voluntario.getId());
                stmt.executeUpdate();
            }

            excluirEspecialidades(conn, voluntario.getId());
            inserirEspecialidade(conn, voluntario);
            conn.commit();

        } catch (SQLException e) {
            rollback(conn);
            throw new DatabaseException("Erro ao atualizar voluntario: " + e.getMessage(), e);
        } finally {
            fechar(conn);
        }
    }

    public void aprovar(int voluntarioId) {
        String sql = "UPDATE VOLUNTARIO SET STATUS_APROVACAO = 'APROVADO', DISPONIVEL = 1 WHERE ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, voluntarioId);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao aprovar voluntario: " + e.getMessage(), e);
        }
    }

    public List<Voluntario> buscarPendentes() {
        String sql = "SELECT " + COLUNAS_VOLUNTARIO + " FROM VOLUNTARIO " +
                "WHERE STATUS_APROVACAO = 'PENDENTE' ORDER BY ID DESC";
        List<Voluntario> voluntarios = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                Voluntario voluntario = mapearVoluntario(rs);
                    carregarEspecialidadesLista(java.util.Collections.singletonList(voluntario));
                voluntarios.add(voluntario);
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar voluntarios pendentes: " + e.getMessage(), e);
        }

        return voluntarios;
    }

    public void excluir(int id) {
        String sql = "DELETE FROM VOLUNTARIO WHERE ID = ?";

        Connection conn = null;

        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false);

            excluirEspecialidades(conn, id);

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setInt(1, id);
                stmt.executeUpdate();
            }

            conn.commit();

        } catch (SQLException e) {
            rollback(conn);
            throw new DatabaseException("Erro ao excluir voluntario: " + e.getMessage(), e);
        } finally {
            fechar(conn);
        }
    }

    private Voluntario mapearVoluntario(ResultSet rs) throws SQLException {
        Voluntario voluntario = new Voluntario();

        voluntario.setId(rs.getInt("ID"));
        voluntario.setNome(rs.getString("NOME"));
        voluntario.setUsuario(rs.getString("USUARIO"));
        voluntario.setSenha(rs.getString("SENHA"));
        voluntario.setAcessoSigilo(rs.getBoolean("ACESSO_SIGILO"));
        voluntario.setDisponivel(rs.getBoolean("DISPONIVEL"));

        int contaId = rs.getInt("ID_CONTA");
        if (!rs.wasNull()) {
            voluntario.setContaId(contaId);
        }
        voluntario.setStatusAprovacao(rs.getString("STATUS_APROVACAO"));
        voluntario.setMotivoVoluntariado(rs.getString("MOTIVO_VOLUNTARIADO"));

        voluntario.setCodigoIndicacao(rs.getString("CODIGO_INDICACAO"));
        voluntario.setPontosIndicacao(rs.getInt("PONTOS_INDICACAO"));
        int indicadorId = rs.getInt("ID_VOLUNTARIO_INDICADOR");
        if (!rs.wasNull()) {
            voluntario.setIdVoluntarioIndicador(indicadorId);
        }

        return voluntario;
    }

    private void carregarEspecialidadesLista(List<Voluntario> voluntarios) throws SQLException {
        if (voluntarios == null || voluntarios.isEmpty()) return;
        
        StringBuilder placeholders = new StringBuilder();
        for (int i = 0; i < voluntarios.size(); i++) {
            placeholders.append("?");
            if (i < voluntarios.size() - 1) placeholders.append(",");
        }
        
        String sql = "SELECT VE.VOLUNTARIO_ID, E.ID AS ESP_ID, E.NOME, E.DESCRICAO " +
                     "FROM VOLUNTARIO_ESPECIALIDADE VE " +
                     "JOIN ESPECIALIDADE E ON VE.ESPECIALIDADE_ID = E.ID " +
                     "WHERE VE.VOLUNTARIO_ID IN (" + placeholders + ")";
                     
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
             
            for (int i = 0; i < voluntarios.size(); i++) {
                stmt.setInt(i + 1, voluntarios.get(i).getId());
            }
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    int volId = rs.getInt("VOLUNTARIO_ID");
                    for (Voluntario v : voluntarios) {
                        if (v.getId() == volId) {
                            Especialidade esp = new Especialidade();
                            esp.setId(rs.getInt("ESP_ID"));
                            esp.setNome(rs.getString("NOME"));
                            esp.setDescricao(rs.getString("DESCRICAO"));
                            
                            if (v.getEspecialidades() == null) {
                                v.setEspecialidades(new ArrayList<>());
                            }
                            v.getEspecialidades().add(esp);
                            break;
                        }
                    }
                }
            }
        }
    }

    private void inserirEspecialidade(Connection conn, Voluntario voluntario) throws SQLException {
        List<Especialidade> especialidades = voluntario.getEspecialidades();
        if ((especialidades == null || especialidades.isEmpty()) && voluntario.getEspecialidade() != null) {
            especialidades = List.of(voluntario.getEspecialidade());
        }
        if (especialidades == null || especialidades.isEmpty()) {
            return;
        }

        String sql = "INSERT INTO VOLUNTARIO_ESPECIALIDADE (VOLUNTARIO_ID, ESPECIALIDADE_ID) VALUES (?, ?)";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            for (Especialidade especialidade : especialidades) {
                if (especialidade == null || especialidade.getId() <= 0) {
                    continue;
                }
                stmt.setInt(1, voluntario.getId());
                stmt.setInt(2, especialidade.getId());
                stmt.addBatch();
            }
            stmt.executeBatch();
        }
    }

    private void excluirEspecialidades(Connection conn, int voluntarioId) throws SQLException {
        String sql = "DELETE FROM VOLUNTARIO_ESPECIALIDADE WHERE VOLUNTARIO_ID = ?";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, voluntarioId);
            stmt.executeUpdate();
        }
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
