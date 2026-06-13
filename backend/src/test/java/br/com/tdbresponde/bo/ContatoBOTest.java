package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.MensagemContatoDAO;
import br.com.tdbresponde.dto.MensagemContatoRequest;
import br.com.tdbresponde.dto.PredictRequest;
import br.com.tdbresponde.dto.PredictResponse;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.model.MensagemContato;
import br.com.tdbresponde.service.ClassificadorService;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.InjectMock;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;

@QuarkusTest
public class ContatoBOTest {

    @Inject
    ContatoBO contatoBO;

    @InjectMock
    MensagemContatoDAO dao;

    @InjectMock
    @RestClient
    ClassificadorService classificadorService;

    @BeforeEach
    public void setup() {
        Mockito.doNothing().when(dao).inserir(any(MensagemContato.class));
    }

    @Test
    public void testRegistrarMensagemSucesso() {
        MensagemContatoRequest request = new MensagemContatoRequest();
        request.nome = "Joao Teste";
        request.email = "joao@teste.com";
        request.mensagem = "Quero ser voluntario";

        PredictResponse predictResponse = new PredictResponse();
        predictResponse.categoriaPrevista = "informativo";
        predictResponse.confianca = 0.99;
        
        Mockito.when(classificadorService.classificar(any(PredictRequest.class))).thenReturn(predictResponse);

        MensagemContato resultado = contatoBO.registrarMensagem(request);

        assertNotNull(resultado);
        assertEquals("Joao Teste", resultado.getNome());
        assertEquals("joao@teste.com", resultado.getEmail());
        assertEquals("Quero ser voluntario", resultado.getMensagem());
        assertEquals("informativo", resultado.getClassificacaoIA());
        assertFalse(resultado.isLida());
        
        Mockito.verify(dao, Mockito.times(1)).inserir(any(MensagemContato.class));
        Mockito.verify(classificadorService, Mockito.times(1)).classificar(any(PredictRequest.class));
    }

    @Test
    public void testRegistrarMensagemFalhaNaIA() {
        MensagemContatoRequest request = new MensagemContatoRequest();
        request.nome = "Maria Teste";
        request.email = "maria@teste.com";
        request.mensagem = "O site esta fora do ar!";

        Mockito.when(classificadorService.classificar(any(PredictRequest.class))).thenThrow(new RuntimeException("API indisponivel"));

        MensagemContato resultado = contatoBO.registrarMensagem(request);

        assertNotNull(resultado);
        assertEquals("Maria Teste", resultado.getNome());
        assertEquals("informativo", resultado.getClassificacaoIA()); // fallback default
        
        Mockito.verify(dao, Mockito.times(1)).inserir(any(MensagemContato.class));
    }

    @Test
    public void testRegistrarMensagemValidacaoFalha() {
        MensagemContatoRequest request = new MensagemContatoRequest();
        request.nome = ""; // invalido
        request.email = "maria@teste.com";
        request.mensagem = "O site esta fora do ar!";

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            contatoBO.registrarMensagem(request);
        });

        assertEquals("Nome, email e mensagem sao obrigatorios.", exception.getMessage());
    }
}
