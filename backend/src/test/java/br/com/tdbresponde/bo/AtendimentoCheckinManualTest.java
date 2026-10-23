package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.AtendimentoDAO;
import br.com.tdbresponde.dto.CheckinRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.model.Atendimento;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AtendimentoCheckinManualTest {
    @Test void gravaStatusSemConsultarMensagensOuServicosExternos() {
        var dao = mock(AtendimentoDAO.class);
        var bo = new AtendimentoBO(); bo.atendimentoDAO = dao;
        var a = new Atendimento(); a.setId(3); a.setStatusCheckin("NAO_ENVIADO");
        when(dao.buscarPorId(3)).thenReturn(a);
        var request = new CheckinRequest(); request.statusCheckin = "AGUARDANDO_RESPOSTA";
        assertSame(a, bo.atualizarCheckin(3, request));
        verify(dao).atualizarCheckin(eq(3), eq("AGUARDANDO_RESPOSTA"), any(LocalDateTime.class));
        verify(dao, times(2)).buscarPorId(3);
        verifyNoMoreInteractions(dao);
    }

    @Test void confirmacaoManualPreservaHorarioDoEnvio() {
        var dao = mock(AtendimentoDAO.class);
        var bo = new AtendimentoBO(); bo.atendimentoDAO = dao;
        var a = new Atendimento(); a.setId(3); a.setStatusCheckin("AGUARDANDO_RESPOSTA");
        var horario = LocalDateTime.of(2026, 1, 1, 10, 0); a.setHorarioEnvioCheckin(horario);
        when(dao.buscarPorId(3)).thenReturn(a);
        var request = new CheckinRequest(); request.statusCheckin = "CONFIRMADO";
        bo.atualizarCheckin(3, request);
        verify(dao).atualizarCheckin(3, "CONFIRMADO", horario);
    }

    @Test void rejeitaPayloadAusenteAntesDePersistir() {
        var dao = mock(AtendimentoDAO.class);
        var bo = new AtendimentoBO(); bo.atendimentoDAO = dao;
        assertThrows(BusinessException.class, () -> bo.atualizarCheckin(3, null));
        assertThrows(BusinessException.class, () -> bo.atualizarCheckin(3, new CheckinRequest()));
        verifyNoInteractions(dao);
    }
}
