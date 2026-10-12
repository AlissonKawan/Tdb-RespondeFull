package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.ContatoBO;
import br.com.tdbresponde.dto.MensagemContatoRequest;
import br.com.tdbresponde.model.MensagemContato;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ContatoResourceTest {
    @Test
    void registrarRetorna201SemCamposDoClassificador() {
        var resource = new ContatoResource();
        resource.bo = mock(ContatoBO.class);
        var request = new MensagemContatoRequest();
        var mensagem = new MensagemContato();
        mensagem.setId(1);
        mensagem.setNome("Testador");
        when(resource.bo.registrarMensagem(request)).thenReturn(mensagem);
        var resposta = resource.registrarMensagem(request);
        assertEquals(201, resposta.getStatus());
        var json = new ObjectMapper().findAndRegisterModules().valueToTree(resposta.getEntity());
        assertEquals(1, json.get("id").asInt());
        assertFalse(json.has("classificacaoIA"));
    }
}
