package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.AgendaConsultaBO;
import br.com.tdbresponde.model.AgendaConsulta;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.*;

class AgendaConsultaResourceTest {

    private AgendaConsultaResource resource;
    private AgendaConsultaBO bo;

    @BeforeEach
    void setUp() {
        bo = mock(AgendaConsultaBO.class);
        resource = new AgendaConsultaResource();
        resource.agendaBO = bo;
        resource.access = mock(br.com.tdbresponde.security.AtendimentoAccess.class);
    }

    @Test
    void deveBuscarAgendasPorAtendimentoComStatus200() {
        AgendaConsulta a = new AgendaConsulta();
        a.setId(1);
        a.setAtendimentoId(100);

        when(bo.buscarPorAtendimento(100)).thenReturn(List.of(a));

        Response response = resource.buscarPorAtendimento(100);

        assertEquals(200, response.getStatus());
        List<?> lista = (List<?>) response.getEntity();
        assertEquals(1, lista.size());
        verify(bo).buscarPorAtendimento(100);
    }

    @Test
    void deveBuscarAgendaPorIdComStatus200() {
        AgendaConsulta a = new AgendaConsulta();
        a.setId(42);
        when(bo.buscarPorId(42)).thenReturn(a);

        Response response = resource.buscarPorId(42);

        assertEquals(200, response.getStatus());
        assertSame(a, response.getEntity());
        verify(bo).buscarPorId(42);
    }

    @Test
    void deveCriarAtualizarEExcluirAgendasCorretamente() {
        AgendaConsulta nova = new AgendaConsulta();
        nova.setId(5);
        when(bo.cadastrar(nova)).thenReturn(nova);
        when(bo.atualizar(5, nova)).thenReturn(nova);

        Response rCriar = resource.criar(nova);
        assertEquals(201, rCriar.getStatus());
        assertSame(nova, rCriar.getEntity());

        Response rAtualizar = resource.atualizar(5, nova);
        assertEquals(200, rAtualizar.getStatus());
        assertSame(nova, rAtualizar.getEntity());

        Response rExcluir = resource.excluir(5);
        assertEquals(204, rExcluir.getStatus());
        verify(bo).excluir(5);
    }
}
