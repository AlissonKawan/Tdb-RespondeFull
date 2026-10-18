package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.ProntuarioBO;
import br.com.tdbresponde.model.Prontuario;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.*;

class ProntuarioResourceTest {

    private ProntuarioResource resource;
    private ProntuarioBO bo;

    @BeforeEach
    void setUp() {
        bo = mock(ProntuarioBO.class);
        resource = new ProntuarioResource();
        resource.prontuarioBO = bo;
    }

    @Test
    void deveBuscarProntuariosPorAgendaEAtendimento() {
        Prontuario p = new Prontuario();
        p.setId(10);
        p.setAgendaId(50);
        p.setAtendimentoId(100);

        when(bo.buscarPorAgenda(50)).thenReturn(List.of(p));
        when(bo.buscarPorAtendimento(100)).thenReturn(List.of(p));

        Response rAgenda = resource.buscarPorAgenda(50);
        assertEquals(200, rAgenda.getStatus());
        assertEquals(1, ((List<?>) rAgenda.getEntity()).size());

        Response rAtendimento = resource.buscarPorAtendimento(100);
        assertEquals(200, rAtendimento.getStatus());
        assertEquals(1, ((List<?>) rAtendimento.getEntity()).size());

        verify(bo).buscarPorAgenda(50);
        verify(bo).buscarPorAtendimento(100);
    }

    @Test
    void deveRegistrarEvolucaoRetornandoStatus201() {
        Prontuario p = new Prontuario();
        p.setId(77);
        when(bo.registrarEvolucao(p)).thenReturn(p);

        Response response = resource.registrarEvolucao(p);

        assertEquals(201, response.getStatus());
        assertSame(p, response.getEntity());
        verify(bo).registrarEvolucao(p);
    }
}
