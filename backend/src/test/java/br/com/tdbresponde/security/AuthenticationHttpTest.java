package br.com.tdbresponde.security;

import br.com.tdbresponde.bo.ContaUsuarioBO;
import br.com.tdbresponde.dao.ContaUsuarioDAO;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.TipoUsuario;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@QuarkusTest
@TestProfile(AuthTestProfile.class)
class AuthenticationHttpTest {
    @InjectMock ContaUsuarioBO bo;
    @InjectMock ContaUsuarioDAO dao;
    ContaUsuario account;
    @BeforeEach void setup() {
        account = new ContaUsuario(); account.setId(7); account.setNome("Teste");
        account.setEmail("teste@example.test"); account.setTipoUsuario(TipoUsuario.BENEFICIARIO); account.setAtivo(true);
        when(bo.login(any())).thenReturn(account);
        when(bo.buscarPorId(7)).thenReturn(account);
        when(dao.buscarPorId(7)).thenReturn(account);
    }
    String login() {
        return given().contentType("application/json").body("{\"email\":\"teste@example.test\",\"senha\":\"teste123\"}")
                .post("/auth/login").then().statusCode(200).header("Cache-Control", "no-store")
                .body("user.id", is(7)).extract().path("token");
    }
    @Test void loginMeLogoutAndRevocation() {
        String token = login();
        given().auth().oauth2(token).get("/auth/me").then().statusCode(200).body("id", is(7));
        given().auth().oauth2(token).post("/auth/logout").then().statusCode(204);
        given().auth().oauth2(token).get("/auth/me").then().statusCode(401);
    }
    @Test void blocksAllPrivateResourcesWithoutSession() {
        for (String path : new String[]{"/auth/me", "/usuarios", "/atendimentos", "/voluntarios",
                "/agendas/setup", "/prontuarios/agenda/1", "/api/cronograma/tarefas/1", "/contato"}) {
            given().accept("application/json").get(path).then().statusCode(401);
        }
        given().auth().oauth2("x".repeat(43)).get("/usuarios").then().statusCode(401);
    }
    @Test void enforcesServerRoleAndAccountStatus() {
        String token = login();
        given().auth().oauth2(token).get("/usuarios").then().statusCode(403);
        given().auth().oauth2(token).get("/agendas/voluntario/1").then().statusCode(403);
        given().auth().oauth2(token).get("/atendimentos").then().statusCode(403);
        account.setTipoUsuario(TipoUsuario.ADMIN);
        when(bo.listar()).thenReturn(java.util.List.of(account));
        given().auth().oauth2(token).get("/usuarios").then().statusCode(200);
        account.setAtivo(false);
        given().auth().oauth2(token).get("/auth/me").then().statusCode(401);
    }
    @Test void badCredentialsNeverCreateSession() {
        when(bo.login(any())).thenThrow(new br.com.tdbresponde.exception.UnauthorizedException("Email ou senha invalidos."));
        given().contentType("application/json").body("{}").post("/auth/login").then().statusCode(401).body("token", nullValue());
    }
}
