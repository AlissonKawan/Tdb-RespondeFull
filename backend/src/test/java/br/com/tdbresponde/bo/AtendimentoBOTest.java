package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.AtendimentoDAO;
import br.com.tdbresponde.dao.HistoricoStatusDAO;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.CriancaAdolescente;
import br.com.tdbresponde.model.HistoricoStatus;
import br.com.tdbresponde.model.MulherApolonia;
import br.com.tdbresponde.model.Voluntario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AtendimentoBOTest {

    private AtendimentoBO bo;
    private FakeAtendimentoDAO atendimentoDAO;
    private FakeHistoricoStatusDAO historicoDAO;

    @BeforeEach
    void setUp() {
        bo = new AtendimentoBO();
        atendimentoDAO = new FakeAtendimentoDAO();
        historicoDAO = new FakeHistoricoStatusDAO();
        bo.atendimentoDAO = atendimentoDAO;
        bo.historicoDAO = historicoDAO;
    }

    @Test
    void deveCalcularPrioridadeDaMulherPeloNivelDeRisco() {
        assertAll(
                () -> assertEquals(1, bo.calcularPrioridade(mulherComRisco(5))),
                () -> assertEquals(1, bo.calcularPrioridade(mulherComRisco(4))),
                () -> assertEquals(2, bo.calcularPrioridade(mulherComRisco(3))),
                () -> assertEquals(3, bo.calcularPrioridade(mulherComRisco(2))),
                () -> assertEquals(3, bo.calcularPrioridade(mulherComRisco(1)))
        );
    }

    @Test
    void deveCalcularPrioridadeDaCriancaPelaGravidadeBucal() {
        assertAll(
                () -> assertEquals(1, bo.calcularPrioridade(criancaComGravidade(5))),
                () -> assertEquals(2, bo.calcularPrioridade(criancaComGravidade(4))),
                () -> assertEquals(3, bo.calcularPrioridade(criancaComGravidade(3))),
                () -> assertEquals(4, bo.calcularPrioridade(criancaComGravidade(2))),
                () -> assertEquals(4, bo.calcularPrioridade(criancaComGravidade(1)))
        );
    }

    @Test
    void deveRecusarDadosNulosNasRegrasDeDominio() {
        assertAll(
                () -> assertThrows(BusinessException.class, () -> bo.calcularPrioridade((MulherApolonia) null)),
                () -> assertThrows(BusinessException.class, () -> bo.calcularPrioridade((CriancaAdolescente) null)),
                () -> assertThrows(BusinessException.class, () -> bo.calcularTempoAtendimentoDias(null)),
                () -> assertThrows(BusinessException.class, () -> bo.voluntarioPodeAtender(null, new Atendimento())),
                () -> assertThrows(BusinessException.class, () -> bo.voluntarioPodeAtender(new Voluntario(), null))
        );
    }

    @Test
    void deveValidarSeVoluntarioPodeAtenderCasoComSigilo() {
        Atendimento atendimento = atendimentoComPessoa(mulherSigilosa());

        assertTrue(bo.voluntarioPodeAtender(voluntario(true, true), atendimento));
        assertFalse(bo.voluntarioPodeAtender(voluntario(false, true), atendimento));
        assertFalse(bo.voluntarioPodeAtender(voluntario(true, false), atendimento));
    }

    @Test
    void deveCalcularTempoUsandoDataDeEncerramentoQuandoExistir() {
        Atendimento atendimento = new Atendimento();
        atendimento.setDataAbertura(LocalDate.of(2026, 5, 1));
        atendimento.setDataEncerramento(LocalDate.of(2026, 5, 11));

        assertEquals(10, bo.calcularTempoAtendimentoDias(atendimento));
    }

    @Test
    void deveCalcularTempoAteHojeQuandoAtendimentoAindaEstiverAberto() {
        Atendimento atendimento = new Atendimento();
        atendimento.setDataAbertura(LocalDate.now().minusDays(5));

        assertEquals(5, bo.calcularTempoAtendimentoDias(atendimento));
    }

    @Test
    void deveEncerrarAtendimentoERegistrarHistorico() {
        Atendimento atendimento = new Atendimento();
        atendimento.setId(10);
        atendimento.setStatus("EM_ATENDIMENTO");
        Voluntario responsavel = voluntario(true, true);
        responsavel.setId(20);

        bo.encerrarAtendimento(atendimento, responsavel);

        assertAll(
                () -> assertEquals("ENCERRADO", atendimento.getStatus()),
                () -> assertEquals(LocalDate.now(), atendimento.getDataEncerramento()),
                () -> assertSame(atendimento, atendimentoDAO.atendimentoAtualizado),
                () -> assertNotNull(historicoDAO.historicoInserido),
                () -> assertEquals("EM_ATENDIMENTO", historicoDAO.historicoInserido.getStatusAnterior()),
                () -> assertEquals("ENCERRADO", historicoDAO.historicoInserido.getStatusNovo()),
                () -> assertSame(responsavel, historicoDAO.historicoInserido.getAlteradoPor())
        );
    }

    @Test
    void naoDeveEncerrarAtendimentoJaEncerrado() {
        Atendimento atendimento = new Atendimento();
        atendimento.setId(10);
        atendimento.setStatus("encerrado");

        assertThrows(BusinessException.class, () -> bo.encerrarAtendimento(atendimento, voluntario(true, true)));
        assertNull(atendimentoDAO.atendimentoAtualizado);
        assertNull(historicoDAO.historicoInserido);
    }

    private MulherApolonia mulherComRisco(int nivelRisco) {
        MulherApolonia mulher = new MulherApolonia();
        mulher.setCodinome("Caso " + nivelRisco);
        mulher.setNivelRisco(nivelRisco);
        return mulher;
    }

    private MulherApolonia mulherSigilosa() {
        MulherApolonia mulher = mulherComRisco(5);
        mulher.setNecessitaSigiloAbsoluto(true);
        return mulher;
    }

    private CriancaAdolescente criancaComGravidade(int gravidade) {
        CriancaAdolescente crianca = new CriancaAdolescente();
        crianca.setGravidadeBucal(gravidade);
        return crianca;
    }

    private Atendimento atendimentoComPessoa(MulherApolonia mulher) {
        Atendimento atendimento = new Atendimento();
        atendimento.setPessoaAtendida(mulher);
        atendimento.setStatus("ABERTO");
        return atendimento;
    }

    private Voluntario voluntario(boolean disponivel, boolean acessoSigilo) {
        Voluntario voluntario = new Voluntario();
        voluntario.setNome("Voluntario");
        voluntario.setDisponivel(disponivel);
        voluntario.setAcessoSigilo(acessoSigilo);
        return voluntario;
    }

    private static class FakeAtendimentoDAO extends AtendimentoDAO {
        private Atendimento atendimentoAtualizado;

        @Override
        public void atualizar(Atendimento atendimento) {
            this.atendimentoAtualizado = atendimento;
        }
    }

    private static class FakeHistoricoStatusDAO extends HistoricoStatusDAO {
        private HistoricoStatus historicoInserido;

        @Override
        public void inserir(HistoricoStatus historico) {
            this.historicoInserido = historico;
        }
    }
}
