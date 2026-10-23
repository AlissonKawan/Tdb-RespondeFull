package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.ContaUsuarioDAO;
import br.com.tdbresponde.dao.EspecialidadeDAO;
import br.com.tdbresponde.dao.VoluntarioDAO;
import br.com.tdbresponde.dto.RegisterRequest;
import br.com.tdbresponde.dto.LoginRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.exception.UnauthorizedException;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.Especialidade;
import br.com.tdbresponde.model.Voluntario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VoluntarioCroTest {
    private ContaUsuarioBO bo;
    private ContaUsuarioDAO contaDAO;
    private VoluntarioDAO voluntarioDAO;
    private EspecialidadeDAO especialidadeDAO;

    @BeforeEach
    void setUp() {
        bo = new ContaUsuarioBO();
        bo.dao = contaDAO = mock(ContaUsuarioDAO.class);
        bo.voluntarioDAO = voluntarioDAO = mock(VoluntarioDAO.class);
        bo.especialidadeDAO = especialidadeDAO = mock(EspecialidadeDAO.class);
        when(especialidadeDAO.buscarPorId(1))
                .thenReturn(new Especialidade(1, "Fixture sintética", "Odontologia"));
    }

    @Test
    void deveGuardarCroManualEManterCadastroPendenteSemAutoAprovacao() {
        RegisterRequest request = cadastro();
        request.cro = " 12345 ";
        request.ufCro = " sp ";
        ContaUsuario conta = registrar(request);

        ArgumentCaptor<Voluntario> captor = ArgumentCaptor.forClass(Voluntario.class);
        verify(voluntarioDAO).inserir(captor.capture());
        Voluntario salvo = captor.getValue();
        assertEquals("12345", salvo.getCro());
        assertEquals("SP", salvo.getUfCro());
        assertEquals("PENDENTE", salvo.getStatusAprovacao());
        assertNull(salvo.getStatusCro(), "Não deve declarar validação externa ou falha de integração");
        assertFalse(conta.isAtivo(), "Somente a revisão administrativa deve liberar a conta");
        assertFalse(salvo.isAcessoSigilo());
        assertEquals(conta.getId(), salvo.getContaId());

        when(contaDAO.buscarPorEmail(request.email)).thenReturn(conta);
        LoginRequest login = new LoginRequest();
        login.email = request.email;
        login.senha = request.senha;
        assertThrows(UnauthorizedException.class, () -> bo.login(login));
        verify(contaDAO, never()).atualizar(any());
    }

    @Test
    void deveCadastrarSemDependenciaDeClienteOuConsultaATerceiros() {
        // Apenas DAOs locais são injetados: nenhum cliente externo é necessário para cadastrar.
        assertTrue(Arrays.stream(ContaUsuarioBO.class.getDeclaredFields())
                .noneMatch(field -> field.getType().getPackageName().equals("br.com.tdbresponde.client")));
        ContaUsuario conta = registrar(cadastro());
        assertFalse(conta.isAtivo());
        verify(voluntarioDAO).inserir(any(Voluntario.class));
    }

    @Test
    void deveAceitarNumeroSemConferirRegistroNoConselho() {
        RegisterRequest request = cadastro();
        // O número não é declarado válido/inválido pelo sistema; a conferência é humana.
        request.cro = "000000";
        registrar(request);
        ArgumentCaptor<Voluntario> captor = ArgumentCaptor.forClass(Voluntario.class);
        verify(voluntarioDAO).inserir(captor.capture());
        assertEquals("000000", captor.getValue().getCro());
        assertEquals("PENDENTE", captor.getValue().getStatusAprovacao());
        assertNull(captor.getValue().getStatusCro());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void deveExigirCroParaOdontologia(String cro) {
        RegisterRequest request = cadastro();
        request.cro = cro;
        assertEquals("CRO e obrigatorio para cadastro de voluntario.",
                assertThrows(BusinessException.class, () -> bo.registrar(request)).getMessage());
        verifyNoInteractions(contaDAO, voluntarioDAO);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   "})
    void deveExigirUfParaOdontologia(String uf) {
        RegisterRequest request = cadastro();
        request.ufCro = uf;
        assertEquals("UF do CRO e obrigatoria para cadastro de voluntario.",
                assertThrows(BusinessException.class, () -> bo.registrar(request)).getMessage());
        verifyNoInteractions(contaDAO, voluntarioDAO);
    }

    @Test
    void deveRecusarCroSemDigitosEFormatoDeUfIncompletoLocalmente() {
        RegisterRequest request = cadastro();
        request.cro = "INVALIDO";
        assertThrows(BusinessException.class, () -> bo.registrar(request));
        request.cro = "12345";
        request.ufCro = "S";
        assertThrows(BusinessException.class, () -> bo.registrar(request));
        verifyNoInteractions(contaDAO, voluntarioDAO);
    }

    @Test
    void deveExigirCroTambemComEspecialidadePorNomeOuLista() {
        RegisterRequest request = cadastro();
        request.especialidadeId = null;
        request.especialidade = "Odontologia";
        request.cro = null;
        assertThrows(BusinessException.class, () -> bo.registrar(request));
        request.especialidade = null;
        request.especialidadeIds = List.of(1);
        assertThrows(BusinessException.class, () -> bo.registrar(request));
        verifyNoInteractions(contaDAO, voluntarioDAO);
    }

    @Test
    void deveManterCadastroNaoOdontologicoPendenteSemExigirCro() {
        when(especialidadeDAO.buscarPorId(2))
                .thenReturn(new Especialidade(2, "Fixture sintética", "Psicologia"));
        RegisterRequest request = cadastro();
        request.especialidadeId = 2;
        request.cro = null;
        request.ufCro = null;
        assertFalse(registrar(request).isAtivo());
        ArgumentCaptor<Voluntario> captor = ArgumentCaptor.forClass(Voluntario.class);
        verify(voluntarioDAO).inserir(captor.capture());
        assertEquals("PENDENTE", captor.getValue().getStatusAprovacao());
        assertNull(captor.getValue().getCro());
        assertNull(captor.getValue().getStatusCro());
    }

    private ContaUsuario registrar(RegisterRequest request) {
        doAnswer(invocation -> {
            ContaUsuario conta = invocation.getArgument(0);
            conta.setId(10);
            when(contaDAO.buscarPorId(10)).thenReturn(conta);
            return null;
        }).when(contaDAO).cadastrarConta(any(ContaUsuario.class));
        doAnswer(invocation -> {
            Voluntario voluntario = invocation.getArgument(0);
            voluntario.setId(20);
            return null;
        }).when(voluntarioDAO).inserir(any(Voluntario.class));
        return bo.registrar(request);
    }

    private RegisterRequest cadastro() {
        RegisterRequest request = new RegisterRequest();
        request.nome = "Voluntário sintético";
        request.email = "voluntario@example.test";
        request.senha = "senha-fixture";
        request.tipoUsuario = "VOLUNTARIO";
        request.motivoVoluntariado = "Quero colaborar com o atendimento voluntário.";
        request.especialidadeId = 1;
        request.cro = "12345";
        request.ufCro = "SP";
        return request;
    }
}
