package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.AtendimentoBO;
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.Voluntario;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class AtendimentoResourceTest {

    private AtendimentoResource resource;
    private AtendimentoBO bo;

    @BeforeEach
    void setUp() {
        bo = mock(AtendimentoBO.class);
        resource = new AtendimentoResource();
        resource.bo = bo;
        resource.access = new br.com.tdbresponde.security.AtendimentoAccess(bo,
                mock(br.com.tdbresponde.bo.ContaUsuarioBO.class), mock(br.com.tdbresponde.dao.PessoaAtendidaDAO.class));
        resource.identity = new br.com.tdbresponde.security.TestIdentity(1, "ADMIN");
    }

    @Test
    void deveListarAtendimentosPorVoluntarioComSucesso() {
        // Arrange
        int voluntarioId = 10;
        Voluntario voluntario = new Voluntario();
        voluntario.setId(voluntarioId);
        
        Atendimento a1 = new Atendimento();
        a1.setId(1);
        a1.setVoluntario(voluntario);
        a1.setStatus("EM_ATENDIMENTO");
        a1.setUltimaMensagemDoBeneficiario(true);

        Atendimento a2 = new Atendimento();
        a2.setId(2);
        a2.setVoluntario(voluntario);
        a2.setStatus("ENCERRADO");

        when(bo.listarPorVoluntario(voluntarioId)).thenReturn(List.of(a1, a2));

        // Act
        Response response = resource.listarPorVoluntario(voluntarioId);

        // Assert
        assertEquals(200, response.getStatus());
        List<?> list = (List<?>) response.getEntity();
        assertEquals(2, list.size());
        assertEquals(true, ((br.com.tdbresponde.dto.AtendimentoResponse) list.get(0)).ultimaMensagemDoBeneficiario);
        
        verify(bo, times(1)).listarPorVoluntario(voluntarioId);
    }
    
    @Test
    void deveListarAtendimentosVazioSeVoluntarioNaoTiverCasos() {
        // Arrange
        int voluntarioId = 99;
        when(bo.listarPorVoluntario(voluntarioId)).thenReturn(List.of());

        // Act
        Response response = resource.listarPorVoluntario(voluntarioId);

        // Assert
        assertEquals(200, response.getStatus());
        List<?> list = (List<?>) response.getEntity();
        assertEquals(0, list.size());
        
        verify(bo, times(1)).listarPorVoluntario(voluntarioId);
    }

    @Test
    void deveCarregarAtendimentoPorIdComSucesso() {
        // Arrange
        int atendimentoId = 49;
        Atendimento atendimentoMock = new Atendimento();
        atendimentoMock.setId(atendimentoId);
        atendimentoMock.setStatus("ABERTO");
        atendimentoMock.setPrioridade(1);

        when(bo.buscarPorId(atendimentoId)).thenReturn(atendimentoMock);

        // Act
        Response response = resource.buscarPorId(atendimentoId);

        // Assert
        assertEquals(200, response.getStatus());
        br.com.tdbresponde.dto.AtendimentoResponse responseDto = (br.com.tdbresponde.dto.AtendimentoResponse) response.getEntity();
        assertEquals(atendimentoId, responseDto.id);
        assertEquals("ABERTO", responseDto.status);

        verify(bo, times(1)).buscarPorId(atendimentoId);
    }

    @Test
    void checkinManualRetornaStatusSemCamposDePrevisao() {
        var atendimento = new Atendimento(); atendimento.setId(49);
        atendimento.setStatusCheckin("CONFIRMADO");
        var request = new br.com.tdbresponde.dto.CheckinRequest(); request.statusCheckin = "CONFIRMADO";
        when(bo.atualizarCheckin(49, request)).thenReturn(atendimento);
        var response = resource.atualizarCheckin(49, request);
        assertEquals(200, response.getStatus());
        var dto = (br.com.tdbresponde.dto.AtendimentoResponse) response.getEntity();
        assertEquals("CONFIRMADO", dto.statusCheckin);
        var json = new com.fasterxml.jackson.databind.ObjectMapper().valueToTree(dto);
        org.junit.jupiter.api.Assertions.assertFalse(json.has("previsaoCheckin"));
        org.junit.jupiter.api.Assertions.assertFalse(json.has("confiancaCheckin"));
        org.junit.jupiter.api.Assertions.assertFalse(json.has("justificativaCheckin"));
        verify(bo).atualizarCheckin(49, request);
    }

    @Test
    void rotaDePrevisaoNaoEstaMaisPublicada() {
        for (var method : AtendimentoResource.class.getDeclaredMethods()) {
            var path = method.getAnnotation(jakarta.ws.rs.Path.class);
            if (path != null) org.junit.jupiter.api.Assertions.assertFalse(path.value().contains("previsao-ia"));
        }
    }
}
