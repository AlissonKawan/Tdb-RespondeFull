package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.AtendimentoDAO;
import br.com.tdbresponde.dao.VoluntarioDAO;
import br.com.tdbresponde.exception.ForbiddenException;
import br.com.tdbresponde.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class AtendimentoSigiloTest {
    AtendimentoBO bo;
    AtendimentoDAO dao;
    Voluntario voluntario;
    Atendimento atendimento;

    @BeforeEach void setup() {
        bo = spy(new AtendimentoBO());
        dao = mock(AtendimentoDAO.class); bo.atendimentoDAO = dao;
        bo.voluntarioDAO = mock(VoluntarioDAO.class);
        voluntario = new Voluntario(); voluntario.setId(80); voluntario.setDisponivel(true);
        when(bo.voluntarioDAO.buscarPorId(80)).thenReturn(voluntario);
        atendimento = new Atendimento(); atendimento.setId(1); atendimento.setStatus("ABERTO");
        var pessoa = new MulherApolonia(); pessoa.setNecessitaSigiloAbsoluto(true);
        atendimento.setPessoaAtendida(pessoa);
        doReturn(atendimento).when(bo).buscarPorId(1);
    }

    @Test void recusaSigiloSemPermissaoSemMudarEstado() {
        voluntario.setAcessoSigilo(false);
        assertThrows(ForbiddenException.class, () -> bo.assumir(1, 80));
        assertNull(atendimento.getVoluntario()); assertEquals("ABERTO", atendimento.getStatus());
        verify(dao, never()).atualizar(any());
    }

    @Test void recusaSigiloComPermissaoNula() {
        var semPermissao = mock(Voluntario.class);
        when(semPermissao.isDisponivel()).thenReturn(true);
        when(semPermissao.getAcessoSigilo()).thenReturn(null);
        when(bo.voluntarioDAO.buscarPorId(80)).thenReturn(semPermissao);
        assertThrows(ForbiddenException.class, () -> bo.assumir(1, 80));
        verify(dao, never()).atualizar(any());
    }

    @Test void permiteSigiloComPermissaoExplicita() {
        voluntario.setAcessoSigilo(true);
        bo.assumir(1, 80);
        assertSame(voluntario, atendimento.getVoluntario());
        assertEquals("EM_ATENDIMENTO", atendimento.getStatus());
        verify(dao).atualizar(atendimento);
    }

    @Test void casoNaoRestritoNaoExigePermissaoDeSigilo() {
        ((MulherApolonia) atendimento.getPessoaAtendida()).setNecessitaSigiloAbsoluto(false);
        voluntario.setAcessoSigilo(false);
        bo.assumir(1, 80);
        verify(dao).atualizar(atendimento);
    }
}
