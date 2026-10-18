package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.AgendaConsultaDAO;
import br.com.tdbresponde.dao.AtendimentoDAO;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.ConflictException;
import br.com.tdbresponde.exception.NotFoundException;
import br.com.tdbresponde.model.AgendaConsulta;
import br.com.tdbresponde.model.Atendimento;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AgendaConsultaBOTest {

    private AgendaConsultaBO bo;
    private AgendaConsultaDAO agendaDAO;
    private AtendimentoDAO atendimentoDAO;

    @BeforeEach
    void setUp() {
        bo = new AgendaConsultaBO();
        agendaDAO = mock(AgendaConsultaDAO.class);
        atendimentoDAO = mock(AtendimentoDAO.class);
        bo.agendaDAO = agendaDAO;
        bo.atendimentoDAO = atendimentoDAO;
    }

    private AgendaConsulta criarAgendaValida() {
        AgendaConsulta a = new AgendaConsulta();
        a.setVoluntarioId(10);
        a.setAtendimentoId(100);
        a.setPaciente("  Maria da Silva  ");
        a.setTipo("  Avaliação Inicial  ");
        a.setDataConsulta(LocalDate.of(2026, 10, 20));
        a.setHorario("09:30");
        a.setStatus("confirmado");
        a.setTipoPessoa("MULHER_APOLONIA");
        return a;
    }

    @Test
    void deveCadastrarAgendaValidaVinculadaAAtendimentoNormalizandoCampos() {
        AgendaConsulta agenda = criarAgendaValida();
        Atendimento atendimento = new Atendimento();
        atendimento.setId(100);

        when(atendimentoDAO.buscarPorId(100)).thenReturn(atendimento);
        when(agendaDAO.buscarPorVoluntario(10)).thenReturn(List.of());
        when(agendaDAO.inserir(any(AgendaConsulta.class))).thenAnswer(inv -> {
            AgendaConsulta arg = inv.getArgument(0);
            arg.setId(55);
            return arg;
        });

        AgendaConsulta resultado = bo.cadastrar(agenda);

        assertAll(
                () -> assertEquals(55, resultado.getId()),
                () -> assertEquals(100, resultado.getAtendimentoId()),
                () -> assertEquals("Maria da Silva", resultado.getPaciente()),
                () -> assertEquals("Avaliação Inicial", resultado.getTipo()),
                () -> assertEquals("CONFIRMADO", resultado.getStatus()),
                () -> assertEquals("09:30", resultado.getHorario())
        );
        verify(agendaDAO).inserir(agenda);
    }

    @Test
    void deveNormalizarAtendimentoIdZeroParaNullEAplicarDefaultsDeStatusETipoPessoa() {
        AgendaConsulta agenda = criarAgendaValida();
        agenda.setAtendimentoId(0);
        agenda.setStatus(null);
        agenda.setTipoPessoa("   ");

        when(agendaDAO.buscarPorVoluntario(10)).thenReturn(List.of());
        when(agendaDAO.inserir(any())).thenAnswer(inv -> inv.getArgument(0));

        AgendaConsulta resultado = bo.cadastrar(agenda);

        assertNull(resultado.getAtendimentoId());
        assertEquals("AGUARDANDO", resultado.getStatus());
        assertEquals("OUTRO", resultado.getTipoPessoa());
        verify(atendimentoDAO, never()).buscarPorId(anyInt());
    }

    @Test
    void deveRecusarAtendimentoVinculadoInexistenteComNotFoundException() {
        AgendaConsulta agenda = criarAgendaValida();
        agenda.setAtendimentoId(999);
        when(atendimentoDAO.buscarPorId(999)).thenReturn(null);

        assertThrows(NotFoundException.class, () -> bo.cadastrar(agenda));
        verify(agendaDAO, never()).inserir(any());
    }

    @Test
    void deveBloquearConflitoDeHorarioParaMesmoVoluntarioEmConsultaAtiva() {
        AgendaConsulta existente = criarAgendaValida();
        existente.setId(1);
        existente.setStatus("AGUARDANDO");

        AgendaConsulta nova = criarAgendaValida();
        nova.setAtendimentoId(null);

        when(agendaDAO.buscarPorVoluntario(10)).thenReturn(List.of(existente));

        assertThrows(ConflictException.class, () -> bo.cadastrar(nova));
        verify(agendaDAO, never()).inserir(any());
    }

    @Test
    void devePermitirMesmoHorarioSeConsultaExistenteEstiverEncerradaOuForOMesmoRegistroNaAtualizacao() {
        AgendaConsulta encerrada = criarAgendaValida();
        encerrada.setId(1);
        encerrada.setStatus("ENCERRADO");

        AgendaConsulta propria = criarAgendaValida();
        propria.setId(2);
        propria.setStatus("CONFIRMADO");

        when(atendimentoDAO.buscarPorId(100)).thenReturn(new Atendimento());
        when(agendaDAO.buscarPorVoluntario(10)).thenReturn(List.of(encerrada, propria));
        when(agendaDAO.atualizar(any())).thenAnswer(inv -> inv.getArgument(0));

        AgendaConsulta atualizada = bo.atualizar(2, criarAgendaValida());
        assertEquals(2, atualizada.getId());
    }

    @Test
    void deveLancarBusinessExceptionParaEntradasInvalidasNaValidacao() {
        assertAll(
                () -> assertThrows(BusinessException.class, () -> bo.cadastrar(null)),
                () -> {
                    AgendaConsulta a = criarAgendaValida();
                    a.setPaciente("   ");
                    assertThrows(BusinessException.class, () -> bo.cadastrar(a));
                },
                () -> {
                    AgendaConsulta a = criarAgendaValida();
                    a.setPaciente("A".repeat(256));
                    assertThrows(BusinessException.class, () -> bo.cadastrar(a));
                },
                () -> {
                    AgendaConsulta a = criarAgendaValida();
                    a.setDataConsulta(null);
                    assertThrows(BusinessException.class, () -> bo.cadastrar(a));
                },
                () -> {
                    AgendaConsulta a = criarAgendaValida();
                    a.setVoluntarioId(0);
                    assertThrows(BusinessException.class, () -> bo.cadastrar(a));
                },
                () -> {
                    AgendaConsulta a = criarAgendaValida();
                    a.setAtendimentoId(-5);
                    assertThrows(BusinessException.class, () -> bo.cadastrar(a));
                },
                () -> {
                    AgendaConsulta a = criarAgendaValida();
                    a.setTipo("");
                    assertThrows(BusinessException.class, () -> bo.cadastrar(a));
                },
                () -> {
                    AgendaConsulta a = criarAgendaValida();
                    a.setTipo("T".repeat(101));
                    assertThrows(BusinessException.class, () -> bo.cadastrar(a));
                },
                () -> {
                    AgendaConsulta a = criarAgendaValida();
                    a.setHorario("25:00");
                    assertThrows(BusinessException.class, () -> bo.cadastrar(a));
                },
                () -> {
                    AgendaConsulta a = criarAgendaValida();
                    a.setHorario("8:00");
                    assertThrows(BusinessException.class, () -> bo.cadastrar(a));
                },
                () -> {
                    AgendaConsulta a = criarAgendaValida();
                    a.setStatus("STATUS_INVENTADO");
                    assertThrows(BusinessException.class, () -> bo.cadastrar(a));
                },
                () -> {
                    AgendaConsulta a = criarAgendaValida();
                    a.setTipoPessoa("P".repeat(51));
                    assertThrows(BusinessException.class, () -> bo.cadastrar(a));
                }
        );
    }

    @Test
    void deveValidarIdsInvalidosEmConsultasAtualizacoesEExclusoes() {
        assertAll(
                () -> assertThrows(BusinessException.class, () -> bo.buscarPorVoluntario(0)),
                () -> assertThrows(BusinessException.class, () -> bo.buscarPorVoluntario(-1)),
                () -> assertThrows(BusinessException.class, () -> bo.buscarPorAtendimento(0)),
                () -> assertThrows(BusinessException.class, () -> bo.buscarPorAtendimento(-10)),
                () -> assertThrows(BusinessException.class, () -> bo.buscarPorId(0)),
                () -> assertThrows(BusinessException.class, () -> bo.atualizar(0, criarAgendaValida())),
                () -> assertThrows(BusinessException.class, () -> bo.excluir(0))
        );
    }

    @Test
    void deveLancarNotFoundExceptionQuandoBuscarPorIdNaoEncontrar() {
        when(agendaDAO.buscarPorId(404)).thenReturn(null);
        assertThrows(NotFoundException.class, () -> bo.buscarPorId(404));
    }
}
