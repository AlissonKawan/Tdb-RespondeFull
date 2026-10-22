package br.com.tdbresponde.security;

import br.com.tdbresponde.bo.AtendimentoBO;
import br.com.tdbresponde.bo.ContaUsuarioBO;
import br.com.tdbresponde.dao.PessoaAtendidaDAO;
import br.com.tdbresponde.dto.AtendimentoRequest;
import br.com.tdbresponde.dto.RelatarSituacaoRequest;
import br.com.tdbresponde.exception.ForbiddenException;
import br.com.tdbresponde.exception.UnauthorizedException;
import br.com.tdbresponde.model.Atendimento;
import br.com.tdbresponde.model.PessoaAtendidaBase;
import br.com.tdbresponde.model.Voluntario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AtendimentoAccessTest {
    AtendimentoBO bo;
    ContaUsuarioBO contas;
    PessoaAtendidaDAO pessoas;
    AtendimentoAccess access;
    Atendimento proprio;
    TestIdentity beneficiario = new TestIdentity(7, "BENEFICIARIO");
    TestIdentity voluntario = new TestIdentity(8, "VOLUNTARIO");
    TestIdentity admin = new TestIdentity(9, "ADMIN");

    @BeforeEach void setup() {
        bo = mock(AtendimentoBO.class);
        contas = mock(ContaUsuarioBO.class);
        pessoas = mock(PessoaAtendidaDAO.class);
        access = new AtendimentoAccess(bo, contas, pessoas);
        proprio = atendimento(1, 7, 80);
        when(bo.buscarPorId(1)).thenReturn(proprio);
        when(bo.buscarPorId(2)).thenReturn(atendimento(2, 70, 800));
        when(contas.buscarVoluntarioIdDaConta(8)).thenReturn(80);
    }

    @Test void beneficiarioSoConsultaEConversaNosPropriosCasos() {
        assertSame(proprio, access.consultar(1, beneficiario));
        assertSame(proprio, access.conversar(1, beneficiario));
        assertThrows(ForbiddenException.class, () -> access.consultar(2, beneficiario));
        assertThrows(ForbiddenException.class, () -> access.conversar(2, beneficiario));
        assertThrows(ForbiddenException.class, () -> access.alterar(1, beneficiario));
    }

    @Test void voluntarioNaoAcessaConversaOuAlteraCasoDeOutroVoluntario() {
        assertSame(proprio, access.conversar(1, voluntario));
        assertSame(proprio, access.alterar(1, voluntario));
        assertThrows(ForbiddenException.class, () -> access.consultar(2, voluntario));
        assertThrows(ForbiddenException.class, () -> access.alterar(2, voluntario));
    }

    @Test void filaPreservaConsultaMasNaoConversaOuAlteracaoAntesDeAssumir() {
        proprio.setVoluntario(null);
        proprio.setStatus("ABERTO");
        assertSame(proprio, access.consultar(1, voluntario));
        assertThrows(ForbiddenException.class, () -> access.conversar(1, voluntario));
        assertThrows(ForbiddenException.class, () -> access.alterar(1, voluntario));
        proprio.setStatus("ENCERRADO");
        assertThrows(ForbiddenException.class, () -> access.consultar(1, voluntario));
    }

    @Test void adminMantemAcessoAOutrosCasos() {
        assertNotNull(access.consultar(2, admin));
        assertNotNull(access.conversar(2, admin));
        assertNotNull(access.alterar(2, admin));
        access.listarPorVoluntario(800, admin);
    }

    @Test void listagemNaoConfiaNoIdDeContaRecebido() {
        access.listarPorConta(7, beneficiario);
        assertThrows(ForbiddenException.class, () -> access.listarPorConta(70, beneficiario));
    }

    @Test void listagemNaoConfiaNoIdDeBeneficiarioRecebido() {
        var pessoa = new PessoaAtendidaBase(); pessoa.setContaId(7);
        when(pessoas.buscarPorId(10)).thenReturn(pessoa);
        access.listarPorBeneficiario(10, beneficiario);
        pessoa.setContaId(70);
        assertThrows(ForbiddenException.class, () -> access.listarPorBeneficiario(10, beneficiario));
    }

    @Test void listagemNaoConfiaNoIdDeVoluntarioRecebido() {
        access.listarPorVoluntario(80, voluntario);
        assertThrows(ForbiddenException.class, () -> access.listarPorVoluntario(800, voluntario));
    }

    @Test void relatoSemContaUsaIdentidadeDoServidor() {
        var request = new RelatarSituacaoRequest();
        access.vincularRelato(request, beneficiario);
        assertEquals(7, request.idContaBeneficiario);
    }

    @Test void relatoNaoPermiteSobrescreverOutraConta() {
        var request = new RelatarSituacaoRequest(); request.idContaBeneficiario = 70;
        assertThrows(ForbiddenException.class, () -> access.vincularRelato(request, beneficiario));
        assertEquals(70, request.idContaBeneficiario);
        assertThrows(ForbiddenException.class, () -> access.vincularRelato(request, voluntario));
    }

    @Test void adminPodeRegistrarRelatoEmNomeDoBeneficiario() {
        var request = new RelatarSituacaoRequest(); request.idContaBeneficiario = 70;
        access.vincularRelato(request, admin);
        assertEquals(70, request.idContaBeneficiario);
    }

    @Test void assumirEEncerrarNaoPermitemForjarResponsavel() {
        assertEquals(80, access.responsavel(null, voluntario));
        assertEquals(80, access.responsavel(80, voluntario));
        assertThrows(ForbiddenException.class, () -> access.responsavel(800, voluntario));
        assertThrows(ForbiddenException.class, () -> access.responsavel(80, beneficiario));
        assertEquals(800, access.responsavel(800, admin));
    }

    @Test void edicaoNaoTransfereCasoParaOutroPacienteOuVoluntario() {
        var request = new AtendimentoRequest(); request.pessoaAtendidaId = 10; request.voluntarioId = 80;
        access.validarAtualizacao(proprio, request, voluntario);
        request.pessoaAtendidaId = 20;
        assertThrows(ForbiddenException.class, () -> access.validarAtualizacao(proprio, request, voluntario));
        request.pessoaAtendidaId = 10; request.voluntarioId = 800;
        assertThrows(ForbiddenException.class, () -> access.validarAtualizacao(proprio, request, voluntario));
    }

    @Test void remetenteVemDoPerfilAutenticado() {
        assertEquals("BENEFICIARIO", access.remetente(beneficiario));
        assertEquals("VOLUNTARIO", access.remetente(voluntario));
        assertEquals("ADMIN", access.remetente(admin));
        assertThrows(UnauthorizedException.class, () -> access.remetente(null));
    }

    @Test void filtroDeListaResolveVoluntarioUmaVez() {
        var filtro = access.consultaPermitida(voluntario);
        assertTrue(filtro.test(proprio));
        assertFalse(filtro.test(atendimento(2, 70, 800)));
        verify(contas, times(1)).buscarVoluntarioIdDaConta(8);
    }

    static Atendimento atendimento(int id, int conta, int voluntario) {
        var a = new Atendimento(); a.setId(id); a.setStatus("EM_ATENDIMENTO");
        var p = new PessoaAtendidaBase(); p.setId(10); p.setContaId(conta); a.setPessoaAtendida(p);
        var v = new Voluntario(); v.setId(voluntario); a.setVoluntario(v);
        return a;
    }
}
