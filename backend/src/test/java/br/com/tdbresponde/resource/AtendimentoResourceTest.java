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
    void deveBuscarPrevisaoIAComSucesso() {
        // Arrange
        int atendimentoId = 49;
        br.com.tdbresponde.dto.CheckinPrevisaoResponse previsaoMock = new br.com.tdbresponde.dto.CheckinPrevisaoResponse();
        previsaoMock.previsaoCheckin = "CONFIRMADO";
        previsaoMock.confiancaCheckin = 0.95;

        when(bo.preverCheckinIA(atendimentoId)).thenReturn(previsaoMock);

        // Act
        Response response = resource.buscarPrevisaoIA(atendimentoId);

        // Assert
        assertEquals(200, response.getStatus());
        br.com.tdbresponde.dto.CheckinPrevisaoResponse responseDto = (br.com.tdbresponde.dto.CheckinPrevisaoResponse) response.getEntity();
        assertEquals("CONFIRMADO", responseDto.previsaoCheckin);
        assertEquals(0.95, responseDto.confiancaCheckin);

        verify(bo, times(1)).preverCheckinIA(atendimentoId);
    }
}
