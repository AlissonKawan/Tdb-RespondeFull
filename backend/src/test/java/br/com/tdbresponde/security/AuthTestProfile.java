package br.com.tdbresponde.security;

import io.quarkus.test.junit.QuarkusTestProfile;
import java.util.Map;

public class AuthTestProfile implements QuarkusTestProfile {
    @Override public Map<String, String> getConfigOverrides() {
        return Map.of("tdb.schema.init.enabled", "false", "admin.seed.enabled", "false",
                "quarkus.datasource.jdbc.url", "jdbc:oracle:thin:@127.0.0.1:1/isolated_test",
                "quarkus.datasource.username", "isolated_test", "quarkus.datasource.password", "not-a-secret",
                "quarkus.datasource.jdbc.min-size", "0", "quarkus.datasource.jdbc.initial-size", "0",
                "quarkus.datasource.devservices.enabled", "false");
    }
}
