package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.*;
import br.com.tdbresponde.dto.RegisterRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.Especialidade;
import br.com.tdbresponde.model.Voluntario;
import br.com.tdbresponde.client.CroVerificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class VoluntarioCroTest {

    private ContaUsuarioBO bo;
    private VoluntarioDAO voluntarioDAO;
    private ContaUsuarioDAO contaUsuarioDAO;
    private EspecialidadeDAO especialidadeDAO;
    private CriancaAdolescenteDAO criancaDAO;
    private MulherApoloniaDAO mulherDAO;
    private CroVerificationService croService;

    @BeforeEach
    void setUp() {
        bo = new ContaUsuarioBO();
        voluntarioDAO = mock(VoluntarioDAO.class);
        contaUsuarioDAO = mock(ContaUsuarioDAO.class);
        especialidadeDAO = mock(EspecialidadeDAO.class);
        criancaDAO = mock(CriancaAdolescenteDAO.class);
        mulherDAO = mock(MulherApoloniaDAO.class);
        croService = mock(CroVerificationService.class);

        bo.voluntarioDAO = voluntarioDAO;
        bo.dao = contaUsuarioDAO;
        bo.especialidadeDAO = especialidadeDAO;
        bo.criancaDAO = criancaDAO;
        bo.mulherDAO = mulherDAO;
        bo.croService = croService;
    }

    @Test
    void deveRegistrarVoluntarioComCroValido() {
        // Arrange
        RegisterRequest req = new RegisterRequest();
        req.nome = "Dr. Valido";
        req.email = "valido@teste.com";
        req.senha = "123456";
        req.tipoUsuario = "VOLUNTARIO";
        req.motivoVoluntariado = "Quero muito ajudar pessoas necessitadas.";
        req.especialidadeId = 1;
        req.cro = "12345";
        req.ufCro = "SP";

        when(contaUsuarioDAO.emailExiste("valido@teste.com")).thenReturn(false);
        when(especialidadeDAO.buscarPorId(1)).thenReturn(new Especialidade());
        when(croService.verificar("12345", "SP")).thenReturn(true);

        doAnswer(invocation -> {
            ContaUsuario conta = invocation.getArgument(0);
            conta.setId(10);
            return null;
        }).when(contaUsuarioDAO).cadastrarConta(any(ContaUsuario.class));
        
        when(contaUsuarioDAO.buscarPorId(10)).thenReturn(new ContaUsuario());

        doAnswer(invocation -> {
            Voluntario vol = invocation.getArgument(0);
            vol.setId(20);
            return null;
        }).when(voluntarioDAO).inserir(any(Voluntario.class));

        // Act
        bo.registrar(req);

        // Assert
        ArgumentCaptor<Voluntario> voluntarioCaptor = ArgumentCaptor.forClass(Voluntario.class);
        verify(voluntarioDAO).inserir(voluntarioCaptor.capture());

        Voluntario voluntarioSalvo = voluntarioCaptor.getValue();
        assertEquals("12345", voluntarioSalvo.getCro());
        assertEquals("SP", voluntarioSalvo.getUfCro());
    }

    @Test
    void deveLancarExcecaoQuandoCroForNulo() {
        // Arrange
        RegisterRequest req = new RegisterRequest();
        req.nome = "Dr. Sem Cro";
        req.email = "semcro@teste.com";
        req.senha = "123456";
        req.tipoUsuario = "VOLUNTARIO";
        req.motivoVoluntariado = "Quero muito ajudar pessoas necessitadas.";
        req.especialidadeId = 1;
        req.cro = null;
        req.ufCro = "SP";

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            bo.registrar(req);
        });

        assertEquals("CRO e obrigatorio para cadastro de voluntario.", exception.getMessage());
    }

    @Test
    void deveLancarExcecaoQuandoUfCroForNulo() {
        // Arrange
        RegisterRequest req = new RegisterRequest();
        req.nome = "Dr. Sem UF";
        req.email = "semuf@teste.com";
        req.senha = "123456";
        req.tipoUsuario = "VOLUNTARIO";
        req.motivoVoluntariado = "Quero muito ajudar pessoas necessitadas.";
        req.especialidadeId = 1;
        req.cro = "12345";
        req.ufCro = null;

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            bo.registrar(req);
        });

        assertEquals("UF do CRO e obrigatoria para cadastro de voluntario.", exception.getMessage());
    }

    @Test
    void deveLancarExcecaoQuandoCroForInvalido() {
        // Arrange
        RegisterRequest req = new RegisterRequest();
        req.nome = "Dr. Invalido";
        req.email = "invalido@teste.com";
        req.senha = "123456";
        req.tipoUsuario = "VOLUNTARIO";
        req.motivoVoluntariado = "Quero muito ajudar pessoas necessitadas.";
        req.especialidadeId = 1;
        req.cro = "INVALIDO";
        req.ufCro = "RJ";

        when(contaUsuarioDAO.emailExiste("invalido@teste.com")).thenReturn(false);
        when(especialidadeDAO.buscarPorId(1)).thenReturn(new Especialidade());
        when(croService.verificar("INVALIDO", "RJ")).thenReturn(false);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            bo.registrar(req);
        });

        assertEquals("CRO informado nao foi validado pelo conselho regional.", exception.getMessage());
    }
}
