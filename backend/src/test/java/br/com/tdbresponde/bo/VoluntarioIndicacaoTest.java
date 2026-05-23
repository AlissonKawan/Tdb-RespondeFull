package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.*;
import br.com.tdbresponde.dto.RegisterRequest;
import br.com.tdbresponde.exception.BusinessException;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.Especialidade;
import br.com.tdbresponde.model.Voluntario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class VoluntarioIndicacaoTest {

    private ContaUsuarioBO bo;
    private VoluntarioDAO voluntarioDAO;
    private ContaUsuarioDAO contaUsuarioDAO;
    private EspecialidadeDAO especialidadeDAO;
    private CriancaAdolescenteDAO criancaDAO;
    private MulherApoloniaDAO mulherDAO;

    @BeforeEach
    void setUp() {
        bo = new ContaUsuarioBO();
        voluntarioDAO = mock(VoluntarioDAO.class);
        contaUsuarioDAO = mock(ContaUsuarioDAO.class);
        especialidadeDAO = mock(EspecialidadeDAO.class);
        criancaDAO = mock(CriancaAdolescenteDAO.class);
        mulherDAO = mock(MulherApoloniaDAO.class);

        bo.voluntarioDAO = voluntarioDAO;
        bo.dao = contaUsuarioDAO;
        bo.especialidadeDAO = especialidadeDAO;
        bo.criancaDAO = criancaDAO;
        bo.mulherDAO = mulherDAO;
    }

    @Test
    void deveGerarCodigoEVincularIndicadorCorretamente() {
        // Arrange
        RegisterRequest req = new RegisterRequest();
        req.nome = "Novo Voluntario";
        req.email = "novo@teste.com";
        req.senha = "123456";
        req.tipoUsuario = "VOLUNTARIO";
        req.motivoVoluntariado = "Quero muito ajudar pessoas necessitadas.";
        req.especialidadeId = 1;
        req.codigoIndicacao = "IND_VALIDO";

        when(contaUsuarioDAO.emailExiste("novo@teste.com")).thenReturn(false);
        when(especialidadeDAO.buscarPorId(1)).thenReturn(new Especialidade());

        Voluntario indicador = new Voluntario();
        indicador.setId(99);
        when(voluntarioDAO.buscarPorCodigoIndicacao("IND_VALIDO")).thenReturn(indicador);

        // Simulando que o banco gerou um ID para a conta
        doAnswer(invocation -> {
            ContaUsuario conta = invocation.getArgument(0);
            conta.setId(10);
            return null;
        }).when(contaUsuarioDAO).cadastrarConta(any(ContaUsuario.class));
        
        when(contaUsuarioDAO.buscarPorId(10)).thenReturn(new ContaUsuario());

        // Simulando que o banco gerou um ID para o voluntário
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
        
        assertNotNull(voluntarioSalvo.getCodigoIndicacao(), "O codigo de indicacao deve ser gerado");
        assertEquals(8, voluntarioSalvo.getCodigoIndicacao().length(), "O codigo deve ter 8 caracteres");
        assertEquals(99, voluntarioSalvo.getIdVoluntarioIndicador(), "O ID do voluntario indicador deve ser vinculado");
    }

    @Test
    void deveLancarExcecaoSeCodigoIndicacaoForInvalido() {
        // Arrange
        RegisterRequest req = new RegisterRequest();
        req.nome = "Novo Voluntario";
        req.email = "novo@teste.com";
        req.senha = "123456";
        req.tipoUsuario = "VOLUNTARIO";
        req.motivoVoluntariado = "Quero muito ajudar pessoas necessitadas.";
        req.especialidadeId = 1;
        req.codigoIndicacao = "INVALIDO";

        when(contaUsuarioDAO.emailExiste("novo@teste.com")).thenReturn(false);
        when(especialidadeDAO.buscarPorId(1)).thenReturn(new Especialidade());
        when(voluntarioDAO.buscarPorCodigoIndicacao("INVALIDO")).thenReturn(null);

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            bo.registrar(req);
        });

        assertEquals("Codigo de indicacao invalido.", exception.getMessage());
    }
}
