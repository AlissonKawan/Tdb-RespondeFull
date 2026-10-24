package br.com.tdbresponde.bo;

import br.com.tdbresponde.dao.VoluntarioDAO;
import br.com.tdbresponde.dto.VoluntarioRequest;
import br.com.tdbresponde.model.Voluntario;
import br.com.tdbresponde.model.Especialidade;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class VoluntarioSigiloTest {
    private VoluntarioBO bo;
    private Voluntario atual;

    @BeforeEach
    void configurar() {
        bo = new VoluntarioBO();
        bo.dao = mock(VoluntarioDAO.class);
        atual = new Voluntario();
        atual.setId(80);
        atual.setNome("Voluntário sintético");
        atual.setStatusAprovacao("APROVADO");
        atual.setDisponivel(true);
        when(bo.dao.buscarPorId(80)).thenReturn(atual);
    }

    private VoluntarioRequest pedido(Boolean acessoSigilo) {
        VoluntarioRequest request = new VoluntarioRequest();
        request.nome = "Voluntário sintético atualizado";
        request.disponivel = true;
        request.acessoSigilo = acessoSigilo;
        return request;
    }

    @Test
    void preservaPermissaoQuandoEdicaoNaoEnviaCampo() {
        atual.setAcessoSigilo(true);
        Voluntario resultado = bo.atualizar(80, pedido(null));
        assertTrue(resultado.getAcessoSigilo());
        assertEquals("APROVADO", resultado.getStatusAprovacao());
        verify(bo.dao).atualizar(resultado);
    }

    @Test
    void ausenciaDoCampoNaoConcedePermissao() {
        atual.setAcessoSigilo(false);
        Voluntario resultado = bo.atualizar(80, pedido(null));
        assertFalse(resultado.getAcessoSigilo());
        verify(bo.dao).atualizar(resultado);
    }

    @Test
    void alterarPermissaoPreservaCadastroEHistoricoOperacional() {
        atual.setUsuario("voluntario.sintetico");
        atual.setSenha("hash-sintetico");
        atual.setContaId(70);
        atual.setCro("12345");
        atual.setUfCro("SP");
        atual.setStatusCro("REGISTRO_HISTORICO");
        atual.setCodigoIndicacao("IND-SINTETICA");
        atual.setPontosIndicacao(30);
        atual.setIdVoluntarioIndicador(90);
        atual.setMotivoVoluntariado("Motivo sintético");
        Especialidade primeira = new Especialidade(); primeira.setId(1);
        Especialidade segunda = new Especialidade(); segunda.setId(2);
        atual.setEspecialidades(java.util.List.of(primeira, segunda));
        atual.setEspecialidade(primeira);

        Voluntario resultado = bo.atualizar(80, pedido(true));

        assertTrue(resultado.getAcessoSigilo());
        assertEquals(atual.getUsuario(), resultado.getUsuario());
        assertEquals(atual.getSenha(), resultado.getSenha());
        assertEquals(atual.getContaId(), resultado.getContaId());
        assertEquals(atual.getCro(), resultado.getCro());
        assertEquals(atual.getUfCro(), resultado.getUfCro());
        assertEquals(atual.getStatusCro(), resultado.getStatusCro());
        assertEquals(atual.getCodigoIndicacao(), resultado.getCodigoIndicacao());
        assertEquals(atual.getPontosIndicacao(), resultado.getPontosIndicacao());
        assertEquals(atual.getIdVoluntarioIndicador(), resultado.getIdVoluntarioIndicador());
        assertEquals(atual.getMotivoVoluntariado(), resultado.getMotivoVoluntariado());
        assertEquals(atual.getEspecialidades(), resultado.getEspecialidades());
        verify(bo.dao).atualizar(resultado);
    }

    @Test
    void mantemEdicaoExplicitaDosDadosProfissionais() {
        VoluntarioRequest request = pedido(true);
        request.cro = "54321";
        request.ufCro = "RJ";
        Voluntario resultado = bo.atualizar(80, request);
        assertEquals("54321", resultado.getCro());
        assertEquals("RJ", resultado.getUfCro());
        verify(bo.dao).atualizar(resultado);
    }

    @Test
    void permiteConcessaoERevogacaoExplicitas() {
        atual.setAcessoSigilo(false);
        Voluntario autorizado = bo.atualizar(80, pedido(true));
        assertTrue(autorizado.getAcessoSigilo());
        verify(bo.dao).atualizar(autorizado);

        atual.setAcessoSigilo(true);
        Voluntario revogado = bo.atualizar(80, pedido(false));
        assertFalse(revogado.getAcessoSigilo());
        verify(bo.dao).atualizar(revogado);
    }
}
