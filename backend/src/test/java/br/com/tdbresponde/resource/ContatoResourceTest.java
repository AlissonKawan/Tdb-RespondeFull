package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.ContatoBO;
import br.com.tdbresponde.dto.MensagemContatoRequest;
import br.com.tdbresponde.model.MensagemContato;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.InjectMock;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.mockito.ArgumentMatchers.any;

@QuarkusTest
public class ContatoResourceTest {

    @InjectMock
    ContatoBO contatoBO;

    @Test
    public void testRegistrarMensagemEndpoint() {
        MensagemContato mensagemSimulada = new MensagemContato();
        mensagemSimulada.setId(1);
        mensagemSimulada.setNome("Testador");
        mensagemSimulada.setEmail("teste@teste.com");
        mensagemSimulada.setMensagem("Olá");
        mensagemSimulada.setClassificacaoIA("informativo");

        Mockito.when(contatoBO.registrarMensagem(any(MensagemContatoRequest.class))).thenReturn(mensagemSimulada);

        MensagemContatoRequest request = new MensagemContatoRequest();
        request.nome = "Testador";
        request.email = "teste@teste.com";
        request.mensagem = "Olá";

        given()
          .contentType(ContentType.JSON)
          .body(request)
        .when().post("/contato")
        .then()
           .statusCode(201)
           .body("id", is(1))
           .body("nome", is("Testador"))
           .body("classificacaoIA", is("informativo"));
    }
}
