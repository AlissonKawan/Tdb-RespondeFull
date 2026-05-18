package br.com.tdbresponde.dao;

import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.CanalComunicacao;
import br.com.tdbresponde.model.CriancaAdolescente;
import br.com.tdbresponde.model.MulherApolonia;
import br.com.tdbresponde.model.PessoaAtendida;
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

    private static final String COLUNAS_ATENDIMENTO =
            "ID, PRIORIDADE, STATUS, DESCRICAO, DATA_ABERTURA, DATA_ENCERRAMENTO, " +
                    "PESSOA_ATENDIDA_ID, VOLUNTARIO_ID, CANAL_COMUNICACAO_ID";

    @Inject
    DataSource dataSource;

    @Inject
    CanalComunicacaoDAO canalDAO;

    @Inject
    VoluntarioDAO voluntarioDAO;

    @Inject
    PessoaAtendidaDAO pessoaAtendidaDAO;

    // CREATE
    public void inserir(Atendimento atendimento) {
        String sql = "INSERT INTO ATENDIMENTO " +
                "(PRIORIDADE, STATUS, DESCRICAO, DATA_ABERTURA, DATA_ENCERRAMENTO, " +
                "PESSOA_ATENDIDA_ID, VOLUNTARIO_ID, CANAL_COMUNICACAO_ID) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"ID"})) {

            stmt.setInt(1, atendimento.getPrioridade());
            stmt.setString(2, atendimento.getStatus());
            stmt.setString(3, atendimento.getDescricao());
            stmt.setObject(4, atendimento.getDataAbertura());
            stmt.setObject(5, atendimento.getDataEncerramento()); // pode ser null
            stmt.setInt(6, atendimento.getPessoaAtendida().getId());
            if (atendimento.getVoluntario() != null) {
                stmt.setInt(7, atendimento.getVoluntario().getId());
            } else {
                stmt.setNull(7, Types.INTEGER);
            }
            stmt.setInt(8, atendimento.getCanalOrigem().getId());

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
        String sql = "SELECT " + COLUNAS_ATENDIMENTO + " " +
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
        String sql = "SELECT " + COLUNAS_ATENDIMENTO + " FROM ATENDIMENTO";

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

    public void relatarSituacao(PessoaAtendida pessoa, String tipo, Atendimento atendimento) {
        Connection conn = null;

        try {
            conn = dataSource.getConnection();
            conn.setAutoCommit(false);

            int pessoaId = salvarPessoaRelato(conn, pessoa, tipo);
            pessoa.setId(pessoaId);

            atendimento.getPessoaAtendida().setId(pessoaId);
            inserirAtendimento(conn, atendimento);

            conn.commit();
        } catch (SQLException e) {
            rollback(conn);
            throw new DatabaseException("Erro ao relatar situacao: " + e.getMessage(), e);
        } finally {
            fechar(conn);
        }
    }

    public List<Atendimento> buscarSolicitados() {
        String sql = "SELECT " + COLUNAS_ATENDIMENTO + " " +
                "FROM ATENDIMENTO " +
                "WHERE VOLUNTARIO_ID IS NULL " +
                "OR UPPER(STATUS) = 'ABERTO' " +
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
        String sql = "SELECT " + COLUNAS_ATENDIMENTO + " " +
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

    public List<Atendimento> buscarPorBeneficiario(int beneficiarioId) {
        String sql = "SELECT " + COLUNAS_ATENDIMENTO + " " +
                "FROM ATENDIMENTO " +
                "WHERE PESSOA_ATENDIDA_ID = ? " +
                "ORDER BY DATA_ABERTURA DESC, ID DESC";

        List<Atendimento> lista = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, beneficiarioId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapearResultSet(rs));
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar atendimentos do beneficiario: " + e.getMessage(), e);
        }
        return lista;
    }

    public List<Atendimento> buscarPorContaBeneficiario(int contaId) {
        String sql = "SELECT A.ID AS ID, A.PRIORIDADE AS PRIORIDADE, A.STATUS AS STATUS, " +
                "A.DESCRICAO AS DESCRICAO, A.DATA_ABERTURA AS DATA_ABERTURA, " +
                "A.DATA_ENCERRAMENTO AS DATA_ENCERRAMENTO, " +
                "A.PESSOA_ATENDIDA_ID AS PESSOA_ATENDIDA_ID, " +
                "A.VOLUNTARIO_ID AS VOLUNTARIO_ID, " +
                "A.CANAL_COMUNICACAO_ID AS CANAL_COMUNICACAO_ID " +
                "FROM ATENDIMENTO A " +
                "JOIN PESSOA_ATENDIDA P ON P.ID = A.PESSOA_ATENDIDA_ID " +
                "WHERE P.ID_CONTA = ? " +
                "ORDER BY A.DATA_ABERTURA DESC, A.ID DESC";

        List<Atendimento> lista = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, contaId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapearResultSet(rs));
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar atendimentos da conta do beneficiario: " + e.getMessage(), e);
        }
        return lista;
    }

    public List<Atendimento> buscarEmAndamento() {
        return buscarPorStatus("EM_ATENDIMENTO");
    }

    public List<Atendimento> buscarEncerrados() {
        return buscarPorStatus("ENCERRADO", "ENCERRADA", "FINALIZADO", "FINALIZADA");
    }

    // UPDATE
    public void atualizar(Atendimento atendimento) {
        String sql = "UPDATE ATENDIMENTO SET " +
                "PRIORIDADE = ?, STATUS = ?, DESCRICAO = ?, DATA_ABERTURA = ?, DATA_ENCERRAMENTO = ?, " +
                "PESSOA_ATENDIDA_ID = ?, VOLUNTARIO_ID = ?, CANAL_COMUNICACAO_ID = ? " +
                "WHERE ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, atendimento.getPrioridade());
            stmt.setString(2, atendimento.getStatus());
            stmt.setString(3, atendimento.getDescricao());
            stmt.setObject(4, atendimento.getDataAbertura());
            stmt.setObject(5, atendimento.getDataEncerramento());
            stmt.setInt(6, atendimento.getPessoaAtendida().getId());
            if (atendimento.getVoluntario() != null) {
                stmt.setInt(7, atendimento.getVoluntario().getId());
            } else {
                stmt.setNull(7, Types.INTEGER);
            }
            stmt.setInt(8, atendimento.getCanalOrigem().getId());
            stmt.setInt(9, atendimento.getId());

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
        a.setDescricao(rs.getString("DESCRICAO"));
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
            PessoaAtendida pessoa = pessoaAtendidaDAO.buscarPorId(pessoaId);
            if (pessoa != null) {
                a.setPessoaAtendida(pessoa);
            } else {
                br.com.tdbresponde.model.PessoaAtendidaBase pessoaBase = new br.com.tdbresponde.model.PessoaAtendidaBase();
                pessoaBase.setId(pessoaId);
                a.setPessoaAtendida(pessoaBase);
            }
        }

        return a;
    }

    private int inserirPessoaAtendida(Connection conn, PessoaAtendida pessoa, String tipo) throws SQLException {
        String sql = "INSERT INTO PESSOA_ATENDIDA " +
                "(NOME_CODIFICADO, DATA_CADASTRO, TELEFONE, EMAIL, TIPO, ID_CONTA) " +
                "VALUES (?, SYSDATE, ?, ?, ?, ?)";

        try (PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"ID"})) {
            stmt.setString(1, pessoa.getNomeCodificado());
            stmt.setString(2, pessoa.getTelefone());
            stmt.setString(3, pessoa.getEmail());
            stmt.setString(4, tipo);
            if (pessoa.getContaId() != null) {
                stmt.setInt(5, pessoa.getContaId());
            } else {
                stmt.setNull(5, Types.INTEGER);
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

    private int salvarPessoaRelato(Connection conn, PessoaAtendida pessoa, String tipo) throws SQLException {
        Integer pessoaId = null;
        if (pessoa.getContaId() != null) {
            pessoaId = buscarPessoaIdPorConta(conn, pessoa.getContaId());
        }

        if (pessoaId != null) {
            atualizarPessoaAtendidaRelato(conn, pessoaId, pessoa, tipo);
        } else {
            pessoaId = inserirPessoaAtendida(conn, pessoa, tipo);
        }

        sincronizarDetalhePessoaRelato(conn, pessoaId, pessoa, tipo);
        return pessoaId;
    }

    private Integer buscarPessoaIdPorConta(Connection conn, int contaId) throws SQLException {
        String sql = "SELECT ID FROM PESSOA_ATENDIDA WHERE ID_CONTA = ?";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, contaId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("ID");
                }
            }
        }

        return null;
    }

    private void atualizarPessoaAtendidaRelato(Connection conn, int pessoaId, PessoaAtendida pessoa, String tipo) throws SQLException {
        String sql = "UPDATE PESSOA_ATENDIDA " +
                "SET NOME_CODIFICADO = ?, TELEFONE = ?, EMAIL = ?, TIPO = ? " +
                "WHERE ID = ?";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, pessoa.getNomeCodificado());
            stmt.setString(2, pessoa.getTelefone());
            stmt.setString(3, pessoa.getEmail());
            stmt.setString(4, tipo);
            stmt.setInt(5, pessoaId);
            stmt.executeUpdate();
        }
    }

    private void sincronizarDetalhePessoaRelato(Connection conn, int pessoaId, PessoaAtendida pessoa, String tipo) throws SQLException {
        if ("CRIANCA_ADOLESCENTE".equals(tipo) && pessoa instanceof CriancaAdolescente crianca) {
            excluirDetalheMulher(conn, pessoaId);
            if (existeDetalheCrianca(conn, pessoaId)) {
                atualizarCriancaAdolescente(conn, pessoaId, crianca);
            } else {
                inserirCriancaAdolescente(conn, pessoaId, crianca);
            }
            return;
        }

        if ("MULHER_APOLONIA".equals(tipo) && pessoa instanceof MulherApolonia mulher) {
            excluirDetalheCrianca(conn, pessoaId);
            if (existeDetalheMulher(conn, pessoaId)) {
                atualizarMulherApolonia(conn, pessoaId, mulher);
            } else {
                inserirMulherApolonia(conn, pessoaId, mulher);
            }
            return;
        }

        excluirDetalheCrianca(conn, pessoaId);
        excluirDetalheMulher(conn, pessoaId);
    }

    private boolean existeDetalheCrianca(Connection conn, int pessoaId) throws SQLException {
        return existeRegistro(conn, "SELECT 1 FROM CRIANCA_ADOLESCENTE WHERE PESSOA_ID = ?", pessoaId);
    }

    private boolean existeDetalheMulher(Connection conn, int pessoaId) throws SQLException {
        return existeRegistro(conn, "SELECT 1 FROM MULHER_APOLONIA WHERE PESSOA_ID = ?", pessoaId);
    }

    private boolean existeRegistro(Connection conn, String sql, int pessoaId) throws SQLException {
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, pessoaId);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    private void atualizarCriancaAdolescente(Connection conn, int pessoaId, CriancaAdolescente crianca) throws SQLException {
        String sql = "UPDATE CRIANCA_ADOLESCENTE " +
                "SET IDADE = ?, NOME_RESPONSAVEL = ?, ESCOLA = ?, GRAVIDADE_BUCAL = ? " +
                "WHERE PESSOA_ID = ?";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, crianca.getIdade());
            stmt.setString(2, crianca.getNomeResponsavel());
            stmt.setString(3, crianca.getEscola());
            stmt.setInt(4, crianca.getGravidadeBucal());
            stmt.setInt(5, pessoaId);
            stmt.executeUpdate();
        }
    }

    private void atualizarMulherApolonia(Connection conn, int pessoaId, MulherApolonia mulher) throws SQLException {
        String sql = "UPDATE MULHER_APOLONIA " +
                "SET CODINOME = ?, NIVEL_RISCO = ?, TEM_BOLETIM_OCORRENCIA = ?, NECESSITA_SIGILO_ABSOLUTO = ? " +
                "WHERE PESSOA_ID = ?";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, mulher.getCodinome());
            stmt.setInt(2, mulher.getNivelRisco());
            stmt.setInt(3, mulher.isTemBoletimOcorrencia() ? 1 : 0);
            stmt.setInt(4, mulher.isNecessitaSigiloAbsoluto() ? 1 : 0);
            stmt.setInt(5, pessoaId);
            stmt.executeUpdate();
        }
    }

    private void excluirDetalheCrianca(Connection conn, int pessoaId) throws SQLException {
        excluirDetalhePessoa(conn, "DELETE FROM CRIANCA_ADOLESCENTE WHERE PESSOA_ID = ?", pessoaId);
    }

    private void excluirDetalheMulher(Connection conn, int pessoaId) throws SQLException {
        excluirDetalhePessoa(conn, "DELETE FROM MULHER_APOLONIA WHERE PESSOA_ID = ?", pessoaId);
    }

    private void excluirDetalhePessoa(Connection conn, String sql, int pessoaId) throws SQLException {
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, pessoaId);
            stmt.executeUpdate();
        }
    }

    private void inserirCriancaAdolescente(Connection conn, int pessoaId, CriancaAdolescente crianca) throws SQLException {
        String sql = "INSERT INTO CRIANCA_ADOLESCENTE " +
                "(PESSOA_ID, IDADE, NOME_RESPONSAVEL, ESCOLA, GRAVIDADE_BUCAL) " +
                "VALUES (?, ?, ?, ?, ?)";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, pessoaId);
            stmt.setInt(2, crianca.getIdade());
            stmt.setString(3, crianca.getNomeResponsavel());
            stmt.setString(4, crianca.getEscola());
            stmt.setInt(5, crianca.getGravidadeBucal());
            stmt.executeUpdate();
        }
    }

    private void inserirMulherApolonia(Connection conn, int pessoaId, MulherApolonia mulher) throws SQLException {
        String sql = "INSERT INTO MULHER_APOLONIA " +
                "(PESSOA_ID, CODINOME, NIVEL_RISCO, TEM_BOLETIM_OCORRENCIA, NECESSITA_SIGILO_ABSOLUTO) " +
                "VALUES (?, ?, ?, ?, ?)";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, pessoaId);
            stmt.setString(2, mulher.getCodinome());
            stmt.setInt(3, mulher.getNivelRisco());
            stmt.setInt(4, mulher.isTemBoletimOcorrencia() ? 1 : 0);
            stmt.setInt(5, mulher.isNecessitaSigiloAbsoluto() ? 1 : 0);
            stmt.executeUpdate();
        }
    }

    private void inserirAtendimento(Connection conn, Atendimento atendimento) throws SQLException {
        String sql = "INSERT INTO ATENDIMENTO " +
                "(PESSOA_ATENDIDA_ID, VOLUNTARIO_ID, CANAL_COMUNICACAO_ID, PRIORIDADE, STATUS, DATA_ABERTURA, DESCRICAO) " +
                "VALUES (?, NULL, ?, ?, 'ABERTO', SYSDATE, ?)";

        try (PreparedStatement stmt = conn.prepareStatement(sql, new String[]{"ID"})) {
            stmt.setInt(1, atendimento.getPessoaAtendida().getId());
            stmt.setInt(2, atendimento.getCanalOrigem().getId());
            stmt.setInt(3, atendimento.getPrioridade());
            stmt.setString(4, atendimento.getDescricao());
            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    atendimento.setId(rs.getInt(1));
                    return;
                }
            }
        }

        throw new SQLException("Nenhuma chave gerada apos insert de atendimento");
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

    private List<Atendimento> buscarPorStatus(String... status) {
        String placeholders = String.join(", ", java.util.Collections.nCopies(status.length, "?"));
        String sql = "SELECT " + COLUNAS_ATENDIMENTO + " FROM ATENDIMENTO " +
                "WHERE UPPER(STATUS) IN (" + placeholders + ") " +
                "ORDER BY DATA_ABERTURA DESC, ID DESC";

        List<Atendimento> lista = new ArrayList<>();

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            for (int i = 0; i < status.length; i++) {
                stmt.setString(i + 1, status[i]);
            }

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    lista.add(mapearResultSet(rs));
                }
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar atendimentos por status: " + e.getMessage(), e);
        }
        return lista;
    }
}
