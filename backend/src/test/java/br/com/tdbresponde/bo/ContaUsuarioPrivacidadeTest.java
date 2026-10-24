package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.ContaUsuarioDAO;
import br.com.tdbresponde.dao.CriancaAdolescenteDAO;
import br.com.tdbresponde.dto.LoginRequest;
import br.com.tdbresponde.dto.RegisterRequest;
import br.com.tdbresponde.dto.ContaUsuarioRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.ConflictException;
import br.com.tdbresponde.exception.UnauthorizedException;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.CriancaAdolescente;
import br.com.tdbresponde.model.TipoUsuario;
import br.com.tdbresponde.security.SenhaHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ContaUsuarioPrivacidadeTest {
    ContaUsuarioBO bo;

    @BeforeEach void setup() {
        bo = new ContaUsuarioBO();
        bo.dao = mock(ContaUsuarioDAO.class);
        doAnswer(call -> { ((ContaUsuario) call.getArgument(0)).setId(15); return null; })
                .when(bo.dao).cadastrarConta(any());
    }

    RegisterRequest apolonia() {
        var request = new RegisterRequest();
        request.tipoUsuario = "BENEFICIARIO";
        request.tipoBeneficiario = "MULHER_APOLONIA";
        request.usuario = "  Aurora.segura  ";
        request.modoIdentificacao = "CODINOME";
        request.nome = "Aurora";
        request.senha = "segredo123";
        return request;
    }

    @Test void cadastroSemContatoPersisteSomenteIdentificacaoEscolhida() {
        bo.registrar(apolonia());
        var conta = ArgumentCaptor.forClass(ContaUsuario.class);
        verify(bo.dao).cadastrarConta(conta.capture());
        assertEquals("aurora.segura", conta.getValue().getUsuario());
        assertEquals("Aurora", conta.getValue().getNome());
        assertNull(conta.getValue().getEmail());
        assertEquals("MULHER_APOLONIA", conta.getValue().getTipoBeneficiario());
        assertTrue(SenhaHasher.validarSenha("segredo123", conta.getValue().getSenhaHash()));
        verify(bo.dao, never()).emailExiste(any());
    }

    @Test void nomeGeradoNaoUsaNomeRealEnviadoAcidentalmente() {
        var request = apolonia(); request.modoIdentificacao = "GERADO";
        request.nome = "Nome real que nao deve ser salvo";
        bo.registrar(request);
        var conta = ArgumentCaptor.forClass(ContaUsuario.class);
        verify(bo.dao).cadastrarConta(conta.capture());
        assertTrue(conta.getValue().getNome().matches("Pessoa [a-f0-9]{8}"));
    }

    @Test void exigeEscolhaExplicitaEUsuarioValido() {
        var request = apolonia(); request.modoIdentificacao = null;
        assertThrows(BusinessException.class, () -> bo.registrar(request));
        request.modoIdentificacao = "CODINOME"; request.usuario = "nome@dominio.com";
        assertThrows(BusinessException.class, () -> bo.registrar(request));
        verify(bo.dao, never()).cadastrarConta(any());
    }

    @Test void contaAnteriorContinuaExigindoEmail() {
        var request = apolonia(); request.tipoBeneficiario = null;
        assertThrows(BusinessException.class, () -> bo.registrar(request));
        verify(bo.dao, never()).cadastrarConta(any());
    }

    @Test void usuarioRepetidoNaoCriaConta() {
        when(bo.dao.buscarPorUsuario("aurora.segura")).thenReturn(new ContaUsuario());
        assertThrows(ConflictException.class, () -> bo.registrar(apolonia()));
        verify(bo.dao, never()).cadastrarConta(any());
    }

    @Test void emailOpcionalDeveSerValidoQuandoInformado() {
        var request = apolonia(); request.email = "invalido";
        assertThrows(BusinessException.class, () -> bo.registrar(request));
        verify(bo.dao, never()).cadastrarConta(any());
    }

    @Test void loginPorUsuarioPreservaAutenticacaoPorSenha() {
        var conta = new ContaUsuario(); conta.setSenhaHash(SenhaHasher.gerarHash("segredo123"));
        when(bo.dao.buscarPorUsuario("aurora.segura")).thenReturn(conta);
        var request = new LoginRequest(); request.email = " Aurora.Segura "; request.senha = "segredo123";
        assertSame(conta, bo.login(request));
        request.senha = "errada";
        assertThrows(UnauthorizedException.class, () -> bo.login(request));
        verify(bo.dao, never()).buscarPorEmail(any());
    }

    @Test void loginLegadoContinuaBuscandoPorEmail() {
        var conta = new ContaUsuario(); conta.setSenhaHash(SenhaHasher.gerarHash("segredo123"));
        when(bo.dao.buscarPorEmail("pessoa@exemplo.com")).thenReturn(conta);
        var request = new LoginRequest(); request.email = "PESSOA@EXEMPLO.COM"; request.senha = "segredo123";
        assertSame(conta, bo.login(request));
        verify(bo.dao, never()).buscarPorUsuario(any());
    }

    @Test void administracaoPodeManterContaApoloniaSemEmail() {
        var conta = new ContaUsuario(); conta.setId(15); conta.setNome("Aurora");
        conta.setTipoUsuario(TipoUsuario.BENEFICIARIO); conta.setTipoBeneficiario("MULHER_APOLONIA");
        conta.setUsuario("aurora.segura");
        when(bo.dao.buscarPorId(15)).thenReturn(conta);
        var request = new ContaUsuarioRequest(); request.nome = "Aurora"; request.tipoUsuario = "BENEFICIARIO";
        bo.atualizar(15, request);
        verify(bo.dao).atualizar(conta);
        assertNull(conta.getEmail());
        assertEquals("aurora.segura", conta.getUsuario());
    }

    @Test void cadastroCriancaAdolescentePersistePerfilVinculadoAConta() {
        bo.criancaDAO = mock(CriancaAdolescenteDAO.class);
        var request = new RegisterRequest();
        request.nome = "Pedro Santos";
        request.email = "pedro@exemplo.com";
        request.senha = "segredo123";
        request.tipoUsuario = "BENEFICIARIO";
        request.tipoBeneficiario = "CRIANCA_ADOLESCENTE";
        request.telefone = "11999998888";
        request.idade = 12;
        request.nomeResponsavel = "Carla Santos";
        request.escola = "E.E. Dom Pedro";

        var conta = bo.registrar(request);
        assertEquals("CRIANCA_ADOLESCENTE", conta.getTipoBeneficiario());

        var criancaCaptor = ArgumentCaptor.forClass(CriancaAdolescente.class);
        verify(bo.criancaDAO).inserir(criancaCaptor.capture());
        var crianca = criancaCaptor.getValue();
        assertEquals(15, crianca.getContaId());
        assertEquals("Pedro Santos", crianca.getNomeCodificado());
        assertEquals("11999998888", crianca.getTelefone());
        assertEquals(12, crianca.getIdade());
        assertEquals("Carla Santos", crianca.getNomeResponsavel());
        assertEquals("E.E. Dom Pedro", crianca.getEscola());
    }

    @Test void cadastroCriancaAdolescenteExigeDadosDoPerfil() {
        var request = new RegisterRequest();
        request.nome = "Pedro Santos";
        request.email = "pedro@exemplo.com";
        request.senha = "segredo123";
        request.tipoUsuario = "BENEFICIARIO";
        request.tipoBeneficiario = "CRIANCA_ADOLESCENTE";
        request.telefone = "11999998888";
        request.idade = 12;
        request.nomeResponsavel = "Carla Santos";
        request.escola = "   ";

        assertThrows(BusinessException.class, () -> bo.registrar(request));
        verify(bo.dao, never()).cadastrarConta(any());
    }
}
