package br.com.tdbresponde.dao;

import br.com.tdbresponde.exception.DatabaseException;
import br.com.tdbresponde.exception.ConflictException;
import br.com.tdbresponde.exception.PrivacidadeIndisponivelException;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.TipoUsuario;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.Locale;

@ApplicationScoped
public class ContaUsuarioDAO {

    @Inject
    DataSource dataSource;

    public void cadastrarConta(ContaUsuario conta) {
        try (Connection conn = dataSource.getConnection()) {
            cadastrarConta(conn, conta);
        } catch (SQLException e) {
            if (colunaPrivacidadeAusente(e) && possuiDadosPrivacidade(conta)) {
                throw new PrivacidadeIndisponivelException();
            }
            if (e.getErrorCode() == 1) {
                throw new ConflictException("Nome de usuário ou e-mail já cadastrado.");
            }
            throw new DatabaseException("Erro ao cadastrar conta: " + e.getMessage(), e);
        }
    }

    public void cadastrarConta(Connection conn, ContaUsuario conta) throws SQLException {
        boolean privacidade = possuiDadosPrivacidade(conta);
        String sql = privacidade ? "INSERT INTO T_CONTA_USUARIO " +
                "(NOME, EMAIL, SENHA_HASH, TIPO_USUARIO, ATIVO, USUARIO, TIPO_BENEFICIARIO, MODO_IDENTIFICACAO) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
                : "INSERT INTO T_CONTA_USUARIO (NOME, EMAIL, SENHA_HASH, TIPO_USUARIO, ATIVO) VALUES (?, ?, ?, ?, ?)";

        try (PreparedStatement stmt = conn.prepareStatement(sql, new String[] {"ID_CONTA"})) {

            stmt.setString(1, conta.getNome());
            stmt.setString(2, conta.getEmail());
            stmt.setString(3, conta.getSenhaHash());
            stmt.setString(4, conta.getTipoUsuario().name());
            stmt.setInt(5, conta.isAtivo() ? 1 : 0);
            if (privacidade) {
                stmt.setString(6, conta.getUsuario());
                stmt.setString(7, conta.getTipoBeneficiario());
                stmt.setString(8, conta.getModoIdentificacao());
            }
            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    conta.setId(rs.getInt(1));
                } else {
                    throw new SQLException("Nenhuma chave gerada apos insert de conta");
                }
            }
        }
    }

    private static final String COLUNAS_ANTERIORES =
            "ID_CONTA, NOME, EMAIL, SENHA_HASH, TIPO_USUARIO, ATIVO, DATA_CRIACAO";
    private static final String COLUNAS_PRIVACIDADE =
            COLUNAS_ANTERIORES + ", USUARIO, TIPO_BENEFICIARIO, MODO_IDENTIFICACAO";

    public ContaUsuario buscarPorEmail(String email) {
        try (Connection conn = dataSource.getConnection()) {
            var contas = consultarContas(conn, "WHERE LOWER(EMAIL) = LOWER(?)", email, false);
            return contas.isEmpty() ? null : contas.get(0);
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar conta por email: " + e.getMessage(), e);
        }
    }

    public ContaUsuario buscarPorUsuario(String usuario) {
        try (Connection conn = dataSource.getConnection()) {
            var contas = consultarContas(conn, "WHERE LOWER(USUARIO) = LOWER(?)", usuario, true);
            return contas.isEmpty() ? null : contas.get(0);
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar conta por usuario: " + e.getMessage(), e);
        }
    }

    public ContaUsuario buscarPorId(int id) {
        try (Connection conn = dataSource.getConnection()) {
            var contas = consultarContas(conn, "WHERE ID_CONTA = ?", id, false);
            return contas.isEmpty() ? null : contas.get(0);
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao buscar conta: " + e.getMessage(), e);
        }
    }

    public List<ContaUsuario> listar() {
        try (Connection conn = dataSource.getConnection()) {
            return consultarContas(conn, "ORDER BY ID_CONTA", null, false);
        } catch (SQLException e) {
            throw new DatabaseException("Erro ao listar contas: " + e.getMessage(), e);
        }
    }

    private List<ContaUsuario> consultarContas(Connection conn, String criterio, Object parametro,
                                               boolean exigePrivacidade) throws SQLException {
        try {
            return executarConsulta(conn, criterio, parametro, true, exigePrivacidade);
        } catch (SQLException e) {
            if (!colunaPrivacidadeAusente(e)) throw e;
            if (exigePrivacidade) throw new PrivacidadeIndisponivelException();
            // Recuperacao restrita a colunas opcionais ausentes, sem cache nem mudancas no banco.
            return executarConsulta(conn, criterio, parametro, false, false);
        }
    }

    private List<ContaUsuario> executarConsulta(Connection conn, String criterio, Object parametro,
                                               boolean novasColunas, boolean exigePrivacidade) throws SQLException {
        String colunas = novasColunas ? COLUNAS_PRIVACIDADE : COLUNAS_ANTERIORES;
        String sql = "SELECT " + colunas + " FROM T_CONTA_USUARIO " + criterio;
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            if (parametro instanceof Integer id) stmt.setInt(1, id);
            else if (parametro instanceof String texto) stmt.setString(1, texto);
            try (ResultSet rs = stmt.executeQuery()) {
                if (exigePrivacidade && !colunasPresentes(rs).containsAll(
                        Set.of("USUARIO", "TIPO_BENEFICIARIO", "MODO_IDENTIFICACAO"))) {
                    throw new PrivacidadeIndisponivelException();
                }
                List<ContaUsuario> contas = new ArrayList<>();
                while (rs.next()) contas.add(mapearConta(rs));
                return contas;
            }
        }
    }

    private boolean colunaPrivacidadeAusente(SQLException e) {
        if (e.getErrorCode() != 904 || e.getMessage() == null) return false;
        String mensagem = e.getMessage().toUpperCase(Locale.ROOT);
        return Set.of("USUARIO", "TIPO_BENEFICIARIO", "MODO_IDENTIFICACAO").stream()
                .anyMatch(coluna -> mensagem.contains("\"" + coluna + "\""));
    }

    public void atualizar(ContaUsuario conta) {
        String sql = "UPDATE T_CONTA_USUARIO SET NOME = ?, EMAIL = ?, TIPO_USUARIO = ?, ATIVO = ? " +
                "WHERE ID_CONTA = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, conta.getNome());
            stmt.setString(2, conta.getEmail());
            stmt.setString(3, conta.getTipoUsuario().name());
            stmt.setInt(4, conta.isAtivo() ? 1 : 0);
            stmt.setInt(5, conta.getId());
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao atualizar conta: " + e.getMessage(), e);
        }
    }

    public void desativar(int id) {
        String sql = "UPDATE T_CONTA_USUARIO SET ATIVO = 0 WHERE ID_CONTA = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao desativar conta: " + e.getMessage(), e);
        }
    }

    public void ativar(int id) {
        String sql = "UPDATE T_CONTA_USUARIO SET ATIVO = 1 WHERE ID_CONTA = ?";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, id);
            stmt.executeUpdate();

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao ativar conta: " + e.getMessage(), e);
        }
    }

    public boolean emailExiste(String email) {
        String sql = "SELECT 1 FROM T_CONTA_USUARIO WHERE LOWER(EMAIL) = LOWER(?)";

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }

        } catch (SQLException e) {
            throw new DatabaseException("Erro ao verificar email: " + e.getMessage(), e);
        }
    }

    private boolean possuiDadosPrivacidade(ContaUsuario conta) {
        return conta.getUsuario() != null || conta.getTipoBeneficiario() != null || conta.getModoIdentificacao() != null;
    }

    private Set<String> colunasPresentes(ResultSet rs) throws SQLException {
        var metadata = rs.getMetaData();
        Set<String> colunas = new HashSet<>();
        for (int i = 1; i <= metadata.getColumnCount(); i++) {
            colunas.add(metadata.getColumnLabel(i).toUpperCase(Locale.ROOT));
        }
        return colunas;
    }

    private ContaUsuario mapearConta(ResultSet rs) throws SQLException {
        // Os metadados pertencem à própria consulta: nenhuma leitura extra nem DDL.
        Set<String> colunas = colunasPresentes(rs);
        ContaUsuario conta = new ContaUsuario();
        conta.setId(rs.getInt("ID_CONTA"));
        conta.setNome(rs.getString("NOME"));
        if (colunas.contains("USUARIO")) conta.setUsuario(rs.getString("USUARIO"));
        if (colunas.contains("TIPO_BENEFICIARIO")) conta.setTipoBeneficiario(rs.getString("TIPO_BENEFICIARIO"));
        if (colunas.contains("MODO_IDENTIFICACAO")) conta.setModoIdentificacao(rs.getString("MODO_IDENTIFICACAO"));
        conta.setEmail(rs.getString("EMAIL"));
        conta.setSenhaHash(rs.getString("SENHA_HASH"));
        conta.setTipoUsuario(TipoUsuario.valueOf(rs.getString("TIPO_USUARIO")));
        conta.setAtivo(rs.getInt("ATIVO") == 1);

        Timestamp dataCriacao = rs.getTimestamp("DATA_CRIACAO");
        if (dataCriacao != null) {
            conta.setDataCriacao(dataCriacao.toLocalDateTime());
        }

        return conta;
    }
}
