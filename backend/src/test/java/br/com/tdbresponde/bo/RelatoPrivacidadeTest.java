package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.AtendimentoDAO;
import br.com.tdbresponde.dto.RelatarSituacaoRequest;
import br.com.tdbresponde.model.MulherApolonia;
import br.com.tdbresponde.model.PessoaAtendida;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RelatoPrivacidadeTest {
    @Test void ausenciaDeContatoEBoletimNaoImpedeRelatoNemViraRespostaNegativa() {
        var bo = new AtendimentoBO(); bo.atendimentoDAO = mock(AtendimentoDAO.class);
        var request = new RelatarSituacaoRequest();
        request.tipo = "MULHER_APOLONIA"; request.idContaBeneficiario = 7;
        request.nomeCodificado = "Aurora"; request.codinome = "Aurora";
        request.nivelRisco = 3; request.prioridade = 3; request.descricao = "Preciso de acolhimento";
        bo.relatar(request);
        var pessoa = ArgumentCaptor.forClass(PessoaAtendida.class);
        verify(bo.atendimentoDAO).relatarSituacao(pessoa.capture(), eq("MULHER_APOLONIA"), any());
        var mulher = assertInstanceOf(MulherApolonia.class, pessoa.getValue());
        assertNull(mulher.getTemBoletimOcorrencia());
        assertNull(mulher.getTelefone()); assertNull(mulher.getEmail());
        assertEquals(7, mulher.getContaId());
        assertEquals("Aurora", mulher.getNomeCodificado());
        assertTrue(mulher.isNecessitaSigiloAbsoluto());
    }
}
