package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.MensagemDAO;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.model.Atendimento;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MensagemPaginationTest {
    @Test void parametrosInvalidosNaoConsultamOBanco() {
        var bo = new MensagemBO(); bo.mensagemDAO = mock(MensagemDAO.class);
        var atendimento = new Atendimento(); atendimento.setId(42);
        for (int limite : new int[]{-1, 0, 101}) {
            assertThrows(BusinessException.class, () -> bo.listarPagina(atendimento, limite, null));
        }
        assertThrows(BusinessException.class, () -> bo.listarPagina(atendimento, 50, 0));
        assertThrows(BusinessException.class, () -> bo.listarPagina(atendimento, null, 81));
        assertThrows(BusinessException.class, () -> bo.listarPagina(null, 50, null));
        verifyNoInteractions(bo.mensagemDAO);
    }

    @Test void chamadaLegadaContinuaCompletaEPaginaReutilizaAtendimentoAutorizado() {
        var bo = new MensagemBO(); bo.mensagemDAO = mock(MensagemDAO.class);
        bo.atendimentoBO = mock(AtendimentoBO.class);
        var atendimento = new Atendimento(); atendimento.setId(42);
        bo.listarPagina(atendimento, null, null);
        verify(bo.mensagemDAO).buscarPorAtendimento(42);
        bo.listarPagina(atendimento, 50, 81);
        verify(bo.mensagemDAO).buscarPaginaPorAtendimento(42, 50, 81);
        verifyNoInteractions(bo.atendimentoBO);
    }
}
