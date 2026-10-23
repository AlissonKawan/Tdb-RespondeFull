package br.com.tdbresponde.security;

import br.com.tdbresponde.bo.ContaUsuarioBO;
import br.com.tdbresponde.bo.AtendimentoBO;
import br.com.tdbresponde.bo.MensagemBO;
import br.com.tdbresponde.dao.PessoaAtendidaDAO;
import br.com.tdbresponde.dto.MensagemRequest;
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.Mensagem;
import br.com.tdbresponde.model.PessoaAtendidaBase;
import br.com.tdbresponde.model.Voluntario;
import br.com.tdbresponde.dao.ContaUsuarioDAO;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.TipoUsuario;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.TestProfile;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@QuarkusTest
@TestProfile(AuthTestProfile.class)
class AuthenticationHttpTest {
    @InjectMock ContaUsuarioBO bo;
    @InjectMock ContaUsuarioDAO dao;
    @InjectMock AtendimentoBO atendimentos;
    @InjectMock MensagemBO mensagens;
    @InjectMock PessoaAtendidaDAO pessoas;
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
    @Test void usernameUnavailableReturns503AndEmailLoginRemainsAvailable() {
        when(bo.login(any())).thenThrow(new br.com.tdbresponde.exception.PrivacidadeIndisponivelException());
        given().contentType("application/json").body("{\"email\":\"aurora\",\"senha\":\"teste123\"}")
                .post("/auth/login").then().statusCode(503).header("Cache-Control", "no-store")
                .body("erro", is("RECURSO_INDISPONIVEL"))
                .body("mensagem", is(new br.com.tdbresponde.exception.PrivacidadeIndisponivelException().getMessage()))
                .body("token", nullValue());
        doReturn(account).when(bo).login(any());
        login();
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

    @Test void beneficiarySessionsCannotReadEachOthersCasesOrMessages() {
        ContaUsuario other = new ContaUsuario(); other.setId(8); other.setAtivo(true);
        other.setTipoUsuario(TipoUsuario.BENEFICIARIO);
        when(dao.buscarPorId(8)).thenReturn(other);
        when(atendimentos.buscarPorId(1)).thenReturn(caseFor(1, 7));
        when(atendimentos.buscarPorId(2)).thenReturn(caseFor(2, 8));
        when(atendimentos.buscarParaAutorizacao(1)).thenReturn(caseFor(1, 7));
        when(atendimentos.buscarParaAutorizacao(2)).thenReturn(caseFor(2, 8));
        when(mensagens.listarPorAtendimento(1)).thenReturn(java.util.List.of());
        String first = login();
        when(bo.login(any())).thenReturn(other);
        String second = given().contentType("application/json").body("{\"email\":\"other@example.test\",\"senha\":\"teste123\"}")
                .post("/auth/login").then().statusCode(200).extract().path("token");
        given().auth().oauth2(first).accept("application/json").get("/atendimentos/1").then().statusCode(200);
        given().auth().oauth2(second).accept("application/json").get("/atendimentos/2").then().statusCode(200);
        given().auth().oauth2(first).accept("application/json").get("/atendimentos/2").then().statusCode(403);
        given().auth().oauth2(second).accept("application/json").get("/atendimentos/1").then().statusCode(403);
        for (String path : new String[]{"/atendimentos/2/mensagens", "/mensagens/atendimento/2", "/atendimentos/beneficiario/conta/8"}) {
            given().auth().oauth2(first).accept("application/json").get(path).then().statusCode(403);
        }
        verify(mensagens, never()).listarPorAtendimento(2);
    }

    @Test void paginatedMessagesKeepArrayContractAndObjectAuthorization() {
        when(atendimentos.buscarParaAutorizacao(1)).thenReturn(caseFor(1, 7));
        when(atendimentos.buscarParaAutorizacao(2)).thenReturn(caseFor(2, 8));
        var message = new Mensagem(); message.setId(80); message.setAtendimento(caseFor(1, 7));
        message.setConteudo("Historico autorizado");
        when(mensagens.listarPagina(any(Atendimento.class), eq(50), eq(81))).thenReturn(java.util.List.of(message));
        String token = login();
        given().auth().oauth2(token).accept("application/json")
                .get("/atendimentos/1/mensagens?limite=50&antesId=81").then()
                .statusCode(200).body("size()", is(1)).body("[0].id", is(80));
        given().auth().oauth2(token).accept("application/json")
                .get("/atendimentos/2/mensagens?limite=50&antesId=81").then().statusCode(403);
        verify(mensagens, times(1)).listarPagina(any(Atendimento.class), eq(50), eq(81));
    }

    @Test void messageSenderIsDerivedFromSessionAndForeignWritesAreDenied() {
        when(atendimentos.buscarPorId(1)).thenReturn(caseFor(1, 7));
        when(atendimentos.buscarPorId(2)).thenReturn(caseFor(2, 8));
        when(atendimentos.buscarParaAutorizacao(1)).thenReturn(caseFor(1, 7));
        when(atendimentos.buscarParaAutorizacao(2)).thenReturn(caseFor(2, 8));
        when(mensagens.inserir(any(), any(Atendimento.class))).thenAnswer(call -> {
            MensagemRequest request = call.getArgument(0);
            Mensagem message = new Mensagem(); message.setId(50); message.setAtendimento(caseFor(1, 7));
            message.setEnviadoPor(request.enviadoPor); return message;
        });
        String token = login();
        given().auth().oauth2(token).contentType("application/json")
                .body("{\"conteudo\":\"Teste\",\"enviadoPor\":\"ADMIN\"}")
                .post("/atendimentos/1/mensagens").then().statusCode(201).body("enviadoPor", is("BENEFICIARIO"));
        given().auth().oauth2(token).contentType("application/json")
                .body("{\"atendimentoId\":1,\"conteudo\":\"Teste\",\"enviadoPor\":\"ADMIN\"}")
                .post("/mensagens").then().statusCode(201).body("enviadoPor", is("BENEFICIARIO"));
        given().auth().oauth2(token).contentType("application/json").body("{\"conteudo\":\"Teste\"}")
                .post("/atendimentos/2/mensagens").then().statusCode(403);
        given().auth().oauth2(token).contentType("application/json").body("{\"idContaBeneficiario\":8}")
                .post("/atendimentos/relatar").then().statusCode(403);
        verify(atendimentos, never()).relatar(any());
        verify(mensagens, times(2)).inserir(any(), any(Atendimento.class));
    }

    private Atendimento caseFor(int id, int accountId) {
        Atendimento atendimento = new Atendimento(); atendimento.setId(id); atendimento.setStatus("EM_ATENDIMENTO");
        PessoaAtendidaBase pessoa = new PessoaAtendidaBase(); pessoa.setContaId(accountId); pessoa.setId(accountId);
        atendimento.setPessoaAtendida(pessoa);
        Voluntario voluntario = new Voluntario(); voluntario.setId(80); atendimento.setVoluntario(voluntario);
        return atendimento;
    }
}
