package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.*;
import br.com.tdbresponde.dao.PessoaAtendidaDAO;
import br.com.tdbresponde.exception.ForbiddenException;
import br.com.tdbresponde.model.*;
import br.com.tdbresponde.security.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AtendimentoVinculosAuthorizationTest {
    AgendaConsultaResource agenda;
    ProntuarioResource prontuario;
    AgendaConsultaBO agendas;
    ProntuarioBO prontuarios;
    AgendaConsulta alheia;

    @BeforeEach void setup() {
        AtendimentoBO atendimentos = mock(AtendimentoBO.class);
        ContaUsuarioBO contas = mock(ContaUsuarioBO.class);
        when(contas.buscarVoluntarioIdDaConta(8)).thenReturn(80);
        when(atendimentos.buscarPorId(2)).thenReturn(AtendimentoAuthorizationTest.atendimento(2, 70, 800));
        var access = new AtendimentoAccess(atendimentos, contas, mock(PessoaAtendidaDAO.class));
        var identity = new TestIdentity(8, "VOLUNTARIO");
        agendas = mock(AgendaConsultaBO.class); prontuarios = mock(ProntuarioBO.class);
        alheia = new AgendaConsulta(); alheia.setId(20); alheia.setVoluntarioId(800); alheia.setAtendimentoId(2);
        when(agendas.buscarPorId(20)).thenReturn(alheia);
        agenda = new AgendaConsultaResource(); agenda.agendaBO = agendas; agenda.access = access; agenda.identity = identity;
        prontuario = new ProntuarioResource(); prontuario.prontuarioBO = prontuarios;
        prontuario.agendas = agendas; prontuario.access = access; prontuario.identity = identity;
    }

    @Test void agendaNaoPermiteLeituraOuEscritaDeOutroResponsavel() {
        assertThrows(ForbiddenException.class, () -> agenda.buscarPorId(20));
        assertThrows(ForbiddenException.class, () -> agenda.buscarPorAtendimento(2));
        assertThrows(ForbiddenException.class, () -> agenda.buscarPorVoluntario(800));
        assertThrows(ForbiddenException.class, () -> agenda.criar(alheia));
        assertThrows(ForbiddenException.class, () -> agenda.atualizar(20, alheia));
        assertThrows(ForbiddenException.class, () -> agenda.excluir(20));
        verify(agendas, never()).cadastrar(any());
        verify(agendas, never()).atualizar(anyInt(), any());
        verify(agendas, never()).excluir(anyInt());
    }

    @Test void prontuarioNaoPermiteLeituraOuRegistroEmCasoAlheio() {
        assertThrows(ForbiddenException.class, () -> prontuario.buscarPorAgenda(20));
        assertThrows(ForbiddenException.class, () -> prontuario.buscarPorAtendimento(2));
        var p = new Prontuario(); p.setVoluntarioId(80); p.setAtendimentoId(2);
        assertThrows(ForbiddenException.class, () -> prontuario.registrarEvolucao(p));
        verifyNoInteractions(prontuarios);
    }

    @Test void agendaAlheiaNaoPodeSerUsadaComoCaminhoAlternativoDeGravacao() {
        var p = new Prontuario(); p.setVoluntarioId(80); p.setAgendaId(20);
        assertThrows(ForbiddenException.class, () -> prontuario.registrarEvolucao(p));
        verifyNoInteractions(prontuarios);
    }
}
