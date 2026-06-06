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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class AtendimentoDAO {

    private static final String SELECT_BASE = 
            "SELECT A.ID, A.PRIORIDADE, A.STATUS, A.DESCRICAO, A.DATA_ABERTURA, A.DATA_ENCERRAMENTO, " +
            "A.PESSOA_ATENDIDA_ID, A.VOLUNTARIO_ID, A.CANAL_COMUNICACAO_ID, A.STATUS_CHECKIN, A.HORARIO_ENVIO_CHECKIN, " +
            "C.ID AS CANAL_ID, C.NOME AS CANAL_NOME, C.DESCRICAO AS CANAL_DESC, " +
            "V.ID AS VOLUNTARIO_ID_REAL, V.NOME AS VOLUNTARIO_NOME, V.DISPONIVEL AS VOLUNTARIO_DISP, V.ACESSO_SIGILO AS VOLUNTARIO_SIGILO, " +
            "P.ID AS PESSOA_ID, P.NOME_CODIFICADO AS PESSOA_NOME, P.DATA_CADASTRO AS PESSOA_DATA, P.TELEFONE AS PESSOA_TEL, P.EMAIL AS PESSOA_EMAIL, P.TIPO AS PESSOA_TIPO, P.ID_CONTA AS PESSOA_CONTA " +
            "FROM ATENDIMENTO A " +
            "LEFT JOIN CANAL_COMUNICACAO C ON A.CANAL_COMUNICACAO_ID = C.ID " +
            "LEFT JOIN VOLUNTARIO V ON A.VOLUNTARIO_ID = V.ID " +
            "LEFT JOIN PESSOA_ATENDIDA P ON A.PESSOA_ATENDIDA_ID = P.ID ";

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
        String sql = SELECT_BASE + " WHERE A.ID = ?";

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
        String sql = SELECT_BASE;

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
        String sql = SELECT_BASE + " WHERE A.VOLUNTARIO_ID IS NULL OR UPPER(A.STATUS) = 'ABERTO' ORDER BY A.DATA_ABERTURA DESC, A.PRIORIDADE ASC";

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
        String sql = SELECT_BASE + " WHERE A.VOLUNTARIO_ID = ? ORDER BY A.DATA_ABERTURA DESC, A.ID DESC";

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
        String sql = SELECT_BASE + " WHERE A.PESSOA_ATENDIDA_ID = ? ORDER BY A.DATA_ABERTURA DESC, A.ID DESC";

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
        String sql = SELECT_BASE + " WHERE P.ID_CONTA = ? ORDER BY A.DATA_ABERTURA DESC, A.ID DESC";

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

    public void atualizarCheckin(int id, String statusCheckin, LocalDateTime horarioEnvioCheckin) {
        String sql = "UPDATE ATENDIMENTO SET STATUS_CHECKIN = ?, HORARIO_ENVIO_CHECKIN = ? WHERE ID = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, statusCheckin);
            stmt.setObject(2, horarioEnvioCheckin);
            stmt.setInt(3, id);

            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar checkin do atendimento: " + e.getMessage(), e);
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
        a.setStatusCheckin(rs.getString("STATUS_CHECKIN"));
        a.setHorarioEnvioCheckin(rs.getObject("HORARIO_ENVIO_CHECKIN", LocalDateTime.class));

        // Carrega canal pelo JOIN
        int canalId = rs.getInt("CANAL_COMUNICACAO_ID");
        if (!rs.wasNull()) {
            CanalComunicacao canal = new CanalComunicacao();
            canal.setId(canalId);
            try {
                canal.setNome(rs.getString("CANAL_NOME"));
                canal.setDescricao(rs.getString("CANAL_DESC"));
                a.setCanalOrigem(canal);
            } catch (SQLException e) {}
        }

        // Carrega voluntario pelo JOIN
        int volId = rs.getInt("VOLUNTARIO_ID");
        if (!rs.wasNull()) {
            Voluntario v = new Voluntario();
            v.setId(volId);
            try {
                v.setNome(rs.getString("VOLUNTARIO_NOME"));
                v.setDisponivel(rs.getBoolean("VOLUNTARIO_DISP"));
                v.setAcessoSigilo(rs.getBoolean("VOLUNTARIO_SIGILO"));
                a.setVoluntario(v);
            } catch (SQLException e) {}
        }

        // pessoa_atendida pelo JOIN
        int pessoaId = rs.getInt("PESSOA_ATENDIDA_ID");
        if (!rs.wasNull()) {
            br.com.tdbresponde.model.PessoaAtendidaBase pessoa = new br.com.tdbresponde.model.PessoaAtendidaBase();
            pessoa.setId(pessoaId);
            try {
                pessoa.setNomeCodificado(rs.getString("PESSOA_NOME"));
                pessoa.setData(rs.getObject("PESSOA_DATA", LocalDate.class));
                pessoa.setTelefone(rs.getString("PESSOA_TEL"));
                pessoa.setEmail(rs.getString("PESSOA_EMAIL"));
                pessoa.setContaId(rs.getInt("PESSOA_CONTA"));
                pessoa.setTipo(rs.getString("PESSOA_TIPO"));
                a.setPessoaAtendida(pessoa);
            } catch (SQLException e) {}
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
        String sql = SELECT_BASE + " WHERE UPPER(A.STATUS) IN (" + placeholders + ") ORDER BY A.DATA_ABERTURA DESC, A.ID DESC";

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
