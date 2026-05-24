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
}
