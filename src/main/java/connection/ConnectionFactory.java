package connection;

import org.eclipse.microprofile.config.ConfigProvider;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class ConnectionFactory {

    public static Connection getConnection() {
        try {
            return DriverManager.getConnection(getUrl(), getUsername(), getPassword());
        } catch (SQLException e) {
            throw new RuntimeException("Erro ao conectar: " + e.getMessage());
        }
    }

    private static String getUrl() {
        return ConfigProvider.getConfig()
                .getValue("quarkus.datasource.jdbc.url", String.class);
    }

    private static String getUsername() {
        return ConfigProvider.getConfig()
                .getOptionalValue("quarkus.datasource.username", String.class)
                .filter(value -> !value.isBlank())
                .orElseThrow(() -> new IllegalStateException("Configure DB_USERNAME ou quarkus.datasource.username"));
    }

    private static String getPassword() {
        return ConfigProvider.getConfig()
                .getOptionalValue("quarkus.datasource.password", String.class)
                .filter(value -> !value.isBlank())
                .orElseThrow(() -> new IllegalStateException("Configure DB_PASSWORD ou quarkus.datasource.password"));
    }
}
