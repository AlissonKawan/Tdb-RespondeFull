package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.AgendaConsultaDAO;
import br.com.tdbresponde.dao.ProntuarioDAO;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.model.AgendaConsulta;
import br.com.tdbresponde.model.Prontuario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ProntuarioBOTest {

    private ProntuarioBO bo;
    private ProntuarioDAO prontuarioDAO;
    private AgendaConsultaDAO agendaDAO;

    @BeforeEach
    void setUp() {
        bo = new ProntuarioBO();
        prontuarioDAO = mock(ProntuarioDAO.class);
        agendaDAO = mock(AgendaConsultaDAO.class);
        bo.prontuarioDAO = prontuarioDAO;
        bo.agendaDAO = agendaDAO;
    }

    private Prontuario criarProntuarioValido() {
        Prontuario p = new Prontuario();
        p.setVoluntarioId(10);
        p.setAgendaId(50);
        p.setAtendimentoId(100);
        p.setPaciente("  Ana Beatriz  ");
        p.setHistoricoMedico("  Alergia a Dipirona, Asma  ");
        p.setTratamentoAtual("  Restauração em resina no dente 16  ");
        return p;
    }

    @Test
    void deveRegistrarEvolucaoComAgendaEAtendimentoNormalizandoTextos() {
        Prontuario p = criarProntuarioValido();
        when(prontuarioDAO.inserir(any(Prontuario.class))).thenAnswer(inv -> {
            Prontuario arg = inv.getArgument(0);
            arg.setId(77);
            return arg;
        });

        Prontuario salvo = bo.registrarEvolucao(p);

        assertAll(
                () -> assertEquals(77, salvo.getId()),
                () -> assertEquals(50, salvo.getAgendaId()),
                () -> assertEquals(100, salvo.getAtendimentoId()),
                () -> assertEquals("Ana Beatriz", salvo.getPaciente()),
                () -> assertEquals("Alergia a Dipirona, Asma", salvo.getHistoricoMedico()),
                () -> assertEquals("Restauração em resina no dente 16", salvo.getTratamentoAtual())
        );
    }

    @Test
    void deveSincronizarAtendimentoIdAutomaticamenteQuandoRegistradoApenasPelaAgenda() {
        Prontuario p = criarProntuarioValido();
        p.setAtendimentoId(null);

        AgendaConsulta agendaVinculada = new AgendaConsulta();
        agendaVinculada.setId(50);
        agendaVinculada.setAtendimentoId(202);

        when(agendaDAO.buscarPorId(50)).thenReturn(agendaVinculada);
        when(prontuarioDAO.inserir(any())).thenAnswer(inv -> inv.getArgument(0));

        Prontuario salvo = bo.registrarEvolucao(p);

        assertEquals(50, salvo.getAgendaId());
        assertEquals(202, salvo.getAtendimentoId());
        verify(agendaDAO).buscarPorId(50);
    }

    @Test
    void deveSincronizarAgendaIdAutomaticamenteQuandoRegistradoApenasPeloAtendimento() {
        Prontuario p = criarProntuarioValido();
        p.setAgendaId(0);
        p.setAtendimentoId(303);

        AgendaConsulta agendaDoAtendimento = new AgendaConsulta();
        agendaDoAtendimento.setId(88);
        agendaDoAtendimento.setAtendimentoId(303);

        when(agendaDAO.buscarPorAtendimento(303)).thenReturn(List.of(agendaDoAtendimento));
        when(prontuarioDAO.inserir(any())).thenAnswer(inv -> inv.getArgument(0));

        Prontuario salvo = bo.registrarEvolucao(p);

        assertEquals(88, salvo.getAgendaId());
        assertEquals(303, salvo.getAtendimentoId());
        verify(agendaDAO).buscarPorAtendimento(303);
    }

    @Test
    void devePermitirRegistrarPeloAtendimentoMesmoSeAindaNaoHouverAgendaCriada() {
        Prontuario p = criarProntuarioValido();
        p.setAgendaId(null);
        p.setAtendimentoId(404);

        when(agendaDAO.buscarPorAtendimento(404)).thenReturn(List.of());
        when(prontuarioDAO.inserir(any())).thenAnswer(inv -> inv.getArgument(0));

        Prontuario salvo = bo.registrarEvolucao(p);

        assertNull(salvo.getAgendaId());
        assertEquals(404, salvo.getAtendimentoId());
    }

    @Test
    void deveRejeitarEntradasInvalidasComBusinessException() {
        assertAll(
                () -> assertThrows(BusinessException.class, () -> bo.registrarEvolucao(null)),
                () -> {
                    Prontuario p = criarProntuarioValido();
                    p.setAgendaId(null);
                    p.setAtendimentoId(null);
                    assertThrows(BusinessException.class, () -> bo.registrarEvolucao(p));
                },
                () -> {
                    Prontuario p = criarProntuarioValido();
                    p.setAgendaId(0);
                    p.setAtendimentoId(0);
                    assertThrows(BusinessException.class, () -> bo.registrarEvolucao(p));
                },
                () -> {
                    Prontuario p = criarProntuarioValido();
                    p.setAgendaId(-1);
                    assertThrows(BusinessException.class, () -> bo.registrarEvolucao(p));
                },
                () -> {
                    Prontuario p = criarProntuarioValido();
                    p.setAtendimentoId(-5);
                    assertThrows(BusinessException.class, () -> bo.registrarEvolucao(p));
                },
                () -> {
                    Prontuario p = criarProntuarioValido();
                    p.setVoluntarioId(0);
                    assertThrows(BusinessException.class, () -> bo.registrarEvolucao(p));
                },
                () -> {
                    Prontuario p = criarProntuarioValido();
                    p.setPaciente("   ");
                    assertThrows(BusinessException.class, () -> bo.registrarEvolucao(p));
                },
                () -> {
                    Prontuario p = criarProntuarioValido();
                    p.setPaciente("P".repeat(256));
                    assertThrows(BusinessException.class, () -> bo.registrarEvolucao(p));
                },
                () -> {
                    Prontuario p = criarProntuarioValido();
                    p.setTratamentoAtual("   ");
                    assertThrows(BusinessException.class, () -> bo.registrarEvolucao(p));
                },
                () -> {
                    Prontuario p = criarProntuarioValido();
                    p.setTratamentoAtual("T".repeat(2001));
                    assertThrows(BusinessException.class, () -> bo.registrarEvolucao(p));
                },
                () -> {
                    Prontuario p = criarProntuarioValido();
                    p.setHistoricoMedico("H".repeat(1001));
                    assertThrows(BusinessException.class, () -> bo.registrarEvolucao(p));
                },
                () -> assertThrows(BusinessException.class, () -> bo.buscarPorAgenda(0)),
                () -> assertThrows(BusinessException.class, () -> bo.buscarPorAgenda(-1)),
                () -> assertThrows(BusinessException.class, () -> bo.buscarPorAtendimento(0)),
                () -> assertThrows(BusinessException.class, () -> bo.buscarPorAtendimento(-10))
        );
    }
}
