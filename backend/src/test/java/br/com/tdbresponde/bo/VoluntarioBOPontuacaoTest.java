package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.ContaUsuarioDAO;
import br.com.tdbresponde.dao.VoluntarioDAO;
import br.com.tdbresponde.model.Voluntario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

public class VoluntarioBOPontuacaoTest {

    private VoluntarioBO bo;
    private VoluntarioDAO dao;
    private ContaUsuarioDAO contaUsuarioDAO;

    @BeforeEach
    void setUp() {
        bo = new VoluntarioBO();
        dao = mock(VoluntarioDAO.class);
        contaUsuarioDAO = mock(ContaUsuarioDAO.class);

        bo.dao = dao;
        bo.contaUsuarioDAO = contaUsuarioDAO;
    }

    @Test
    void deveAtribuirPontosAoIndicadorQuandoVoluntarioForAprovado() {
        // Arrange
        int voluntarioId = 10;
        Voluntario voluntarioAprovado = new Voluntario();
        voluntarioAprovado.setId(voluntarioId);
        voluntarioAprovado.setContaId(50);
        voluntarioAprovado.setIdVoluntarioIndicador(99);

        Voluntario indicador = new Voluntario();
        indicador.setId(99);
        indicador.setPontosIndicacao(20);

        when(dao.buscarPorId(voluntarioId)).thenReturn(voluntarioAprovado);
        when(dao.buscarPorId(99)).thenReturn(indicador);

        // Act
        bo.aprovar(voluntarioId);

        // Assert
        verify(dao).aprovar(voluntarioId);
        verify(contaUsuarioDAO).ativar(50);

        ArgumentCaptor<Voluntario> indicadorCaptor = ArgumentCaptor.forClass(Voluntario.class);
        verify(dao).atualizar(indicadorCaptor.capture());

        Voluntario indicadorAtualizado = indicadorCaptor.getValue();
        assertEquals(30, indicadorAtualizado.getPontosIndicacao(), "O indicador deve receber +10 pontos.");
    }

    @Test
    void naoDeveAtribuirPontosQuandoNaoHouverIndicador() {
        // Arrange
        int voluntarioId = 10;
        Voluntario voluntarioAprovado = new Voluntario();
        voluntarioAprovado.setId(voluntarioId);
        voluntarioAprovado.setContaId(50);
        voluntarioAprovado.setIdVoluntarioIndicador(null);

        when(dao.buscarPorId(voluntarioId)).thenReturn(voluntarioAprovado);

        // Act
        bo.aprovar(voluntarioId);

        // Assert
        verify(dao).aprovar(voluntarioId);
        verify(contaUsuarioDAO).ativar(50);

        // Verifica que o DAO de atualizar NUNCA foi chamado para atualizar pontos de ninguem
        verify(dao, never()).atualizar(any(Voluntario.class));
    }
}
