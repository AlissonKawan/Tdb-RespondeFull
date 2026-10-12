package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.MensagemContatoDAO;
import br.com.tdbresponde.dto.MensagemContatoRequest;
import br.com.tdbresponde.exception.BusinessException;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ContatoBOTest {
    @Test
    void registrarMensagemSemClassificacaoExterna() {
        ContatoBO bo = new ContatoBO();
        bo.dao = mock(MensagemContatoDAO.class);
        MensagemContatoRequest request = new MensagemContatoRequest();
        request.nome = " Joao ";
        request.email = " joao@teste.com ";
        request.mensagem = " Quero ser voluntario ";
        var resultado = bo.registrarMensagem(request);
        assertEquals("Joao", resultado.getNome());
        assertEquals("joao@teste.com", resultado.getEmail());
        assertEquals("Quero ser voluntario", resultado.getMensagem());
        assertFalse(resultado.isLida());
        verify(bo.dao).inserir(resultado);
    }

    @Test
    void dadosInvalidosNaoPersistem() {
        ContatoBO bo = new ContatoBO();
        bo.dao = mock(MensagemContatoDAO.class);
        assertThrows(BusinessException.class, () -> bo.registrarMensagem(null));
        MensagemContatoRequest request = new MensagemContatoRequest();
        request.nome = " ";
        request.email = "maria@teste.com";
        request.mensagem = "Oi";
        assertThrows(BusinessException.class, () -> bo.registrarMensagem(request));
        verifyNoInteractions(bo.dao);
    }
}
