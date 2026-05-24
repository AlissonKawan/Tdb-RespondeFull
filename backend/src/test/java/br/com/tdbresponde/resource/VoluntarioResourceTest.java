package br.com.tdbresponde.resource;

import br.com.tdbresponde.bo.VoluntarioBO;
import br.com.tdbresponde.dao.ContaUsuarioDAO;
import br.com.tdbresponde.dto.AprovacaoVoluntarioRequest;
import br.com.tdbresponde.exception.UnauthorizedException;
import br.com.tdbresponde.model.ContaUsuario;
import br.com.tdbresponde.model.TipoUsuario;
import br.com.tdbresponde.model.Voluntario;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

public class VoluntarioResourceTest {

    private VoluntarioResource resource;
    private VoluntarioBO bo;
    private ContaUsuarioDAO contaUsuarioDAO;

    @BeforeEach
    void setUp() {
        resource = new VoluntarioResource();
        bo = mock(VoluntarioBO.class);
        contaUsuarioDAO = mock(ContaUsuarioDAO.class);

        resource.bo = bo;
        resource.contaUsuarioDAO = contaUsuarioDAO;
    }

    @Test
    void deveAprovarQuandoAprovadorForAdmin() {
        // Arrange
        int voluntarioId = 5;
        AprovacaoVoluntarioRequest request = new AprovacaoVoluntarioRequest();
        request.aprovadorId = 99;

        ContaUsuario adminConta = new ContaUsuario();
        adminConta.setId(99);
        adminConta.setTipoUsuario(TipoUsuario.ADMIN);

        when(contaUsuarioDAO.buscarPorId(99)).thenReturn(adminConta);

        // Act
        Response response = resource.aprovar(voluntarioId, request);

        // Assert
        assertEquals(204, response.getStatus(), "Deve retornar 204 No Content");
        verify(bo).aprovar(voluntarioId);
    }

    @Test
    void deveLancarExcecaoQuandoAprovadorNaoForAdmin() {
        // Arrange
        int voluntarioId = 5;
        AprovacaoVoluntarioRequest request = new AprovacaoVoluntarioRequest();
        request.aprovadorId = 88;

        ContaUsuario voluntarioConta = new ContaUsuario();
        voluntarioConta.setId(88);
        voluntarioConta.setTipoUsuario(TipoUsuario.VOLUNTARIO);

        when(contaUsuarioDAO.buscarPorId(88)).thenReturn(voluntarioConta);

        // Act & Assert
        UnauthorizedException exception = assertThrows(UnauthorizedException.class, () -> {
            resource.aprovar(voluntarioId, request);
        });

        assertEquals("Apenas administradores podem aprovar novos voluntarios.", exception.getMessage());
        verify(bo, never()).aprovar(anyInt());
    }

    @Test
    void deveLancarExcecaoQuandoRequestForNulo() {
        // Act & Assert
        UnauthorizedException exception = assertThrows(UnauthorizedException.class, () -> {
            resource.aprovar(5, null);
        });

        assertEquals("Aprovador nao identificado.", exception.getMessage());
        verify(bo, never()).aprovar(anyInt());
    }

    @Test
    void deveLancarExcecaoQuandoAprovadorIdForNulo() {
        // Arrange
        AprovacaoVoluntarioRequest request = new AprovacaoVoluntarioRequest();
        request.aprovadorId = null;

        // Act & Assert
        UnauthorizedException exception = assertThrows(UnauthorizedException.class, () -> {
            resource.aprovar(5, request);
        });

        assertEquals("Aprovador nao identificado.", exception.getMessage());
        verify(bo, never()).aprovar(anyInt());
    }

    @Test
    void deveRetornarRankingComPrivacidade() {
        // Arrange
        Voluntario v1 = new Voluntario();
        v1.setNome("Primeiro Lugar");
        v1.setUsuario("teste1@email.com"); // dado sensível
        v1.setPontosIndicacao(100);
        v1.setCodigoIndicacao("AAAA1111");

        Voluntario v2 = new Voluntario();
        v2.setNome("Segundo Lugar");
        v2.setUsuario("teste2@email.com"); // dado sensível
        v2.setPontosIndicacao(50);
        v2.setCodigoIndicacao("BBBB2222");

        when(bo.buscarTopRanking(2)).thenReturn(List.of(v1, v2));

        // Act
        Response response = resource.listarRanking(2);

        // Assert
        assertEquals(200, response.getStatus());
        List<?> list = (List<?>) response.getEntity();
        assertEquals(2, list.size());

        // Verificando mapeamento e privacidade
        br.com.tdbresponde.dto.RankingResponse r1 = (br.com.tdbresponde.dto.RankingResponse) list.get(0);
        assertEquals("Primeiro Lugar", r1.nome);
        assertEquals(100, r1.pontosIndicacao);
        assertEquals("AAAA1111", r1.codigoIndicacao);

        // Nao deve existir campo de usuario (email)
        boolean hasUsuario = false;
        try {
            r1.getClass().getField("usuario");
            hasUsuario = true;
        } catch (NoSuchFieldException e) {
            hasUsuario = false;
        }
        assertEquals(false, hasUsuario, "A classe RankingResponse nao deve conter campo usuario.");
    }
}
