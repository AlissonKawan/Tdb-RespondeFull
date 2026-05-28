package br.com.tdbresponde.config;

import br.com.tdbresponde.security.SenhaHasher;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.Optional;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

@ApplicationScoped
public class AdminSeed {

    private static final Logger LOG = Logger.getLogger(AdminSeed.class);

    @Inject
    DataSource dataSource;

    @ConfigProperty(name = "admin.seed.enabled", defaultValue = "false")
    boolean enabled;

    @ConfigProperty(name = "admin.seed.email", defaultValue = "admin@tdbresponde.com")
    String email;

    @ConfigProperty(name = "admin.seed.password")
    Optional<String> password;

    @ConfigProperty(name = "admin.seed.name", defaultValue = "Administrador")
    String name;

    @Transactional
    void onStart(@Observes StartupEvent event) {
        if (!enabled) {
            LOG.info("AdminSeed desativado");
            return;
        }

        String normalizedEmail = email.trim().toLowerCase();
        if (password.isEmpty() || password.get().isBlank()) {
            LOG.error("AdminSeed ativado, mas admin.seed.password/ADMIN_SEED_PASSWORD nao foi informado");
            return;
        }
        String senhaHash = SenhaHasher.gerarHash(password.get());
        LOG.infof("AdminSeed executando para o e-mail %s", normalizedEmail);

        try (Connection conn = dataSource.getConnection()) {
            Integer idConta = buscarAdmin(conn, normalizedEmail);

            if (idConta == null) {
                criarAdmin(conn, normalizedEmail, senhaHash);
                LOG.infof("AdminSeed criou/atualizou admin: %s", normalizedEmail);
                return;
            }

            atualizarAdmin(conn, idConta, normalizedEmail, senhaHash);
            LOG.infof("AdminSeed criou/atualizou admin: %s", normalizedEmail);
        } catch (SQLException e) {
            LOG.errorf(e, "Falha ao criar/atualizar admin inicial para o e-mail %s", normalizedEmail);
        }
    }

    private Integer buscarAdmin(Connection conn, String normalizedEmail) throws SQLException {
        String sql = "SELECT ID_CONTA FROM T_CONTA_USUARIO WHERE LOWER(EMAIL) = LOWER(?)";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, normalizedEmail);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("ID_CONTA");
                }
            }
        }

        return null;
    }

    private void criarAdmin(Connection conn, String normalizedEmail, String senhaHash) throws SQLException {
        String sql = "INSERT INTO T_CONTA_USUARIO (NOME, EMAIL, SENHA_HASH, TIPO_USUARIO, ATIVO) " +
                "VALUES (?, ?, ?, 'ADMIN', 1)";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, name.trim());
            stmt.setString(2, normalizedEmail);
            stmt.setString(3, senhaHash);
            stmt.executeUpdate();
        }
    }

    private void atualizarAdmin(Connection conn, int idConta, String normalizedEmail, String senhaHash) throws SQLException {
        String sql = "UPDATE T_CONTA_USUARIO " +
                "SET NOME = ?, EMAIL = ?, SENHA_HASH = ?, TIPO_USUARIO = 'ADMIN', ATIVO = 1 " +
                "WHERE ID_CONTA = ?";

        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, name.trim());
            stmt.setString(2, normalizedEmail);
            stmt.setString(3, senhaHash);
            stmt.setInt(4, idConta);
            stmt.executeUpdate();
        }
    }
}
