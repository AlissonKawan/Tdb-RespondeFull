package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.VoluntarioDAO;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ContaUsuarioVinculoTest {
    @Test void autorizacaoConsultaSoOIdentificadorDoVoluntario() {
        var bo = new ContaUsuarioBO(); bo.voluntarioDAO = mock(VoluntarioDAO.class);
        when(bo.voluntarioDAO.buscarIdPorContaId(8)).thenReturn(80);
        assertEquals(80, bo.buscarVoluntarioIdDaConta(8));
        verify(bo.voluntarioDAO).buscarIdPorContaId(8);
        verify(bo.voluntarioDAO, never()).buscarPorContaId(anyInt());
    }
}
