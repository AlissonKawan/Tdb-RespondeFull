package br.com.tdbresponde.resource;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Map;

@Path("/health")
@Produces(MediaType.APPLICATION_JSON)
public class HealthResource {

    private static final Logger LOG = Logger.getLogger(HealthResource.class);

    @Inject
    DataSource dataSource;

    @GET
    @Path("/db")
    public Response database() {
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement("SELECT 1 FROM DUAL");
             ResultSet rs = stmt.executeQuery()) {

            if (rs.next() && rs.getInt(1) == 1) {
                return Response.ok(Map.of(
                        "status", "ok",
                        "database", "connected"
                )).build();
            }

            LOG.error("Healthcheck do banco nao retornou o valor esperado em SELECT 1 FROM DUAL");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of(
                            "status", "error",
                            "database", "unavailable",
                            "message", "Banco respondeu, mas a validacao falhou."
                    ))
                    .build();
        } catch (Exception e) {
            LOG.error("Falha no healthcheck do banco Oracle", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of(
                            "status", "error",
                            "database", "unavailable",
                            "message", "Nao foi possivel conectar ao banco Oracle. Verifique rede, DNS, usuario, senha e DB_URL."
                    ))
                    .build();
        }
    }
}
